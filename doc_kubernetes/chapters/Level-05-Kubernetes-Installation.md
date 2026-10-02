# Level 5 — Kubernetes Installation & Cluster Bootstrap

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Beginner → Intermediate |
| **Theory Duration** | 3 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 4 — Kubernetes Architecture |
| **Lab Required** | Yes — Linux VM(s) for kubeadm; Docker for Minikube/Kind |
| **Interview Importance** | ⭐⭐⭐⭐ (4/5) — CKA exam includes cluster installation |
| **Industry Importance** | ⭐⭐⭐⭐ (4/5) — Understanding bootstrap, even when using managed K8s |
| **Certification Alignment** | CKA (Cluster Installation — 15% of exam) |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Choose the appropriate Kubernetes installation method for their use case.
2. Install Minikube and Kind for local development and learning.
3. Bootstrap a multi-node Kubernetes cluster using `kubeadm`.
4. Configure containerd as the container runtime with systemd cgroup driver.
5. Install a CNI plugin (Calico) for Pod networking.
6. Join worker nodes to the cluster and verify cluster health.
7. Understand and configure `kubeconfig` for cluster access.
8. Troubleshoot common installation failures.

---

## 1. Choosing the Right Installation Method

| Method | Nodes | Use Case | Complexity | Production-like? |
| :--- | :--- | :--- | :--- | :--- |
| **Minikube** | Single | Quick local dev, first-time learners | Very Low | No |
| **Kind** (K8s in Docker) | Multi-node (containers) | CI testing, multi-node labs on single machine | Low | Partially |
| **Docker Desktop K8s** | Single | Developers on macOS/Windows | Very Low | No |
| **kubeadm** | Multi-node (VMs/bare metal) | CKA practice, understanding cluster internals | Medium | Yes |
| **k3s** | Single or multi | Edge, IoT, lightweight clusters | Low | Partially |
| **AWS EKS** | Managed | Enterprise production | Low (operational) | Yes (managed) |

---

## 2. Minikube Installation

### 2.1 What is Minikube?

Minikube runs a single-node Kubernetes cluster inside a VM or container on your local machine. It is the fastest way to start learning Kubernetes.

```bash
# ─── Install Minikube on Linux ──────────────────────────────────

# Download binary
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start cluster (using Docker driver — recommended)
minikube start --driver=docker --cpus=2 --memory=4096

# Expected output:
# 🏄  Done! kubectl is now configured to use "minikube" cluster
# 🎉  minikube is ready to use!

# Verify
kubectl get nodes
# → NAME       STATUS   ROLES           AGE   VERSION
# → minikube   Ready    control-plane   1m    v1.30.0

# Access Kubernetes Dashboard
minikube dashboard

# Stop the cluster (preserves state)
minikube stop

# Delete the cluster (destroys everything)
minikube delete

# Useful Minikube commands
minikube status                    # Check cluster status
minikube ssh                       # SSH into the Minikube VM
minikube service <svc-name> --url  # Get external URL for a NodePort service
minikube addons list               # List available add-ons
minikube addons enable metrics-server  # Enable Metrics Server
```

---

## 3. Kind (Kubernetes in Docker) Installation

### 3.1 What is Kind?

Kind runs Kubernetes cluster nodes as Docker containers. It supports multi-node clusters on a single machine and is ideal for CI pipelines and advanced local testing.

```bash
# ─── Install Kind ───────────────────────────────────────────────

# Download binary
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create a simple single-node cluster
kind create cluster --name my-cluster

# Create a multi-node cluster (1 control plane + 2 workers)
cat > kind-config.yaml << 'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker
EOF

kind create cluster --name multi-node --config kind-config.yaml

# Verify
kubectl get nodes
# → NAME                       STATUS   ROLES           AGE   VERSION
# → multi-node-control-plane   Ready    control-plane   2m    v1.30.0
# → multi-node-worker          Ready    <none>          1m    v1.30.0
# → multi-node-worker2         Ready    <none>          1m    v1.30.0

# List clusters
kind get clusters

# Delete cluster
kind delete cluster --name multi-node
```

---

## 4. Production Installation with kubeadm

### 4.1 What is kubeadm?

`kubeadm` is the official Kubernetes tool for bootstrapping production-grade clusters. It handles certificate generation, Control Plane component deployment (as static pods), and worker node joining.

### 4.2 Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                  kubeadm Cluster Architecture                  │
│                                                               │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐│
│  │ Control Plane Node (master)     │  │ Worker Node 1        ││
│  │ IP: 10.0.1.10                   │  │ IP: 10.0.1.11        ││
│  │                                 │  │                      ││
│  │ Static Pods:                    │  │ Components:          ││
│  │ ├ kube-apiserver               │  │ ├ kubelet            ││
│  │ ├ etcd                         │  │ ├ kube-proxy         ││
│  │ ├ kube-scheduler               │  │ ├ containerd         ││
│  │ └ kube-controller-manager      │  │ └ CNI (Calico)       ││
│  │                                 │  │                      ││
│  │ Services:                       │  │ Joined via:          ││
│  │ ├ kubelet                      │  │ kubeadm join ...     ││
│  │ ├ kube-proxy (DaemonSet)       │  │                      ││
│  │ ├ containerd                   │  │                      ││
│  │ └ CNI (Calico)                 │  │                      ││
│  └─────────────────────────────────┘  └──────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### 4.3 Prerequisites (ALL Nodes — Control Plane + Workers)

```bash
# ─── Step 1: Disable Swap (REQUIRED for kubelet) ─────────────

# Disable swap immediately
sudo swapoff -a

# Disable swap permanently (survives reboot)
sudo sed -i '/ swap / s/^/#/' /etc/fstab

# Verify swap is off
free -h | grep Swap
# → Swap:          0B       0B       0B

# ─── Step 2: Load Required Kernel Modules ────────────────────

cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# ─── Step 3: Set sysctl Parameters (Required for Networking) ─

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system

# Verify
sysctl net.bridge.bridge-nf-call-iptables net.bridge.bridge-nf-call-ip6tables net.ipv4.ip_forward
# All should show = 1
```

### 4.4 Install containerd (ALL Nodes)

```bash
# ─── Install containerd ──────────────────────────────────────

# Install prerequisites
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg

# Add Docker's repository (containerd is distributed via Docker repo)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y containerd.io

# ─── Configure containerd ────────────────────────────────────

# Generate default configuration
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml > /dev/null

# CRITICAL: Set SystemdCgroup = true
# (Kubernetes requires systemd as cgroup driver for stability)
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml

# Restart containerd
sudo systemctl restart containerd
sudo systemctl enable containerd

# Verify
sudo systemctl status containerd
# → Active: active (running)
```

### 4.5 Install kubeadm, kubelet, kubectl (ALL Nodes)

```bash
# ─── Add Kubernetes APT Repository ───────────────────────────

# Add the Kubernetes signing key
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# Add the repository
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
  https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | \
  sudo tee /etc/apt/sources.list.d/kubernetes.list

# Install kubeadm, kubelet, kubectl
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl

# Pin versions to prevent accidental upgrades
sudo apt-mark hold kubelet kubeadm kubectl

# Enable kubelet (it will crash-loop until kubeadm init runs)
sudo systemctl enable kubelet
```

### 4.6 Initialize Control Plane (CONTROL PLANE NODE ONLY)

```bash
# ─── Initialize the Cluster ──────────────────────────────────

sudo kubeadm init \
  --apiserver-advertise-address=10.0.1.10 \
  --pod-network-cidr=192.168.0.0/16 \
  --kubernetes-version=v1.30.0

# Parameters explained:
# --apiserver-advertise-address  → IP address the API Server listens on
# --pod-network-cidr             → IP range for Pods (must match CNI config)
#                                   192.168.0.0/16 for Calico
#                                   10.244.0.0/16 for Flannel
# --kubernetes-version           → Specific K8s version to install

# Expected output (SAVE THIS!):
# Your Kubernetes control-plane has initialized successfully!
#
# To start using your cluster, you need to run as a regular user:
#   mkdir -p $HOME/.kube
#   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
#   sudo chown $(id -u):$(id -g) $HOME/.kube/config
#
# Then you can join any number of worker nodes by running:
#   kubeadm join 10.0.1.10:6443 --token abcdef.1234567890abcdef \
#     --discovery-token-ca-cert-hash sha256:abc123def456...

# ─── Configure kubectl for the Current User ──────────────────

mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Verify kubectl works
kubectl get nodes
# → NAME         STATUS     ROLES           AGE   VERSION
# → master-01    NotReady   control-plane   1m    v1.30.0
#   (NotReady because CNI is not yet installed)
```

### 4.7 Install CNI Plugin — Calico (CONTROL PLANE NODE ONLY)

```bash
# ─── Install Calico CNI ──────────────────────────────────────

# Apply Calico manifest
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml

# Wait for Calico pods to be ready
kubectl get pods -n kube-system -l k8s-app=calico-node -w
# → Wait until all show STATUS: Running

# Verify node is now Ready
kubectl get nodes
# → NAME         STATUS   ROLES           AGE   VERSION
# → master-01    Ready    control-plane   5m    v1.30.0
```

### 4.8 Join Worker Nodes (WORKER NODES ONLY)

```bash
# ─── Run on Each Worker Node ─────────────────────────────────

# Use the join command from kubeadm init output
sudo kubeadm join 10.0.1.10:6443 \
  --token abcdef.1234567890abcdef \
  --discovery-token-ca-cert-hash sha256:abc123def456...

# Expected output:
# This node has joined the cluster:
# * Certificate signing request was sent to apiserver and a response was received.
# * The Kubelet was informed of the new secure connection details.
#
# Run 'kubectl get nodes' on the control-plane to see this node join the cluster.

# ─── If Token Expired (tokens expire after 24 hours) ─────────

# On the control plane node, generate a new token:
kubeadm token create --print-join-command
# → Prints the complete join command with a new token
```

### 4.9 Verify Cluster Health

```bash
# ─── Run on Control Plane Node ────────────────────────────────

# Check all nodes are Ready
kubectl get nodes -o wide
# → NAME         STATUS   ROLES           AGE   VERSION   INTERNAL-IP   OS-IMAGE
# → master-01    Ready    control-plane   10m   v1.30.0   10.0.1.10     Ubuntu 22.04
# → worker-01    Ready    <none>          5m    v1.30.0   10.0.1.11     Ubuntu 22.04
# → worker-02    Ready    <none>          3m    v1.30.0   10.0.1.12     Ubuntu 22.04

# Check all system pods are running
kubectl get pods -n kube-system
# Expected: All pods should be Running
# → coredns-xxx           1/1  Running
# → calico-node-xxx       1/1  Running  (one per node)
# → kube-apiserver-xxx    1/1  Running
# → kube-controller-xxx   1/1  Running
# → kube-scheduler-xxx    1/1  Running
# → etcd-master-01        1/1  Running
# → kube-proxy-xxx        1/1  Running  (one per node)

# Test cluster with a deployment
kubectl create deployment test-nginx --image=nginx:1.25-alpine --replicas=3
kubectl get pods -o wide
# → Verify pods are distributed across worker nodes

# Cleanup test
kubectl delete deployment test-nginx
```

---

## 5. kubeconfig — Cluster Access Configuration

### 5.1 kubeconfig File Structure

```yaml
# File: ~/.kube/config
apiVersion: v1
kind: Config
current-context: production-cluster     # Active context

clusters:                               # Cluster definitions
- cluster:
    certificate-authority-data: <base64-encoded-ca-cert>
    server: https://10.0.1.10:6443
  name: production-cluster

users:                                  # User credentials
- name: admin
  user:
    client-certificate-data: <base64-encoded-client-cert>
    client-key-data: <base64-encoded-client-key>

contexts:                               # Context = cluster + user + namespace
- context:
    cluster: production-cluster
    user: admin
    namespace: default
  name: production-cluster
```

### 5.2 Managing Contexts

```bash
# View current configuration
kubectl config view

# List contexts
kubectl config get-contexts

# Switch context
kubectl config use-context production-cluster

# Set default namespace for current context
kubectl config set-context --current --namespace=production

# Add a new cluster
kubectl config set-cluster dev-cluster \
  --server=https://10.0.2.10:6443 \
  --certificate-authority=/path/to/ca.crt
```

---

## 6. Kubernetes Certificate Architecture

```
/etc/kubernetes/pki/
├── ca.crt                         ← Cluster Certificate Authority (root of trust)
├── ca.key                         ← CA private key (PROTECT THIS)
├── apiserver.crt                  ← API Server serving certificate
├── apiserver.key                  ← API Server private key
├── apiserver-kubelet-client.crt   ← API Server → kubelet client cert
├── apiserver-kubelet-client.key
├── apiserver-etcd-client.crt      ← API Server → etcd client cert
├── apiserver-etcd-client.key
├── front-proxy-ca.crt             ← Aggregation layer CA
├── front-proxy-ca.key
├── front-proxy-client.crt         ← API aggregation client cert
├── front-proxy-client.key
├── sa.key                         ← ServiceAccount signing key
├── sa.pub                         ← ServiceAccount verification key
└── etcd/
    ├── ca.crt                     ← etcd CA
    ├── ca.key
    ├── server.crt                 ← etcd server certificate
    ├── server.key
    ├── peer.crt                   ← etcd peer communication cert
    ├── peer.key
    ├── healthcheck-client.crt     ← etcd health check client cert
    └── healthcheck-client.key

# Check certificate expiry
sudo kubeadm certs check-expiration

# Renew all certificates
sudo kubeadm certs renew all
```

---

## 7. Troubleshooting Installation Failures

| Problem | Symptoms | Diagnostic Commands | Resolution |
| :--- | :--- | :--- | :--- |
| Swap is enabled | `kubeadm init` fails with swap error | `free -h` shows swap > 0 | `swapoff -a`; edit `/etc/fstab` |
| Container runtime not running | kubelet fails to start | `systemctl status containerd` | `systemctl restart containerd` |
| Wrong cgroup driver | kubelet keeps restarting | `journalctl -u kubelet \| grep cgroup` | Set `SystemdCgroup = true` in containerd config |
| Port 6443 in use | `kubeadm init` fails binding port | `ss -tlnp \| grep 6443` | Stop conflicting process or use different port |
| Node NotReady after init | No CNI installed | `kubectl describe node \| grep "network plugin"` | Install CNI plugin (Calico, Flannel) |
| Join token expired | Worker cannot join | Token error in kubeadm join output | `kubeadm token create --print-join-command` on control plane |
| DNS not working | CoreDNS pods in CrashLoop | `kubectl logs -n kube-system coredns-xxx` | Check CNI, check `/etc/resolv.conf` on nodes |
| Firewall blocking ports | Nodes cannot communicate | `telnet 10.0.1.10 6443` | Open ports: 6443, 2379-2380, 10250, 10259, 10257 |

### Required Ports

| Component | Port(s) | Protocol | Direction |
| :--- | :--- | :--- | :--- |
| kube-apiserver | 6443 | TCP | Inbound (from kubectl, kubelet, scheduler, controller) |
| etcd | 2379-2380 | TCP | Inbound (from API Server, etcd peers) |
| kubelet | 10250 | TCP | Inbound (from API Server) |
| kube-scheduler | 10259 | TCP | Inbound (health checks) |
| kube-controller-manager | 10257 | TCP | Inbound (health checks) |
| NodePort Services | 30000-32767 | TCP | Inbound (external traffic) |
| Calico BGP | 179 | TCP | Bidirectional (between nodes) |
| Calico VXLAN | 4789 | UDP | Bidirectional (between nodes) |

---

## 8. Interview Questions

### Q1: How do you set up a Kubernetes cluster from scratch?

**Expected Answer:**
1. Prepare nodes: disable swap, load kernel modules (`overlay`, `br_netfilter`), set sysctl parameters.
2. Install container runtime (containerd) with `SystemdCgroup = true`.
3. Install kubeadm, kubelet, kubectl from the Kubernetes APT/YUM repository.
4. On the control plane: run `kubeadm init` with apiserver address and pod network CIDR.
5. Configure kubeconfig: copy admin.conf to `~/.kube/config`.
6. Install CNI plugin (Calico, Cilium, or Flannel).
7. On worker nodes: run `kubeadm join` with the token from step 4.
8. Verify: `kubectl get nodes` shows all nodes Ready.

---

### Q2: What is the role of kubeconfig?

**Expected Answer:**
kubeconfig (default: `~/.kube/config`) defines how `kubectl` connects to Kubernetes clusters. It contains three sections: **clusters** (API server endpoints and CA certificates), **users** (authentication credentials — client certs, tokens, or exec plugins), and **contexts** (a combination of cluster + user + namespace). The `current-context` determines which cluster kubectl communicates with.

---

### Q3: Why does the node show "NotReady" after `kubeadm init`?

**Expected Answer:**
After `kubeadm init`, the node shows NotReady because no CNI plugin has been installed yet. The kubelet reports the node as NotReady when it cannot configure Pod networking. Installing a CNI plugin (e.g., `kubectl apply -f calico.yaml`) resolves this by enabling Pod IP assignment and inter-Pod communication.

---

## 9. Best Practices

1. **Always disable swap** before installing Kubernetes.
2. **Use containerd** with `SystemdCgroup = true` as the container runtime.
3. **Pin Kubernetes versions** with `apt-mark hold` to prevent accidental upgrades.
4. **Save the kubeadm join command** — you'll need it for every worker node.
5. **Use kubeadm for learning** cluster internals, even if you'll use EKS in production.
6. **Check certificate expiry** regularly: `kubeadm certs check-expiration`.
7. **Open required firewall ports** before running kubeadm.
8. **Use Minikube or Kind for daily development** — don't burn resources on a full kubeadm cluster.

---

## 10. Summary

| Tool | Best For | Nodes | Difficulty |
| :--- | :--- | :--- | :--- |
| **Minikube** | Learning K8s basics, quick experiments | Single | Very Easy |
| **Kind** | CI/CD testing, multi-node local simulation | Multi (Docker containers) | Easy |
| **kubeadm** | CKA preparation, understanding cluster internals | Multi (VMs/bare metal) | Medium |
| **EKS** | Enterprise production (covered in Level 17) | Managed by AWS | Low (operational) |

---

## 11. Practice Assignment

1. Install Minikube and deploy a 3-replica nginx Deployment. Verify Pods are running.
2. Create a Kind multi-node cluster (1 control plane + 3 workers). Deploy an application and verify Pod distribution across workers.
3. Set up a 3-node kubeadm cluster (1 master + 2 workers) on VMs. Install Calico CNI and verify all nodes are Ready.
4. Check the certificate expiry dates on your kubeadm cluster.
5. Practice switching between multiple kubeconfig contexts.
