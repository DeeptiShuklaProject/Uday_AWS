# Level 10 — Kubernetes Storage Deep Dive

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate |
| **Theory Duration** | 6 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 9 — Kubernetes Networking |
| **Lab Required** | Yes — Cluster with dynamic provisioning (EKS or StorageClass configured) |
| **Interview Importance** | ⭐⭐⭐⭐ (4/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Every stateful app needs storage |
| **Certification Alignment** | CKA (Storage — 10%), CKAD |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain ephemeral vs persistent storage in Kubernetes.
2. Describe the PersistentVolume / PersistentVolumeClaim / StorageClass architecture.
3. Configure static and dynamic volume provisioning.
4. Understand volume access modes and reclaim policies.
5. Use CSI (Container Storage Interface) drivers for AWS EBS and EFS.
6. Configure storage for StatefulSets with `volumeClaimTemplates`.

---

## 1. Storage Types Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                   Kubernetes Storage Types                            │
│                                                                      │
│  EPHEMERAL (dies with Pod)          PERSISTENT (survives Pod deletion)│
│  ┌───────────────────────┐         ┌────────────────────────────────┐│
│  │ emptyDir              │         │ PersistentVolume (PV)          ││
│  │ • Created when Pod    │         │ + PersistentVolumeClaim (PVC)  ││
│  │   starts              │         │                                ││
│  │ • Deleted when Pod    │         │ • Exists independently of Pod  ││
│  │   dies                │         │ • Backed by real storage:      ││
│  │ • Shared between      │         │   - AWS EBS (block)            ││
│  │   containers in Pod   │         │   - AWS EFS (file/NFS)         ││
│  │ • Use: temp data,     │         │   - Azure Disk                 ││
│  │   caching, shared     │         │   - GCE PD                     ││
│  │   logs                │         │   - NFS, iSCSI, local          ││
│  ├───────────────────────┤         │                                ││
│  │ configMap / secret    │         │ Dynamic provisioning via       ││
│  │ • Read-only projected │         │ StorageClass automatically     ││
│  │   volumes             │         │ creates PVs when PVCs are      ││
│  ├───────────────────────┤         │ created.                       ││
│  │ hostPath              │         │                                ││
│  │ • Mounts host dir     │         │                                ││
│  │ • DANGEROUS in prod   │         │                                ││
│  │ • Use: DaemonSets,    │         │                                ││
│  │   node agents only    │         │                                ││
│  └───────────────────────┘         └────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. The PV/PVC/StorageClass Architecture

### 2.1 Three-Layer Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Storage Architecture                              │
│                                                                     │
│  Layer 1: StorageClass (Template)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  name: gp3                                                      ││
│  │  provisioner: ebs.csi.aws.com                                   ││
│  │  type: gp3, iops: 3000, throughput: 125                         ││
│  │  reclaimPolicy: Delete                                          ││
│  │                                                                 ││
│  │  "When someone requests storage, create a gp3 EBS volume"       ││
│  └─────────────────────────────────────────────────────────────────┘│
│                           │                                         │
│                           │ (triggers provisioning)                 │
│                           ▼                                         │
│  Layer 2: PersistentVolumeClaim (Request)                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  name: data-postgres-0                                          ││
│  │  storageClassName: gp3                                          ││
│  │  accessModes: ReadWriteOnce                                     ││
│  │  storage: 20Gi                                                  ││
│  │                                                                 ││
│  │  "I need a 20GB gp3 volume with read-write access"              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                           │                                         │
│                           │ (CSI driver creates real storage)       │
│                           ▼                                         │
│  Layer 3: PersistentVolume (Actual Storage)                         │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  name: pv-abc123                                                ││
│  │  capacity: 20Gi                                                 ││
│  │  AWS EBS Volume: vol-0abc123def456                              ││
│  │  AZ: us-east-1a                                                 ││
│  │  Status: Bound (to data-postgres-0)                             ││
│  │                                                                 ││
│  │  "A real 20GB EBS gp3 disk in us-east-1a"                       ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Volume Lifecycle

```
PVC Created → StorageClass triggers CSI driver → CSI creates EBS volume
    → PV created automatically → PV bound to PVC → Pod mounts PVC

Pod Deleted → PVC still exists → PV still exists → Data preserved!

PVC Deleted → Reclaim Policy determines what happens:
  • Delete: PV and underlying EBS volume are deleted (data lost)
  • Retain: PV is released but EBS volume preserved (manual cleanup)
```

---

## 3. StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"  # Default StorageClass
provisioner: ebs.csi.aws.com          # CSI driver to use
parameters:
  type: gp3                            # EBS volume type
  fsType: ext4                         # Filesystem type
  encrypted: "true"                    # Encrypt at rest
  iops: "3000"                         # Provisioned IOPS
  throughput: "125"                    # MB/s throughput
volumeBindingMode: WaitForFirstConsumer # Wait until Pod is scheduled
reclaimPolicy: Delete                  # Delete PV when PVC is deleted
allowVolumeExpansion: true             # Allow resizing PVCs
```

### 3.1 Volume Binding Modes

| Mode | Behavior | Use Case |
| :--- | :--- | :--- |
| `Immediate` | PV created as soon as PVC is created | When you don't care about zone placement |
| `WaitForFirstConsumer` | PV created only when a Pod using the PVC is scheduled | **Recommended** — ensures PV is in the same AZ as the Pod |

### 3.2 Reclaim Policies

| Policy | What Happens When PVC Is Deleted | Use Case |
| :--- | :--- | :--- |
| `Delete` | PV and underlying storage deleted | Dev/test (no data preservation needed) |
| `Retain` | PV released but storage preserved | Production (manual data recovery) |

---

## 4. PersistentVolumeClaim (PVC)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
  namespace: production
spec:
  accessModes:
  - ReadWriteOnce                      # Access mode
  storageClassName: gp3                # Which StorageClass to use
  resources:
    requests:
      storage: 50Gi                    # Requested size
```

### 4.1 Access Modes

| Mode | Abbreviation | Description | Supported By |
| :--- | :--- | :--- | :--- |
| `ReadWriteOnce` | RWO | Read-write by a single node | EBS, Azure Disk, GCE PD |
| `ReadOnlyMany` | ROX | Read-only by many nodes | EFS, NFS, Azure File |
| `ReadWriteMany` | RWX | Read-write by many nodes | EFS, NFS, Azure File |
| `ReadWriteOncePod` | RWOP | Read-write by a single Pod (K8s 1.27+) | CSI drivers supporting it |

**Important:** AWS EBS volumes are `ReadWriteOnce` — they can only be attached to ONE node. For shared storage across Pods on different nodes, use AWS EFS (`ReadWriteMany`).

### 4.2 Using PVC in a Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-storage
spec:
  containers:
  - name: app
    image: myapp:v1.0
    volumeMounts:
    - name: data
      mountPath: /app/data             # Where the volume appears in the container
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: app-data              # Reference the PVC by name
```

---

## 5. CSI (Container Storage Interface)

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CSI Architecture                          │
│                                                             │
│  kubelet                                                    │
│    │                                                        │
│    │ (CSI gRPC)                                             │
│    ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              CSI Driver                               │  │
│  │                                                       │  │
│  │  ┌─────────────────┐    ┌─────────────────────────┐  │  │
│  │  │ Node Plugin     │    │ Controller Plugin        │  │  │
│  │  │ (DaemonSet)     │    │ (Deployment)             │  │  │
│  │  │                 │    │                          │  │  │
│  │  │ • Mount/Unmount │    │ • Create/Delete volumes  │  │  │
│  │  │ • Publish/      │    │ • Attach/Detach volumes  │  │  │
│  │  │   Unpublish     │    │ • Snapshot management    │  │  │
│  │  │ • Runs on       │    │ • Runs as controller     │  │  │
│  │  │   every node    │    │   replica                │  │  │
│  │  └─────────────────┘    └─────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │ API calls                       │
│                           ▼                                 │
│                    ┌──────────────┐                          │
│                    │ Cloud Provider│                          │
│                    │ AWS EBS API   │                          │
│                    │ AWS EFS API   │                          │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 AWS EBS CSI Driver

```bash
# Install EBS CSI Driver on EKS (via EKS add-on)
aws eks create-addon \
  --cluster-name my-cluster \
  --addon-name aws-ebs-csi-driver \
  --service-account-role-arn arn:aws:iam::123456789012:role/AmazonEKS_EBS_CSI_DriverRole

# Or install via Helm
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm install aws-ebs-csi-driver aws-ebs-csi-driver/aws-ebs-csi-driver \
  -n kube-system

# EBS characteristics:
# • Block storage (like a hard disk)
# • RWO only (single node attachment)
# • AZ-specific (cannot cross AZs)
# • Types: gp3 (general), io2 (high IOPS), st1 (throughput), sc1 (cold)
# • Snapshots for backup
# • Encryption with AWS KMS
```

### 5.3 AWS EFS CSI Driver

```yaml
# EFS StorageClass (shared filesystem)
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: efs-sc
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap             # EFS Access Point
  fileSystemId: fs-0123456789abcdef0   # EFS filesystem ID
  directoryPerms: "700"
  uid: "1000"
  gid: "1000"

# EFS characteristics:
# • File storage (NFS-compatible)
# • RWX supported (multiple Pods across multiple nodes)
# • Region-wide (not AZ-specific like EBS)
# • Elastic (grows/shrinks automatically)
# • Use for: shared config, media uploads, ML training data
```

---

## 6. Volume Types Quick Reference

| Volume Type | Persistence | Shared Across Pods? | Use Case |
| :--- | :--- | :--- | :--- |
| `emptyDir` | Deleted with Pod | Yes (same Pod) | Temp data, inter-container sharing |
| `hostPath` | Persists on node | No | DaemonSets, node agents (AVOID in prod) |
| `configMap` | N/A (read-only) | Yes | Application configuration |
| `secret` | N/A (read-only) | Yes | Credentials, TLS certs |
| `PVC` (EBS) | Persists independently | No (RWO) | Databases, stateful apps |
| `PVC` (EFS) | Persists independently | Yes (RWX) | Shared data, uploads, models |
| `downwardAPI` | N/A (read-only) | No | Expose Pod metadata to container |
| `projected` | N/A (read-only) | No | Combine configMap + secret + downwardAPI |

---

## 7. StatefulSet Storage (volumeClaimTemplates)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: gp3
      resources:
        requests:
          storage: 50Gi

# Creates PVCs automatically:
#   data-mysql-0  → 50Gi gp3 (attached to mysql-0)
#   data-mysql-1  → 50Gi gp3 (attached to mysql-1)
#   data-mysql-2  → 50Gi gp3 (attached to mysql-2)
#
# When mysql-1 is rescheduled, the SAME PVC (data-mysql-1) is reattached.
# IMPORTANT: PVCs from volumeClaimTemplates are NOT deleted when StatefulSet is deleted.
# You must manually delete them: kubectl delete pvc data-mysql-0 data-mysql-1 data-mysql-2
```

---

## 8. Volume Expansion (Resizing PVCs)

```bash
# Prerequisites: StorageClass must have allowVolumeExpansion: true

# Resize a PVC
kubectl patch pvc data-mysql-0 -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'

# For EBS: The volume is expanded online (no Pod restart needed for filesystem expansion)
# For some drivers: Pod restart may be required for filesystem resize

# Check PVC status
kubectl get pvc data-mysql-0
# → Condition "FileSystemResizePending" during resize

# NOTE: PVCs can only be EXPANDED, never shrunk.
```

---

## 9. Troubleshooting Storage

| Problem | Symptoms | Diagnostic | Resolution |
| :--- | :--- | :--- | :--- |
| PVC stuck in Pending | Pod stuck in Pending | `kubectl describe pvc` → "waiting for volume" | Check StorageClass exists; check CSI driver is running |
| Volume attach fails | Pod stuck in ContainerCreating | `kubectl describe pod` → "AttachVolume failed" | EBS already attached to another node (RWO); check AZ match |
| AZ mismatch | Pod cannot schedule | Events show "volume zone mismatch" | Use `WaitForFirstConsumer` binding mode |
| Disk full | Application errors | `kubectl exec — df -h` | Expand PVC or clean up data |
| Mount permission denied | App cannot write | Container logs show permission errors | Set `fsGroup` in Pod securityContext |
| CSI driver not installed | PVC stuck in Pending | `kubectl get csidrivers` shows nothing | Install the appropriate CSI driver |

---

## 10. Interview Questions

### Q1: What is the difference between PV, PVC, and StorageClass?

**Expected Answer:**
- **StorageClass** is a template that defines how storage should be provisioned (provider, type, parameters). Think of it as a "menu item."
- **PersistentVolumeClaim (PVC)** is a request for storage by a user — specifying size, access mode, and StorageClass. Think of it as an "order."
- **PersistentVolume (PV)** is the actual provisioned storage resource (e.g., an EBS volume). Think of it as the "delivered product."

With dynamic provisioning: PVC created → StorageClass triggers CSI driver → PV auto-created → PV bound to PVC → Pod mounts PVC.

---

### Q2: What are the volume access modes? When would you use each?

**Expected Answer:**
- **ReadWriteOnce (RWO):** Volume can be mounted read-write by a single node. Use for databases (PostgreSQL, MySQL) backed by block storage (EBS).
- **ReadOnlyMany (ROX):** Volume can be mounted read-only by many nodes. Use for shared configuration or static assets.
- **ReadWriteMany (RWX):** Volume can be mounted read-write by many nodes simultaneously. Use for shared uploads, ML training data. Requires network filesystem (EFS, NFS).

---

### Q3: Why is `WaitForFirstConsumer` important?

**Expected Answer:**
`WaitForFirstConsumer` delays PV provisioning until a Pod using the PVC is scheduled. This ensures the volume is created in the same availability zone as the Pod's node. Without it (`Immediate` mode), the PV might be created in AZ-a while the Pod is scheduled in AZ-b, causing a "volume zone mismatch" error since EBS volumes are AZ-specific.

---

## 11. Best Practices

1. **Always use `WaitForFirstConsumer`** binding mode for EBS StorageClasses.
2. **Enable volume encryption** — set `encrypted: "true"` in StorageClass parameters.
3. **Set reclaim policy to `Retain`** for production databases.
4. **Use EFS for shared storage** (RWX) and EBS for single-Pod storage (RWO).
5. **Enable `allowVolumeExpansion`** on all StorageClasses.
6. **Set `fsGroup`** in securityContext for correct volume permissions.
7. **Remember:** StatefulSet PVCs are NOT auto-deleted — clean them up manually.
8. **Back up EBS volumes** using snapshots before any destructive operations.

---

## 12. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **emptyDir** | Ephemeral; dies with Pod; for temp data and inter-container sharing |
| **PV/PVC** | Persistent storage decoupled from Pod lifecycle |
| **StorageClass** | Dynamic provisioning template (defines "how" to create storage) |
| **CSI** | Standard interface for storage drivers (EBS CSI, EFS CSI) |
| **Access Modes** | RWO (EBS, block), RWX (EFS, NFS), ROX (read-only shared) |
| **Binding Mode** | `WaitForFirstConsumer` ensures AZ alignment |
| **Reclaim Policy** | Delete (dev) vs Retain (prod) |

---

## 13. Practice Assignment

1. Create a StorageClass for gp3 EBS volumes with encryption enabled.
2. Create a PVC requesting 10Gi and mount it in an nginx Pod at `/usr/share/nginx/html`.
3. Write data to the volume, delete the Pod, recreate it, and verify data persists.
4. Deploy a 3-replica StatefulSet with `volumeClaimTemplates`. Verify each Pod gets its own PVC.
5. Expand a PVC from 10Gi to 20Gi and verify the new size.
6. Compare EBS vs EFS: deploy a Pod using each and note the access mode differences.
