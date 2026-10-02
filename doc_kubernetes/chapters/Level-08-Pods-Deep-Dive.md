# Level 8 — Pods Deep Dive

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate |
| **Theory Duration** | 6 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 7 — Kubernetes Core Objects |
| **Lab Required** | Yes — Any running Kubernetes cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Pod internals are heavily tested |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKA, CKAD, CKS |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain the complete Pod lifecycle and phase transitions.
2. Implement init containers for startup dependencies.
3. Design multi-container Pods using sidecar, ambassador, and adapter patterns.
4. Configure liveness, readiness, and startup probes correctly.
5. Set resource requests and limits and understand QoS classes.
6. Implement graceful shutdown with `preStop` hooks and `terminationGracePeriodSeconds`.
7. Troubleshoot all common Pod failure states.

---

## 1. Pod Lifecycle

### 1.1 Pod Phases

```
Pod Phase Transitions:

  ┌──────────┐
  │ Pending  │ ← Pod accepted by API Server; waiting for scheduling,
  │          │   image pull, or init container completion.
  └────┬─────┘
       │ (scheduled, images pulled, containers started)
       ▼
  ┌──────────┐
  │ Running  │ ← At least one container is running or being restarted.
  │          │   Pod is executing its workload.
  └────┬─────┘
       │
       ├──── (all containers exit successfully, restartPolicy != Always)
       │     ┌──────────┐
       ├────►│Succeeded │ ← All containers terminated with exit code 0.
       │     └──────────┘   (Common for Jobs)
       │
       └──── (a container exits with non-zero, restartPolicy = Never)
             ┌──────────┐
             │  Failed  │ ← At least one container terminated with error.
             └──────────┘

  ┌──────────┐
  │ Unknown  │ ← Cannot determine Pod state (usually node communication failure).
  └──────────┘
```

### 1.2 Container States

Each container within a Pod has its own state:

| State | Description | `kubectl describe` Shows |
| :--- | :--- | :--- |
| **Waiting** | Container not yet running (pulling image, waiting for init) | `Waiting: ContainerCreating` or `Waiting: CrashLoopBackOff` |
| **Running** | Container is executing | `Running: Started at <timestamp>` |
| **Terminated** | Container has finished execution | `Terminated: Exit Code: 0` (success) or `Exit Code: 137` (killed) |

### 1.3 Common Exit Codes

| Exit Code | Meaning | Common Cause |
| :--- | :--- | :--- |
| **0** | Successful completion | Application finished its work normally |
| **1** | General application error | Application crash, unhandled exception |
| **2** | Shell misuse | Incorrect command syntax |
| **126** | Permission denied | Cannot execute the binary |
| **127** | Command not found | Binary does not exist in the image |
| **137** | SIGKILL (128 + 9) | OOMKilled or `terminationGracePeriodSeconds` exceeded |
| **139** | SIGSEGV (128 + 11) | Segmentation fault |
| **143** | SIGTERM (128 + 15) | Graceful termination by K8s |

---

## 2. Init Containers

### 2.1 Concept

**Simple Analogy:** Init containers are like pre-flight checks before an airplane takes off. The pilots (main containers) cannot start until all safety checks (init containers) have passed.

**Technical Explanation:**
Init containers run **before** the main application containers start. They run **sequentially** (one at a time, in order), and each must complete successfully (exit code 0) before the next one starts. Only after ALL init containers succeed do the main containers start.

### 2.2 Use Cases

| Use Case | Init Container Does |
| :--- | :--- |
| Wait for a dependency | `until nslookup database.svc; do sleep 2; done` |
| Database migration | Run `flyway migrate` or `alembic upgrade head` |
| Clone a Git repository | `git clone` config into a shared volume |
| Download configuration | `curl` a config file from a remote endpoint |
| Set file permissions | `chown -R` on mounted volumes |
| Register with a service | Register the Pod with an external service registry |

### 2.3 YAML Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  initContainers:
  # Init Container 1: Wait for the database Service to be available
  - name: wait-for-db
    image: busybox:1.36
    command: ['sh', '-c',
      'until nslookup database.default.svc.cluster.local; do echo "Waiting for database..."; sleep 2; done']

  # Init Container 2: Run database migrations
  - name: run-migrations
    image: myapp/migrate:v1.0
    command: ['python', 'manage.py', 'migrate']
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: url

  # Init Container 3: Download dynamic configuration
  - name: fetch-config
    image: busybox:1.36
    command: ['wget', '-O', '/config/app.json', 'https://config-server.example.com/app.json']
    volumeMounts:
    - name: config-volume
      mountPath: /config

  # Main container starts ONLY after all 3 init containers succeed
  containers:
  - name: web-app
    image: myapp/web:v2.0
    ports:
    - containerPort: 8080
    volumeMounts:
    - name: config-volume
      mountPath: /app/config
      readOnly: true

  volumes:
  - name: config-volume
    emptyDir: {}
```

### 2.4 Init Container vs Main Container

| Property | Init Container | Main Container |
| :--- | :--- | :--- |
| **Execution order** | Sequential (one at a time) | Parallel (all at once) |
| **Must succeed?** | Yes — all must exit 0 | Depends on restartPolicy |
| **Runs when?** | Before main containers | After all init containers succeed |
| **Runs how many times?** | Once (unless Pod restarts) | Continuously (with restartPolicy: Always) |
| **Supports probes?** | Startup probes only (K8s 1.28+) | All probes |
| **Resource limits** | Separate from main containers | Standard resource management |

---

## 3. Multi-Container Pod Patterns

### 3.1 Why Multiple Containers in One Pod?

All containers in a Pod share:
- **Network namespace** — same IP address, communicate via `localhost`.
- **Storage volumes** — can mount the same volumes.
- **Lifecycle** — co-scheduled, co-located on the same node.

### 3.2 Sidecar Pattern

```
┌───────────────────────────────────────────┐
│                    Pod                     │
│                                           │
│  ┌─────────────────┐  ┌────────────────┐ │
│  │ Main Container  │  │ Sidecar        │ │
│  │ (Application)   │  │ (Log shipper / │ │
│  │                 │  │  proxy / agent) │ │
│  │ Writes logs to  │──│ Reads logs from│ │
│  │ /var/log/app/   │  │ /var/log/app/  │ │
│  └─────────────────┘  └────────────────┘ │
│           │                    │          │
│           └────── Shared Volume ─────────┘ │
└───────────────────────────────────────────┘

Use case: Log collection (Fluent Bit sidecar), Service Mesh proxy (Envoy/Istio)
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: sidecar-example
spec:
  containers:
  - name: app
    image: myapp:v1.0
    volumeMounts:
    - name: logs
      mountPath: /var/log/app

  - name: log-shipper
    image: fluent/fluent-bit:2.2
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
      readOnly: true

  volumes:
  - name: logs
    emptyDir: {}
```

### 3.3 Ambassador Pattern

```
┌──────────────────────────────────────────────┐
│                     Pod                       │
│                                              │
│  ┌─────────────────┐   ┌──────────────────┐ │
│  │ Main Container  │   │ Ambassador       │ │
│  │ (Application)   │   │ (Proxy)          │ │
│  │                 │──►│                  │──► External DB cluster
│  │ Connects to     │   │ Routes to correct│    (master/replica)
│  │ localhost:5432   │   │ DB endpoint      │ │
│  └─────────────────┘   └──────────────────┘ │
└──────────────────────────────────────────────┘

Use case: Database proxy (PgBouncer), API gateway, connection pooling
The app always connects to localhost; the ambassador handles discovery/routing.
```

### 3.4 Adapter Pattern

```
┌──────────────────────────────────────────────┐
│                     Pod                       │
│                                              │
│  ┌─────────────────┐   ┌──────────────────┐ │
│  │ Main Container  │   │ Adapter          │ │
│  │ (Application)   │   │ (Format          │ │
│  │                 │──►│  Converter)      │──► Prometheus
│  │ Outputs custom  │   │ Transforms to    │    (expects /metrics)
│  │ metrics format  │   │ Prometheus format│ │
│  └─────────────────┘   └──────────────────┘ │
└──────────────────────────────────────────────┘

Use case: Metrics exporter (convert app-specific metrics to Prometheus format)
```

---

## 4. Health Probes

### 4.1 Three Types of Probes

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Kubernetes Health Probes                                │
│                                                                              │
│  ┌─────────────────────┐                                                    │
│  │   STARTUP PROBE     │ "Is the app finished starting up?"                 │
│  │                     │                                                    │
│  │   ┌─────┐           │  Runs first. While active, liveness and readiness  │
│  │   │Check│──► App    │  probes are disabled. Prevents liveness from       │
│  │   └─────┘  starting?│  killing slow-starting containers.                 │
│  └──────────┬──────────┘                                                    │
│             │ (Startup succeeds → enable other probes)                      │
│             ▼                                                               │
│  ┌─────────────────────┐    ┌─────────────────────┐                        │
│  │   LIVENESS PROBE    │    │  READINESS PROBE     │                        │
│  │                     │    │                      │                        │
│  │   "Is the app       │    │  "Can the app serve  │                        │
│  │    alive?"           │    │   traffic?"          │                        │
│  │                     │    │                      │                        │
│  │   If FAILS:         │    │  If FAILS:            │                        │
│  │   kubelet KILLS     │    │  Pod REMOVED from     │                        │
│  │   the container     │    │  Service endpoints    │                        │
│  │   (restart)         │    │  (no traffic sent)    │                        │
│  └─────────────────────┘    └─────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Probe Mechanisms

| Mechanism | How It Works | Best For |
| :--- | :--- | :--- |
| **httpGet** | Sends HTTP GET to a path/port; success = 200-399 | Web applications with health endpoints |
| **tcpSocket** | Attempts TCP connection to a port; success = connection established | Databases, Redis, services without HTTP |
| **exec** | Runs a command inside container; success = exit code 0 | Custom checks, file existence, script validation |
| **grpc** | Sends gRPC health check request | gRPC microservices |

### 4.3 Complete Probe Configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: probe-example
spec:
  containers:
  - name: app
    image: myapp:v1.0
    ports:
    - containerPort: 8080

    # STARTUP PROBE — Gate for slow-starting apps
    startupProbe:
      httpGet:
        path: /healthz
        port: 8080
      failureThreshold: 30       # Allow 30 failures before giving up
      periodSeconds: 10           # Check every 10 seconds
      # Total startup time allowed: 30 × 10 = 300 seconds (5 minutes)

    # LIVENESS PROBE — "Is the process healthy?"
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 0      # Start immediately (startup probe gates this)
      periodSeconds: 15           # Check every 15 seconds
      timeoutSeconds: 5           # Timeout per check
      failureThreshold: 3         # Kill after 3 consecutive failures
      successThreshold: 1         # 1 success to be considered healthy

    # READINESS PROBE — "Can this Pod handle traffic?"
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
      successThreshold: 1
```

### 4.4 Probe Configuration Parameters

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `initialDelaySeconds` | 0 | Seconds to wait after container starts before first probe |
| `periodSeconds` | 10 | Seconds between consecutive probes |
| `timeoutSeconds` | 1 | Seconds to wait for a probe response |
| `failureThreshold` | 3 | Consecutive failures before action is taken |
| `successThreshold` | 1 | Consecutive successes to be considered healthy (must be 1 for liveness/startup) |

### 4.5 Common Mistakes with Probes

| Mistake | Consequence | Correct Approach |
| :--- | :--- | :--- |
| Liveness probe checks an external dependency (DB) | Container killed when DB is temporarily down (cascading failure) | Liveness should check ONLY the application process health |
| No startup probe for slow-starting apps | Liveness probe kills container before it finishes starting | Add startupProbe with high `failureThreshold` |
| Same endpoint for liveness and readiness | Cannot distinguish "process frozen" from "app overloaded" | Use `/healthz` for liveness (is process alive?) and `/ready` for readiness (can handle traffic?) |
| Very aggressive probe timing (1s period, 1 failure) | Container killed on a single slow response | Use reasonable settings: 10-15s period, 3 failures |
| No probes at all | K8s cannot detect or react to application problems | Always configure at least readiness probe |

---

## 5. Resource Management

### 5.1 Requests vs Limits

```yaml
resources:
  requests:              # GUARANTEED minimum resources
    cpu: "250m"          # Scheduler uses this for placement decisions
    memory: "256Mi"      # Node must have this much available to schedule the Pod
  limits:                # MAXIMUM allowed resources
    cpu: "1000m"         # CPU is throttled (not killed) if exceeded
    memory: "512Mi"      # Memory limit: container is OOMKilled if exceeded
```

**CPU Units:**
- `1` = 1 vCPU / 1 core / 1 hyperthread
- `1000m` = 1 CPU (m = millicores)
- `250m` = 0.25 CPU (quarter of a core)
- `100m` = 0.1 CPU (minimum recommended)

**Memory Units:**
- `128Mi` = 128 Mebibytes (1 Mi = 1,048,576 bytes)
- `1Gi` = 1 Gibibyte (1,073,741,824 bytes)
- `256M` = 256 Megabytes (1 M = 1,000,000 bytes) — prefer Mi

### 5.2 QoS (Quality of Service) Classes

Kubernetes assigns a QoS class to each Pod based on resource configuration. Under node pressure, QoS determines **eviction priority** (lowest class evicted first).

| QoS Class | Condition | Eviction Priority | Example |
| :--- | :--- | :--- | :--- |
| **Guaranteed** | All containers have requests == limits for BOTH cpu and memory | Last to be evicted (highest priority) | `requests: {cpu: 500m, memory: 256Mi}` + `limits: {cpu: 500m, memory: 256Mi}` |
| **Burstable** | At least one container has a request or limit set, but they're not equal | Middle priority | `requests: {cpu: 100m, memory: 128Mi}` + `limits: {cpu: 500m, memory: 512Mi}` |
| **BestEffort** | NO containers have any requests or limits set | First to be evicted (lowest priority) | No resources block at all |

```bash
# Check Pod QoS class
kubectl get pod <name> -o jsonpath='{.status.qosClass}'
# → Guaranteed | Burstable | BestEffort
```

### 5.3 What Happens When Limits Are Exceeded?

```
CPU Limit Exceeded:
  → Container is THROTTLED (slowed down), NOT killed.
  → The process still runs but gets less CPU time.
  → Symptom: Slow application response, high latency.

Memory Limit Exceeded:
  → Container is OOMKilled (Out Of Memory Killed).
  → Exit code: 137 (128 + SIGKILL signal 9).
  → kubelet restarts the container (restartPolicy: Always).
  → If repeated: CrashLoopBackOff.
  → Fix: Increase memory limit or fix the memory leak.
```

---

## 6. Restart Policies

| Policy | Behavior | Used By |
| :--- | :--- | :--- |
| `Always` (default) | Restart container whenever it exits, regardless of exit code | Deployments, StatefulSets, DaemonSets |
| `OnFailure` | Restart only if container exits with non-zero exit code | Jobs (retry on failure) |
| `Never` | Never restart the container | Jobs (don't retry), debug pods |

```
Restart backoff timing:
1st restart: 10s delay
2nd restart: 20s delay
3rd restart: 40s delay
4th restart: 80s delay
5th restart: 160s delay
6th+ restart: 300s delay (capped at 5 minutes)
→ This is what causes "CrashLoopBackOff" status.
```

---

## 7. Pod Termination — Graceful Shutdown

### 7.1 The Termination Sequence

```
kubectl delete pod my-app
         │
         ▼
Step 1: API Server sets Pod status to "Terminating"
         │
         ├─── Endpoint Controller REMOVES Pod IP from Service endpoints
         │    (New traffic stops being sent to this Pod)
         │
         ├─── kubelet receives termination signal
         │
         ▼
Step 2: kubelet executes preStop hook (if configured)
         │    Examples: sleep 5 (drain connections), deregister from service
         │
         ▼
Step 3: kubelet sends SIGTERM to container PID 1
         │    Application should:
         │    ├── Stop accepting new requests
         │    ├── Complete in-flight requests
         │    ├── Close database connections
         │    ├── Flush logs/buffers
         │    └── Exit gracefully (exit code 0)
         │
         │    ┌─── terminationGracePeriodSeconds countdown starts (default: 30s)
         │    │
         ▼    ▼
Step 4: If container hasn't exited within grace period:
         kubelet sends SIGKILL (exit code 137)
         Container is forcefully terminated.
```

### 7.2 Graceful Shutdown Configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: graceful-app
spec:
  terminationGracePeriodSeconds: 60    # Allow 60 seconds for graceful shutdown
  containers:
  - name: app
    image: myapp:v1.0
    lifecycle:
      preStop:                          # Hook executed BEFORE SIGTERM
        exec:
          command: ["/bin/sh", "-c", "sleep 5 && /app/shutdown.sh"]
        # Or use HTTP:
        # httpGet:
        #   path: /shutdown
        #   port: 8080
```

### 7.3 Why `preStop: sleep 5` Is a Best Practice

```
Problem: There is a race condition between endpoint removal and SIGTERM.

Timeline WITHOUT preStop sleep:
  t=0: Pod deletion triggered
  t=0: SIGTERM sent to app AND endpoint removal starts
  t=0-2s: Some kube-proxy nodes still have old iptables rules
  → In-flight requests get 502/504 errors during this window

Timeline WITH preStop: sleep 5:
  t=0: Pod deletion triggered
  t=0: preStop starts (sleep 5)
  t=0-5s: Endpoint removal propagates to all kube-proxy instances
  t=5: SIGTERM sent to app (by now, no new traffic is arriving)
  → Clean shutdown with zero dropped requests
```

---

## 8. Pod Security Context

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:                      # Pod-level security context
    runAsUser: 10001                    # Run all containers as UID 10001
    runAsGroup: 10001                   # Run all containers as GID 10001
    fsGroup: 10001                     # Volume ownership set to GID 10001
    runAsNonRoot: true                 # Enforce non-root execution
    seccompProfile:
      type: RuntimeDefault             # Apply default seccomp filter

  containers:
  - name: app
    image: myapp:v1.0
    securityContext:                    # Container-level security context
      allowPrivilegeEscalation: false  # Prevent privilege escalation
      readOnlyRootFilesystem: true     # Read-only filesystem (write to volumes only)
      capabilities:
        drop:
        - ALL                          # Drop ALL Linux capabilities
        add:
        - NET_BIND_SERVICE             # Only add what's needed
    volumeMounts:
    - name: tmp
      mountPath: /tmp                  # Writable tmp directory

  volumes:
  - name: tmp
    emptyDir: {}                       # Ephemeral writable directory
```

---

## 9. Troubleshooting Pod Issues

### 9.1 Diagnostic Flowchart

```
Pod is not working
       │
       ├── Status: Pending
       │   └── kubectl describe pod <name>
       │       ├── "Insufficient cpu/memory" → Node has no capacity → Scale nodes
       │       ├── "Unschedulable" → Taints not tolerated → Add tolerations
       │       ├── "No nodes match" → nodeSelector/affinity not satisfied → Fix selectors
       │       └── "PVC not bound" → PersistentVolume not available → Create PV / check StorageClass
       │
       ├── Status: ContainerCreating
       │   └── kubectl describe pod <name>
       │       ├── "ImagePullBackOff" → Wrong image name, tag, or no access → Fix image reference
       │       ├── "ErrImagePull" → Registry auth failure → Check imagePullSecrets
       │       └── "MountVolume failed" → Volume not available → Check PVC, CSI driver
       │
       ├── Status: CrashLoopBackOff
       │   └── kubectl logs <name> --previous
       │       ├── Exit Code 1 → Application error → Fix application code/config
       │       ├── Exit Code 127 → Command not found → Wrong ENTRYPOINT/CMD in Dockerfile
       │       ├── Exit Code 137 → OOMKilled → Increase memory limit
       │       └── No logs → Container exits immediately → Check command/args, entrypoint
       │
       ├── Status: Running but not working
       │   └── kubectl describe pod <name>
       │       ├── Readiness probe failing → App not ready → Check app health endpoint
       │       ├── Liveness probe failing → App frozen → Check probe config
       │       └── Container restarting → Check logs for repeating errors
       │
       └── Status: Evicted
           └── kubectl describe pod <name>
               ├── DiskPressure → Clean up disk on node
               ├── MemoryPressure → Reduce memory usage; fix limits
               └── PIDPressure → Too many processes; check fork bombs
```

### 9.2 Key Troubleshooting Commands

```bash
# 1. Overview
kubectl get pod <name> -o wide

# 2. Detailed status + events (MOST IMPORTANT)
kubectl describe pod <name>

# 3. Container logs (current)
kubectl logs <name>

# 4. Container logs (previous crash)
kubectl logs <name> --previous

# 5. Logs from specific container in multi-container Pod
kubectl logs <name> -c <container-name>

# 6. Execute command inside container
kubectl exec -it <name> -- /bin/sh

# 7. Check resource usage
kubectl top pod <name>

# 8. Check events in namespace
kubectl get events --sort-by=.lastTimestamp

# 9. Check node conditions
kubectl describe node <node-name>

# 10. Debug containers (for distroless images with no shell)
kubectl debug -it <name> --image=busybox:1.36 --target=<container-name>
```

---

## 10. Hands-On Labs

### Lab 8.1: Init Containers

```bash
# Step 1: Create a Service that the init container will wait for
kubectl create namespace lab-8

# Step 2: Create a Pod with init container that waits for the service
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: init-demo
  namespace: lab-8
spec:
  initContainers:
  - name: wait-for-svc
    image: busybox:1.36
    command: ['sh', '-c', 'echo "Waiting for myservice..." && sleep 10 && echo "Done waiting"']
  containers:
  - name: app
    image: nginx:1.25-alpine
    ports:
    - containerPort: 80
EOF

# Step 3: Watch the Pod (init container runs first)
kubectl get pod init-demo -n lab-8 -w
# → STATUS: Init:0/1 → PodInitializing → Running

# Step 4: Check init container logs
kubectl logs init-demo -n lab-8 -c wait-for-svc
```

### Lab 8.2: Probes

```bash
# Create a Pod with all three probes
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: probe-demo
  namespace: lab-8
spec:
  containers:
  - name: web
    image: nginx:1.25-alpine
    ports:
    - containerPort: 80
    startupProbe:
      httpGet:
        path: /
        port: 80
      failureThreshold: 10
      periodSeconds: 5
    livenessProbe:
      httpGet:
        path: /
        port: 80
      periodSeconds: 10
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /
        port: 80
      periodSeconds: 5
      failureThreshold: 3
EOF

# Verify probe status
kubectl describe pod probe-demo -n lab-8 | grep -A5 "Liveness\|Readiness\|Startup"

# Simulate liveness failure: delete the default page
kubectl exec probe-demo -n lab-8 -- rm /usr/share/nginx/html/index.html

# Watch: liveness probe will fail → container restarted
kubectl get pod probe-demo -n lab-8 -w
```

### Lab 8.3: Resource Limits and OOMKill

```bash
# Create a Pod with strict memory limit
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: oom-demo
  namespace: lab-8
spec:
  containers:
  - name: stress
    image: polinux/stress
    command: ["stress", "--vm", "1", "--vm-bytes", "200M", "--timeout", "60s"]
    resources:
      requests:
        memory: "50Mi"
      limits:
        memory: "100Mi"
EOF

# Watch: Container will be OOMKilled (trying to use 200M with 100M limit)
kubectl get pod oom-demo -n lab-8 -w
# → STATUS: OOMKilled → CrashLoopBackOff

# Check the exit code
kubectl describe pod oom-demo -n lab-8 | grep -A3 "Last State"
# → Exit Code: 137

# Cleanup
kubectl delete namespace lab-8
```

---

## 11. Interview Questions

### Q1: What is the difference between liveness and readiness probes?

**Expected Answer:**
A **liveness probe** checks if the application process is alive. If it fails, kubelet **kills and restarts** the container. Use it to detect deadlocks or frozen processes.

A **readiness probe** checks if the application can handle incoming traffic. If it fails, the Pod is **removed from Service endpoints** (no traffic is sent), but the container is NOT killed. It remains running and the probe continues checking. Once it passes again, the Pod is added back to endpoints.

**Common Mistake:** "If readiness probe fails, the container is restarted." Wrong — only liveness failures trigger restarts.

---

### Q2: What are the QoS classes in Kubernetes? How does OOMKill priority work?

**Expected Answer:**
Three QoS classes based on resource configuration:
1. **Guaranteed** (requests == limits for all containers) — highest priority, last to be evicted.
2. **Burstable** (at least one request or limit set, but not equal) — middle priority.
3. **BestEffort** (no requests or limits) — lowest priority, first to be evicted.

Under memory pressure, the kubelet evicts BestEffort Pods first, then Burstable Pods exceeding their requests, and Guaranteed Pods last.

---

### Q3: What is CrashLoopBackOff?

**Expected Answer:**
CrashLoopBackOff occurs when a container repeatedly crashes and restarts. After each crash, kubelet waits progressively longer before restarting (10s → 20s → 40s → 80s → 160s → 300s cap). The status shows "CrashLoopBackOff" during the wait period. To debug: `kubectl logs <pod> --previous` to see the crash logs, and `kubectl describe pod <pod>` to check events and exit codes. Common causes: application errors (exit code 1), command not found (127), OOMKilled (137), missing configuration.

---

### Q4: Explain init containers. When would you use them?

**Expected Answer:**
Init containers run before main containers, execute sequentially, and each must complete successfully before the next starts. Use cases: waiting for a dependent service to be available, running database migrations before the app starts, downloading configuration or secrets from an external source, and setting file permissions on mounted volumes. Unlike main containers, init containers are guaranteed to complete before the application starts.

---

### Q5: What happens when you delete a Pod? Describe the termination process.

**Expected Answer:**
1. API Server marks Pod as "Terminating."
2. Endpoint Controller removes Pod from Service endpoints (stops new traffic).
3. kubelet executes `preStop` hook (if configured).
4. kubelet sends SIGTERM to container PID 1.
5. Application should handle SIGTERM: stop accepting requests, complete in-flight work, close connections, exit cleanly.
6. If container doesn't exit within `terminationGracePeriodSeconds` (default 30s), kubelet sends SIGKILL (exit code 137).

**Best Practice:** Configure `preStop: sleep 5` to ensure endpoint removal propagates to all kube-proxy instances before SIGTERM is sent.

---

## 12. Best Practices

1. **Always configure readiness probes** — without them, Pods receive traffic before they're ready.
2. **Use startup probes for slow-starting apps** — prevents liveness from killing during startup.
3. **Liveness probes should check the process only** — never check external dependencies.
4. **Always set resource requests and limits** — target Guaranteed or Burstable QoS.
5. **Configure `preStop: sleep 5`** for zero-downtime Pod termination.
6. **Set `terminationGracePeriodSeconds`** appropriately (30-120s based on app needs).
7. **Use init containers for startup dependencies** — cleaner than retry loops in the app.
8. **Run containers as non-root** — always set `runAsNonRoot: true` and `readOnlyRootFilesystem: true`.
9. **Never create standalone Pods** — always use Deployments, Jobs, or StatefulSets.

---

## 13. Common Mistakes

1. Using liveness probe to check database connectivity → cascading failures.
2. Not using `--previous` flag when checking crashed container logs.
3. Setting memory requests too low → constant evictions under pressure.
4. No startup probe for Java/Spring apps that take 60+ seconds to start.
5. Setting `readOnlyRootFilesystem: true` without providing writable volumes for `/tmp`.
6. Confusing exit code 137 (OOMKilled) with application errors.
7. Not implementing SIGTERM handling in the application → ungraceful shutdown.

---

## 14. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **Pod Phases** | Pending → Running → Succeeded/Failed; Container states: Waiting/Running/Terminated |
| **Init Containers** | Run sequentially before main containers; for startup dependencies |
| **Multi-container Patterns** | Sidecar (helper), Ambassador (proxy), Adapter (converter) |
| **Probes** | Startup (gate), Liveness (kill if frozen), Readiness (remove from traffic) |
| **Resources** | Requests = scheduling guarantee; Limits = maximum allowed (OOMKill on memory exceed) |
| **QoS** | Guaranteed > Burstable > BestEffort (eviction priority) |
| **Graceful Shutdown** | preStop hook → SIGTERM → grace period → SIGKILL |
| **Security** | runAsNonRoot, readOnlyRootFilesystem, drop ALL capabilities |

---

## 15. Practice Assignment

1. Create a Pod with 2 init containers: one waits 10 seconds, another echoes "ready." Verify the startup sequence.
2. Create a multi-container Pod with a sidecar that reads a shared log file written by the main container.
3. Deploy an nginx Pod with liveness, readiness, and startup probes. Simulate a liveness failure and observe the restart.
4. Create a Pod with 100Mi memory limit. Run a stress test exceeding the limit and observe OOMKill (exit code 137).
5. Deploy an application with `preStop: sleep 5` and `terminationGracePeriodSeconds: 60`. Delete the pod and observe the graceful shutdown timing.
6. Create a Pod with strict security context: non-root, read-only filesystem, all capabilities dropped.
