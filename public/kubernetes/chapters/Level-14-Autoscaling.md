# Level 14 — Autoscaling: HPA, VPA & Cluster Autoscaler

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate → Advanced |
| **Theory Duration** | 6 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 13 — Deployment Strategies |
| **Lab Required** | Yes — Cluster with Metrics Server installed |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Critical for production & interviews |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Every production cluster uses autoscaling |
| **Certification Alignment** | CKA, CKAD |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Configure Horizontal Pod Autoscaler (HPA) for CPU, memory, and custom metrics.
2. Understand the HPA scaling algorithm and stabilization windows.
3. Configure Vertical Pod Autoscaler (VPA) for right-sizing resource requests.
4. Explain Cluster Autoscaler (CA) and how it adds/removes nodes.
5. Describe Karpenter (AWS) as the next-generation node autoscaler.
6. Design multi-layer autoscaling strategies combining HPA, VPA, CA/Karpenter.

---

## 1. Autoscaling Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Kubernetes Autoscaling Layers                              │
│                                                                              │
│  Layer 3: CLUSTER (Node) Autoscaling                                         │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │  Cluster Autoscaler / Karpenter                                  │        │
│  │  "Are there enough NODES to run the Pods?"                       │        │
│  │                                                                  │        │
│  │  Pending Pods (no schedulable node) → Add new node               │        │
│  │  Underutilized nodes → Remove node (move Pods elsewhere)         │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  Layer 2: VERTICAL Pod Autoscaling (VPA)                                     │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │  Vertical Pod Autoscaler                                         │        │
│  │  "Are Pods using the right amount of CPU/memory?"                │        │
│  │                                                                  │        │
│  │  Pod over-provisioned (requests too high) → Reduce requests      │        │
│  │  Pod under-provisioned (hitting limits) → Increase requests      │        │
│  │  NOTE: VPA restarts Pods to apply changes                        │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  Layer 1: HORIZONTAL Pod Autoscaling (HPA)                                   │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │  Horizontal Pod Autoscaler                                       │        │
│  │  "Are there enough POD REPLICAS to handle the load?"             │        │
│  │                                                                  │        │
│  │  High CPU/memory/custom metric → Add more Pods                   │        │
│  │  Low utilization → Remove excess Pods                            │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  Foundation: Metrics Server (collects CPU/memory metrics from kubelets)      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Metrics Server

### 2.1 What is Metrics Server?

Metrics Server is a lightweight, in-cluster component that collects **real-time CPU and memory metrics** from kubelets. It is required for HPA and `kubectl top` to work.

```bash
# Install Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# On Minikube:
minikube addons enable metrics-server

# Verify
kubectl top nodes
kubectl top pods
kubectl get apiservice v1beta1.metrics.k8s.io
# → Should show AVAILABLE: True
```

### 2.2 Metrics Pipeline

```
kubelet (cAdvisor) → Metrics Server → Metrics API → HPA Controller
     │                    │                              │
     │ Collects CPU/mem   │ Aggregates metrics           │ Reads metrics
     │ per container      │ from all nodes               │ every 15 seconds
     │ every 10 seconds   │ Stores in-memory             │ to make scaling
     │                    │ (no persistence)             │ decisions
```

---

## 3. Horizontal Pod Autoscaler (HPA)

### 3.1 Concept

**Simple Analogy:** HPA is like a restaurant manager who adds waiters when the restaurant gets busy and sends waiters home when it's quiet.

### 3.2 HPA v2 Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app

  minReplicas: 3                    # Minimum Pods (never scale below this)
  maxReplicas: 20                   # Maximum Pods (never scale above this)

  metrics:
  # CPU-based scaling (most common)
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70      # Scale when avg CPU > 70% of requests

  # Memory-based scaling
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80      # Scale when avg memory > 80% of requests

  # Custom metric (e.g., requests per second from Prometheus)
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"        # Scale when avg RPS > 1000 per Pod

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # Wait 60s before scaling up again
      policies:
      - type: Pods
        value: 4                       # Add max 4 Pods per scale event
        periodSeconds: 60
      - type: Percent
        value: 100                     # Or double the Pods
        periodSeconds: 60
      selectPolicy: Max                # Use whichever policy allows more Pods

    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 minutes before scaling down
      policies:
      - type: Pods
        value: 2                       # Remove max 2 Pods per scale event
        periodSeconds: 120
      selectPolicy: Min                # Use whichever policy removes fewer Pods
```

### 3.3 The Scaling Algorithm

```
HPA Scaling Formula:

  desiredReplicas = ceil[currentReplicas × (currentMetricValue / targetMetricValue)]

Example:
  Current: 3 replicas, avg CPU = 90%
  Target: avg CPU = 70%

  desiredReplicas = ceil[3 × (90 / 70)] = ceil[3 × 1.286] = ceil[3.857] = 4

  → Scale from 3 to 4 replicas.

Scale-Down Example:
  Current: 10 replicas, avg CPU = 30%
  Target: avg CPU = 70%

  desiredReplicas = ceil[10 × (30 / 70)] = ceil[10 × 0.429] = ceil[4.29] = 5

  → Scale from 10 to 5 replicas (after stabilization window).
```

### 3.4 HPA Imperative Commands

```bash
# Create HPA with kubectl
kubectl autoscale deployment web-app \
  --min=3 \
  --max=20 \
  --cpu-percent=70

# Check HPA status
kubectl get hpa
# → NAME         REFERENCE            TARGETS   MINPODS   MAXPODS   REPLICAS
# → web-app-hpa  Deployment/web-app   45%/70%   3         20        5

# Describe for detailed events
kubectl describe hpa web-app-hpa
# → Events section shows scaling decisions and reasons

# Delete HPA
kubectl delete hpa web-app-hpa
```

### 3.5 Prerequisites for HPA

```yaml
# IMPORTANT: HPA requires resource REQUESTS on containers!
# HPA calculates utilization as: (actual usage / requests) × 100%
# Without requests, HPA cannot calculate utilization and will show <unknown>

spec:
  containers:
  - name: web
    image: myapp:v1.0
    resources:
      requests:
        cpu: "200m"        # ← REQUIRED for CPU-based HPA
        memory: "256Mi"    # ← REQUIRED for memory-based HPA
      limits:
        cpu: "1000m"
        memory: "512Mi"
```

---

## 4. Vertical Pod Autoscaler (VPA)

### 4.1 Concept

VPA adjusts the **resource requests and limits** of individual Pods based on historical and real-time usage. It answers: "Am I requesting the right amount of CPU and memory?"

### 4.2 VPA Modes

| Mode | Behavior | Pod Restart? |
| :--- | :--- | :--- |
| `Off` | Recommendations only (displayed but not applied) | No |
| `Initial` | Apply recommendations only at Pod creation time | No (existing Pods unchanged) |
| `Auto` | Apply recommendations by evicting and recreating Pods | Yes (Pods are restarted) |

### 4.3 VPA Configuration

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app

  updatePolicy:
    updateMode: "Auto"               # Off | Initial | Auto

  resourcePolicy:
    containerPolicies:
    - containerName: web
      minAllowed:
        cpu: "50m"
        memory: "64Mi"
      maxAllowed:
        cpu: "2"
        memory: "2Gi"
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsAndLimits   # RequestsOnly | RequestsAndLimits
```

```bash
# Check VPA recommendations
kubectl get vpa web-app-vpa -o yaml
# Look for status.recommendation:
#   containerRecommendations:
#   - containerName: web
#     lowerBound:   {cpu: "50m",  memory: "128Mi"}
#     target:       {cpu: "200m", memory: "256Mi"}   ← Recommended values
#     upperBound:   {cpu: "1",    memory: "1Gi"}
#     uncappedTarget: {cpu: "200m", memory: "256Mi"}
```

### 4.4 VPA vs HPA

| Property | HPA | VPA |
| :--- | :--- | :--- |
| **What it scales** | Number of Pod replicas | CPU/memory requests per Pod |
| **Direction** | Horizontal (more Pods) | Vertical (bigger Pods) |
| **Pod restart?** | No | Yes (in Auto mode) |
| **Use case** | Stateless apps (web servers, APIs) | Right-sizing, stateful apps, single-replica |
| **Compatibility** | Cannot use HPA + VPA for the same metric | Do NOT use both on CPU simultaneously |

### 4.5 Combining HPA and VPA

```
RULE: Do NOT use HPA and VPA on the SAME metric (e.g., both scaling on CPU).
      They will fight each other.

VALID combination:
  HPA scales on CPU → adjusts replica count
  VPA scales on memory → adjusts memory requests
  (Different metrics = no conflict)

VALID combination:
  HPA scales on custom metric (RPS) → adjusts replica count
  VPA scales on CPU and memory → adjusts resource sizing
  (HPA uses custom metric, VPA uses resource metrics = no conflict)
```

---

## 5. Cluster Autoscaler (CA)

### 5.1 Concept

Cluster Autoscaler operates at the **node level**. It adds nodes when Pods are unschedulable (Pending) and removes nodes when they're underutilized.

### 5.2 How It Works

```
SCALE UP:
  1. HPA creates new Pod replicas.
  2. Scheduler tries to place Pods but no node has enough resources.
  3. Pods go to Pending state.
  4. Cluster Autoscaler detects Pending Pods.
  5. CA calculates which node group can fit the Pods.
  6. CA calls AWS Auto Scaling Group API to increase desired count.
  7. New EC2 instance launches, joins cluster as a node.
  8. kubelet registers. Scheduler places Pending Pods.

SCALE DOWN:
  1. CA checks node utilization every 10 seconds.
  2. If a node's utilization < 50% for 10+ minutes:
     a. CA checks if all Pods on the node can be rescheduled elsewhere.
     b. CA checks PodDisruptionBudgets.
     c. If safe, CA cordons the node, drains Pods, terminates EC2 instance.

NOT SCALE-DOWN ELIGIBLE:
  - Pods with local storage (emptyDir with data)
  - Pods without controllers (standalone Pods)
  - Pods with PodDisruptionBudget that would be violated
  - Pods with annotation: cluster-autoscaler.kubernetes.io/safe-to-evict: "false"
  - System Pods (kube-system without PDB)
```

### 5.3 Cluster Autoscaler on EKS

```bash
# Deploy Cluster Autoscaler on EKS
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set autoDiscovery.clusterName=my-eks-cluster \
  --set awsRegion=us-east-1 \
  --set rbac.serviceAccount.create=true \
  --set rbac.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::123456789012:role/ClusterAutoscalerRole

# Key configurations:
# --set extraArgs.scale-down-delay-after-add=10m     # Wait 10min after adding before removing
# --set extraArgs.scale-down-unneeded-time=10m       # Node must be underutilized for 10min
# --set extraArgs.balance-similar-node-groups=true    # Balance across node groups
# --set extraArgs.expander=least-waste                # Choose node that wastes least resources
```

---

## 6. Karpenter (AWS Next-Gen Node Autoscaler)

### 6.1 Why Karpenter Over Cluster Autoscaler?

| Feature | Cluster Autoscaler | Karpenter |
| :--- | :--- | :--- |
| **Node selection** | Predefined ASG instance types | Dynamically selects optimal instance type |
| **Provisioning speed** | Minutes (ASG scaling) | Seconds (direct EC2 API) |
| **Instance diversity** | Single type per ASG | Mixes Spot, On-Demand, multiple types |
| **Right-sizing** | Fixed node sizes | Matches node size to pending Pod requirements |
| **Consolidation** | Basic scale-down | Active bin-packing (replaces underutilized nodes) |
| **Cloud support** | Multi-cloud | AWS only |

### 6.2 Karpenter Configuration

```yaml
# NodePool (replaces provisioner in Karpenter v1)
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
      - key: kubernetes.io/arch
        operator: In
        values: ["amd64"]
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand", "spot"]         # Use both Spot and On-Demand
      - key: node.kubernetes.io/instance-type
        operator: In
        values:                                # Allow these instance types
        - m5.large
        - m5.xlarge
        - m5.2xlarge
        - m6i.large
        - m6i.xlarge
        - c5.large
        - c5.xlarge
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
  limits:
    cpu: "100"                                 # Max 100 vCPUs across all nodes
    memory: "400Gi"                            # Max 400Gi memory
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m                       # Consolidate after 1 minute
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiSelectorTerms:
  - alias: al2023@latest                       # Amazon Linux 2023 AMI
  subnetSelectorTerms:
  - tags:
      karpenter.sh/discovery: my-cluster
  securityGroupSelectorTerms:
  - tags:
      karpenter.sh/discovery: my-cluster
  role: KarpenterNodeRole
```

### 6.3 Karpenter Workflow

```
1. Pod created → Scheduler cannot find a node → Pod is Pending.
2. Karpenter detects Pending Pod within 1-2 seconds.
3. Karpenter analyzes Pod requirements:
   - CPU/memory requests
   - Node selectors / affinity
   - Tolerations
   - Topology spread constraints
4. Karpenter selects the CHEAPEST instance type that satisfies requirements.
   (e.g., needs 2 CPU + 4Gi → selects m5.large instead of m5.2xlarge)
5. Karpenter calls EC2 RunInstances API directly (not through ASG).
6. Instance launches in ~30 seconds.
7. Node registers with cluster. Pod is scheduled.

Consolidation (ongoing):
  Karpenter continuously analyzes running nodes.
  If node is underutilized:
    → Karpenter launches a smaller replacement node.
    → Cordons and drains the old node.
    → Terminates the oversized instance.
    → Result: Lower cost, better utilization.
```

---

## 7. Multi-Layer Autoscaling Design

```
Production Autoscaling Architecture:

  ┌─────────────────────────────────────────────────────────────────┐
  │                    Application Layer                             │
  │                                                                 │
  │   User Traffic → Ingress → Service → Pods                      │
  │                                                                 │
  │   HPA: Scale Pods based on CPU/RPS                              │
  │   VPA: Right-size Pod resource requests (off mode for advice)   │
  │                                                                 │
  │   Flow: Traffic increases → HPA adds Pods → Pods go Pending → │
  │         Karpenter adds nodes → Pods scheduled → Traffic served  │
  │                                                                 │
  │   Flow: Traffic decreases → HPA removes Pods → Nodes           │
  │         underutilized → Karpenter consolidates/removes nodes    │
  └─────────────────────────────────────────────────────────────────┘

  Timeline:
  t=0:    Traffic spike detected by HPA
  t=15s:  HPA evaluates metrics (runs every 15s)
  t=16s:  HPA creates new Pods → Pending (no node capacity)
  t=18s:  Karpenter detects Pending Pods
  t=20s:  Karpenter launches EC2 instance
  t=50s:  Node joins cluster
  t=55s:  Pods scheduled and starting
  t=65s:  Pods passing readiness probes → serving traffic

  Total scale-up time: ~65 seconds (with Karpenter)
  vs. ~3-5 minutes with Cluster Autoscaler + ASG
```

---

## 8. Hands-On Lab

### Lab 14.1: HPA with CPU Scaling

```bash
kubectl create namespace lab-14

# Deploy an app with resource requests
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-apache
  namespace: lab-14
spec:
  replicas: 1
  selector:
    matchLabels:
      app: php-apache
  template:
    metadata:
      labels:
        app: php-apache
    spec:
      containers:
      - name: php-apache
        image: registry.k8s.io/hpa-example
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "200m"
          limits:
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: php-apache
  namespace: lab-14
spec:
  selector:
    app: php-apache
  ports:
  - port: 80
EOF

# Create HPA
kubectl autoscale deployment php-apache \
  --min=1 --max=10 --cpu-percent=50 -n lab-14

# Watch HPA
kubectl get hpa -n lab-14 -w

# In another terminal: Generate load
kubectl run -i --tty load-generator --rm --image=busybox:1.36 \
  --restart=Never -n lab-14 -- \
  /bin/sh -c "while sleep 0.01; do wget -q -O- http://php-apache; done"

# Observe: HPA scales up Pods as CPU increases
# After stopping load generator, HPA scales down (after stabilization window)

kubectl delete namespace lab-14
```

---

## 9. Interview Questions

### Q1: How does HPA work? What metrics does it use?

**Expected Answer:**
HPA monitors Pod metrics every 15 seconds via the Metrics API. It uses the formula: `desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)`. It supports Resource metrics (CPU/memory utilization from Metrics Server), custom metrics (from Prometheus Adapter — e.g., requests per second), and external metrics (from cloud services — e.g., SQS queue depth). HPA requires resource `requests` to be set for utilization-based scaling. Scaling behavior can be tuned with stabilization windows and rate-limiting policies.

---

### Q2: What is the difference between HPA and VPA?

**Expected Answer:**
HPA scales **horizontally** — it adjusts the number of Pod replicas based on load. VPA scales **vertically** — it adjusts CPU/memory requests per Pod based on usage patterns. HPA is preferred for stateless applications (web servers, APIs). VPA is useful for right-sizing or for applications that cannot scale horizontally (single-instance databases). They should not be used on the same metric simultaneously, as they will conflict.

---

### Q3: How does Karpenter differ from Cluster Autoscaler?

**Expected Answer:**
Cluster Autoscaler works with pre-defined Auto Scaling Groups (fixed instance types). Karpenter directly calls the EC2 API to provision the optimal instance type for pending Pods. Karpenter is faster (~30 seconds vs minutes), supports instance type diversity, can mix Spot and On-Demand, and actively consolidates underutilized nodes. Karpenter is AWS-specific, while Cluster Autoscaler is multi-cloud.

---

## 10. Best Practices

1. **Always set resource requests** — HPA requires them for utilization calculation.
2. **Use HPA `behavior` to prevent flapping** — set stabilization windows (60s up, 300s down).
3. **Start with CPU-based HPA** then add custom metrics (RPS, queue depth) for accuracy.
4. **Use VPA in `Off` mode first** to get recommendations before enabling Auto.
5. **Use Karpenter on EKS** instead of Cluster Autoscaler for faster scaling and cost savings.
6. **Set `maxReplicas` reasonably** to prevent runaway scaling from bugs.
7. **Monitor HPA events** — `kubectl describe hpa` shows scaling decisions and reasons.
8. **Combine HPA + Karpenter** for complete autoscaling (Pod + Node layers).

---

## 11. Summary

| Autoscaler | What It Scales | Speed | Use Case |
| :--- | :--- | :--- | :--- |
| **HPA** | Pod replica count | ~15s evaluation cycle | Stateless apps under variable load |
| **VPA** | Pod resource requests | Requires Pod restart | Right-sizing, reducing over-provisioning |
| **Cluster Autoscaler** | Node count (via ASG) | Minutes | Multi-cloud, traditional node scaling |
| **Karpenter** | Node count + type (direct EC2) | ~30 seconds | AWS EKS, cost optimization, fast scaling |

---

## 12. Practice Assignment

1. Deploy an application with CPU requests. Create an HPA targeting 50% CPU. Generate load and observe scaling.
2. Install VPA and configure it in `Off` mode. Check the recommendations it provides.
3. Configure HPA with `behavior` settings: scale up fast (double every 60s) but scale down slowly (2 Pods per 2 minutes).
4. Create an HPA that scales on a custom metric (if Prometheus is available).
5. Research: How would you configure Karpenter NodePool for a mixed Spot/On-Demand workload?
6. Design a complete autoscaling architecture for a production web application handling variable traffic.
