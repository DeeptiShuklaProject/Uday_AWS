# Level 26 — Kubernetes Troubleshooting Mastery

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Advanced |
| **Theory Duration** | 8 hours |
| **Practical Duration** | 10 hours |
| **Prerequisites** | Level 25 — Production Operations |
| **Lab Required** | Yes — Break-and-fix scenarios |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — THE most important interview topic |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Daily SRE/DevOps work |
| **Certification Alignment** | CKA (Troubleshooting — 30%), CKAD, CKS |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Systematically troubleshoot Pod failures (Pending, CrashLoopBackOff, ImagePullBackOff).
2. Debug networking issues (DNS, Service connectivity, NetworkPolicy).
3. Diagnose cluster-level problems (node NotReady, control plane issues).
4. Troubleshoot storage issues (PVC Pending, mount failures).
5. Use the troubleshooting decision tree for rapid incident resolution.

---

## 1. Troubleshooting Decision Tree

```
Pod is not working
    │
    ├─ Pod Phase = Pending?
    │   ├─ Check: kubectl describe pod → Events
    │   ├─ "Insufficient cpu/memory" → Node resources full → Scale up nodes
    │   ├─ "node selector didn't match" → Fix nodeSelector/affinity labels
    │   ├─ "taint not tolerated" → Add toleration or remove taint
    │   ├─ "volume zone mismatch" → Use WaitForFirstConsumer StorageClass
    │   └─ "PVC Pending" → StorageClass missing / CSI driver not installed
    │
    ├─ Pod Phase = ImagePullBackOff?
    │   ├─ Check: kubectl describe pod → Events
    │   ├─ "pull access denied" → Image doesn't exist or wrong tag
    │   ├─ "unauthorized" → Missing imagePullSecrets or expired token
    │   └─ "timeout" → Network issue (NAT Gateway, Security Group, DNS)
    │
    ├─ Pod Phase = CrashLoopBackOff?
    │   ├─ Check: kubectl logs <pod> / kubectl logs <pod> --previous
    │   ├─ Application error → Fix code, config, or dependencies
    │   ├─ OOMKilled → Increase memory limits
    │   ├─ Permission denied → Fix SecurityContext (runAsUser, fsGroup)
    │   └─ Config error → Check ConfigMap/Secret values
    │
    ├─ Pod is Running but not responding?
    │   ├─ Check readiness/liveness probes → kubectl describe pod
    │   ├─ Probe failing → App not listening on expected port/path
    │   ├─ DNS issue → Test: kubectl exec -- nslookup <service>
    │   ├─ NetworkPolicy blocking → Check policies with kubectl get netpol
    │   └─ Service selector mismatch → Labels don't match endpoints
    │
    └─ Pod was terminated unexpectedly?
        ├─ Check: kubectl describe pod → Last State → Reason
        ├─ OOMKilled → Increase memory limits
        ├─ Evicted → Node under memory/disk pressure → Add resources
        ├─ Preempted → Higher priority Pod needed resources
        └─ Node drain → Maintenance in progress
```

---

## 2. Essential Troubleshooting Commands

```bash
# ─── Pod Troubleshooting ────────────────────────────────────
kubectl get pods -o wide                              # Pod status + node placement
kubectl describe pod <pod-name>                       # Events, conditions, container status
kubectl logs <pod-name>                               # Current container logs
kubectl logs <pod-name> --previous                    # Logs from PREVIOUS crashed container
kubectl logs <pod-name> -c <container>                # Specific container in multi-container Pod
kubectl exec -it <pod-name> -- /bin/sh                # Shell into running container
kubectl top pod <pod-name>                            # CPU/memory usage

# ─── Node Troubleshooting ───────────────────────────────────
kubectl get nodes -o wide                             # Node status
kubectl describe node <node-name>                     # Conditions, resource usage, events
kubectl top nodes                                     # CPU/memory per node
kubectl get pods --field-selector spec.nodeName=<node> -A  # Pods on specific node

# ─── Service/Networking ─────────────────────────────────────
kubectl get svc -o wide                               # Service endpoints
kubectl get endpoints <service-name>                  # Which Pods back the Service
kubectl get endpointslices -l kubernetes.io/service-name=<svc>
kubectl run debug --image=busybox:1.36 --rm -it -- nslookup <service>
kubectl run debug --image=curlimages/curl --rm -it -- curl <service>:<port>

# ─── Events ─────────────────────────────────────────────────
kubectl get events --sort-by=.lastTimestamp -A        # Cluster-wide events
kubectl get events -n <namespace> --sort-by=.lastTimestamp

# ─── Resources ──────────────────────────────────────────────
kubectl api-resources                                 # All resource types
kubectl get all -n <namespace>                        # All resources in namespace
```

---

## 3. Pod Failure Scenarios

### 3.1 CrashLoopBackOff

```bash
# Diagnosis
kubectl describe pod crash-pod
# → State: Waiting (CrashLoopBackOff)
# → Last State: Terminated (Exit Code 1/137)
# → Restart Count: 5

kubectl logs crash-pod --previous
# → Shows application error from the PREVIOUS container instance

# Common causes and fixes:
# Exit Code 1:   Application error → Check logs, fix code/config
# Exit Code 137: OOMKilled → Increase spec.containers[].resources.limits.memory
# Exit Code 126: Permission denied → Fix file permissions or SecurityContext
# Exit Code 127: Command not found → Wrong image or entrypoint

# Fix OOMKilled:
kubectl patch deployment myapp -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"512Mi"}}}]}}}}'
```

### 3.2 ImagePullBackOff

```bash
# Diagnosis
kubectl describe pod image-pod
# → Events:
# → Failed to pull image "myapp:v999": rpc error: manifest unknown
# → Failed to pull image "private.ecr/app:v1": unauthorized

# Fixes:
# 1. Image doesn't exist:
#    → Verify: docker pull myapp:v999 (or check ECR console)
#    → Fix the image tag in the Deployment

# 2. Private registry — missing credentials:
kubectl create secret docker-registry ecr-secret \
  --docker-server=123456789012.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password)

# Add to Pod spec:
# spec.imagePullSecrets:
# - name: ecr-secret
```

### 3.3 Pending Pod

```bash
# Diagnosis
kubectl describe pod pending-pod
# → Events section shows WHY it's pending

# Scenario: No CPU/memory
# "0/3 nodes are available: 3 Insufficient cpu"
# Fix: Scale up node group or reduce Pod requests

# Scenario: No matching node
# "0/3 nodes are available: 3 node(s) didn't match Pod's node affinity/selector"
# Fix: Label nodes correctly or fix Pod nodeSelector

# Scenario: Taint
# "0/3 nodes are available: 3 node(s) had taint {dedicated: gpu}"
# Fix: Add toleration to Pod or remove taint
```

---

## 4. Networking Troubleshooting

```bash
# ─── DNS Issues ──────────────────────────────────────────────
# Test DNS from inside a Pod
kubectl run dns-debug --image=busybox:1.36 --rm -it -- nslookup kubernetes
kubectl run dns-debug --image=busybox:1.36 --rm -it -- cat /etc/resolv.conf

# Check CoreDNS is running
kubectl get pods -n kube-system -l k8s-app=kube-dns

# ─── Service Connectivity ───────────────────────────────────
# Check endpoints (Pods backing the Service)
kubectl get endpoints my-service
# → If empty: Service selector doesn't match any Pod labels

# Check from inside cluster
kubectl run curl --image=curlimages/curl --rm -it -- curl http://my-service:80

# ─── NetworkPolicy Blocking ─────────────────────────────────
# List policies in namespace
kubectl get networkpolicies -n production

# Temporarily delete policy to test
kubectl delete networkpolicy default-deny -n production
# → If traffic works now, the NetworkPolicy was blocking it
```

---

## 5. Node Troubleshooting

```bash
# Node NotReady
kubectl describe node problem-node
# → Check Conditions section:
#   MemoryPressure: True → Node is running low on memory
#   DiskPressure: True → Node disk is nearly full
#   PIDPressure: True → Too many processes
#   NetworkUnavailable: True → CNI plugin issue
#   Ready: False → kubelet is not running or can't contact API server

# Check kubelet status (on the node)
systemctl status kubelet
journalctl -u kubelet -f

# Check node resource usage
kubectl top node problem-node
kubectl describe node problem-node | grep -A 10 "Allocated resources"
```

---

## 6. Interview Questions

### Q1: A Pod is in CrashLoopBackOff. How do you troubleshoot?

**Expected Answer:**
1. `kubectl describe pod <pod>` — check Events and Last State (Exit Code).
2. `kubectl logs <pod> --previous` — read logs from the crashed container.
3. Check exit code: 1 = app error, 137 = OOMKilled, 126/127 = permission/command issue.
4. If OOMKilled: increase memory limits.
5. If app error: fix configuration (ConfigMap/Secret values), check dependencies.
6. If permission issue: check SecurityContext (runAsUser, fsGroup).

---

### Q2: A Pod is stuck in Pending. What are the possible causes?

**Expected Answer:**
Check `kubectl describe pod` Events section:
1. **Insufficient resources**: No node has enough CPU/memory → scale up nodes or reduce Pod requests.
2. **Node selector/affinity mismatch**: Pod's nodeSelector or affinity doesn't match any node labels → fix labels or selectors.
3. **Taint not tolerated**: Node has a taint the Pod doesn't tolerate → add toleration.
4. **PVC not bound**: Storage issue → check StorageClass, CSI driver, AZ mismatch.
5. **Topology spread constraint**: Can't satisfy spread → change to ScheduleAnyway.

---

### Q3: How do you debug a Service that is not routing traffic?

**Expected Answer:**
1. `kubectl get endpoints <service>` — if empty, the Service selector doesn't match any Pod labels.
2. `kubectl get pods -l <selector-labels>` — verify Pods exist with matching labels.
3. Verify target port matches the container port.
4. Test DNS: `kubectl exec -- nslookup <service>`.
5. Test connectivity: `kubectl exec -- curl <service>:<port>`.
6. Check NetworkPolicies that might block ingress to the backend Pods.

---

## 7. Summary

| Problem | First Command | Key Check |
| :--- | :--- | :--- |
| **Pending Pod** | `kubectl describe pod` | Events section |
| **CrashLoopBackOff** | `kubectl logs --previous` | Exit code + app logs |
| **ImagePullBackOff** | `kubectl describe pod` | Image name, registry auth |
| **No traffic to Service** | `kubectl get endpoints` | Empty = selector mismatch |
| **DNS failure** | `kubectl exec -- nslookup` | CoreDNS pods running? |
| **Node NotReady** | `kubectl describe node` | Conditions section |
| **Storage stuck** | `kubectl describe pvc` | StorageClass, CSI driver |

---

## 8. Practice Assignment

1. Deploy a Pod with an invalid image tag. Diagnose and fix the ImagePullBackOff.
2. Deploy a Pod that OOMKills. Identify the problem from logs and fix it.
3. Create a Service with a wrong selector. Diagnose why it has no endpoints and fix it.
4. Apply a deny-all NetworkPolicy. Debug why traffic is blocked and create an allow rule.
5. Simulate a full node by deploying many resource-heavy Pods. Observe Pending state and diagnose.
6. Create a PVC with a non-existent StorageClass. Diagnose and fix.
