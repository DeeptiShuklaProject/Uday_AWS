# Level 16 — AWS Fundamentals for Kubernetes Engineers

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Beginner → Intermediate |
| **Theory Duration** | 8 hours |
| **Practical Duration** | 4 hours |
| **Prerequisites** | Level 15 — Security & RBAC |
| **Lab Required** | Yes — AWS Free Tier account |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Required for EKS/Cloud roles |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | AWS Solutions Architect, AWS DevOps Engineer |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Describe the AWS global infrastructure (Regions, AZs, Edge locations).
2. Explain core AWS services used with Kubernetes: VPC, IAM, EC2, EBS, EFS, ELB, Route 53, ECR, S3.
3. Design a VPC architecture for EKS clusters.
4. Configure IAM users, roles, and policies following least privilege.
5. Understand EC2 instance types, AMIs, and pricing models.
6. Use AWS CLI and configure programmatic access.

---

## 1. AWS Global Infrastructure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     AWS Global Infrastructure                                │
│                                                                              │
│  Region (e.g., us-east-1)                                                   │
│  ├── A geographic area with multiple data centers                            │
│  ├── 30+ regions worldwide                                                  │
│  ├── Choose based on: latency, compliance, service availability, cost       │
│  │                                                                          │
│  └── Availability Zones (AZs) — isolated data centers within a region       │
│      ├── us-east-1a — Data Center Group A                                   │
│      ├── us-east-1b — Data Center Group B                                   │
│      ├── us-east-1c — Data Center Group C                                   │
│      └── us-east-1d, 1e, 1f ...                                            │
│                                                                              │
│  Key for EKS:                                                                │
│  • EKS control plane runs across 3 AZs automatically                        │
│  • Worker nodes should be spread across 2-3 AZs                             │
│  • EBS volumes are AZ-specific (cannot cross AZs)                           │
│  • EFS is regional (works across all AZs)                                   │
│  • ALB/NLB can distribute traffic across AZs                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. VPC (Virtual Private Cloud)

### 2.1 VPC Architecture for EKS

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     VPC: 10.0.0.0/16 (65,536 IPs)                           │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │  AZ: us-east-1a                                                       │   │
│  │  ┌─────────────────────┐  ┌──────────────────────┐                   │   │
│  │  │ Public Subnet        │  │ Private Subnet        │                   │   │
│  │  │ 10.0.1.0/24          │  │ 10.0.10.0/24          │                   │   │
│  │  │                      │  │                       │                   │   │
│  │  │ • NAT Gateway        │  │ • EKS Worker Nodes    │                   │   │
│  │  │ • ALB/NLB            │  │ • Application Pods    │                   │   │
│  │  │ • Bastion Host       │  │ • Database Pods       │                   │   │
│  │  └─────────────────────┘  └──────────────────────┘                   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │  AZ: us-east-1b                                                       │   │
│  │  ┌─────────────────────┐  ┌──────────────────────┐                   │   │
│  │  │ Public Subnet        │  │ Private Subnet        │                   │   │
│  │  │ 10.0.2.0/24          │  │ 10.0.20.0/24          │                   │   │
│  │  │                      │  │                       │                   │   │
│  │  │ • NAT Gateway        │  │ • EKS Worker Nodes    │                   │   │
│  │  │ • ALB/NLB            │  │ • Application Pods    │                   │   │
│  │  └─────────────────────┘  └──────────────────────┘                   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │  AZ: us-east-1c                                                       │   │
│  │  ┌─────────────────────┐  ┌──────────────────────┐                   │   │
│  │  │ Public Subnet        │  │ Private Subnet        │                   │   │
│  │  │ 10.0.3.0/24          │  │ 10.0.30.0/24          │                   │   │
│  │  └─────────────────────┘  └──────────────────────┘                   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Internet Gateway (IGW) ←→ Public Subnets                                   │
│  NAT Gateway (in public) ←→ Private Subnets (outbound internet)             │
│  Route Tables: Public → IGW, Private → NAT GW                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Required VPC Tags for EKS

```bash
# Subnet tags required for EKS to discover subnets:

# All subnets used by EKS:
kubernetes.io/cluster/<cluster-name> = shared   (or "owned")

# Public subnets (for ALB/NLB internet-facing):
kubernetes.io/role/elb = 1

# Private subnets (for internal ALBs and worker nodes):
kubernetes.io/role/internal-elb = 1
```

### 2.3 Key Networking Concepts

| Concept | Description | EKS Relevance |
| :--- | :--- | :--- |
| **VPC** | Isolated virtual network | Container for all EKS resources |
| **Subnet** | IP range within a VPC | Workers in private subnets; LBs in public |
| **Security Group** | Stateful firewall per ENI | Controls traffic to/from nodes and Pods |
| **NACL** | Stateless firewall per subnet | Additional network security layer |
| **NAT Gateway** | Outbound internet for private subnets | Worker nodes pull images, call AWS APIs |
| **Internet Gateway** | Internet access for public subnets | External traffic to ALB/NLB |
| **Route Table** | Traffic routing rules | Directs subnet traffic to IGW/NAT |
| **ENI** | Elastic Network Interface | VPC CNI assigns Pod IPs from ENI secondary IPs |

---

## 3. IAM (Identity and Access Management)

### 3.1 IAM for EKS

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    IAM Roles for EKS                                     │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  EKS Cluster Role (Control Plane)                                │    │
│  │  Trust: eks.amazonaws.com                                        │    │
│  │  Policies:                                                       │    │
│  │    • AmazonEKSClusterPolicy                                     │    │
│  │    • AmazonEKSVPCResourceController (for Pod networking)         │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Node Group Role (Worker Nodes)                                  │    │
│  │  Trust: ec2.amazonaws.com                                        │    │
│  │  Policies:                                                       │    │
│  │    • AmazonEKSWorkerNodePolicy                                  │    │
│  │    • AmazonEKS_CNI_Policy (VPC CNI networking)                  │    │
│  │    • AmazonEC2ContainerRegistryReadOnly (pull images from ECR)  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Pod Roles (IRSA — per application)                               │    │
│  │  Trust: oidc.eks.<region>.amazonaws.com (EKS OIDC provider)      │    │
│  │  Policies: Per-application (S3 access, SQS access, etc.)         │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Karpenter Role (Node provisioning)                               │    │
│  │  Trust: pods.eks.amazonaws.com (Pod Identity)                     │    │
│  │  Policies:                                                       │    │
│  │    • EC2 RunInstances, TerminateInstances                        │    │
│  │    • EC2 CreateFleet, CreateTags                                  │    │
│  │    • IAM PassRole                                                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. EC2 Instance Types for EKS

### 4.1 Instance Families

| Family | Optimized For | Examples | EKS Use Case |
| :--- | :--- | :--- | :--- |
| **M** (General) | Balanced compute/memory | m5.large, m6i.xlarge | General workloads, default worker nodes |
| **C** (Compute) | High CPU | c5.xlarge, c6i.2xlarge | CPU-intensive apps, build servers |
| **R** (Memory) | High memory | r5.large, r6i.xlarge | Databases, caching (Redis, Elasticsearch) |
| **T** (Burstable) | Variable workloads | t3.medium, t3.large | Dev/test environments (NOT production) |
| **G/P** (GPU) | Machine learning | g4dn.xlarge, p3.2xlarge | ML training/inference |
| **I** (Storage) | High I/O | i3.large, i3en.xlarge | Database nodes, high-throughput storage |

### 4.2 Pricing Models

| Model | Discount | Commitment | EKS Use Case |
| :--- | :--- | :--- | :--- |
| **On-Demand** | None (base price) | None | Baseline capacity, variable workloads |
| **Reserved Instances** | Up to 72% | 1 or 3 years | Stable baseline worker nodes |
| **Savings Plans** | Up to 72% | 1 or 3 years | Flexible across instance types |
| **Spot Instances** | Up to 90% | None (can be reclaimed) | Batch processing, stateless apps, CI/CD runners |

---

## 5. AWS Services Used with EKS

| AWS Service | K8s Integration | Purpose |
| :--- | :--- | :--- |
| **ECR** | Container registry | Store and pull Docker images |
| **EBS** | CSI driver → PV/PVC | Block storage for databases |
| **EFS** | CSI driver → PV/PVC | Shared file storage (RWX) |
| **ALB** | AWS Load Balancer Controller → Ingress | HTTP/HTTPS load balancing |
| **NLB** | Service type: LoadBalancer | TCP/UDP load balancing |
| **Route 53** | ExternalDNS controller | Automatic DNS record management |
| **Secrets Manager** | External Secrets Operator | Centralized secret management |
| **CloudWatch** | Fluent Bit → CloudWatch Logs | Centralized logging |
| **S3** | Application SDK | Object storage, backups |
| **SQS** | HPA custom metrics | Message queue, event-driven scaling |
| **KMS** | etcd encryption, EBS encryption | Encryption key management |
| **CloudTrail** | Audit logging | API call auditing |

---

## 6. AWS CLI Setup

```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
# → AWS Access Key ID: <your-key>
# → AWS Secret Access Key: <your-secret>
# → Default region: us-east-1
# → Default output: json

# Verify
aws sts get-caller-identity
# → Account ID, ARN, User ID

# Install eksctl (EKS management tool)
curl -sLO "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_Linux_amd64.tar.gz"
tar xz -C /tmp -f eksctl_Linux_amd64.tar.gz
sudo mv /tmp/eksctl /usr/local/bin/

# Verify
eksctl version
```

---

## 7. Interview Questions

### Q1: What AWS services are required for an EKS cluster?

**Expected Answer:**
At minimum: VPC (with public and private subnets across 2+ AZs), IAM roles (cluster role, node role), EC2 instances or Fargate for worker nodes, and a NAT Gateway for outbound internet. Typically also: ECR for container images, EBS CSI driver for persistent storage, ALB/NLB for traffic routing, Route 53 for DNS, CloudWatch for logging, and KMS for encryption.

---

### Q2: Why should EKS worker nodes be in private subnets?

**Expected Answer:**
Private subnets have no direct internet access, reducing the attack surface. Worker nodes communicate with the internet through NAT Gateways (outbound only — for pulling images, calling AWS APIs). Inbound traffic reaches applications through Load Balancers (ALB/NLB) in public subnets. This follows the defense-in-depth security model: only Load Balancers are publicly exposed.

---

## 8. Summary

| AWS Concept | K8s Relevance |
| :--- | :--- |
| **Region/AZ** | Multi-AZ deployment for HA; EBS is AZ-specific |
| **VPC** | Network foundation for EKS; private subnets for nodes |
| **IAM** | Authentication/authorization for cluster, nodes, and Pods |
| **EC2** | Worker node instances (managed node groups or self-managed) |
| **EBS/EFS** | Persistent storage via CSI drivers |
| **ALB/NLB** | Traffic routing to Kubernetes Services |
| **ECR** | Private container image registry |

---

## 9. Practice Assignment

1. Create a VPC with 3 public and 3 private subnets across 3 AZs using AWS Console or CLI.
2. Create IAM roles for EKS cluster and node groups with the required policies.
3. Set up AWS CLI and verify connectivity with `aws sts get-caller-identity`.
4. Push a Docker image to ECR and pull it from a Kubernetes Pod.
5. Create an EBS volume and an EFS filesystem via AWS Console. Understand their AZ behavior.
