# Level 6 — kubectl Deep Dive: Mastering the Kubernetes CLI

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Beginner → Intermediate |
| **Theory Duration** | 4 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 5 — Kubernetes Installation |
| **Lab Required** | Yes — Any running Kubernetes cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Used in every CKA/CKAD question |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Daily tool for every K8s engineer |
| **Certification Alignment** | CKA, CKAD, CKS (kubectl is the primary tool for all exams) |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Execute all essential kubectl commands with confidence and speed.
2. Use output formatting options (`-o wide`, `-o yaml`, `-o json`, `-o jsonpath`, `-o custom-columns`).
3. Manage multi-cluster access with contexts and kubeconfig.
4. Debug applications using `kubectl logs`, `describe`, `exec`, `port-forward`, and `debug`.
5. Set up shell autocompletion and productivity aliases.
6. Explain the internal request lifecycle of a kubectl command.

---

## 1. kubectl Fundamentals

### 1.1 What is kubectl?

`kubectl` (pronounced "kube-control" or "kube-C-T-L") is the command-line tool for communicating with the Kubernetes API Server. Every action you take in a Kubernetes cluster flows through kubectl → API Server → etcd.

### 1.2 Command Structure

```
kubectl  <verb>  <resource-type>  [resource-name]  [flags]
   │        │          │                │              │
   │        │          │                │              └─ Options (-n namespace, -o output, etc.)
   │        │          │                └─ Specific resource (optional)
   │        │          └─ What kind of resource (pod, deployment, service)
   │        └─ Action (get, create, apply, delete, describe, logs, exec)
   └─ The CLI tool itself

Examples:
kubectl get pods                           # List all pods in current namespace
kubectl get pods -n production             # List pods in "production" namespace
kubectl get pods -A                        # List pods across ALL namespaces
kubectl get pods my-app -o yaml            # Get a specific pod in YAML format
kubectl describe pod my-app                # Show detailed info about a pod
kubectl delete pod my-app                  # Delete a pod
kubectl apply -f deployment.yaml           # Apply a manifest file
kubectl logs my-app -f                     # Stream logs from a pod
kubectl exec -it my-app -- /bin/sh         # Open a shell inside a pod
```

---

## 2. Essential kubectl Commands

### 2.1 Creating Resources

```bash
# ─── Declarative (RECOMMENDED) ──────────────────────────────
# Apply from a file (creates or updates)
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f .                         # Apply all YAML files in current directory
kubectl apply -f https://example.com/manifest.yaml  # Apply from URL
kubectl apply -R -f ./manifests/           # Apply recursively from directory

# ─── Imperative (Quick tasks, CKA exam speed) ───────────────
# Create a Deployment
kubectl create deployment nginx --image=nginx:1.25-alpine --replicas=3

# Create a Service (ClusterIP)
kubectl expose deployment nginx --port=80 --target-port=80

# Create a Service (NodePort)
kubectl expose deployment nginx --port=80 --target-port=80 --type=NodePort

# Create a ConfigMap
kubectl create configmap app-config --from-literal=DB_HOST=mysql --from-literal=DB_PORT=3306

# Create a Secret
kubectl create secret generic db-secret --from-literal=password=mysecret

# Create a Namespace
kubectl create namespace production

# Create a ServiceAccount
kubectl create serviceaccount deploy-sa -n production

# ─── Dry Run (Generate YAML without creating) ───────────────
# EXTREMELY useful for CKA/CKAD exam speed

kubectl create deployment nginx --image=nginx:1.25-alpine --replicas=3 \
  --dry-run=client -o yaml > deployment.yaml
# → Generates deployment.yaml without creating the resource

kubectl run tmp-pod --image=busybox:1.36 --restart=Never \
  --dry-run=client -o yaml > pod.yaml

kubectl expose deployment nginx --port=80 --type=ClusterIP \
  --dry-run=client -o yaml > service.yaml
```

### 2.2 Reading Resources

```bash
# ─── GET (List resources) ────────────────────────────────────

# List pods in current namespace
kubectl get pods
# → NAME                    READY   STATUS    RESTARTS   AGE
# → nginx-7d9f8b-abc12      1/1     Running   0          5m
# → nginx-7d9f8b-def34      1/1     Running   0          5m

# Wide output (shows Node, IP)
kubectl get pods -o wide
# → Adds: IP, NODE, NOMINATED NODE, READINESS GATES columns

# List across ALL namespaces
kubectl get pods -A

# List with labels
kubectl get pods --show-labels
kubectl get pods -l app=nginx                  # Filter by label
kubectl get pods -l 'app in (nginx, redis)'    # Label set filter
kubectl get pods -l app=nginx,tier=frontend    # Multiple labels (AND)

# List multiple resource types
kubectl get pods,services,deployments

# Sort by a field
kubectl get pods --sort-by=.metadata.creationTimestamp
kubectl get pods --sort-by=.status.phase

# Watch (real-time updates)
kubectl get pods -w

# ─── DESCRIBE (Detailed info + events) ──────────────────────

kubectl describe pod nginx-7d9f8b-abc12
# → Shows: Metadata, Status, Containers, Conditions, Volumes, Events
# → Events section is CRITICAL for debugging (shows scheduling, pulling, started, errors)

kubectl describe node worker-01
# → Shows: Capacity, Allocatable, Conditions, Pods running on node, Resource usage

kubectl describe deployment nginx
# → Shows: Replicas, Strategy, Pod Template, Events (rollout events)

kubectl describe service nginx-svc
# → Shows: Type, ClusterIP, Port, Endpoints (Pod IPs receiving traffic)
```

### 2.3 Output Formatting

```bash
# ─── YAML Output ─────────────────────────────────────────────
kubectl get pod nginx-abc12 -o yaml

# ─── JSON Output ─────────────────────────────────────────────
kubectl get pod nginx-abc12 -o json

# ─── JSONPath (Extract specific fields) ──────────────────────
# Get Pod IP
kubectl get pod nginx-abc12 -o jsonpath='{.status.podIP}'
# → 10.0.1.50

# Get all Pod IPs
kubectl get pods -o jsonpath='{.items[*].status.podIP}'
# → 10.0.1.50 10.0.1.51 10.0.2.60

# Get node names and IPs
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.addresses[0].address}{"\n"}{end}'
# → master-01   10.0.1.10
# → worker-01   10.0.1.11

# Get container images used by all pods
kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'

# ─── Custom Columns ──────────────────────────────────────────
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName,IP:.status.podIP
# → NAME                 STATUS    NODE        IP
# → nginx-7d9f8b-abc12   Running   worker-01   10.0.1.50
# → nginx-7d9f8b-def34   Running   worker-02   10.0.2.60

# ─── Name Only ───────────────────────────────────────────────
kubectl get pods -o name
# → pod/nginx-7d9f8b-abc12
# → pod/nginx-7d9f8b-def34
```

### 2.4 Updating Resources

```bash
# ─── Apply (Declarative update) ──────────────────────────────
# Edit YAML file, then:
kubectl apply -f deployment.yaml

# ─── Edit (Interactive editor) ───────────────────────────────
kubectl edit deployment nginx
# → Opens in $EDITOR (vim by default)
# → Save and close to apply changes

# Set editor
export KUBE_EDITOR="nano"

# ─── Patch (In-place modification) ───────────────────────────
# JSON Merge Patch
kubectl patch deployment nginx -p '{"spec":{"replicas":5}}'

# Strategic Merge Patch (add an environment variable)
kubectl patch deployment nginx --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/env","value":[{"name":"ENV","value":"prod"}]}]'

# ─── Scale ───────────────────────────────────────────────────
kubectl scale deployment nginx --replicas=5
kubectl scale deployment nginx --replicas=0   # Scale to zero (stop all pods)

# ─── Set Image (Trigger rolling update) ──────────────────────
kubectl set image deployment/nginx nginx=nginx:1.26-alpine
# → Triggers a rolling update to the new image version

# ─── Labels & Annotations ───────────────────────────────────
# Add a label
kubectl label pod nginx-abc12 environment=production

# Remove a label
kubectl label pod nginx-abc12 environment-

# Add an annotation
kubectl annotate deployment nginx description="Web frontend"

# Overwrite an existing label
kubectl label pod nginx-abc12 environment=staging --overwrite
```

### 2.5 Deleting Resources

```bash
# Delete by name
kubectl delete pod nginx-abc12
kubectl delete deployment nginx
kubectl delete service nginx-svc

# Delete by file
kubectl delete -f deployment.yaml

# Delete by label
kubectl delete pods -l app=nginx

# Delete all pods in a namespace
kubectl delete pods --all -n dev

# Delete all resources in a namespace
kubectl delete all --all -n dev

# Force delete a stuck pod (CAUTION)
kubectl delete pod stuck-pod --grace-period=0 --force

# Delete a namespace (deletes EVERYTHING in it)
kubectl delete namespace dev
```

---

## 3. Debugging & Troubleshooting Commands

### 3.1 Logs

```bash
# View pod logs
kubectl logs nginx-abc12

# Follow/stream logs (like tail -f)
kubectl logs nginx-abc12 -f

# View last N lines
kubectl logs nginx-abc12 --tail=100

# View logs from a specific container (multi-container pod)
kubectl logs nginx-abc12 -c sidecar-container

# View logs since a duration
kubectl logs nginx-abc12 --since=1h
kubectl logs nginx-abc12 --since=5m

# View logs from all pods with a label
kubectl logs -l app=nginx --all-containers=true

# View previous container logs (after a crash restart)
kubectl logs nginx-abc12 --previous
# → CRITICAL: Use --previous to see crash logs before the container restarted
```

### 3.2 Exec (Execute Commands Inside Containers)

```bash
# Open an interactive shell
kubectl exec -it nginx-abc12 -- /bin/sh
kubectl exec -it nginx-abc12 -- /bin/bash

# Execute a single command
kubectl exec nginx-abc12 -- cat /etc/nginx/nginx.conf
kubectl exec nginx-abc12 -- env
kubectl exec nginx-abc12 -- curl -s localhost:80

# Exec into a specific container in a multi-container pod
kubectl exec -it nginx-abc12 -c sidecar -- /bin/sh

# Common debugging commands inside containers:
# curl localhost:<port>/healthz    → Test health endpoint
# cat /etc/resolv.conf             → Check DNS configuration
# nslookup <service-name>          → Test DNS resolution
# env                              → Check environment variables
# ls -la /app/                     → Check mounted files
# cat /var/run/secrets/kubernetes.io/serviceaccount/token → Check SA token
```

### 3.3 Port-Forward (Access Pods Locally)

```bash
# Forward local port to a pod
kubectl port-forward pod/nginx-abc12 8080:80
# → Access at http://localhost:8080

# Forward to a service
kubectl port-forward svc/nginx-svc 8080:80

# Forward to a deployment (picks one pod)
kubectl port-forward deployment/nginx 8080:80

# Listen on all interfaces (not just localhost)
kubectl port-forward --address 0.0.0.0 pod/nginx-abc12 8080:80
```

### 3.4 Debug (Ephemeral Debug Containers)

```bash
# Create an ephemeral debug container in a running pod
kubectl debug -it nginx-abc12 --image=busybox:1.36 --target=nginx
# → Attaches a busybox container to the pod's namespace
# → Useful when the pod image has no shell (distroless/scratch)

# Create a copy of the pod for debugging
kubectl debug nginx-abc12 -it --image=ubuntu:22.04 --copy-to=debug-pod

# Debug a node
kubectl debug node/worker-01 -it --image=ubuntu:22.04
# → Creates a privileged pod on the node with access to host filesystem
```

### 3.5 Top (Resource Usage)

```bash
# View node resource usage (requires metrics-server)
kubectl top nodes
# → NAME        CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# → worker-01   250m         12%    1024Mi           25%

# View pod resource usage
kubectl top pods
kubectl top pods --sort-by=cpu
kubectl top pods --sort-by=memory
kubectl top pods -A                 # All namespaces

# View container-level usage
kubectl top pods --containers=true
```

---

## 4. Advanced kubectl Techniques

### 4.1 API Resource Discovery

```bash
# List all API resources available in the cluster
kubectl api-resources
# → Shows: NAME, SHORTNAMES, APIVERSION, NAMESPACED, KIND

# List only namespaced resources
kubectl api-resources --namespaced=true

# List only cluster-scoped resources
kubectl api-resources --namespaced=false

# Show API versions
kubectl api-versions

# Explain a resource (built-in documentation)
kubectl explain pod
kubectl explain pod.spec
kubectl explain pod.spec.containers
kubectl explain pod.spec.containers.livenessProbe
kubectl explain deployment.spec.strategy
# → Extremely useful in CKA/CKAD exams for remembering field names
```

### 4.2 Shell Autocompletion & Aliases

```bash
# ─── Enable bash autocompletion ──────────────────────────────
source <(kubectl completion bash)
echo 'source <(kubectl completion bash)' >> ~/.bashrc

# ─── Enable zsh autocompletion ───────────────────────────────
source <(kubectl completion zsh)
echo 'source <(kubectl completion zsh)' >> ~/.zshrc

# ─── Essential Aliases ──────────────────────────────────────
# Add to ~/.bashrc or ~/.zshrc

alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias ka='kubectl apply -f'
alias kdel='kubectl delete'
alias kex='kubectl exec -it'
alias kgp='kubectl get pods'
alias kgpa='kubectl get pods -A'
alias kgn='kubectl get nodes'
alias kgs='kubectl get svc'
alias kgd='kubectl get deploy'
alias kns='kubectl config set-context --current --namespace'

# Enable alias autocompletion
complete -o default -F __start_kubectl k

# ─── CKA/CKAD Exam Speed Tips ───────────────────────────────
# 1. Set the alias immediately in the exam:
alias k=kubectl
complete -o default -F __start_kubectl k

# 2. Use --dry-run=client -o yaml to generate YAML templates
# 3. Use kubectl explain to look up field names
# 4. Use kubectl get -o jsonpath for specific field extraction
```

---

## 5. kubectl Internal Request Lifecycle

```
What happens when you run: kubectl get pods

1. kubectl reads ~/.kube/config
   ├─ Gets API server endpoint: https://10.0.1.10:6443
   ├─ Gets client certificate/key for authentication
   └─ Gets CA certificate for TLS verification

2. kubectl constructs HTTP request:
   GET /api/v1/namespaces/default/pods
   Headers:
     Authorization: Bearer <token> (or client cert)
     Accept: application/json

3. TLS Handshake with API Server
   ├─ kubectl verifies server certificate against CA
   └─ API Server verifies client certificate

4. API Server processes the request
   ├─ Authentication: Validates identity
   ├─ Authorization: RBAC check (can this user GET pods?)
   └─ Response: Serializes pod list from etcd cache

5. kubectl receives JSON response
   ├─ Deserializes the JSON
   ├─ Formats output (table, yaml, json, jsonpath)
   └─ Prints to terminal
```

---

## 6. Hands-On Lab

### Lab 6.1: kubectl Mastery Exercise

```bash
# Step 1: Create resources
kubectl create namespace lab-6
kubectl create deployment web --image=nginx:1.25-alpine --replicas=3 -n lab-6
kubectl expose deployment web --port=80 --type=ClusterIP -n lab-6

# Step 2: Practice GET with various outputs
kubectl get pods -n lab-6 -o wide
kubectl get pods -n lab-6 -o yaml | head -30
kubectl get pods -n lab-6 -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -n lab-6 -o custom-columns=POD:.metadata.name,STATUS:.status.phase,IP:.status.podIP,NODE:.spec.nodeName

# Step 3: Generate YAML templates
kubectl create deployment redis --image=redis:7-alpine --dry-run=client -o yaml > /tmp/redis.yaml
cat /tmp/redis.yaml

# Step 4: Debug a pod
kubectl exec -it $(kubectl get pods -n lab-6 -o jsonpath='{.items[0].metadata.name}') -n lab-6 -- /bin/sh
# Inside: curl localhost:80 && exit

# Step 5: Use explain
kubectl explain deployment.spec.strategy
kubectl explain pod.spec.containers.readinessProbe

# Step 6: Labels and filtering
kubectl label pods -l app=web tier=frontend -n lab-6
kubectl get pods -l tier=frontend -n lab-6 --show-labels

# Step 7: Cleanup
kubectl delete namespace lab-6
```

---

## 7. Interview Questions

### Q1: What is the kubectl dry-run flag and why is it useful?

**Expected Answer:**
`--dry-run=client` tells kubectl to validate and generate the resource definition locally without sending it to the API Server. Combined with `-o yaml`, it generates YAML templates instantly from imperative commands. This is essential in CKA/CKAD exams for quickly creating YAML files and in production for previewing changes before applying.

---

### Q2: How do you view logs from a crashed container?

**Expected Answer:**
Use `kubectl logs <pod-name> --previous`. The `--previous` flag retrieves logs from the previous container instance. When a container crashes and restarts, the current logs are from the new instance — `--previous` shows the logs before the crash, which contain the actual error.

---

### Q3: How do you troubleshoot a Pod stuck in Pending state?

**Expected Answer:**
1. `kubectl describe pod <name>` — check the Events section for scheduling errors.
2. Common causes: insufficient CPU/memory on nodes, unmatched nodeSelector, unsatisfied node affinity, untolerated taints, no available PersistentVolumes.
3. `kubectl get nodes -o wide` — check node readiness and capacity.
4. `kubectl describe node <name>` — check Allocatable vs Allocated resources.

---

## 8. Best Practices

1. **Use `kubectl apply -f` (declarative)** over `kubectl create` (imperative) in production.
2. **Always use `--dry-run=client -o yaml`** to generate YAML templates.
3. **Set up shell autocompletion** — it dramatically speeds up work.
4. **Use `kubectl explain`** instead of searching documentation.
5. **Use `--previous` flag** when investigating container crashes.
6. **Use `-o jsonpath`** for extracting specific fields in scripts.
7. **Never use `--force --grace-period=0`** unless absolutely necessary.

---

## 9. Summary

| Category | Key Commands |
| :--- | :--- |
| **Create** | `kubectl apply -f`, `kubectl create`, `--dry-run=client -o yaml` |
| **Read** | `kubectl get`, `kubectl describe`, `kubectl explain` |
| **Update** | `kubectl apply -f`, `kubectl edit`, `kubectl patch`, `kubectl scale`, `kubectl set image` |
| **Delete** | `kubectl delete`, `kubectl delete -f`, `kubectl delete -l` |
| **Debug** | `kubectl logs`, `kubectl exec`, `kubectl port-forward`, `kubectl debug`, `kubectl top` |
| **Output** | `-o wide`, `-o yaml`, `-o json`, `-o jsonpath`, `-o custom-columns` |

---

## 10. Practice Assignment

1. Deploy a 3-replica nginx deployment. Use 5 different `-o` formats to list the pods.
2. Generate a Deployment YAML using `--dry-run=client -o yaml`. Modify it to add labels, then apply it.
3. Use `kubectl exec` to open a shell in a pod and run `curl localhost:80`.
4. Use `kubectl port-forward` to access an nginx pod from your local browser.
5. Use `kubectl explain` to find the YAML path for configuring a readiness probe.
6. Write a kubectl command using `-o jsonpath` that lists all pod names and their node assignments.
