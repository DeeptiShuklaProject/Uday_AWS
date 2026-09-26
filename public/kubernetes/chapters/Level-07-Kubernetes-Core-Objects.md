# Level 7 — Kubernetes Core Objects Comprehensive Guide

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Beginner → Intermediate |
| **Theory Duration** | 10 hours |
| **Practical Duration** | 10 hours |
| **Prerequisites** | Level 6 — kubectl Deep Dive |
| **Lab Required** | Yes — Any running Kubernetes cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKA (Workloads & Scheduling — 15%), CKAD (Application Design — 20%) |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Write YAML manifests from memory for all core Kubernetes objects.
2. Explain the relationship and hierarchy between Deployment → ReplicaSet → Pod.
3. Deploy stateless applications using Deployments and stateful applications using StatefulSets.
4. Schedule background and recurring tasks using Jobs and CronJobs.
5. Run per-node workloads using DaemonSets.
6. Expose applications using Services (ClusterIP, NodePort, LoadBalancer).
7. Organize clusters using Namespaces, Labels, Annotations, and ResourceQuotas.

---

## 1. Namespace — Logical Cluster Partitioning

### 1.1 Concept

**Simple Analogy:** Namespaces are like floors in an office building. Each floor has its own set of rooms (resources), reception (services), and access badges (RBAC). Teams on different floors don't interfere with each other, even if they name their rooms the same thing.

### 1.2 Default Namespaces

| Namespace | Purpose |
| :--- | :--- |
| `default` | Resources created without specifying a namespace go here |
| `kube-system` | Kubernetes system components (apiserver, scheduler, coredns, kube-proxy) |
| `kube-public` | Publicly readable data (e.g., cluster-info ConfigMap) |
| `kube-node-lease` | Node heartbeat (NodeLease) objects for node health detection |

### 1.3 YAML & Commands

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
    team: platform
```

```bash
# Create
kubectl create namespace staging
kubectl apply -f namespace.yaml

# List
kubectl get namespaces

# Set default namespace for current context
kubectl config set-context --current --namespace=production

# Delete (WARNING: Deletes ALL resources within the namespace)
kubectl delete namespace staging
```

### 1.4 Best Practices
- Use namespaces to separate environments: `dev`, `staging`, `production`.
- Use namespaces for team isolation: `team-frontend`, `team-backend`.
- Apply ResourceQuotas per namespace to prevent resource hogging.
- Apply NetworkPolicies per namespace for security isolation.

---

## 2. Labels, Selectors & Annotations

### 2.1 Labels — Identifying Metadata

Labels are key-value pairs attached to objects used for **grouping, filtering, and selecting**.

```yaml
metadata:
  labels:
    app: web-frontend         # Application name
    tier: frontend            # Application tier
    environment: production   # Environment
    version: v2.1.0           # Version
    team: platform            # Owning team
    cost-center: cc-1234      # Business metadata
```

### 2.2 Label Selectors

```bash
# Equality-based selectors
kubectl get pods -l app=web-frontend
kubectl get pods -l environment=production
kubectl get pods -l environment!=staging

# Set-based selectors
kubectl get pods -l 'app in (web-frontend, web-backend)'
kubectl get pods -l 'environment notin (dev, test)'
kubectl get pods -l 'tier,!canary'    # Has "tier" label, does NOT have "canary"

# Multiple selectors (AND logic)
kubectl get pods -l app=web-frontend,environment=production

# Used in YAML (matchLabels / matchExpressions)
spec:
  selector:
    matchLabels:              # Equality-based (simple, common)
      app: web-frontend
    matchExpressions:         # Set-based (advanced)
    - key: environment
      operator: In            # In, NotIn, Exists, DoesNotExist
      values: [production, staging]
```

### 2.3 Annotations — Non-Identifying Metadata

Annotations are key-value pairs for **metadata that is NOT used for selection** but stores additional information for tools and humans.

```yaml
metadata:
  annotations:
    description: "Frontend web server serving React SPA"
    owner: "platform-team@example.com"
    prometheus.io/scrape: "true"           # Prometheus auto-discovery
    prometheus.io/port: "9090"
    kubernetes.io/change-cause: "Updated image to v2.1.0"  # Rollout history
    alb.ingress.kubernetes.io/scheme: "internet-facing"     # AWS ALB config
```

**Rule:** If you need to SELECT objects by a value, use **labels**. If you need to STORE additional info, use **annotations**.

---

## 3. Pod

### 3.1 Concept

A **Pod** is the smallest deployable unit in Kubernetes. It wraps one or more containers that share the same network namespace (IP address), storage volumes, and lifecycle.

*(Covered in extreme detail in Level 8. This section provides the essential reference.)*

### 3.2 Basic Pod YAML

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
  namespace: default
  labels:
    app: web-app
    tier: frontend
spec:
  containers:
  - name: nginx
    image: nginx:1.25-alpine
    ports:
    - containerPort: 80
    resources:
      requests:
        cpu: "100m"          # 100 millicores (0.1 CPU core)
        memory: "128Mi"      # 128 Mebibytes
      limits:
        cpu: "500m"          # 500 millicores (0.5 CPU core)
        memory: "256Mi"      # 256 Mebibytes
    livenessProbe:
      httpGet:
        path: /healthz
        port: 80
      initialDelaySeconds: 10
      periodSeconds: 15
    readinessProbe:
      httpGet:
        path: /ready
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 10
  restartPolicy: Always      # Always | OnFailure | Never
```

---

## 4. ReplicaSet — Ensuring Pod Count

### 4.1 Concept

A **ReplicaSet** ensures that a specified number of Pod replicas are running at all times. If a Pod dies, the ReplicaSet controller creates a replacement. If there are too many Pods, it deletes the excess.

**Key Rule:** Never create ReplicaSets directly. Use Deployments, which manage ReplicaSets for you.

### 4.2 YAML

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: web-app-rs
  labels:
    app: web-app
spec:
  replicas: 3                     # Desired number of Pods
  selector:                       # MUST match the template labels
    matchLabels:
      app: web-app
  template:                       # Pod template (defines what each Pod looks like)
    metadata:
      labels:
        app: web-app              # MUST match selector.matchLabels
    spec:
      containers:
      - name: nginx
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
```

### 4.3 How It Works

```
ReplicaSet Controller Loop:
1. Watch: Observe all ReplicaSets via API Server.
2. For each ReplicaSet, list Pods matching the label selector.
3. Compare: running Pods vs spec.replicas.
4. If running < desired → Create new Pods.
5. If running > desired → Delete excess Pods.
6. If running == desired → No action.
7. Repeat continuously.
```

---

## 5. Deployment — Declarative Application Management

### 5.1 Concept

A **Deployment** is the most commonly used workload resource. It manages ReplicaSets and provides:
- **Rolling updates** — gradual transition to a new version.
- **Rollback** — instant revert to a previous version.
- **Scaling** — increase/decrease replica count.
- **Pause/Resume** — staged rollouts.

### 5.2 Object Hierarchy

```
Deployment (web-app)
    │
    ├── ReplicaSet (web-app-7d9f8b4)  ← Current version (3/3 Pods)
    │   ├── Pod (web-app-7d9f8b4-abc12)
    │   ├── Pod (web-app-7d9f8b4-def34)
    │   └── Pod (web-app-7d9f8b4-ghi56)
    │
    └── ReplicaSet (web-app-5c6d7e8)  ← Previous version (0/0 Pods, kept for rollback)
```

### 5.3 Complete Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
    tier: frontend
  annotations:
    kubernetes.io/change-cause: "Initial deployment of v1.0"
spec:
  replicas: 3                              # Desired Pod count
  revisionHistoryLimit: 10                 # Keep 10 old ReplicaSets for rollback
  selector:
    matchLabels:
      app: web-app
  strategy:
    type: RollingUpdate                    # RollingUpdate (default) or Recreate
    rollingUpdate:
      maxSurge: 1                          # Max extra Pods during update (can be % or int)
      maxUnavailable: 0                    # Max unavailable Pods during update
  template:
    metadata:
      labels:
        app: web-app
        tier: frontend
    spec:
      containers:
      - name: web
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 20
```

### 5.4 Deployment Commands

```bash
# Create
kubectl apply -f deployment.yaml

# Scale
kubectl scale deployment web-app --replicas=5 -n production

# Update image (triggers rolling update)
kubectl set image deployment/web-app web=nginx:1.26-alpine -n production

# Check rollout status
kubectl rollout status deployment/web-app -n production
# → Waiting for deployment "web-app" rollout to finish: 1 of 3 updated replicas are available...
# → deployment "web-app" successfully rolled out

# View rollout history
kubectl rollout history deployment/web-app -n production
# → REVISION  CHANGE-CAUSE
# → 1         Initial deployment of v1.0
# → 2         Updated image to v1.26

# Rollback to previous version
kubectl rollout undo deployment/web-app -n production

# Rollback to specific revision
kubectl rollout undo deployment/web-app --to-revision=1 -n production

# Pause a rollout (for canary-style testing)
kubectl rollout pause deployment/web-app -n production

# Resume a paused rollout
kubectl rollout resume deployment/web-app -n production
```

### 5.5 Rolling Update Process

```
Rolling Update: maxSurge=1, maxUnavailable=0, replicas=3

Initial State (v1):
  Pod-A (v1) ✅    Pod-B (v1) ✅    Pod-C (v1) ✅

Step 1: Create new Pod (maxSurge=1 allows 1 extra)
  Pod-A (v1) ✅    Pod-B (v1) ✅    Pod-C (v1) ✅    Pod-D (v2) ⏳
                                                       (starting)

Step 2: Pod-D passes readiness probe
  Pod-A (v1) ✅    Pod-B (v1) ✅    Pod-C (v1) ✅    Pod-D (v2) ✅
  Now we have 4 running. Can terminate one old Pod.

Step 3: Terminate Pod-A
  Pod-A (v1) ❌    Pod-B (v1) ✅    Pod-C (v1) ✅    Pod-D (v2) ✅

Step 4: Create Pod-E (v2)
  Pod-B (v1) ✅    Pod-C (v1) ✅    Pod-D (v2) ✅    Pod-E (v2) ⏳

... Repeat until all Pods are v2 ...

Final State (v2):
  Pod-D (v2) ✅    Pod-E (v2) ✅    Pod-F (v2) ✅
```

---

## 6. StatefulSet — Stateful Applications

### 6.1 Concept

A **StatefulSet** is like a Deployment but provides:
- **Stable network identity:** Each Pod gets a permanent hostname: `<name>-0`, `<name>-1`, `<name>-2`.
- **Stable persistent storage:** Each Pod gets its own PersistentVolumeClaim, retained across rescheduling.
- **Ordered deployment and scaling:** Pods are created in order (0, 1, 2) and deleted in reverse (2, 1, 0).

### 6.2 When to Use StatefulSet

| Workload | Use Deployment or StatefulSet? | Why? |
| :--- | :--- | :--- |
| Web frontend (nginx) | Deployment | Stateless; any Pod can handle any request |
| REST API server | Deployment | Stateless; horizontal scaling |
| PostgreSQL / MySQL | StatefulSet | Needs persistent storage and stable identity |
| Redis cluster | StatefulSet | Needs stable network names for cluster topology |
| Kafka / Zookeeper | StatefulSet | Needs ordered startup and stable storage |
| Elasticsearch | StatefulSet | Needs persistent data directories per node |

### 6.3 StatefulSet YAML

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
spec:
  serviceName: postgres-headless         # REQUIRED: Headless Service for DNS
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:                  # Each Pod gets its own PVC
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: gp3
      resources:
        requests:
          storage: 20Gi
---
# REQUIRED: Headless Service (ClusterIP: None)
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  namespace: production
spec:
  clusterIP: None                        # Headless = DNS returns individual Pod IPs
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### 6.4 DNS Records Created

```
StatefulSet: postgres (3 replicas) + Headless Service: postgres-headless

DNS Records:
  postgres-0.postgres-headless.production.svc.cluster.local → 10.0.1.50
  postgres-1.postgres-headless.production.svc.cluster.local → 10.0.2.60
  postgres-2.postgres-headless.production.svc.cluster.local → 10.0.1.70

PVCs Created:
  data-postgres-0  →  20Gi gp3 volume (attached to postgres-0)
  data-postgres-1  →  20Gi gp3 volume (attached to postgres-1)
  data-postgres-2  →  20Gi gp3 volume (attached to postgres-2)

Pod startup order: postgres-0 first, then postgres-1, then postgres-2
Pod deletion order: postgres-2 first, then postgres-1, then postgres-0
```

---

## 7. DaemonSet — One Pod Per Node

### 7.1 Concept

A **DaemonSet** ensures that a copy of a Pod runs on every node (or a subset of nodes using nodeSelector/affinity). When a new node joins the cluster, the DaemonSet automatically schedules a Pod on it. When a node is removed, the Pod is garbage collected.

### 7.2 Common Use Cases

| Use Case | Example |
| :--- | :--- |
| Log collection | Fluent Bit / Fluentd on every node |
| Monitoring agent | Prometheus Node Exporter, Datadog agent |
| Network plugin | Calico, Cilium, AWS VPC CNI |
| Storage driver | CSI node plugins (EBS CSI, EFS CSI) |
| Security agent | Falco runtime security on every node |
| kube-proxy | Kubernetes network proxy (built-in DaemonSet) |

### 7.3 DaemonSet YAML

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: kube-system
  labels:
    app: fluent-bit
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:2.2
        resources:
          requests:
            cpu: "50m"
            memory: "64Mi"
          limits:
            cpu: "200m"
            memory: "128Mi"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
          readOnly: true
        - name: containers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: containers
        hostPath:
          path: /var/lib/docker/containers
      tolerations:                      # Run on ALL nodes, including control plane
      - operator: Exists
```

---

## 8. Job & CronJob — Batch Processing

### 8.1 Job — Run to Completion

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-migration
spec:
  completions: 5          # Total successful completions needed
  parallelism: 2          # Run 2 Pods simultaneously
  backoffLimit: 3          # Retry up to 3 times on failure
  activeDeadlineSeconds: 600  # Kill after 10 minutes
  template:
    spec:
      containers:
      - name: migrate
        image: myapp/migrate:v1.0
        command: ["python", "migrate.py"]
      restartPolicy: OnFailure    # OnFailure or Never (NOT Always)
```

### 8.2 CronJob — Scheduled Execution

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
spec:
  schedule: "0 2 * * *"              # Every day at 2:00 AM (cron syntax)
  concurrencyPolicy: Forbid          # Don't run if previous job still running
  successfulJobsHistoryLimit: 3      # Keep last 3 successful jobs
  failedJobsHistoryLimit: 1          # Keep last 1 failed job
  startingDeadlineSeconds: 200       # Must start within 200s of schedule
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16-alpine
            command: ["/bin/sh", "-c", "pg_dump -h db-host mydb > /backup/dump.sql"]
          restartPolicy: OnFailure
```

```bash
# Cron schedule reference:
# ┌───────────── minute (0 - 59)
# │ ┌───────────── hour (0 - 23)
# │ │ ┌───────────── day of month (1 - 31)
# │ │ │ ┌───────────── month (1 - 12)
# │ │ │ │ ┌───────────── day of week (0 - 6, Sunday = 0)
# │ │ │ │ │
# * * * * *
#
# "0 2 * * *"     = Daily at 2:00 AM
# "*/15 * * * *"  = Every 15 minutes
# "0 0 * * 0"     = Every Sunday at midnight
# "0 9 1 * *"     = 9:00 AM on the 1st of every month
```

---

## 9. Service — Network Abstraction

### 9.1 Concept

A **Service** provides a stable network endpoint for accessing a set of Pods. Pod IPs change on restart; Service IPs do not. Services use label selectors to discover backend Pods.

### 9.2 Service Types

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Kubernetes Service Types                          │
│                                                                          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐│
│  │   ClusterIP      │  │    NodePort       │  │     LoadBalancer         ││
│  │   (default)      │  │                   │  │                          ││
│  │                   │  │                   │  │  ┌────────────────────┐  ││
│  │  Internal-only    │  │  External access  │  │  │  Cloud LB (NLB/ALB│  ││
│  │  access within    │  │  via any node IP  │  │  │  provisioned by    │  ││
│  │  the cluster      │  │  on a static port │  │  │  cloud provider)   │  ││
│  │                   │  │  (30000-32767)    │  │  └────────┬───────────┘  ││
│  │  10.96.0.100:80   │  │  <NodeIP>:30080   │  │           │              ││
│  │       │           │  │       │           │  │           ▼              ││
│  │       ▼           │  │       ▼           │  │     NodePort + ClusterIP ││
│  │  Backend Pods     │  │  Backend Pods     │  │     Backend Pods         ││
│  └─────────────────┘  └──────────────────┘  └──────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │   ExternalName (DNS alias — no proxy, no ClusterIP)                 │ │
│  │   Returns a CNAME record pointing to an external DNS name           │ │
│  │   Example: maps "my-db" to "db.external.example.com"                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### 9.3 ClusterIP Service YAML

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-svc
  namespace: production
spec:
  type: ClusterIP                  # Default — internal only
  selector:
    app: web-app                   # Routes to Pods with label app=web-app
  ports:
  - name: http
    port: 80                       # Service port (what clients connect to)
    targetPort: 8080               # Container port (where app listens)
    protocol: TCP
```

### 9.4 NodePort Service YAML

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-nodeport
spec:
  type: NodePort
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080                # Static port on every node (30000-32767)
    protocol: TCP
```

### 9.5 LoadBalancer Service YAML

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-lb
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"        # AWS NLB
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  type: LoadBalancer
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
```

### 9.6 Service DNS

```
# Every Service gets a DNS entry in CoreDNS:
<service-name>.<namespace>.svc.cluster.local

Examples:
web-app-svc.production.svc.cluster.local   → ClusterIP 10.96.0.100
web-app-svc.production.svc                 → Short form (within same cluster)
web-app-svc.production                     → Shorter form
web-app-svc                                → Within same namespace
```

---

## 10. ResourceQuota & LimitRange

### 10.1 ResourceQuota — Namespace-Level Limits

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "10"            # Total CPU requests across all Pods
    requests.memory: "20Gi"       # Total memory requests
    limits.cpu: "20"              # Total CPU limits
    limits.memory: "40Gi"         # Total memory limits
    pods: "50"                    # Maximum number of Pods
    services: "20"                # Maximum number of Services
    persistentvolumeclaims: "10"  # Maximum number of PVCs
    configmaps: "30"              # Maximum ConfigMaps
    secrets: "30"                 # Maximum Secrets
```

### 10.2 LimitRange — Per-Pod/Container Defaults

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: dev
spec:
  limits:
  - type: Container
    default:                       # Default limits (if none specified)
      cpu: "500m"
      memory: "256Mi"
    defaultRequest:                # Default requests (if none specified)
      cpu: "100m"
      memory: "128Mi"
    max:                           # Maximum allowed limits
      cpu: "2"
      memory: "2Gi"
    min:                           # Minimum allowed requests
      cpu: "50m"
      memory: "64Mi"
```

---

## 11. Hands-On Lab

### Lab 7.1: Core Objects Practice

```bash
# Step 1: Create namespace
kubectl create namespace lab-7

# Step 2: Deploy a web application
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
  namespace: lab-7
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
        tier: frontend
    spec:
      containers:
      - name: nginx
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "50m"
            memory: "64Mi"
          limits:
            cpu: "200m"
            memory: "128Mi"
EOF

# Step 3: Expose with a ClusterIP Service
kubectl expose deployment webapp --port=80 --target-port=80 -n lab-7

# Step 4: Verify
kubectl get all -n lab-7
kubectl describe service webapp -n lab-7

# Step 5: Test internal DNS
kubectl run tmp --image=busybox:1.36 --rm -it --restart=Never -n lab-7 -- \
  wget -qO- http://webapp.lab-7.svc.cluster.local

# Step 6: Trigger a rolling update
kubectl set image deployment/webapp nginx=nginx:1.26-alpine -n lab-7
kubectl rollout status deployment/webapp -n lab-7

# Step 7: View rollout history and rollback
kubectl rollout history deployment/webapp -n lab-7
kubectl rollout undo deployment/webapp -n lab-7

# Step 8: Create a Job
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: hello-job
  namespace: lab-7
spec:
  template:
    spec:
      containers:
      - name: hello
        image: busybox:1.36
        command: ["echo", "Hello from Kubernetes Job!"]
      restartPolicy: Never
EOF

kubectl get jobs -n lab-7
kubectl logs job/hello-job -n lab-7

# Step 9: Cleanup
kubectl delete namespace lab-7
```

---

## 12. Interview Questions

### Q1: What is the difference between a Deployment and a StatefulSet?

**Expected Answer:**
A Deployment manages stateless applications — Pods are interchangeable, have random names, and share no persistent state. A StatefulSet manages stateful applications — Pods have stable network identities (`app-0`, `app-1`), each gets its own PersistentVolumeClaim, and Pods are created/deleted in order. Use Deployments for web servers and APIs; use StatefulSets for databases, message queues, and distributed systems.

---

### Q2: How does a Service route traffic to Pods?

**Expected Answer:**
A Service uses a **label selector** to discover backend Pods. The EndpointSlice Controller watches for Pods matching the selector and updates the EndpointSlice object with their IPs. kube-proxy reads the EndpointSlice and creates iptables/IPVS rules that intercept traffic to the Service ClusterIP and DNAT it to one of the backend Pod IPs using random probability (load balancing).

---

### Q3: What are the 3 types of Kubernetes Services?

**Expected Answer:**
1. **ClusterIP** (default): Internal-only. Assigns a stable virtual IP accessible within the cluster. Used for internal microservice-to-microservice communication.
2. **NodePort**: Exposes the service on a static port (30000-32767) on every node. External traffic can reach the service via `<NodeIP>:<NodePort>`.
3. **LoadBalancer**: Provisions a cloud provider load balancer (AWS NLB/ALB) that forwards external traffic to the service. Builds on top of NodePort + ClusterIP.

**Bonus:** ExternalName — returns a CNAME DNS record pointing to an external hostname. No proxy or ClusterIP.

---

## 13. Best Practices

1. **Always use Deployments** — never create bare Pods (they won't be recreated on failure).
2. **Always set resource requests and limits** on every container.
3. **Use labels consistently** — establish a labeling standard (`app`, `tier`, `environment`, `version`, `team`).
4. **Use Namespaces** to isolate environments and teams.
5. **Use ResourceQuotas** to prevent any team from consuming entire cluster resources.
6. **Use headless Services** for StatefulSets (enables stable DNS per Pod).
7. **Set `revisionHistoryLimit`** to a reasonable number (5-10) to enable rollbacks.

---

## 14. Summary

| Object | Purpose | Key Feature |
| :--- | :--- | :--- |
| **Namespace** | Logical isolation | Scope for RBAC, ResourceQuotas, NetworkPolicies |
| **Deployment** | Stateless app management | Rolling updates, rollback, scaling |
| **ReplicaSet** | Pod count enforcement | Managed by Deployment (don't create directly) |
| **StatefulSet** | Stateful app management | Stable identity, stable storage, ordered ops |
| **DaemonSet** | One Pod per node | Log collectors, monitoring agents, CNI plugins |
| **Job** | Run-to-completion task | Batch processing, migrations |
| **CronJob** | Scheduled tasks | Backups, reports, cleanup jobs |
| **Service** | Stable network endpoint | ClusterIP / NodePort / LoadBalancer |
| **ResourceQuota** | Namespace resource limits | Prevent resource hogging |
| **LimitRange** | Default resource settings | Ensure every container has resource bounds |

---

## 15. Practice Assignment

1. Create a Deployment with 5 replicas. Perform a rolling update to a new image version. Then rollback to the original.
2. Create a StatefulSet for Redis with a headless Service. Verify stable DNS names (`redis-0`, `redis-1`).
3. Create a DaemonSet that runs busybox on every worker node and outputs the hostname.
4. Create a Job that calculates Pi to 2000 decimal places and a CronJob that runs it every 5 minutes.
5. Create a Namespace with a ResourceQuota limiting it to 5 Pods and 1 CPU total.
6. Expose a Deployment with ClusterIP, NodePort, and LoadBalancer services. Test access from different locations.
