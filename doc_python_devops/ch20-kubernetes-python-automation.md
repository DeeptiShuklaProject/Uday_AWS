<!-- TODO: Rewrite and humanize content from 11-kubernetes\module-34-kubernetes-fundamentals.md, 11-kubernetes\module-35-python-kubernetes-client.md -->

# Module 34 — Kubernetes Fundamentals

## 1. Chapter Introduction
Kubernetes (K8s) is the industry standard for container orchestration. If Docker is a shipping container, Kubernetes is the entire port—managing thousands of containers across hundreds of servers. Before we automate Kubernetes with Python in the next module, we must understand its core architecture and objects.

## 2. What You Will Learn
- Kubernetes architecture (control plane, worker nodes).
- Core objects: Pod, Deployment, Service, Namespace.
- Advanced objects: ConfigMap, Secret, Ingress, StatefulSet, DaemonSet, Job, CronJob.
- How `kubectl` communicates with the API server.
- YAML manifests for defining Kubernetes resources.

## 3. Kubernetes Architecture
```
┌──────────────────────────────────────────────────────┐
│                    CONTROL PLANE                      │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │
│  │ API      │ │ Scheduler│ │ etcd   │ │Controller│  │
│  │ Server   │ │          │ │(state) │ │ Manager  │  │
│  └──────────┘ └──────────┘ └────────┘ └──────────┘  │
├──────────────────────────────────────────────────────┤
│                    WORKER NODES                       │
│  ┌─────────────────┐  ┌─────────────────┐            │
│  │ Node 1          │  │ Node 2          │            │
│  │ ┌─────┐ ┌─────┐│  │ ┌─────┐ ┌─────┐│            │
│  │ │Pod A│ │Pod B││  │ │Pod C│ │Pod D││            │
│  │ └─────┘ └─────┘│  │ └─────┘ └─────┘│            │
│  │ kubelet         │  │ kubelet         │            │
│  └─────────────────┘  └─────────────────┘            │
└──────────────────────────────────────────────────────┘
```

## 4. Core Objects

| Object | Purpose | Example |
|---|---|---|
| **Pod** | Smallest deployable unit; contains 1+ containers | A web server container |
| **Deployment** | Manages replica sets of pods; handles rolling updates | 3 replicas of your web app |
| **Service** | Stable network endpoint for accessing pods | LoadBalancer exposing port 80 |
| **Namespace** | Logical isolation within a cluster | `production`, `staging` |
| **ConfigMap** | Non-sensitive configuration data | Database hostnames, feature flags |
| **Secret** | Sensitive data (base64 encoded) | API keys, passwords |
| **Ingress** | HTTP/HTTPS routing to services | `api.example.com` → web service |
| **StatefulSet** | For stateful apps needing stable identity | Databases, message queues |
| **DaemonSet** | Ensures a pod runs on every node | Log collectors, monitoring agents |
| **Job** | Run-to-completion task | Database migration |
| **CronJob** | Scheduled recurring task | Nightly backup at 2 AM |

## 5. DevOps Example: Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
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
      containers:
        - name: web-app
          image: myregistry/web-app:v2.5.1
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "256Mi"
              cpu: "500m"
```

## 6. Quick Revision Notes
- **Pod** = smallest unit, **Deployment** = manages pods, **Service** = exposes pods
- Control plane manages state; worker nodes run containers
- `kubectl apply -f manifest.yaml` — Apply a YAML manifest
- `kubectl get pods -n production` — List pods in a namespace
- `kubectl logs pod-name` — View pod logs
- `kubectl describe pod pod-name` — Debug pod issues
- Kubernetes API server accepts JSON — Python can talk to it directly


---

# Module 35 — Python Kubernetes Client

## 1. Chapter Introduction
In Module 20, we learned how to run a single Docker container on a single server. But what if you have 500 containers? What if a server crashes and takes down 50 containers with it? You need a system to manage, restart, and network those containers automatically. That system is **Kubernetes (K8s)**. While Kubernetes is usually managed via YAML files and the `kubectl` command line, DevOps engineers often need to automate complex K8s operations. In this module, we will learn how to use the official Python Kubernetes Client to interact directly with a K8s cluster.

## 2. What You Will Learn
- What Kubernetes is and how it relates to Docker.
- How to install the official `kubernetes` Python package.
- How to authenticate a Python script to a local or cloud K8s cluster.
- How to list Pods and Namespaces using Python.
- Why writing custom Kubernetes automation in Python is a superpower.

## 3. Why This Topic Matters in DevOps
Kubernetes is the operating system of the modern cloud. While standard deployments are handled by CI/CD pipelines applying YAML files, edge cases require scripting. Imagine you need a script that runs every night, finds every Kubernetes Pod in the "development" namespace that has been running for more than 48 hours, and deletes it to save money. You cannot easily do this with `kubectl` and Bash. You need the power of Python's loops, date parsing, and API integration.

## 4. Concept Explained in Simple Language
### What is Kubernetes?
If a Docker Container is an instrument (a violin), Kubernetes is the conductor of the orchestra. The conductor doesn't play the instruments; they tell the instruments when to start, when to stop, and how loud to play. 

### Pods and Namespaces
- **Pod:** The smallest unit in Kubernetes. A Pod is essentially a wrapper around your Docker container. 
- **Namespace:** A virtual partition. You might have a "dev" namespace and a "prod" namespace inside the same cluster to keep things organized.

## 5. Real-World Analogy
Using the `kubectl` command line is like talking to the orchestra conductor using a megaphone. It works, but it's manual and loud.
Using the **Python Kubernetes Client** is like giving the conductor a highly sophisticated earpiece. You can write complex, programmatic logic (like, "If the violin section plays out of tune for 5 seconds, swap them out for new players") and the conductor will execute it instantly.

## 6. Basic Example: The Setup
First, install the library: `pip install kubernetes`.

To test this, you must have access to a Kubernetes cluster. (If you don't have one, you can run `minikube` or Docker Desktop's built-in Kubernetes locally).

```python
from kubernetes import client, config

# 1. Load the authentication file
# By default, K8s stores its credentials in ~/.kube/config
# This line tells Python to read that file and log in to the cluster.
config.load_kube_config()

# 2. Create the API client
# K8s has many APIs. The "CoreV1Api" handles basic things like Pods and Namespaces.
v1 = client.CoreV1Api()

print("Successfully connected to the Kubernetes Cluster.")
```

## 7. Step-by-Step Example: Listing Pods
Let's write a script that acts like the `kubectl get pods -A` command. It will fetch every pod in the entire cluster and print its name and status.

```python
from kubernetes import client, config
import sys

def list_all_pods():
    try:
        config.load_kube_config()
        v1 = client.CoreV1Api()
    except Exception as e:
        print(f"CRITICAL: Could not connect to Kubernetes: {e}")
        sys.exit(1)

    print("Fetching Pods...\n")
    
    # Call the K8s API
    pod_list = v1.list_pod_for_all_namespaces(watch=False)
    
    # pod_list is a complex object. We access the actual list via .items
    for pod in pod_list.items:
        namespace = pod.metadata.namespace
        name = pod.metadata.name
        status = pod.status.phase
        
        # We format it nicely
        print(f"[{namespace}] {name} ---> {status}")

if __name__ == "__main__":
    list_all_pods()
```

## 8. DevOps Example: Deleting a Pod
Let's write the cleanup script we mentioned in Section 3. We want to delete a specific pod in a specific namespace.

```python
from kubernetes import client, config

def delete_target_pod(namespace, pod_name):
    config.load_kube_config()
    v1 = client.CoreV1Api()

    print(f"Attempting to delete Pod '{pod_name}' in '{namespace}'...")
    
    try:
        # API call to delete the pod
        v1.delete_namespaced_pod(name=pod_name, namespace=namespace)
        print("Delete command sent successfully.")
    except client.exceptions.ApiException as e:
        # The kubernetes library has its own specific Error type we must catch
        if e.status == 404:
            print("Pod not found. It might already be deleted.")
        else:
            print(f"Failed to delete Pod: {e}")

# Call the function
# delete_target_pod("dev-environment", "old-frontend-pod-1234")
```

## 9. Cloud Example: In-Cluster Configuration
`config.load_kube_config()` reads a file from your laptop. But what if you containerize this Python script (Module 20) and run the script *inside* the Kubernetes cluster as a CronJob? A container doesn't have a `~/.kube/config` file.

Kubernetes automatically mounts a special security token inside every container running in the cluster. You must change one line of code:

```python
from kubernetes import client, config

# If running on a laptop/CI Runner:
# config.load_kube_config()

# If running INSIDE the Kubernetes cluster:
config.load_incluster_config() 

v1 = client.CoreV1Api()
```
*A production script usually tries `load_incluster_config()` first, and falls back to `load_kube_config()` in a `try/except` block.*

## 10. Production Example: Kubernetes Custom Resource Definitions (CRDs)
Kubernetes doesn't just manage Pods. Modern K8s manages databases, SSL certificates, and even AWS infrastructure via Custom Resources. The `CoreV1Api` cannot manage these. You must use the `CustomObjectsApi`. The Python library provides full access to every custom API in the cluster, meaning you can write Python code to manage literally any software deployed in your company.

## 11. Common Mistakes
- **Using `os.system("kubectl get pods")`:** As discussed in Module 12, shelling out is a bad practice. `os.system` returns raw, unstructured text that you have to parse with messy regex. Using the `kubernetes` Python package returns clean, structured Python Objects.
- **Forgetting `watch=False`:** In the API calls, `watch=True` keeps the connection open forever, streaming live updates. If you just want a one-time list, ensure `watch=False` or your script will hang indefinitely.

## 12. Troubleshooting
**Error:** `urllib3.exceptions.MaxRetryError: HTTPConnectionPool...`
**Fix:** Python cannot reach the cluster. Either your `~/.kube/config` file is empty, or the cluster is turned off, or your VPN has dropped. Run `kubectl cluster-info` in your terminal to verify the cluster is actually alive.

## 13. Security Considerations
When writing a Python script to manage Kubernetes, remember that you are giving the script "God Mode" over your infrastructure. If you use `load_incluster_config()`, you must configure a **Kubernetes ServiceAccount** with strict **RBAC (Role-Based Access Control)**. If your script only needs to delete pods in the "dev" namespace, its ServiceAccount must be mathematically prevented by K8s from touching the "prod" namespace.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "We need to delete any pod that says 'Evicted'. I'll write a Bash script that runs `kubectl get pods | grep Evicted | awk '{print $1}' | xargs kubectl delete pod`."
**Senior Engineer:** "Bash pipelines are brittle. If the column spacing in the `kubectl` output changes in the next Kubernetes version, your `awk` command will delete the wrong column. Use the Python Kubernetes client. Fetch the objects, read the `pod.status.phase` property, and delete exactly the object you want. It's safer, auditable, and much easier to write unit tests for."

## 15. Hands-on Exercise
**Advanced Exercise:**
*(Requires access to a Kubernetes cluster, such as Docker Desktop or minikube).*
1. Install the library: `pip install kubernetes`.
2. Write a script that loads the kube config.
3. Fetch all namespaces in the cluster using `v1.list_namespace()`.
4. Loop through the result and print the name of each namespace (`namespace.metadata.name`).
5. Run the script and compare the output to running `kubectl get namespaces` in your terminal.

## 16. Interview Questions
**Beginner:**
Q: Why use the Python `kubernetes` library instead of just running `subprocess.run(["kubectl", "get", "pods"])`?
A: The Python library interacts directly with the Kubernetes REST API and returns structured Python objects. Calling the `kubectl` binary returns raw text, which is brittle and highly prone to parsing errors if the output format changes.

**Intermediate:**
Q: How does a Python script authenticate to Kubernetes if the script is running natively inside a Kubernetes Pod?
A: Instead of loading a local kubeconfig file, the script uses `config.load_incluster_config()`. This method reads the securely injected ServiceAccount token that Kubernetes automatically mounts at `/var/run/secrets/kubernetes.io/serviceaccount/` inside every container.

**Advanced / Production Scenario:**
Q: You have written a Python script to automatically restart failing pods. It runs flawlessly on your laptop using `load_kube_config()`. You containerize it and deploy it to the K8s cluster as a CronJob, using `load_incluster_config()`. However, it crashes in the cluster with an HTTP 403 Forbidden error. Why?
A: The script is lacking RBAC permissions. When running on my laptop, the script inherits my personal admin credentials. When running inside the cluster, it uses the default ServiceAccount of the namespace, which has virtually no permissions. I need to create a K8s Role that allows "get" and "delete" on Pods, create a ServiceAccount, bind them together (RoleBinding), and assign that ServiceAccount to the CronJob.

## 17. Chapter Summary
Kubernetes is the ultimate destination for modern software. By mastering the `kubernetes` Python package, you bypass the limitations of Bash and YAML, allowing you to write complex, logical, and resilient automation that manages cloud-native infrastructure at a massive scale.

## 18. Quick Revision Notes
- Install via: **`pip install kubernetes`**
- **`config.load_kube_config()`**: Auth from a laptop/CI runner.
- **`config.load_incluster_config()`**: Auth from inside a K8s Pod.
- **`client.CoreV1Api()`**: The client for basic K8s objects (Pods, Namespaces).
- Stop using Bash `grep`/`awk` to manage K8s; use Python objects.
- In-cluster scripts must have proper **RBAC** (ServiceAccounts and Roles).


---

