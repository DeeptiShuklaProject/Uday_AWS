# Level 28 — Enterprise Architecture & Reference Designs

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Expert / Architect |
| **Theory Duration** | 10 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 27 — Production Incidents |
| **Lab Required** | Design-focused — diagrams and planning |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Senior/Staff/Architect roles |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | AWS Solutions Architect Professional |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Design a multi-tier production EKS architecture.
2. Implement multi-cluster strategies (active-passive, active-active).
3. Design for high availability, disaster recovery, and compliance.
4. Make architectural trade-off decisions and justify them.
5. Present architecture designs in interviews and design reviews.

---

## 1. Production EKS Reference Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   Production EKS Reference Architecture                          │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        External Traffic                                     │ │
│  │  Users → Route 53 (DNS) → CloudFront (CDN) → WAF → ALB (Ingress)          │ │
│  └────────────────────────────────────────┬────────────────────────────────────┘ │
│                                           │                                      │
│  ┌────────────────────────────────────────▼────────────────────────────────────┐ │
│  │                        EKS Cluster                                         │ │
│  │                                                                            │ │
│  │  ┌── Namespace: production ────────────────────────────────────────────┐   │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────────────┐ │   │ │
│  │  │  │ Frontend│  │ API GW  │  │ Backend │  │ Workers (async jobs) │ │   │ │
│  │  │  │ (React) │  │ (NGINX) │  │ (Go/Node│  │ (SQS consumers)     │ │   │ │
│  │  │  │ 3 reps  │  │ 3 reps  │  │ 5 reps  │  │ 2 reps (HPA on SQS)│ │   │ │
│  │  │  │ +HPA    │  │ +HPA    │  │ +HPA    │  │                     │ │   │ │
│  │  │  └────┬────┘  └────┬────┘  └────┬────┘  └──────────┬──────────┘ │   │ │
│  │  │       │             │             │                  │            │   │ │
│  │  │  ┌────▼─────────────▼─────────────▼──────────────────▼──────┐    │   │ │
│  │  │  │              Internal Services                           │    │   │ │
│  │  │  │  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐ │    │   │ │
│  │  │  │  │ Redis  │  │PostgreSQL│  │ ElasticS.│  │ RabbitMQ  │ │    │   │ │
│  │  │  │  │(cache) │  │(primary) │  │(search)  │  │(messaging)│ │    │   │ │
│  │  │  │  │StatefulSet│StatefulSet│ │StatefulSet│ │StatefulSet│ │    │   │ │
│  │  │  │  └────────┘  └──────────┘  └──────────┘  └───────────┘ │    │   │ │
│  │  │  └──────────────────────────────────────────────────────────┘    │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                        │ │
│  │  ┌── Namespace: monitoring ──────┐  ┌── Namespace: argocd ──────────┐ │ │
│  │  │ Prometheus, Grafana,          │  │ Argo CD (GitOps controller)   │ │ │
│  │  │ Alertmanager, Fluent Bit      │  │ ApplicationSets              │ │ │
│  │  └───────────────────────────────┘  └───────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌── AWS Services ───────────────────────────────────────────────────────┐   │
│  │ ECR (images) │ EBS/EFS (storage) │ Secrets Manager │ SQS │ S3 │ KMS │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌── Infrastructure ────────────────────────────────────────────────────┐    │
│  │ Terraform (IaC) │ GitHub Actions (CI) │ Argo CD (CD) │ Karpenter    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Cluster Strategies

### 2.1 Strategy Comparison

| Strategy | Architecture | RPO | RTO | Cost | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Single Cluster** | 1 cluster, multi-AZ | ~4h (backup interval) | Hours | $ | Low |
| **Active-Passive** | Primary + standby cluster | ~1h | 15-30 min | $$ | Medium |
| **Active-Active** | 2+ clusters, traffic split | ~0 | ~0 | $$$ | High |

### 2.2 Active-Passive Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    Active-Passive Multi-Cluster                   │
│                                                                   │
│  Route 53 (Failover routing)                                     │
│  ├── Primary: cluster-east.example.com (us-east-1) [ACTIVE]     │
│  └── Secondary: cluster-west.example.com (us-west-2) [STANDBY]  │
│                                                                   │
│  Primary (us-east-1):                                             │
│  ┌────────────────────────────────────┐                          │
│  │ EKS Cluster (full workload)        │                          │
│  │ RDS Primary (PostgreSQL)           │                          │
│  │ S3 (with cross-region replication) │                          │
│  └────────────────────────────────────┘                          │
│           │ replication                                           │
│           ▼                                                       │
│  Secondary (us-west-2):                                           │
│  ┌────────────────────────────────────┐                          │
│  │ EKS Cluster (standby — scaled down)│                          │
│  │ RDS Read Replica (promote on fail)  │                          │
│  │ S3 (replica bucket)                │                          │
│  └────────────────────────────────────┘                          │
│                                                                   │
│  Failover: Route 53 health check fails → traffic routes to       │
│  secondary → promote RDS replica → scale up standby EKS cluster  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 3. Design Decision Framework

### 3.1 Architecture Trade-offs

| Decision | Option A | Option B | Key Consideration |
| :--- | :--- | :--- | :--- |
| **Compute** | Managed Node Groups | Karpenter | Cost optimization vs simplicity |
| **Networking** | VPC CNI (native) | Cilium eBPF | Native AWS vs advanced features |
| **CD** | ArgoCD (pull) | Jenkins (push) | Security vs familiarity |
| **Ingress** | ALB Controller | NGINX Ingress | AWS-native vs portable |
| **Storage** | EBS (block) | EFS (file) | RWO vs RWX |
| **Secrets** | K8s Secrets + KMS | External Secrets + Secrets Manager | Simple vs centralized |
| **Monitoring** | CloudWatch | Prometheus + Grafana | AWS-native vs open source |

### 3.2 Architecture Decision Record (ADR)

```markdown
# ADR-001: Use Karpenter instead of Cluster Autoscaler

## Status: Accepted

## Context
We need node autoscaling for our EKS cluster. Options:
- Cluster Autoscaler with ASG
- Karpenter with direct EC2 provisioning

## Decision
Use Karpenter because:
1. Faster scaling (30s vs 3-5 min)
2. Automatic instance type selection (cost optimization)
3. Mixed Spot/On-Demand support
4. Active consolidation of underutilized nodes

## Consequences
- AWS-only (not portable to other clouds)
- Newer project (less community experience)
- Must manage NodePool CRD lifecycle
```

---

## 4. Interview Questions

### Q1: Design a production-grade EKS architecture for a web application.

**Expected Answer Structure:**
1. **Networking**: VPC with 3 AZs, private subnets for nodes, public for ALBs, NAT Gateways.
2. **Compute**: Managed Node Groups (baseline) + Karpenter (scale-up) + Spot for non-critical.
3. **Traffic**: Route 53 → CloudFront (CDN) → WAF → ALB (Ingress) → Services → Pods.
4. **Storage**: EBS gp3 for databases (StatefulSet), EFS for shared files.
5. **Security**: IRSA, RBAC per namespace, Pod Security Standards, NetworkPolicies.
6. **CD**: Argo CD (GitOps), Helm charts per environment.
7. **Observability**: Prometheus + Grafana (metrics), Fluent Bit + CloudWatch (logs).
8. **DR**: Multi-AZ, Velero backups, consider active-passive for critical services.
9. **Cost**: Spot instances, HPA, Karpenter consolidation, Savings Plans.

---

### Q2: How do you handle disaster recovery for EKS?

**Expected Answer:**
1. **Multi-AZ** within a region (handles AZ failure — default for EKS control plane).
2. **Velero backups** for K8s resources + EBS snapshots for data (daily).
3. **Terraform** for infrastructure recreation (apply same code in another region).
4. **Git repos** for application manifests (Argo CD redeploys from Git).
5. **Cross-region database replication** (RDS Read Replicas).
6. **Route 53 failover routing** for DNS-based failover.
7. **RPO/RTO targets** drive the architecture choice (single cluster vs active-passive vs active-active).

---

## 5. Summary

| Architecture Layer | Components |
| :--- | :--- |
| **External Traffic** | Route 53 → CloudFront → WAF → ALB |
| **Cluster** | EKS (3 AZ) + Karpenter + Managed Node Groups |
| **Application** | Helm charts + Argo CD (GitOps) |
| **Data** | EBS/EFS (CSI) + RDS + ElastiCache |
| **Security** | IRSA + RBAC + PSA + NetworkPolicies |
| **Observability** | Prometheus + Grafana + Fluent Bit + CloudWatch |
| **IaC** | Terraform + S3 state + GitHub Actions |
| **DR** | Velero + cross-region replication + Route 53 failover |

---

## 6. Practice Assignment

1. Draw a complete architecture diagram for a production EKS deployment.
2. Write an Architecture Decision Record for choosing between ALB and NGINX Ingress.
3. Design a disaster recovery plan with RPO < 1 hour and RTO < 30 minutes.
4. Design a multi-tenant EKS cluster for 5 development teams with namespace isolation.
5. Calculate the infrastructure cost for your architecture using the AWS Pricing Calculator.
