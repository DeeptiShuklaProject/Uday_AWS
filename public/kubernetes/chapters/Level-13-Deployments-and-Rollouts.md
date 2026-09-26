# Level 13 — Deployment Strategies & Rolling Updates

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate |
| **Theory Duration** | 5 hours |
| **Practical Duration** | 5 hours |
| **Prerequisites** | Level 12 — Scheduling |
| **Lab Required** | Yes — Any running Kubernetes cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Core topic for DevOps/SRE interviews |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Every production deployment uses strategies |
| **Certification Alignment** | CKA (Workloads), CKAD (Application Deployment — 20%) |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Configure and execute Rolling Update deployments with `maxSurge` and `maxUnavailable`.
2. Implement Recreate strategy and understand when to use it.
3. Perform rollbacks to any previous revision.
4. Implement Blue/Green deployments using Kubernetes Services.
5. Implement Canary deployments using native K8s or weighted traffic routing.
6. Configure PodDisruptionBudgets for safe voluntary disruptions.
7. Choose the right deployment strategy for each use case.

---

## 1. Deployment Strategies Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Deployment Strategy Comparison                           │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │  Rolling     │  │  Recreate   │  │  Blue/Green │  │  Canary             │ │
│  │  Update      │  │             │  │             │  │                    │ │
│  │              │  │             │  │             │  │                    │ │
│  │  v1 ████████ │  │  v1 ████████│  │  v1 ████████│  │  v1 ██████████    │ │
│  │  v1 ██████   │  │             │  │  v2 ████████│  │  v2 ██            │ │
│  │  v1 ████     │  │             │  │     switch  │  │     10% traffic   │ │
│  │  v2   ██     │  │  v2 ████████│  │     ↓       │  │     ↓             │ │
│  │  v2   ████   │  │             │  │  v2 ████████│  │  v2 ██████████    │ │
│  │  v2   ██████ │  │             │  │             │  │                    │ │
│  │  v2 ████████ │  │             │  │             │  │                    │ │
│  │              │  │             │  │             │  │                    │ │
│  │ Zero downtime│  │  Downtime!  │  │ Instant swap│  │ Gradual rollout   │ │
│  │ K8s native   │  │  K8s native │  │ Manual/Svc  │  │ Manual or Argo    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Rolling Update (Default Strategy)

### 2.1 Concept

Gradually replaces old Pods with new Pods. At no point are ALL Pods unavailable. Zero-downtime deployment.

### 2.2 Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  annotations:
    kubernetes.io/change-cause: "Update to v2.0 — new payment module"
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1              # Max 1 extra Pod during update (can be % or int)
      maxUnavailable: 0        # Zero unavailable Pods (safest)
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web
        image: nginx:2.0
        readinessProbe:         # CRITICAL for rolling updates!
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 2.3 maxSurge and maxUnavailable Combinations

| `maxSurge` | `maxUnavailable` | Behavior | Speed | Risk |
| :--- | :--- | :--- | :--- | :--- |
| `1` | `0` | Always N or N+1 Pods running. Safest. | Slowest | Lowest |
| `25%` | `25%` | Default K8s behavior. Balanced. | Medium | Medium |
| `50%` | `0` | Fast but uses 50% more resources temporarily | Fast | Low |
| `0` | `1` | Kill 1 old, start 1 new (resource-efficient) | Slow | Medium |
| `100%` | `0` | Double the Pods then drain old (like Blue/Green) | Fast | Low (needs 2x resources) |

### 2.4 Detailed Rolling Update Process

```
Replicas: 4, maxSurge: 1, maxUnavailable: 0

Step 0 — Initial state (v1):
  Pod-A(v1)✅  Pod-B(v1)✅  Pod-C(v1)✅  Pod-D(v1)✅
  Running: 4/4    Available: 4

Step 1 — Create 1 new Pod (maxSurge allows 1 extra):
  Pod-A(v1)✅  Pod-B(v1)✅  Pod-C(v1)✅  Pod-D(v1)✅  Pod-E(v2)⏳
  Running: 5/4    (1 over desired — allowed by maxSurge)

Step 2 — Pod-E passes readiness probe:
  Pod-A(v1)✅  Pod-B(v1)✅  Pod-C(v1)✅  Pod-D(v1)✅  Pod-E(v2)✅
  Available: 5 → can remove 1 old Pod (maxUnavailable=0 means min 4 must be available)

Step 3 — Terminate Pod-A:
  Pod-A(v1)⏳terminating  Pod-B(v1)✅  Pod-C(v1)✅  Pod-D(v1)✅  Pod-E(v2)✅
  → preStop hook → SIGTERM → graceful shutdown

Step 4 — Pod-A terminated. Create Pod-F(v2):
  Pod-B(v1)✅  Pod-C(v1)✅  Pod-D(v1)✅  Pod-E(v2)✅  Pod-F(v2)⏳

... continue until all Pods are v2 ...

Step final:
  Pod-E(v2)✅  Pod-F(v2)✅  Pod-G(v2)✅  Pod-H(v2)✅
  Running: 4/4    All v2 ✅
```

### 2.5 Rollout Commands

```bash
# Trigger a rolling update by changing the image
kubectl set image deployment/web-app web=nginx:2.0

# Or apply updated YAML
kubectl apply -f deployment-v2.yaml

# Watch rollout progress
kubectl rollout status deployment/web-app
# → Waiting for deployment "web-app" rollout to finish: 2 of 4 updated replicas are available...
# → deployment "web-app" successfully rolled out

# View rollout history
kubectl rollout history deployment/web-app
# → REVISION  CHANGE-CAUSE
# → 1         Initial deployment v1.0
# → 2         Update to v2.0 — new payment module

# View details of a specific revision
kubectl rollout history deployment/web-app --revision=1

# Rollback to previous version
kubectl rollout undo deployment/web-app
# → Instantly creates new ReplicaSet with v1 config

# Rollback to specific revision
kubectl rollout undo deployment/web-app --to-revision=1

# Pause/Resume rollout (for manual verification between batches)
kubectl rollout pause deployment/web-app
# → Perform checks...
kubectl rollout resume deployment/web-app
```

---

## 3. Recreate Strategy

### 3.1 Concept

Kill ALL old Pods first, then create ALL new Pods. There IS downtime.

### 3.2 When to Use

| Use Case | Why Recreate? |
| :--- | :--- |
| Database schema change (incompatible v1↔v2) | Old version cannot run alongside new version |
| Persistent volume with RWO (single-attach) | New Pod can't mount volume until old Pod releases it |
| Single-instance applications (dev/test) | Simplicity; downtime acceptable |
| License-limited software (single instance) | Cannot run two instances simultaneously |

### 3.3 Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: legacy-app
spec:
  replicas: 3
  strategy:
    type: Recreate          # Kill all old, then create all new
  selector:
    matchLabels:
      app: legacy-app
  template:
    metadata:
      labels:
        app: legacy-app
    spec:
      containers:
      - name: app
        image: legacy-app:v2.0
```

```
Recreate process:

Step 1: All v1 Pods are terminated simultaneously
  Pod-A(v1)❌  Pod-B(v1)❌  Pod-C(v1)❌
  → DOWNTIME WINDOW BEGINS

Step 2: All v2 Pods are created
  Pod-D(v2)⏳  Pod-E(v2)⏳  Pod-F(v2)⏳

Step 3: v2 Pods become ready
  Pod-D(v2)✅  Pod-E(v2)✅  Pod-F(v2)✅
  → DOWNTIME WINDOW ENDS
```

---

## 4. Blue/Green Deployment

### 4.1 Concept

Run two identical environments: **Blue** (current production) and **Green** (new version). Switch traffic instantly by updating the Service selector.

### 4.2 Implementation

```yaml
# Blue Deployment (current production — v1)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
      version: blue
  template:
    metadata:
      labels:
        app: web-app
        version: blue
    spec:
      containers:
      - name: web
        image: myapp:v1.0
---
# Green Deployment (new version — v2)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
      version: green
  template:
    metadata:
      labels:
        app: web-app
        version: green
    spec:
      containers:
      - name: web
        image: myapp:v2.0
---
# Service (initially pointing to Blue)
apiVersion: v1
kind: Service
metadata:
  name: web-app-svc
spec:
  selector:
    app: web-app
    version: blue            # ← Points to Blue
  ports:
  - port: 80
    targetPort: 8080
```

```bash
# Step 1: Deploy Green alongside Blue
kubectl apply -f green-deployment.yaml

# Step 2: Test Green internally
kubectl run test --image=curlimages/curl --rm -it --restart=Never -- \
  curl http://web-app-green.default.svc:8080/healthz

# Step 3: Switch traffic to Green (instant cutover)
kubectl patch service web-app-svc -p '{"spec":{"selector":{"version":"green"}}}'

# Step 4: Verify
kubectl describe service web-app-svc  # → Endpoints should show Green Pod IPs

# Step 5: If problems → instant rollback to Blue
kubectl patch service web-app-svc -p '{"spec":{"selector":{"version":"blue"}}}'

# Step 6: Cleanup Blue after confidence period
kubectl delete deployment web-app-blue
```

### 4.3 Blue/Green Pros and Cons

| Pro | Con |
| :--- | :--- |
| Instant switch (zero downtime) | Requires 2x resources (both running simultaneously) |
| Instant rollback | Database schema changes are tricky (both versions hit same DB) |
| Easy to test Green before switching | No gradual traffic shift (all or nothing) |

---

## 5. Canary Deployment

### 5.1 Concept

Route a **small percentage of traffic** (e.g., 5-10%) to the new version. Monitor metrics. If healthy, gradually increase. If problems, rollback the small canary only.

### 5.2 Native Kubernetes Canary (Replica-Based)

```yaml
# Stable Deployment (v1 — 9 replicas → 90% of traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: web-app
      track: stable
  template:
    metadata:
      labels:
        app: web-app              # Shared label for Service selector
        track: stable
        version: v1
    spec:
      containers:
      - name: web
        image: myapp:v1.0
---
# Canary Deployment (v2 — 1 replica → 10% of traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
      track: canary
  template:
    metadata:
      labels:
        app: web-app              # Same shared label → included in Service
        track: canary
        version: v2
    spec:
      containers:
      - name: web
        image: myapp:v2.0
---
# Service selects BOTH stable and canary (label: app=web-app)
apiVersion: v1
kind: Service
metadata:
  name: web-app-svc
spec:
  selector:
    app: web-app                  # Matches BOTH deployments
  ports:
  - port: 80
    targetPort: 8080
```

```bash
# Traffic split: 9/(9+1) = 90% v1, 10% v2

# If canary is healthy, gradually shift:
kubectl scale deployment web-app-stable --replicas=7
kubectl scale deployment web-app-canary --replicas=3
# → 70% v1, 30% v2

# Continue until:
kubectl scale deployment web-app-stable --replicas=0
kubectl scale deployment web-app-canary --replicas=10
# → 100% v2

# If canary has issues:
kubectl scale deployment web-app-canary --replicas=0
# → Instant rollback to 100% v1
```

### 5.3 Advanced Canary with Argo Rollouts

```yaml
# Argo Rollouts provides first-class canary support
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: web-app
spec:
  replicas: 10
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web
        image: myapp:v2.0
  strategy:
    canary:
      steps:
      - setWeight: 10              # 10% traffic to canary
      - pause: { duration: 5m }    # Wait 5 minutes
      - setWeight: 30              # 30% traffic
      - pause: { duration: 5m }
      - setWeight: 60              # 60% traffic
      - pause: { duration: 10m }
      - setWeight: 100             # Full rollout
      canaryService: web-app-canary
      stableService: web-app-stable
      trafficRouting:
        nginx:
          stableIngress: web-app-ingress
```

---

## 6. PodDisruptionBudget (PDB)

### 6.1 Concept

A PodDisruptionBudget limits the number of Pods that can be voluntarily disrupted (e.g., during `kubectl drain`, node upgrades, cluster autoscaler scale-down).

### 6.2 Configuration

```yaml
# Method 1: Minimum available
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app-pdb
spec:
  minAvailable: 2                     # At least 2 Pods must always be running
  # OR: minAvailable: "75%"           # At least 75% of Pods must be running
  selector:
    matchLabels:
      app: web-app
---
# Method 2: Maximum unavailable
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app-pdb
spec:
  maxUnavailable: 1                   # At most 1 Pod can be disrupted at a time
  # OR: maxUnavailable: "25%"
  selector:
    matchLabels:
      app: web-app
```

### 6.3 How PDB Works

```
Scenario: 4 replicas of web-app, PDB: minAvailable=3

kubectl drain worker-01:
  worker-01 has: web-app-pod-A, web-app-pod-B
  worker-02 has: web-app-pod-C, web-app-pod-D

  Step 1: Drain tries to evict Pod-A.
    PDB check: 4 running - 1 = 3 ≥ minAvailable(3) → ALLOWED ✅
    Pod-A evicted. Rescheduled on worker-02.

  Step 2: Drain tries to evict Pod-B.
    PDB check: 3 running - 1 = 2 < minAvailable(3) → BLOCKED ❌
    Drain waits until Pod-A's replacement is running on worker-02.

  Step 3: Pod-A replacement is running (4 Pods total again).
    PDB check: 4 running - 1 = 3 ≥ minAvailable(3) → ALLOWED ✅
    Pod-B evicted and rescheduled.
```

---

## 7. Strategy Selection Guide

| Criteria | Rolling Update | Recreate | Blue/Green | Canary |
| :--- | :--- | :--- | :--- | :--- |
| **Zero downtime** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **Resource overhead** | Low (+1 Pod) | None | High (2x) | Low (+1-2 Pods) |
| **Rollback speed** | Medium (undo rollout) | Slow (redeploy v1) | Instant (switch Service) | Fast (scale canary to 0) |
| **Gradual traffic shift** | ❌ No (all-or-nothing per Pod) | ❌ No | ❌ No | ✅ Yes |
| **Risk level** | Low-Medium | Medium (downtime) | Low | Very Low |
| **Complexity** | Very Low (native K8s) | Very Low (native K8s) | Medium (manual) | Medium-High (requires tooling) |
| **Best for** | Most stateless apps | Schema changes, RWO volumes | Critical apps, compliance | High-traffic apps, SaaS |

---

## 8. Hands-On Lab

### Lab 13.1: Rolling Update and Rollback

```bash
kubectl create namespace lab-13

# Deploy v1
kubectl create deployment web --image=nginx:1.25-alpine --replicas=4 -n lab-13
kubectl annotate deployment web kubernetes.io/change-cause="Deploy v1.25" -n lab-13

# Watch the rollout
kubectl rollout status deployment/web -n lab-13

# Update to v2 (rolling update)
kubectl set image deployment/web nginx=nginx:1.26-alpine -n lab-13
kubectl annotate deployment web kubernetes.io/change-cause="Update to v1.26" --overwrite -n lab-13

# Watch pods transitioning
kubectl get pods -n lab-13 -w

# Check history
kubectl rollout history deployment/web -n lab-13

# Rollback
kubectl rollout undo deployment/web -n lab-13

# Verify
kubectl describe deployment web -n lab-13 | grep Image

kubectl delete namespace lab-13
```

---

## 9. Interview Questions

### Q1: What deployment strategies does Kubernetes support natively?

**Expected Answer:**
Kubernetes natively supports two strategies in the Deployment spec:
1. **RollingUpdate** (default): Gradually replaces old Pods with new ones. Configurable via `maxSurge` (extra Pods during update) and `maxUnavailable` (Pods that can be down). Zero-downtime if readiness probes are configured.
2. **Recreate**: Terminates ALL old Pods before creating new ones. Has downtime. Use when old and new versions cannot coexist.

Blue/Green and Canary are implemented at the application layer using Service selectors, separate Deployments, or tools like Argo Rollouts — they're not built-in Deployment strategies.

---

### Q2: How do you rollback a failed deployment?

**Expected Answer:**
Use `kubectl rollout undo deployment/<name>` to instantly revert to the previous revision. Kubernetes keeps old ReplicaSets (controlled by `revisionHistoryLimit`, default 10) for rollback. To rollback to a specific revision: `kubectl rollout undo deployment/<name> --to-revision=N`. You can view revision history with `kubectl rollout history deployment/<name>`.

---

### Q3: What is a PodDisruptionBudget and why is it important?

**Expected Answer:**
A PodDisruptionBudget (PDB) limits the number of Pods that can be voluntarily disrupted simultaneously — during node drain, cluster autoscaler scale-down, or maintenance. It specifies either `minAvailable` (minimum Pods that must remain running) or `maxUnavailable` (maximum Pods that can be disrupted). PDBs are critical for maintaining application availability during cluster operations. Without PDBs, a drain operation could simultaneously evict all replicas, causing an outage.

---

## 10. Best Practices

1. **Always configure readiness probes** — rolling updates depend on readiness to gauge when new Pods are ready.
2. **Use `maxSurge: 1, maxUnavailable: 0`** for safest rolling updates (no capacity loss).
3. **Set `revisionHistoryLimit`** to 5-10 (keeps rollback history without excessive old ReplicaSets).
4. **Add `kubernetes.io/change-cause` annotation** for meaningful rollout history descriptions.
5. **Create PodDisruptionBudgets** for all production Deployments.
6. **Use Blue/Green for high-risk changes** that need instant rollback capability.
7. **Use Canary for high-traffic services** to validate new versions with minimal user impact.
8. **Always test canary with monitoring** — metrics (error rate, latency) should validate the canary before promotion.

---

## 11. Summary

| Strategy | Downtime | Resources | Rollback | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Rolling Update** | Zero | Low (+maxSurge) | `kubectl rollout undo` | Default for stateless apps |
| **Recreate** | Yes | None extra | Redeploy old version | Incompatible versions, RWO volumes |
| **Blue/Green** | Zero | 2x (both running) | Switch Service selector | Critical apps, instant rollback |
| **Canary** | Zero | Low (+canary Pods) | Scale canary to 0 | High-traffic, risk-averse |
| **PDB** | N/A | N/A | N/A | Protect availability during drain/upgrade |

---

## 12. Practice Assignment

1. Deploy a 4-replica application. Perform a rolling update with `maxSurge=1, maxUnavailable=0`. Watch the process.
2. Trigger a bad deployment (invalid image tag). Observe the stuck rollout and perform a rollback.
3. Implement a Blue/Green deployment using two Deployments and a Service. Switch traffic between them.
4. Implement a native Canary deployment (90/10 split using replica counts).
5. Create a PodDisruptionBudget with `minAvailable: 2`. Drain a node and observe the PDB enforcement.
6. Compare rollout speed between `maxSurge=1,maxUnavailable=0` and `maxSurge=50%,maxUnavailable=50%`.
