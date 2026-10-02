# Level 17 — Amazon EKS Deep Dive

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate → Advanced |
| **Theory Duration** | 10 hours |
| **Practical Duration** | 10 hours |
| **Prerequisites** | Level 16 — AWS Fundamentals |
| **Lab Required** | Yes — AWS account with EKS permissions |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Core for AWS DevOps/K8s roles |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Most popular managed K8s platform |
| **Certification Alignment** | AWS Certified DevOps Engineer, AWS Solutions Architect |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain the EKS architecture and what AWS manages vs what you manage.
2. Create EKS clusters using `eksctl`, AWS CLI, and Terraform.
3. Configure Managed Node Groups, Self-Managed Nodes, and Fargate profiles.
4. Install and configure essential EKS add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI).
5. Set up `kubectl` access with `aws eks update-kubeconfig`.
6. Implement cluster access management using EKS Access Entries.
7. Compare EKS compute options (EC2 Managed, Karpenter, Fargate).

---

## 1. EKS Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Amazon EKS Architecture                             │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │              AWS-Managed (Control Plane)                                │  │
│  │              You do NOT manage this.                                    │  │
│  │                                                                        │  │
│  │  ┌──────────────┐  ┌──────┐  ┌───────────┐  ┌─────────────────┐      │  │
│  │  │kube-apiserver│  │ etcd │  │ scheduler │  │controller-manager│      │  │
│  │  │ (3 AZs, HA)  │  │(3 AZ)│  │ (HA)      │  │    (HA)         │      │  │
│  │  └──────────────┘  └──────┘  └───────────┘  └─────────────────┘      │  │
│  │                                                                        │  │
│  │  • Runs across 3 AZs automatically                                    │  │
│  │  • etcd encrypted with AWS KMS                                        │  │
│  │  • API Server behind NLB endpoint                                      │  │
│  │  • Automatic upgrades available (for Control Plane)                    │  │
│  │  • 99.95% SLA                                                         │  │
│  │  • Cost: ~$0.10/hour ($73/month) for the Control Plane                │  │
│  └───────────────────────────────────┬────────────────────────────────────┘  │
│                                      │                                       │
│                                      │ HTTPS (via ENI in your VPC)           │
│                                      │                                       │
│  ┌───────────────────────────────────▼────────────────────────────────────┐  │
│  │              Customer-Managed (Data Plane)                             │  │
│  │              YOU manage this.                                          │  │
│  │                                                                        │  │
│  │  Option A: Managed Node Groups (EC2)                                  │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │  │
│  │  │  Worker Node      │  │  Worker Node      │  │  Worker Node      │    │  │
│  │  │  (EC2 m5.xlarge)  │  │  (EC2 m5.xlarge)  │  │  (EC2 m5.xlarge)  │    │  │
│  │  │  AZ: us-east-1a   │  │  AZ: us-east-1b   │  │  AZ: us-east-1c   │    │  │
│  │  │  kubelet, proxy   │  │  kubelet, proxy   │  │  kubelet, proxy   │    │  │
│  │  │  VPC CNI          │  │  VPC CNI          │  │  VPC CNI          │    │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘    │  │
│  │                                                                        │  │
│  │  Option B: Fargate (Serverless)                                       │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                          │  │
│  │  │  Fargate Pod      │  │  Fargate Pod      │  No nodes to manage!    │  │
│  │  │  (Isolated VM)    │  │  (Isolated VM)    │  Each Pod runs in       │  │
│  │  │  AZ: us-east-1a   │  │  AZ: us-east-1b   │  its own micro-VM.     │  │
│  │  └──────────────────┘  └──────────────────┘                          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 What AWS Manages vs What You Manage

| Component | AWS Manages | You Manage |
| :--- | :--- | :--- |
| **Control Plane** | ✅ (HA, patching, etcd backup) | ❌ |
| **Worker Nodes** | Partially (MNG launch/terminate) | ✅ (scaling, OS updates, security) |
| **Networking** | Partially (VPC CNI add-on) | ✅ (VPC, subnets, security groups) |
| **Storage** | Partially (EBS/EFS CSI add-ons) | ✅ (StorageClass configuration) |
| **Load Balancing** | Partially (AWS LB Controller) | ✅ (Ingress/Service configuration) |
| **Security** | Partially (API Server auth) | ✅ (RBAC, Pod security, IRSA) |
| **Monitoring** | Partially (Control Plane logs) | ✅ (Application monitoring, alerts) |
| **K8s Version Upgrades** | ❌ (you initiate) | ✅ (schedule and execute upgrades) |

---

## 2. Creating an EKS Cluster

### 2.1 Using eksctl (Fastest Method)

```bash
# Simple cluster (dev/learning)
eksctl create cluster \
  --name my-eks-cluster \
  --version 1.30 \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type m5.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed

# Production cluster with custom VPC
cat > cluster-config.yaml << 'EOF'
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: production-cluster
  region: us-east-1
  version: "1.30"

vpc:
  id: vpc-0abc123def456               # Existing VPC
  subnets:
    private:
      us-east-1a: { id: subnet-0aaa }
      us-east-1b: { id: subnet-0bbb }
      us-east-1c: { id: subnet-0ccc }

managedNodeGroups:
- name: general
  instanceType: m5.xlarge
  desiredCapacity: 3
  minSize: 2
  maxSize: 10
  volumeSize: 100
  volumeType: gp3
  privateNetworking: true
  labels:
    role: general
  iam:
    withAddonPolicies:
      ebs: true
      efs: true
      albIngress: true
      cloudWatch: true

- name: spot-workers
  instanceTypes: ["m5.large", "m5.xlarge", "m6i.large"]
  spot: true
  desiredCapacity: 2
  minSize: 0
  maxSize: 10
  labels:
    role: spot
    lifecycle: spot

addons:
- name: vpc-cni
  version: latest
- name: coredns
  version: latest
- name: kube-proxy
  version: latest
- name: aws-ebs-csi-driver
  version: latest

iam:
  withOIDC: true                       # Enable IRSA
EOF

eksctl create cluster -f cluster-config.yaml
```

### 2.2 Configure kubectl Access

```bash
# Update kubeconfig to point to the EKS cluster
aws eks update-kubeconfig \
  --name my-eks-cluster \
  --region us-east-1

# Verify
kubectl get nodes
kubectl cluster-info
kubectl get pods -n kube-system
```

---

## 3. EKS Compute Options

### 3.1 Comparison

| Feature | Managed Node Groups | Karpenter | Fargate |
| :--- | :--- | :--- | :--- |
| **Infrastructure** | EC2 instances (you choose type) | EC2 (auto-selected) | AWS-managed micro-VMs |
| **Scaling** | Cluster Autoscaler | Karpenter (faster) | Auto (per Pod) |
| **OS Management** | You manage (AMI updates) | Managed (AMI auto-selected) | AWS manages |
| **DaemonSets** | ✅ Supported | ✅ Supported | ❌ Not supported |
| **GPU** | ✅ Supported | ✅ Supported | ❌ Not supported |
| **Pricing** | EC2 instance pricing | EC2 instance pricing | Per vCPU/memory/second |
| **Best for** | General workloads | Cost-optimized, mixed | Small, bursty, or isolated workloads |

### 3.2 Fargate Profile

```yaml
# Fargate runs Pods in serverless micro-VMs
# Define which Pods should run on Fargate:

apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: my-cluster
  region: us-east-1

fargateProfiles:
- name: fp-production
  selectors:
  - namespace: production
    labels:
      compute: fargate               # Only Pods with this label
- name: fp-coredns
  selectors:
  - namespace: kube-system
    labels:
      k8s-app: kube-dns              # Run CoreDNS on Fargate
```

```bash
# Create Fargate profile
eksctl create fargateprofile \
  --cluster my-cluster \
  --name fp-production \
  --namespace production \
  --labels compute=fargate
```

---

## 4. EKS Add-ons

### 4.1 Essential Add-ons

| Add-on | Purpose | Required? |
| :--- | :--- | :--- |
| **vpc-cni** | Pod networking (assigns VPC IPs to Pods) | Yes (default) |
| **coredns** | DNS resolution inside cluster | Yes (default) |
| **kube-proxy** | Service routing via iptables/IPVS | Yes (default) |
| **aws-ebs-csi-driver** | EBS persistent storage | Yes (for stateful apps) |
| **aws-efs-csi-driver** | EFS shared storage | If using EFS |
| **aws-load-balancer-controller** | ALB/NLB for Ingress/Services | Yes (for production) |
| **metrics-server** | CPU/memory metrics for HPA | Yes (for autoscaling) |
| **cert-manager** | TLS certificate management | Recommended |
| **external-dns** | Automatic Route 53 DNS records | Recommended |

### 4.2 AWS Load Balancer Controller

```bash
# Install AWS Load Balancer Controller (manages ALB/NLB)
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=my-cluster \
  --set serviceAccount.create=true \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::123456789012:role/AWSLoadBalancerControllerRole
```

```yaml
# ALB Ingress example
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip              # Route directly to Pod IPs
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...  # ACM TLS cert
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app
            port:
              number: 80
```

---

## 5. EKS Cluster Upgrades

```bash
# EKS Upgrade Process (rolling, one version at a time):

# Step 1: Check current version
kubectl version --short
aws eks describe-cluster --name my-cluster --query 'cluster.version'

# Step 2: Upgrade Control Plane (AWS manages this)
aws eks update-cluster-version \
  --name my-cluster \
  --kubernetes-version 1.31
# → Takes 20-30 minutes. No downtime for running workloads.

# Step 3: Update add-ons to compatible versions
aws eks update-addon --cluster-name my-cluster --addon-name vpc-cni --resolve-conflicts OVERWRITE
aws eks update-addon --cluster-name my-cluster --addon-name coredns --resolve-conflicts OVERWRITE
aws eks update-addon --cluster-name my-cluster --addon-name kube-proxy --resolve-conflicts OVERWRITE

# Step 4: Upgrade Node Groups
aws eks update-nodegroup-version \
  --cluster-name my-cluster \
  --nodegroup-name standard-workers
# → Rolling update: new nodes launched with updated AMI,
#   old nodes drained and terminated one by one.

# Step 5: Verify
kubectl get nodes -o wide
# → All nodes should show the new K8s version
```

---

## 6. EKS Networking (VPC CNI)

```
AWS VPC CNI — How Pod IPs Work:

┌────────────────────────────────────────────────────────────────┐
│                    Worker Node (EC2)                            │
│                                                                │
│  Primary ENI: eth0 (10.0.10.50)                               │
│  ├── Secondary IP: 10.0.10.51 → Pod-A                        │
│  ├── Secondary IP: 10.0.10.52 → Pod-B                        │
│  └── Secondary IP: 10.0.10.53 → Pod-C                        │
│                                                                │
│  Secondary ENI: eth1                                           │
│  ├── Primary IP: 10.0.10.100                                  │
│  ├── Secondary IP: 10.0.10.101 → Pod-D                       │
│  └── Secondary IP: 10.0.10.102 → Pod-E                       │
│                                                                │
│  Key Insight: Each Pod gets a REAL VPC IP address.            │
│  No overlay network. Pods are directly routable in the VPC.   │
│  Max Pods = (# ENIs × IPs per ENI) - node IPs                │
│  m5.large: 3 ENIs × 10 IPs = 29 max Pods                     │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. EKS Observability

```bash
# Enable Control Plane logging
aws eks update-cluster-config \
  --name my-cluster \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'

# Logs go to CloudWatch Log Group: /aws/eks/<cluster-name>/cluster

# Install Fluent Bit for Pod log shipping
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonSet/container-insights-monitoring/fluent-bit/fluent-bit.yaml

# Install Container Insights (metrics + logs)
# Provides CloudWatch dashboards for node, Pod, and container metrics
```

---

## 8. Interview Questions

### Q1: What is Amazon EKS and what does AWS manage?

**Expected Answer:**
Amazon EKS is a managed Kubernetes service. AWS manages the Control Plane: highly available API server, etcd (encrypted, backed up), scheduler, and controller-manager across 3 AZs with a 99.95% SLA. You manage the Data Plane: worker nodes (EC2 or Fargate), application deployments, networking configuration, RBAC, storage, and monitoring. The control plane costs ~$0.10/hour.

---

### Q2: How does VPC CNI differ from overlay-based CNI plugins?

**Expected Answer:**
AWS VPC CNI assigns real VPC IP addresses to Pods using secondary IPs on EC2 Elastic Network Interfaces. There is no overlay network — Pods are directly routable within the VPC. This provides native VPC performance (no encapsulation overhead) and allows Pods to use VPC features like Security Groups and VPC Flow Logs. The tradeoff is IP address consumption — each Pod consumes a VPC IP, and the max Pods per node is limited by the instance type's ENI and IP capacity.

---

### Q3: What are the three compute options on EKS?

**Expected Answer:**
1. **Managed Node Groups**: EC2 instances managed via ASGs. You choose instance types. AWS handles AMI updates, scaling, and node lifecycle. Best for general workloads.
2. **Karpenter**: Dynamically provisions optimal EC2 instances based on pending Pod requirements. Faster than ASG-based scaling, supports Spot instances, and actively consolidates underutilized nodes. Best for cost optimization.
3. **Fargate**: Serverless — each Pod runs in an isolated micro-VM managed by AWS. No nodes to manage. Best for small, bursty workloads that don't need DaemonSets or GPUs.

---

## 9. Summary

| EKS Concept | Key Takeaway |
| :--- | :--- |
| **Architecture** | Managed Control Plane (3 AZ HA) + Customer Data Plane |
| **Creating Clusters** | eksctl (fast), AWS CLI, Terraform (production IaC) |
| **Compute** | Managed Node Groups, Karpenter, Fargate |
| **Networking** | VPC CNI (real VPC IPs, no overlay) |
| **Add-ons** | VPC CNI, CoreDNS, kube-proxy, EBS CSI, AWS LB Controller |
| **Upgrades** | Rolling: Control Plane → Add-ons → Node Groups |
| **Cost** | $0.10/hr control plane + EC2/Fargate compute costs |

---

## 10. Practice Assignment

1. Create an EKS cluster with `eksctl` (2 managed node groups: general + spot).
2. Configure `kubectl` access and verify cluster health.
3. Install AWS Load Balancer Controller and deploy an Ingress with ALB.
4. Install EBS CSI driver and deploy a StatefulSet with persistent storage.
5. Create a Fargate profile for a namespace and deploy a workload to Fargate.
6. Upgrade an EKS cluster from one version to the next (control plane + nodes).
