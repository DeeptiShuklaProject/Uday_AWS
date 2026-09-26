# Level 12 — Kubernetes Scheduling Deep Dive

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate → Advanced |
| **Theory Duration** | 6 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 8 — Pods Deep Dive |
| **Lab Required** | Yes — Multi-node cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Heavily tested in CKA |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Critical for production workload placement |
| **Certification Alignment** | CKA (Workloads & Scheduling — 15%) |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain the complete scheduling process (filtering and scoring).
2. Use `nodeSelector` for simple node affinity.
3. Configure Node Affinity and Anti-Affinity rules (required and preferred).
4. Configure Pod Affinity and Anti-Affinity for co-location and spreading.
5. Use Taints and Tolerations to repel Pods from specific nodes.
6. Use Topology Spread Constraints for even Pod distribution across zones.
7. Understand priority and preemption for workload prioritization.
8. Debug scheduling failures.

---

## 1. Scheduling Overview

```
Pod Created (spec.nodeName = "")
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        kube-scheduler                                │
│                                                                     │
│  PHASE 1: FILTERING (which nodes CAN run this Pod?)                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Check 1: Does node have enough CPU & memory?               │    │
│  │  Check 2: Does Pod's nodeSelector match node labels?        │    │
│  │  Check 3: Does node affinity match?                         │    │
│  │  Check 4: Does Pod tolerate node's taints?                  │    │
│  │  Check 5: Are required ports available?                     │    │
│  │  Check 6: Are required volumes available in this zone?      │    │
│  │  Check 7: Does Pod satisfy topology spread constraints?     │    │
│  │  Check 8: Is the node in Ready condition?                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  Result: Feasible nodes [node-01, node-03, node-04]                 │
│  (If empty → Pod stays Pending)                                     │
│                                                                     │
│  PHASE 2: SCORING (which node is BEST?)                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Score 1: LeastRequestedPriority (most free resources)      │    │
│  │  Score 2: BalancedResourceAllocation (CPU/memory balance)   │    │
│  │  Score 3: NodeAffinityPriority (preferred affinity match)   │    │
│  │  Score 4: PodTopologySpread (improves spread across zones)  │    │
│  │  Score 5: InterPodAffinity (prefers co-location if set)     │    │
│  │  Score 6: ImageLocality (image already cached on node)      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  Result: node-03 (score: 87) > node-04 (72) > node-01 (65)         │
│  Winner: node-03                                                    │
│                                                                     │
│  BINDING: spec.nodeName = "node-03"                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. nodeSelector — Simple Node Selection

### 2.1 Concept

`nodeSelector` is the simplest form of node selection. It requires the Pod to be scheduled on a node whose labels match ALL specified labels.

### 2.2 Usage

```bash
# Step 1: Label nodes
kubectl label nodes worker-01 disk=ssd
kubectl label nodes worker-02 disk=hdd
kubectl label nodes worker-01 gpu=nvidia
kubectl label nodes worker-03 zone=us-east-1a

# Verify labels
kubectl get nodes --show-labels
kubectl get nodes -l disk=ssd
```

```yaml
# Step 2: Use nodeSelector in Pod spec
apiVersion: v1
kind: Pod
metadata:
  name: ml-training
spec:
  nodeSelector:
    disk: ssd                 # Pod will ONLY run on nodes with label disk=ssd
    gpu: nvidia               # AND label gpu=nvidia
  containers:
  - name: trainer
    image: myapp/ml-trainer:v1.0
```

### 2.3 Limitations
- Only supports equality matching (`key=value`).
- No "prefer but don't require" option.
- No set-based selectors (`In`, `NotIn`, `Exists`).
- For more flexibility → use Node Affinity.

---

## 3. Node Affinity — Advanced Node Selection

### 3.1 Types

| Type | Behavior | Analogy |
| :--- | :--- | :--- |
| `requiredDuringSchedulingIgnoredDuringExecution` | HARD requirement — Pod won't schedule unless rule matches | "I MUST sit in the window seat" |
| `preferredDuringSchedulingIgnoredDuringExecution` | SOFT preference — scheduler tries to match but not required | "I'd prefer a window seat, but aisle is fine" |

**Note:** "IgnoredDuringExecution" means: if the node labels change AFTER scheduling, the Pod is NOT evicted. It stays where it is.

### 3.2 Required Node Affinity

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In                     # In, NotIn, Exists, DoesNotExist, Gt, Lt
            values:
            - us-east-1a
            - us-east-1b
          - key: node.kubernetes.io/instance-type
            operator: In
            values:
            - m5.xlarge
            - m5.2xlarge
  containers:
  - name: postgres
    image: postgres:16-alpine
```

This Pod will ONLY schedule on nodes that are:
- In zone `us-east-1a` OR `us-east-1b`, AND
- Instance type `m5.xlarge` OR `m5.2xlarge`.

### 3.3 Preferred Node Affinity

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 80                           # Higher weight = stronger preference (1-100)
        preference:
          matchExpressions:
          - key: disk
            operator: In
            values:
            - ssd
      - weight: 20
        preference:
          matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values:
            - us-east-1a
  containers:
  - name: nginx
    image: nginx:1.25-alpine
```

The scheduler will **prefer** nodes with SSD disks (weight 80) and zone us-east-1a (weight 20), but will schedule elsewhere if no matching nodes are available.

### 3.4 Operators

| Operator | Description | Example |
| :--- | :--- | :--- |
| `In` | Label value is in the specified set | `key: zone, values: [us-east-1a, us-east-1b]` |
| `NotIn` | Label value is NOT in the set | `key: zone, values: [us-west-2a]` (avoid this zone) |
| `Exists` | Label key exists (any value) | `key: gpu` (any node with a GPU label) |
| `DoesNotExist` | Label key does NOT exist | `key: spot` (avoid spot instances) |
| `Gt` | Label value is greater than (numeric) | `key: gpu-count, values: ["2"]` (more than 2 GPUs) |
| `Lt` | Label value is less than (numeric) | `key: memory-gb, values: ["64"]` (less than 64GB) |

---

## 4. Taints and Tolerations

### 4.1 Concept

**Simple Analogy:** Taints are like "No Entry" signs on nodes. Tolerations are like "VIP passes" on Pods.

- A **Taint** on a node says: "Keep away unless you tolerate me."
- A **Toleration** on a Pod says: "I can handle this taint."

### 4.2 Taint Effects

| Effect | Behavior |
| :--- | :--- |
| `NoSchedule` | New Pods without toleration will NOT be scheduled (existing Pods stay) |
| `PreferNoSchedule` | Scheduler TRIES to avoid, but may schedule if no alternative |
| `NoExecute` | New Pods won't schedule AND existing Pods without toleration are EVICTED |

### 4.3 Commands

```bash
# Add a taint to a node
kubectl taint nodes worker-01 environment=production:NoSchedule
kubectl taint nodes worker-02 dedicated=gpu:NoSchedule
kubectl taint nodes worker-03 maintenance=true:NoExecute

# View taints on a node
kubectl describe node worker-01 | grep Taints

# Remove a taint (note the trailing dash)
kubectl taint nodes worker-01 environment=production:NoSchedule-

# Common built-in taints:
# node.kubernetes.io/not-ready:NoExecute                (node not ready)
# node.kubernetes.io/unreachable:NoExecute              (node unreachable)
# node.kubernetes.io/memory-pressure:NoSchedule         (low memory)
# node.kubernetes.io/disk-pressure:NoSchedule           (low disk)
# node.kubernetes.io/pid-pressure:NoSchedule            (too many processes)
# node.kubernetes.io/unschedulable:NoSchedule           (cordoned node)
```

### 4.4 Tolerations in Pod Spec

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: production-app
spec:
  tolerations:
  # Exact match toleration
  - key: "environment"
    operator: "Equal"
    value: "production"
    effect: "NoSchedule"

  # Exists match (any value for the key)
  - key: "dedicated"
    operator: "Exists"
    effect: "NoSchedule"

  # Tolerate NoExecute with time limit (evict after 300 seconds)
  - key: "node.kubernetes.io/not-ready"
    operator: "Exists"
    effect: "NoExecute"
    tolerationSeconds: 300

  # Tolerate ALL taints (use with extreme caution — e.g., DaemonSets)
  # - operator: "Exists"
  #   (no key, no value, no effect = tolerate everything)

  containers:
  - name: app
    image: myapp:v1.0
```

### 4.5 Taints + Tolerations vs Node Affinity

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Taints + Tolerations:                                                 │
│  "Keep Pods AWAY from nodes" (node repels Pods)                        │
│  Node says: "Don't come here unless you have a pass"                   │
│  → Prevents Pods from being scheduled on specific nodes                │
│                                                                        │
│  Node Affinity:                                                        │
│  "Attract Pods TO nodes" (Pod chooses nodes)                           │
│  Pod says: "I want to go to this type of node"                         │
│  → Attracts Pods to specific nodes                                     │
│                                                                        │
│  Used TOGETHER for dedicated node pools:                               │
│  1. Taint GPU nodes: kubectl taint nodes gpu-node dedicated=gpu:NoSch  │
│  2. ML Pods: toleration for dedicated=gpu + affinity for gpu nodes     │
│  → Only ML Pods can run on GPU nodes (taint keeps others out)          │
│  → ML Pods will go to GPU nodes (affinity attracts them)               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Pod Affinity and Anti-Affinity

### 5.1 Concept

| Rule | Purpose | Example |
| :--- | :--- | :--- |
| **Pod Affinity** | Schedule NEAR other Pods | "Place cache Pods on same node as web Pods" |
| **Pod Anti-Affinity** | Schedule AWAY from other Pods | "Spread web replicas across different nodes" |

### 5.2 Pod Anti-Affinity (Most Common)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      affinity:
        podAntiAffinity:
          # HARD: Must spread across nodes
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - web-app
            topologyKey: kubernetes.io/hostname    # Spread across NODES
            # topologyKey: topology.kubernetes.io/zone  # Spread across ZONES

      containers:
      - name: web
        image: nginx:1.25-alpine
```

This ensures no two `web-app` Pods run on the same node (high availability).

### 5.3 Pod Affinity (Co-location)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-cache
spec:
  replicas: 3
  selector:
    matchLabels:
      app: redis-cache
  template:
    metadata:
      labels:
        app: redis-cache
    spec:
      affinity:
        podAffinity:
          # Place cache Pods on same nodes as web Pods (low latency)
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - web-app
              topologyKey: kubernetes.io/hostname
      containers:
      - name: redis
        image: redis:7-alpine
```

### 5.4 Topology Keys

| Topology Key | Granularity | Use Case |
| :--- | :--- | :--- |
| `kubernetes.io/hostname` | Per node | Spread replicas across different nodes |
| `topology.kubernetes.io/zone` | Per AZ | Spread replicas across availability zones |
| `topology.kubernetes.io/region` | Per region | Multi-region deployments |

---

## 6. Topology Spread Constraints

### 6.1 Concept

Topology Spread Constraints provide **fine-grained control** over how Pods are distributed across topology domains (nodes, zones, regions). More flexible than Pod Anti-Affinity.

### 6.2 YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 6
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      topologySpreadConstraints:
      # Spread across zones: max 1 Pod difference between zones
      - maxSkew: 1                              # Max difference in Pod count between domains
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule        # DoNotSchedule (hard) or ScheduleAnyway (soft)
        labelSelector:
          matchLabels:
            app: web-app

      # Spread across nodes: max 1 Pod difference between nodes
      - maxSkew: 1
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway       # Soft: try to balance, but schedule anyway
        labelSelector:
          matchLabels:
            app: web-app
      containers:
      - name: web
        image: nginx:1.25-alpine
```

```
Example: 6 replicas across 3 zones, 6 nodes

Without topology spread:
  Zone A: [Pod, Pod, Pod, Pod]  Zone B: [Pod]  Zone C: [Pod]  ← Imbalanced!

With topologySpreadConstraints (maxSkew=1):
  Zone A: [Pod, Pod]  Zone B: [Pod, Pod]  Zone C: [Pod, Pod]  ← Balanced! ✅

  Zone A:                Zone B:               Zone C:
  node-1: [Pod]          node-3: [Pod]         node-5: [Pod]
  node-2: [Pod]          node-4: [Pod]         node-6: [Pod]
```

---

## 7. Priority and Preemption

### 7.1 Concept

When a cluster has insufficient resources, **Priority Classes** determine which Pods get to stay and which get evicted to make room for higher-priority Pods.

### 7.2 PriorityClass

```yaml
# High-priority: critical system workloads
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: critical
value: 1000000                         # Higher value = higher priority
globalDefault: false
preemptionPolicy: PreemptLowerPriority  # Can evict lower-priority Pods
description: "Critical production workloads"
---
# Default priority
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: default
value: 1000
globalDefault: true                    # Default for all Pods without explicit priority
preemptionPolicy: PreemptLowerPriority
description: "Default priority"
---
# Low-priority: batch jobs, dev workloads
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 100
globalDefault: false
preemptionPolicy: Never                # Cannot evict other Pods
description: "Low priority batch jobs"
```

```yaml
# Using PriorityClass in a Pod
apiVersion: v1
kind: Pod
metadata:
  name: critical-app
spec:
  priorityClassName: critical           # Use the PriorityClass
  containers:
  - name: app
    image: myapp:v1.0
```

### 7.3 Preemption Process

```
1. High-priority Pod cannot be scheduled (no resources).
2. Scheduler identifies lower-priority Pods that could be evicted.
3. Scheduler picks the minimal set of evictions to free resources.
4. Lower-priority Pods receive SIGTERM → terminationGracePeriodSeconds.
5. Once evicted, high-priority Pod is scheduled on the freed resources.
```

---

## 8. Node Cordoning and Draining

```bash
# ─── Cordon: Mark node as unschedulable ──────────────────────
kubectl cordon worker-01
# → New Pods won't be scheduled on worker-01
# → Existing Pods continue running

# ─── Drain: Cordon + evict all Pods ─────────────────────────
kubectl drain worker-01 \
  --ignore-daemonsets \          # DaemonSets can't be evicted
  --delete-emptydir-data \       # OK to delete emptyDir volumes
  --force                        # Force evict Pods without controllers

# Use for:
# • Kernel updates on the node
# • Node scaling down
# • Hardware maintenance
# • K8s version upgrades

# ─── Uncordon: Mark node as schedulable again ────────────────
kubectl uncordon worker-01
```

---

## 9. Troubleshooting Scheduling Failures

| Symptom | Possible Cause | Diagnostic | Resolution |
| :--- | :--- | :--- | :--- |
| Pod stuck in `Pending` | No node has enough resources | `kubectl describe pod` → Events: "Insufficient cpu/memory" | Add nodes, increase node size, or reduce Pod resource requests |
| Pod stuck in `Pending` | nodeSelector doesn't match any node | Events: "didn't match Pod's node selector" | Fix nodeSelector labels or label the correct nodes |
| Pod stuck in `Pending` | Taint not tolerated | Events: "had taint {key: NoSchedule}" | Add toleration to Pod or remove taint from node |
| Pod stuck in `Pending` | Anti-affinity can't be satisfied | Events: "didn't match pod anti-affinity rules" | Reduce replicas or change anti-affinity to preferred |
| Pod stuck in `Pending` | Topology spread can't be satisfied | Events: "doesn't satisfy spread constraint" | Change `whenUnsatisfiable` to `ScheduleAnyway` |
| Pod stuck in `Pending` | PVC not available in zone | Events: "volume node affinity conflict" | Use `WaitForFirstConsumer` StorageClass |

```bash
# Key debugging commands
kubectl describe pod <pending-pod>                      # Check Events section
kubectl get nodes -o wide                               # Check node status
kubectl describe node <node> | grep -A5 "Allocatable"   # Check available resources
kubectl describe node <node> | grep "Taints"            # Check taints
kubectl get nodes --show-labels                         # Check labels
kubectl get events --sort-by=.lastTimestamp              # Recent events
```

---

## 10. Hands-On Lab

### Lab 12.1: nodeSelector and Node Affinity

```bash
kubectl create namespace lab-12

# Label nodes
kubectl label nodes $(kubectl get nodes -o name | head -1 | cut -d/ -f2) disk=ssd env=production
kubectl label nodes $(kubectl get nodes -o name | tail -1 | cut -d/ -f2) disk=hdd env=staging

# Deploy with nodeSelector
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: ssd-pod
  namespace: lab-12
spec:
  nodeSelector:
    disk: ssd
  containers:
  - name: app
    image: nginx:1.25-alpine
EOF

kubectl get pod ssd-pod -n lab-12 -o wide
# → Verify it's on the SSD node
```

### Lab 12.2: Taints and Tolerations

```bash
# Taint a node
NODE=$(kubectl get nodes -o name | head -1 | cut -d/ -f2)
kubectl taint nodes $NODE dedicated=special:NoSchedule

# Try to schedule a Pod (should fail / go to another node)
kubectl run no-toleration --image=nginx:1.25-alpine -n lab-12
kubectl get pod no-toleration -n lab-12 -o wide

# Schedule with toleration
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: tolerant-pod
  namespace: lab-12
spec:
  tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "special"
    effect: "NoSchedule"
  containers:
  - name: app
    image: nginx:1.25-alpine
EOF

# Cleanup
kubectl taint nodes $NODE dedicated=special:NoSchedule-
kubectl delete namespace lab-12
```

---

## 11. Interview Questions

### Q1: What is the difference between Taints/Tolerations and Node Affinity?

**Expected Answer:**
**Taints and Tolerations** work from the **node's perspective** — they repel Pods. A taint on a node says "keep away unless you tolerate me." They prevent unwanted Pods from running on specific nodes.

**Node Affinity** works from the **Pod's perspective** — it attracts Pods to specific nodes. A Pod with node affinity says "I want to run on nodes with these labels."

**Used together for dedicated node pools:** Taint GPU nodes so only GPU-tolerating Pods can schedule there, AND set node affinity on GPU Pods to attract them to GPU nodes. This ensures GPU nodes are exclusively used by GPU workloads.

---

### Q2: How do you ensure Pod replicas are spread across availability zones?

**Expected Answer:**
Use **Topology Spread Constraints**:
```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels:
      app: my-app
```
This ensures the difference in Pod count between any two zones is at most 1. Alternatively, use Pod Anti-Affinity with `topologyKey: topology.kubernetes.io/zone`, but topology spread constraints offer finer control with `maxSkew`.

---

### Q3: What happens when you drain a node?

**Expected Answer:**
`kubectl drain` does two things: (1) Cordons the node (marks it unschedulable so no new Pods are placed on it), and (2) Evicts all Pods on the node (sends them SIGTERM, respecting PodDisruptionBudgets). DaemonSet Pods are not evicted (use `--ignore-daemonsets`). Pods managed by Deployments/ReplicaSets are recreated on other nodes. Standalone Pods without controllers are lost unless `--force` is used. Drain is used for node maintenance, kernel updates, and cluster upgrades.

---

## 12. Best Practices

1. **Use Topology Spread Constraints** for zone balancing (preferred over Pod Anti-Affinity).
2. **Use Taints for dedicated node pools** (GPU, high-memory, spot instances).
3. **Combine taints + affinity** for exclusive node pools.
4. **Use `preferredDuringScheduling`** when hard rules would prevent scheduling.
5. **Always use PodDisruptionBudgets** with drain operations to protect availability.
6. **Set PriorityClasses** for critical vs background workloads.
7. **Label nodes consistently** using standard labels (`topology.kubernetes.io/zone`, etc.).

---

## 13. Summary

| Mechanism | Direction | Strength | Use Case |
| :--- | :--- | :--- | :--- |
| **nodeSelector** | Pod → Node | Hard only | Simple label matching |
| **Node Affinity** | Pod → Node | Hard + Soft | Advanced node selection with operators |
| **Taints** | Node → Pod (repel) | Hard + Soft + Evict | Dedicated nodes, maintenance |
| **Tolerations** | Pod → Node (override taint) | — | Allow Pods on tainted nodes |
| **Pod Affinity** | Pod → Pod (attract) | Hard + Soft | Co-location for low latency |
| **Pod Anti-Affinity** | Pod → Pod (repel) | Hard + Soft | HA — spread replicas across nodes/zones |
| **Topology Spread** | Pod distribution | Hard + Soft | Even distribution across zones/nodes |
| **Priority/Preemption** | Pod priority ranking | — | Critical workloads get resources first |

---

## 14. Practice Assignment

1. Label two nodes differently. Deploy a Pod with `nodeSelector` targeting one specific node. Verify placement.
2. Create a Deployment with Node Affinity preferring SSD nodes. Verify behavior when SSD nodes are unavailable.
3. Taint a node with `NoSchedule`. Deploy a Pod without toleration (should go elsewhere). Add toleration and verify it schedules.
4. Deploy a 3-replica Deployment with Pod Anti-Affinity spread across nodes. Verify each replica is on a different node.
5. Configure Topology Spread Constraints to balance 6 replicas across 3 zones.
6. Drain a worker node and observe Pod rescheduling.
