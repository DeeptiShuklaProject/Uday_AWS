# Level 25 — Production Operations & Day-2 Management

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Advanced |
| **Theory Duration** | 8 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 24 — Monitoring & Observability |
| **Lab Required** | Yes — Production-like cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKA, CKS |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Perform Kubernetes version upgrades (control plane + nodes) safely.
2. Implement backup and disaster recovery for etcd and cluster resources.
3. Design multi-tenancy with namespace isolation, resource quotas, and limit ranges.
4. Implement resource management (requests, limits, QoS classes).
5. Manage certificate rotation and cluster maintenance.
6. Implement cost optimization strategies.

---

## 1. Cluster Upgrades

### 1.1 Upgrade Strategy

```
EKS Upgrade Process (ALWAYS upgrade ONE minor version at a time):

1. Check release notes for breaking changes
   → https://kubernetes.io/releases/

2. Update Control Plane (AWS managed — no downtime)
   aws eks update-cluster-version --name my-cluster --kubernetes-version 1.31
   → Takes 20-30 minutes

3. Update Add-ons (vpc-cni, coredns, kube-proxy, ebs-csi)
   aws eks update-addon --cluster-name my-cluster --addon-name vpc-cni --resolve-conflicts OVERWRITE

4. Update Node Groups (rolling update)
   aws eks update-nodegroup-version --cluster-name my-cluster --nodegroup-name general
   → New nodes launch → old nodes drain → old nodes terminate

5. Verify
   kubectl get nodes -o wide
   kubectl get pods -A --field-selector status.phase!=Running
```

### 1.2 Pre-Upgrade Checklist

```
□ Read release notes for deprecated/removed APIs
□ Test upgrade in staging environment first
□ Ensure PodDisruptionBudgets are configured for critical apps
□ Verify Helm charts are compatible with new K8s version
□ Back up etcd (kubeadm) / cluster resources (Velero)
□ Ensure monitoring and alerting are active
□ Schedule upgrade during maintenance window
□ Communicate with stakeholders
```

---

## 2. Backup & Disaster Recovery

### 2.1 What to Back Up

| Component | Backup Tool | Frequency |
| :--- | :--- | :--- |
| **etcd** (kubeadm clusters) | `etcdctl snapshot save` | Every 4 hours |
| **K8s Resources** | Velero | Daily |
| **Persistent Volumes** | EBS Snapshots / Velero | Daily |
| **Helm Release State** | `helm get values` / Velero | With each release |
| **Git Repos** (IaC/manifests) | Git hosting provider backup | Continuous |

### 2.2 Velero Backup

```bash
# Install Velero
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.8.0 \
  --bucket my-velero-backups \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1 \
  --secret-file ./credentials-velero

# Create backup
velero backup create daily-backup --include-namespaces production,staging

# Schedule daily backups
velero schedule create daily --schedule="0 2 * * *" --include-namespaces production

# Restore from backup
velero restore create --from-backup daily-backup

# Disaster Recovery: Restore entire cluster resources
velero restore create full-restore --from-backup daily-backup --include-namespaces '*'
```

### 2.3 etcd Backup (kubeadm clusters)

```bash
# Save snapshot
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Verify snapshot
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-snapshot.db --write-table

# Restore from snapshot
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot.db \
  --data-dir=/var/lib/etcd-restored
```

---

## 3. Multi-Tenancy & Resource Management

### 3.1 ResourceQuota

```yaml
# Limit total resources per namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "20"               # Total CPU requests across all Pods
    requests.memory: "40Gi"          # Total memory requests
    limits.cpu: "40"                 # Total CPU limits
    limits.memory: "80Gi"            # Total memory limits
    pods: "100"                      # Max Pods in namespace
    services: "20"                   # Max Services
    persistentvolumeclaims: "50"     # Max PVCs
    configmaps: "100"
    secrets: "100"
```

### 3.2 LimitRange

```yaml
# Default limits for Pods that don't specify them
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - type: Container
    default:                          # Default limits (if not specified)
      cpu: "500m"
      memory: "256Mi"
    defaultRequest:                   # Default requests (if not specified)
      cpu: "100m"
      memory: "128Mi"
    max:                              # Maximum allowed
      cpu: "4"
      memory: "8Gi"
    min:                              # Minimum allowed
      cpu: "50m"
      memory: "64Mi"
```

---

## 4. Cost Optimization

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Cost Optimization Strategies                          │
│                                                                          │
│  1. Right-Size Resources:                                                │
│     Use VPA recommendations to adjust resource requests.                 │
│     Over-provisioned Pods waste money.                                   │
│                                                                          │
│  2. Use Spot Instances:                                                  │
│     Karpenter: capacity-type: spot (up to 90% savings)                  │
│     Best for: stateless apps, batch jobs, CI/CD runners                  │
│                                                                          │
│  3. Autoscale Everything:                                                │
│     HPA: Scale Pods based on load (don't run idle replicas)             │
│     Karpenter: Scale nodes based on demand (no idle nodes)              │
│                                                                          │
│  4. Use Savings Plans / Reserved Instances:                              │
│     For baseline capacity that runs 24/7                                 │
│                                                                          │
│  5. Namespace ResourceQuotas:                                            │
│     Prevent teams from over-provisioning their namespaces                │
│                                                                          │
│  6. Tools:                                                               │
│     Kubecost: Cost attribution per namespace/deployment                  │
│     AWS Cost Explorer: Account-level cost analysis                       │
│     Karpenter consolidation: Replace underutilized nodes                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Interview Questions

### Q1: How do you handle Kubernetes cluster upgrades?

**Expected Answer:**
Always upgrade one minor version at a time (1.29 → 1.30, not 1.29 → 1.31). Process: (1) Review release notes for deprecated APIs. (2) Test in staging first. (3) Upgrade control plane. (4) Update add-ons (vpc-cni, coredns, kube-proxy). (5) Upgrade node groups (rolling update — new nodes launch, old nodes drain). Ensure PodDisruptionBudgets protect application availability during node drain. Back up before upgrading.

---

### Q2: How do you implement cost optimization on EKS?

**Expected Answer:**
1. **Right-size** Pods using VPA recommendations (reduce over-provisioned requests).
2. **Use Spot Instances** for fault-tolerant workloads (Karpenter mixed capacity).
3. **Autoscale** with HPA (scale Pods) + Karpenter (scale nodes to demand).
4. **Reserved Instances / Savings Plans** for baseline 24/7 capacity.
5. **ResourceQuotas** per namespace to prevent waste.
6. **Karpenter consolidation** to replace underutilized nodes with smaller instances.
7. **Kubecost** for per-team cost visibility.

---

## 6. Summary

| Topic | Key Takeaway |
| :--- | :--- |
| **Upgrades** | One version at a time; Control Plane → Add-ons → Nodes |
| **Backup** | Velero for K8s resources; EBS snapshots for data; etcd snapshots |
| **Multi-Tenancy** | Namespaces + RBAC + ResourceQuota + LimitRange + NetworkPolicy |
| **Cost** | Right-size + Spot + Autoscale + Savings Plans + Kubecost |
| **Maintenance** | PDB for safe disruptions; certificate rotation; monitoring |

---

## 7. Practice Assignment

1. Create a ResourceQuota and LimitRange for a namespace. Test enforcement by exceeding limits.
2. Install Velero and create a backup of a namespace. Delete the namespace and restore it.
3. Plan an EKS upgrade: document the checklist, execute in a test cluster.
4. Calculate the cost difference between on-demand and spot for a workload.
5. Set up Kubecost and analyze cost attribution by namespace.
