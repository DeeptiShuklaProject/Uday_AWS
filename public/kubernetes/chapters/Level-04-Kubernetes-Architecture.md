# Level 4 — Kubernetes Architecture Deep Dive

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Beginner → Intermediate |
| **Theory Duration** | 8 hours |
| **Practical Duration** | 4 hours |
| **Prerequisites** | Level 3 — Kubernetes Introduction |
| **Lab Required** | Yes (Minikube or Kind for component inspection) |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Most asked topic in K8s interviews |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKA (Cluster Architecture — 25%), CKS (Understanding arch for security) |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Draw and explain the complete Kubernetes architecture from memory.
2. Describe the purpose, responsibilities, communication pattern, failure scenarios, and troubleshooting approach for every Control Plane component.
3. Describe the purpose and responsibilities of every Worker Node component.
4. Explain the complete request flow from `kubectl apply` to a running container.
5. Explain how every component communicates with the API Server.
6. Describe what happens when each component fails.

---

## 1. Complete Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                  KUBERNETES CLUSTER                                      │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              CONTROL PLANE                                         │  │
│  │                                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         kube-apiserver (Port 6443)                           │  │  │
│  │  │                                                                              │  │  │
│  │  │  • Single entry point for ALL cluster operations                             │  │  │
│  │  │  • Authentication → Authorization (RBAC) → Admission Control → Validation    │  │  │
│  │  │  • Only component that communicates with etcd                                │  │  │
│  │  │  • Exposes RESTful API over HTTPS                                            │  │  │
│  │  └────────┬──────────────────────┬───────────────────────┬──────────────────────┘  │  │
│  │           │                      │                       │                         │  │
│  │           ▼                      ▼                       ▼                         │  │
│  │  ┌────────────────┐    ┌──────────────────┐    ┌──────────────────────────┐       │  │
│  │  │     etcd       │    │  kube-scheduler  │    │ kube-controller-manager  │       │  │
│  │  │  (Port 2379)   │    │  (Port 10259)    │    │     (Port 10257)         │       │  │
│  │  │                │    │                  │    │                          │       │  │
│  │  │ • Distributed  │    │ • Watches for    │    │ • Runs control loops:    │       │  │
│  │  │   KV store     │    │   unscheduled    │    │   - Node Controller      │       │  │
│  │  │ • Raft         │    │   Pods           │    │   - ReplicaSet Controller│       │  │
│  │  │   consensus    │    │ • Filters nodes  │    │   - Endpoint Controller  │       │  │
│  │  │ • Source of    │    │ • Scores nodes   │    │   - SA/Token Controller  │       │  │
│  │  │   truth        │    │ • Binds Pod to   │    │   - Job Controller       │       │  │
│  │  │                │    │   best node      │    │   - ... 30+ controllers  │       │  │
│  │  └────────────────┘    └──────────────────┘    └──────────────────────────┘       │  │
│  │                                                                                    │  │
│  │  ┌──────────────────────────────────────────┐                                     │  │
│  │  │    cloud-controller-manager (optional)    │                                     │  │
│  │  │    • Node lifecycle (AWS EC2 integration) │                                     │  │
│  │  │    • Route controller                     │                                     │  │
│  │  │    • Service controller (LoadBalancer)     │                                     │  │
│  │  └──────────────────────────────────────────┘                                     │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                               │
│                                          │ HTTPS (Port 10250)                            │
│                                          ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              WORKER NODE 1                                         │  │
│  │                                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    kubelet (Port 10250)                                      │  │  │
│  │  │                                                                              │  │  │
│  │  │  • Registers node with API Server                                            │  │  │
│  │  │  • Watches API Server for PodSpecs assigned to this node                     │  │  │
│  │  │  • Manages container lifecycle via CRI                                       │  │  │
│  │  │  • Reports node status and Pod status back to API Server                     │  │  │
│  │  │  • Executes liveness/readiness/startup probes                                │  │  │
│  │  └──────┬──────────────────────┬───────────────────────┬────────────────────────┘  │  │
│  │         │ CRI (gRPC)           │ CNI                   │ CSI                       │  │
│  │         ▼                      ▼                       ▼                           │  │
│  │  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐                 │  │
│  │  │ containerd   │    │   CNI Plugin     │    │   CSI Driver     │                 │  │
│  │  │              │    │ (Calico/Cilium/  │    │ (EBS CSI/        │                 │  │
│  │  │ → runc       │    │  VPC CNI)        │    │  EFS CSI)        │                 │  │
│  │  │ → containers │    │ → Pod IPs        │    │ → Volume mount   │                 │  │
│  │  └──────────────┘    └──────────────────┘    └──────────────────┘                 │  │
│  │                                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    kube-proxy (Port 10256)                                   │  │  │
│  │  │  • Maintains network rules (iptables / IPVS / eBPF)                         │  │  │
│  │  │  • Routes Service traffic to backend Pods                                    │  │  │
│  │  │  • Watches API Server for Service and EndpointSlice changes                  │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │   Pod A     │  │   Pod B     │  │   Pod C     │  │   Pod D     │              │  │
│  │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │              │  │
│  │  │ │Container│ │  │ │Container│ │  │ │Container│ │  │ │Container│ │              │  │
│  │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │              │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘              │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Control Plane Components — Detailed Analysis

### 2.1 kube-apiserver

#### Purpose
The API Server is the **front door** to the entire Kubernetes cluster. It is the ONLY component that directly reads from and writes to etcd. Every other component (scheduler, controllers, kubelet, kubectl) communicates with the cluster exclusively through the API Server.

#### Responsibilities

| Responsibility | Detail |
| :--- | :--- |
| **Authentication** | Validates identity — X.509 client certificates, Bearer tokens, OIDC, webhook |
| **Authorization** | Checks permissions — RBAC, ABAC, Node authorization, Webhook |
| **Admission Control** | Mutating webhooks (inject defaults/sidecars) → Validating webhooks (enforce policies) |
| **Validation** | Checks object schema against the API spec (is this valid YAML for a Deployment?) |
| **Serialization** | Converts between JSON/YAML/Protobuf for internal and external communication |
| **etcd Gateway** | Only component writing to etcd; enforces consistency |
| **Watch/Notification** | Components use Watch API to receive real-time event streams |
| **API Aggregation** | Custom API Servers can extend the API (used by metrics-server, custom CRDs) |

#### Request Processing Pipeline

```
kubectl apply -f deployment.yaml
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    kube-apiserver Processing                     │
│                                                                 │
│  Step 1: AUTHENTICATION                                         │
│  ├─ Client certificate validation (X.509)?                      │
│  ├─ Bearer token validation (ServiceAccount, OIDC)?             │
│  └─ Result: Identity established (e.g., "user:uday" or         │
│             "system:serviceaccount:default:deploy-sa")          │
│                                                                 │
│  Step 2: AUTHORIZATION (RBAC)                                   │
│  ├─ Can "user:uday" perform "create" on "deployments"          │
│  │   in namespace "production"?                                 │
│  ├─ Checks RoleBindings and ClusterRoleBindings                │
│  └─ Result: Allowed ✅ or Denied ❌ (403 Forbidden)            │
│                                                                 │
│  Step 3: MUTATING ADMISSION WEBHOOKS                            │
│  ├─ Inject defaults (e.g., add resource limits if missing)     │
│  ├─ Inject sidecar containers (e.g., Istio Envoy proxy)        │
│  └─ Modify labels/annotations                                  │
│                                                                 │
│  Step 4: OBJECT SCHEMA VALIDATION                               │
│  ├─ Validate field types against API schema                    │
│  └─ Reject malformed objects (400 Bad Request)                 │
│                                                                 │
│  Step 5: VALIDATING ADMISSION WEBHOOKS                          │
│  ├─ OPA Gatekeeper: "No privileged containers allowed"         │
│  ├─ Kyverno: "Image must come from approved registry"          │
│  └─ Result: Accepted ✅ or Rejected ❌                         │
│                                                                 │
│  Step 6: PERSIST TO etcd                                        │
│  ├─ Serialize object to protobuf                               │
│  ├─ Write to etcd key: /registry/deployments/production/web-app│
│  └─ Return 201 Created to client                               │
└─────────────────────────────────────────────────────────────────┘
```

#### Failure Scenario

| Failure | Impact | Detection | Resolution |
| :--- | :--- | :--- | :--- |
| API Server down | `kubectl` commands fail; no new scheduling; existing Pods continue running | `kubectl get nodes` times out | Check systemd: `journalctl -u kube-apiserver`; check certificates; check etcd connectivity |
| API Server overloaded | Slow responses, timeouts | High latency on API requests | Increase replicas (HA setup), check request rate, implement priority & fairness |

#### Troubleshooting Commands

```bash
# Check API Server status
kubectl cluster-info
# → Expected: Kubernetes control plane is running at https://10.0.1.10:6443

# Check API Server health endpoints
curl -k https://localhost:6443/healthz
curl -k https://localhost:6443/readyz

# Check API Server logs (kubeadm setup)
sudo journalctl -u kubelet | grep apiserver
kubectl logs -n kube-system kube-apiserver-<node-name>

# Check API Server static pod manifest
cat /etc/kubernetes/manifests/kube-apiserver.yaml
```

---

### 2.2 etcd

#### Purpose
etcd is the **single source of truth** for the entire Kubernetes cluster. It is a distributed, strongly consistent key-value store that persists all cluster configuration, object specifications, and current state.

#### Key Technical Details

| Property | Value |
| :--- | :--- |
| **Type** | Distributed key-value store |
| **Consensus Algorithm** | Raft (leader election, log replication) |
| **Consistency Model** | Strongly consistent (linearizable reads/writes) |
| **Client Port** | 2379 |
| **Peer Port** | 2380 (cluster member communication) |
| **Data Format** | Protobuf (binary, efficient) |
| **Storage** | WAL (Write-Ahead Log) + snapshot files on disk |
| **HA Requirement** | Odd number of members (3 or 5) for Raft quorum |

#### What etcd Stores

```
/registry/
├── deployments/
│   └── production/
│       └── web-app          → Full Deployment spec + status
├── replicasets/
│   └── production/
│       └── web-app-7d9f8b4  → ReplicaSet spec + status
├── pods/
│   └── production/
│       ├── web-app-7d9f8b4-abc12  → Pod spec + status
│       └── web-app-7d9f8b4-def34  → Pod spec + status
├── services/
│   └── production/
│       └── web-app-service  → Service spec + ClusterIP
├── secrets/
│   └── production/
│       └── db-credentials   → Encrypted secret data
├── configmaps/
│   └── production/
│       └── app-config       → Configuration data
├── nodes/
│   ├── node-01              → Node capacity, conditions, addresses
│   └── node-02
└── namespaces/
    ├── default
    ├── kube-system
    └── production
```

#### Failure Scenario

| Failure | Impact | Detection | Resolution |
| :--- | :--- | :--- | :--- |
| etcd single member failure | Cluster continues if quorum maintained (2/3 or 3/5) | `etcdctl member list` shows unhealthy member | Replace failed member; restore from backup if needed |
| etcd quorum loss | **CATASTROPHIC** — cluster becomes read-only, no writes possible | API Server returns errors; no new Pod scheduling | Restore from etcd snapshot backup |
| etcd disk full | Writes fail; cluster stops functioning | `etcdctl alarm list` shows NOSPACE alarm | Free disk space; compact and defragment etcd database |

#### Backup Commands (Critical for Production)

```bash
# Purpose: Snapshot the etcd database for disaster recovery

# Take a snapshot
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Verify snapshot
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-snapshot.db --write-table

# Restore from snapshot (DISASTER RECOVERY)
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot.db \
  --data-dir=/var/lib/etcd-restored

# Check etcd cluster health
ETCDCTL_API=3 etcdctl endpoint health \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

---

### 2.3 kube-scheduler

#### Purpose
The Scheduler watches for newly created Pods that have no node assigned (`.spec.nodeName` is empty) and selects the optimal node for each Pod to run on.

#### Scheduling Process (2 Phases)

```
New Pod Created (nodeName = "")
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: FILTERING (Predicates)                             │
│  "Which nodes CAN run this Pod?"                             │
│                                                              │
│  Checks:                                                     │
│  ├─ Does the node have enough CPU & memory?                  │
│  │   (Compare Pod requests vs node allocatable resources)    │
│  ├─ Does the node satisfy nodeSelector / nodeAffinity?       │
│  ├─ Does the node have required taints tolerated by Pod?     │
│  ├─ Does the Pod fit within node PID limits?                 │
│  ├─ Are required ports available on the node?                │
│  ├─ Are required volumes available/attachable?               │
│  └─ Does the node match topology constraints?               │
│                                                              │
│  Result: List of feasible nodes (e.g., [node-01, node-03])   │
│  If empty: Pod stays Pending                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: SCORING (Priorities)                               │
│  "Among feasible nodes, which is BEST?"                      │
│                                                              │
│  Scores (0-100 per plugin):                                  │
│  ├─ LeastRequestedPriority: Prefer nodes with most free      │
│  │   resources (spreads load)                                │
│  ├─ BalancedResourceAllocation: Prefer balanced CPU/memory   │
│  ├─ NodeAffinityPriority: Prefer nodes matching preferred    │
│  │   affinity rules                                          │
│  ├─ PodTopologySpread: Prefer nodes that improve spread      │
│  │   across zones                                            │
│  ├─ InterPodAffinity: Prefer/avoid nodes based on co-located │
│  │   Pods                                                    │
│  └─ ImageLocality: Prefer nodes that already have the        │
│      container image cached                                  │
│                                                              │
│  Result: node-03 scores 85, node-01 scores 72                │
│  Winner: node-03                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  BINDING                                                     │
│  Scheduler updates Pod object in etcd:                       │
│  spec.nodeName = "node-03"                                   │
│                                                              │
│  kubelet on node-03 detects the assignment and starts        │
│  the container.                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Failure Scenario

| Failure | Impact | Detection | Resolution |
| :--- | :--- | :--- | :--- |
| Scheduler down | New Pods stay in `Pending` state; existing Pods continue running | `kubectl get pods` shows persistent Pending | Restart scheduler; check logs `journalctl -u kube-scheduler` |

---

### 2.4 kube-controller-manager

#### Purpose
The Controller Manager runs a set of **controllers** — background loops that watch the cluster state and make changes to move the current state toward the desired state.

#### Key Controllers

| Controller | Watches | Action |
| :--- | :--- | :--- |
| **Node Controller** | Node heartbeats (every 10s) | Marks nodes as `NotReady` after 40s timeout; evicts Pods after 5min |
| **ReplicaSet Controller** | ReplicaSet objects | Creates/deletes Pods to match `spec.replicas` count |
| **Deployment Controller** | Deployment objects | Creates/manages ReplicaSets for rolling updates |
| **EndpointSlice Controller** | Services and Pods | Updates EndpointSlice with Pod IPs that match Service selector |
| **ServiceAccount Controller** | Namespaces | Creates default ServiceAccount in new namespaces |
| **Job Controller** | Job objects | Creates Pods for batch tasks; tracks completion |
| **CronJob Controller** | CronJob objects | Creates Job objects on schedule |
| **StatefulSet Controller** | StatefulSet objects | Manages ordered Pod creation with stable identities |
| **DaemonSet Controller** | DaemonSet objects | Ensures one Pod runs on each qualifying node |
| **Namespace Controller** | Namespace deletion | Cleans up all resources when namespace is deleted |
| **PV Controller** | PVC objects | Binds PVCs to available PVs |

#### How a Controller Works (ReplicaSet Example)

```
Reconciliation Loop (continuous):

1. WATCH: Observe ReplicaSet objects via API Server Watch stream.
2. LIST:  For each ReplicaSet, list all Pods matching the label selector.
3. COMPARE: Count running Pods vs desired replicas.

   If running Pods < desired replicas:
      → Create new Pod objects via API Server

   If running Pods > desired replicas:
      → Delete excess Pod objects via API Server

   If running Pods == desired replicas:
      → No action needed ✅

4. REPEAT: Go to step 1 (loop runs continuously).
```

#### Failure Scenario

| Failure | Impact | Detection | Resolution |
| :--- | :--- | :--- | :--- |
| Controller Manager down | No reconciliation; crashed Pods not replaced; new Deployments not processed; Pods not evicted from failed nodes | Pods stay crashed; Deployments don't progress | Restart; check logs; verify certificates |

---

### 2.5 cloud-controller-manager (CCM)

#### Purpose
Separates cloud-specific logic from core Kubernetes logic. Talks to the cloud provider's API (AWS, GCP, Azure) to manage cloud resources.

#### Controllers in CCM

| Controller | Action |
| :--- | :--- |
| **Node Controller** | Discovers node instances from cloud API; sets node addresses; detects terminated instances |
| **Route Controller** | Configures cloud network routes for Pod CIDR |
| **Service Controller** | Creates/updates/deletes cloud load balancers for `type: LoadBalancer` Services |

**AWS Example:**
When you create a `Service type: LoadBalancer`, the CCM calls the AWS API to provision an Elastic Load Balancer (ELB/NLB/ALB) and configures its target group to point to the node IPs.

---

## 3. Worker Node Components — Detailed Analysis

### 3.1 kubelet

#### Purpose
The kubelet is the **primary agent** running on every worker node. It is responsible for managing Pods and containers on its node.

#### Responsibilities

```
kubelet Responsibilities:

1. NODE REGISTRATION
   └─ Registers this node with the API Server (name, IP, capacity, labels)

2. POD WATCHING
   └─ Watches API Server for PodSpecs where spec.nodeName matches this node

3. CONTAINER MANAGEMENT (via CRI)
   ├─ Pulls container images
   ├─ Creates containers (via containerd → runc)
   ├─ Starts, stops, restarts containers
   └─ Reports container status

4. HEALTH PROBING
   ├─ Executes liveness probes → kills unhealthy containers
   ├─ Executes readiness probes → updates EndpointSlice
   └─ Executes startup probes → gates liveness/readiness

5. VOLUME MANAGEMENT (via CSI)
   ├─ Attaches volumes (e.g., AWS EBS)
   ├─ Mounts volumes into container filesystem
   └─ Unmounts and detaches on Pod termination

6. NETWORK SETUP (via CNI)
   ├─ Calls CNI plugin to assign Pod IP
   ├─ Sets up Pod network namespace
   └─ Configures routing for Pod communication

7. NODE STATUS REPORTING
   ├─ Reports node conditions (Ready, DiskPressure, MemoryPressure, PIDPressure)
   ├─ Reports resource capacity and allocatable resources
   └─ Sends heartbeat to API Server (NodeLease, every 10 seconds)

8. STATIC PODS
   └─ Manages Pods defined as local YAML files in /etc/kubernetes/manifests/
      (Used for control plane components in kubeadm installations)
```

#### Communication Interfaces

```
                        kubelet
                          │
            ┌─────────────┼─────────────────┐
            │             │                 │
            ▼             ▼                 ▼
     ┌──────────┐  ┌──────────┐      ┌──────────┐
     │   CRI    │  │   CNI    │      │   CSI    │
     │ Container│  │ Container│      │Container │
     │ Runtime  │  │ Network  │      │ Storage  │
     │Interface │  │Interface │      │Interface │
     └────┬─────┘  └────┬─────┘      └────┬─────┘
          │              │                 │
          ▼              ▼                 ▼
     containerd     Calico/Cilium    EBS/EFS CSI
     → runc         VPC CNI          Driver
     → containers   → Pod IPs       → Volumes
```

| Interface | Protocol | Purpose |
| :--- | :--- | :--- |
| **CRI** (Container Runtime Interface) | gRPC over Unix socket | Pull images, create/start/stop containers |
| **CNI** (Container Network Interface) | Binary exec | Assign IP, configure network namespace |
| **CSI** (Container Storage Interface) | gRPC | Provision, attach, mount persistent volumes |

#### Failure Scenario

| Failure | Impact | Detection | Resolution |
| :--- | :--- | :--- | :--- |
| kubelet stops | Node marked `NotReady` after 40s; Pods evicted after 5min | `kubectl get nodes` shows NotReady | Restart kubelet: `systemctl restart kubelet`; check logs: `journalctl -u kubelet` |

---

### 3.2 kube-proxy

#### Purpose
kube-proxy is a network proxy running on each node that implements the Kubernetes **Service** abstraction by maintaining network rules for traffic routing.

#### Operating Modes

| Mode | Mechanism | Performance | When to Use |
| :--- | :--- | :--- | :--- |
| **iptables** (default) | Linux iptables NAT rules | Sequential rule matching; degrades at >10,000 services | Default; works everywhere |
| **IPVS** | Linux kernel IPVS (IP Virtual Server) | Hash table lookup O(1); excellent at scale | Large clusters with many services |
| **eBPF** (Cilium) | Extended Berkeley Packet Filter | Bypasses entire kernel network stack; extreme performance | Modern high-performance clusters |

#### How kube-proxy Routes Traffic

```
Example: Service "web-svc" (ClusterIP: 10.96.0.100, Port: 80)
         Targets: Pod-A (10.0.1.50:8080), Pod-B (10.0.2.60:8080)

1. kube-proxy watches API Server for Service and EndpointSlice objects.
2. For Service "web-svc", it creates iptables rules:

   iptables -t nat -A KUBE-SERVICES \
     -d 10.96.0.100/32 --dport 80 \
     -j KUBE-SVC-XXXX

   iptables -t nat -A KUBE-SVC-XXXX \
     -m statistic --mode random --probability 0.5 \
     -j KUBE-SEP-AAAA    (→ DNAT to 10.0.1.50:8080)

   iptables -t nat -A KUBE-SVC-XXXX \
     -j KUBE-SEP-BBBB    (→ DNAT to 10.0.2.60:8080)

3. When a Pod sends traffic to 10.96.0.100:80:
   - iptables intercepts the packet
   - Randomly selects one of the backend Pods (50/50)
   - DNATs the destination to the Pod IP (e.g., 10.0.1.50:8080)
   - Packet arrives at the backend Pod
```

---

## 4. Component Communication Map

```
┌──────────────────────────────────────────────────────────────────────┐
│               Component Communication Map                             │
│                                                                       │
│  kubectl ──────────────────────► kube-apiserver ◄──────── Dashboard   │
│  (HTTPS, port 6443)               │  ▲  │  ▲                        │
│                                    │  │  │  │                        │
│                    ┌───────────────┘  │  └──┼────────────────┐       │
│                    │                 │     │                │       │
│                    ▼                 │     ▼                ▼       │
│              etcd (R/W)             │  kube-scheduler   controllers │
│           (port 2379-2380)          │  (Watch stream)   (Watch)     │
│                                     │                              │
│                                     │  (port 10250, HTTPS)         │
│                                     ▼                              │
│                                  kubelet                           │
│                                    │  ▲                            │
│                              ┌─────┼──┘                            │
│                              │     │                               │
│                    ┌─────────┤     ├──────────┐                    │
│                    ▼         ▼     ▼          ▼                    │
│                  CRI       CNI   CSI     kube-proxy                │
│               containerd  Plugin Plugin  (Watch API Server         │
│                  │                         for Service changes)     │
│                  ▼                                                  │
│              Containers                                             │
│              (user workloads)                                       │
└──────────────────────────────────────────────────────────────────────┘

Direction of communication:
  kubectl       → API Server  (user initiates)
  API Server    → etcd        (API Server is only client)
  Scheduler     → API Server  (Watch for unscheduled Pods, Write bindings)
  Controllers   → API Server  (Watch for objects, Write corrections)
  kubelet       → API Server  (Watch for PodSpecs, Report status)
  API Server    → kubelet     (exec, logs, port-forward requests)
  kube-proxy    → API Server  (Watch for Service/EndpointSlice changes)
  kubelet       → containerd  (CRI gRPC: pull image, create container)
  kubelet       → CNI plugin  (exec binary: configure Pod network)
  kubelet       → CSI driver  (gRPC: attach/mount volumes)
```

---

## 5. Complete Request Flow: `kubectl apply -f deployment.yaml`

```
STEP 1: CLIENT (kubectl)
  │  • Reads ~/.kube/config → extracts API server endpoint + client certificate
  │  • Parses deployment.yaml → validates client-side
  │  • Converts YAML to JSON payload
  │  • Sends HTTPS POST to https://api-server:6443/apis/apps/v1/namespaces/default/deployments
  │
  ▼
STEP 2: API SERVER — Authentication
  │  • Validates client TLS certificate against cluster CA
  │  • Extracts identity: "user: uday, groups: [system:masters]"
  │
  ▼
STEP 3: API SERVER — Authorization (RBAC)
  │  • Checks: Can "uday" "create" "deployments" in namespace "default"?
  │  • Evaluates ClusterRoleBindings and RoleBindings
  │  • Result: ALLOWED ✅
  │
  ▼
STEP 4: API SERVER — Mutating Admission
  │  • Mutating webhooks modify the object:
  │    - Add default ServiceAccount if not specified
  │    - Inject Istio sidecar container (if enabled)
  │    - Add default resource limits (if LimitRange exists)
  │
  ▼
STEP 5: API SERVER — Schema Validation
  │  • Validates all fields against the apps/v1 Deployment schema
  │  • Rejects if required fields are missing or types are wrong
  │
  ▼
STEP 6: API SERVER — Validating Admission
  │  • Validating webhooks enforce policies:
  │    - Kyverno: "Image must be from approved registry"
  │    - OPA: "Must have cost-center label"
  │  • Result: ACCEPTED ✅
  │
  ▼
STEP 7: API SERVER — Persist to etcd
  │  • Serializes to protobuf
  │  • Writes to etcd: /registry/deployments/default/web-app
  │  • Returns HTTP 201 Created to kubectl
  │
  ▼
STEP 8: DEPLOYMENT CONTROLLER (Watch event)
  │  • Detects new Deployment via Watch stream
  │  • Creates a ReplicaSet object matching the Deployment spec
  │  • Writes ReplicaSet to API Server → etcd
  │
  ▼
STEP 9: REPLICASET CONTROLLER (Watch event)
  │  • Detects new ReplicaSet
  │  • Checks: desired replicas = 3, actual Pods = 0
  │  • Creates 3 Pod objects (with spec.nodeName = "")
  │  • Writes Pods to API Server → etcd
  │
  ▼
STEP 10: SCHEDULER (Watch event)
  │  • Detects 3 unscheduled Pods (nodeName is empty)
  │  • For each Pod:
  │    - Filters nodes (resources, taints, affinity)
  │    - Scores remaining nodes
  │    - Binds Pod: updates spec.nodeName = "node-02"
  │  • Writes binding to API Server → etcd
  │
  ▼
STEP 11: KUBELET on node-02 (Watch event)
  │  • Detects Pod assigned to this node
  │  • Calls CNI plugin → assigns Pod IP (e.g., 10.0.2.15)
  │  • Calls CSI driver → attaches/mounts volumes (if needed)
  │  • Calls containerd via CRI:
  │    - Pulls container image (if not cached)
  │    - Creates container with namespaces/cgroups
  │    - Starts container process
  │  • Updates Pod status to "Running" via API Server → etcd
  │
  ▼
STEP 12: APPLICATION IS LIVE
  • Pod is running with IP 10.0.2.15
  • kubelet begins executing health probes
  • kube-proxy updates iptables rules for associated Services
```

---

## 6. Hands-On Lab

### Lab 4.1: Inspecting Cluster Components

```bash
# Step 1: Start a Minikube cluster
minikube start --driver=docker

# Step 2: Verify cluster components
kubectl get componentstatuses   # (deprecated but informative)
kubectl get nodes -o wide

# Step 3: Inspect Control Plane static pods
kubectl get pods -n kube-system
# → Expected: kube-apiserver, etcd, kube-scheduler, kube-controller-manager, coredns, kube-proxy

# Step 4: Examine the API Server pod
kubectl describe pod -n kube-system kube-apiserver-minikube

# Step 5: Examine etcd
kubectl describe pod -n kube-system etcd-minikube

# Step 6: Check kube-proxy
kubectl get daemonset -n kube-system kube-proxy
kubectl logs -n kube-system -l k8s-app=kube-proxy --tail=20

# Step 7: Verify kubelet is running on the node
minikube ssh -- sudo systemctl status kubelet

# Step 8: Explore the API
kubectl api-resources | head -30         # List all API resources
kubectl api-versions                     # List all API versions
kubectl explain deployment.spec.replicas # Explain a specific field
```

---

## 7. Interview Questions

### Q1: Draw and explain the Kubernetes architecture.

**Expected Answer:** *(Draw the diagram from Section 1 and explain each component's role. This is the #1 most asked question in Kubernetes interviews.)*

Key points to mention:
- Control Plane: apiserver (only component talking to etcd), etcd (state store), scheduler (Pod placement), controller-manager (reconciliation loops)
- Worker Nodes: kubelet (node agent), kube-proxy (Service routing), containerd (container execution)
- All communication goes through the API Server
- etcd is the single source of truth

---

### Q2: What happens when a node goes down?

**Expected Answer:**
1. kubelet stops sending heartbeats (NodeLease) to the API Server.
2. After 40 seconds, the Node Controller (in controller-manager) marks the node as `NotReady`.
3. After 5 minutes (default `pod-eviction-timeout`), the Node Controller begins evicting Pods from the failed node.
4. For Pods managed by Deployments/ReplicaSets, the ReplicaSet Controller creates replacement Pods.
5. The Scheduler assigns these new Pods to healthy nodes.
6. kubelet on the new nodes starts the containers.

**Follow-up:** What happens to Pods NOT managed by a controller (standalone Pods)?
**Answer:** They are lost forever. Standalone Pods have no controller to recreate them. This is why you should always use Deployments, never bare Pods.

---

### Q3: What is the role of etcd? Why is it critical?

**Expected Answer:**
etcd is the only stateful component in the Kubernetes Control Plane. It stores ALL cluster state — every object specification, every status update, every secret. If etcd is lost without a backup, the entire cluster configuration is lost. This is why etcd backup is the #1 priority in Kubernetes disaster recovery.

**Follow-up:** How do you back up etcd?
**Answer:** `etcdctl snapshot save /backup/etcd-snapshot.db` with the appropriate TLS certificates.

---

### Q4: What is the difference between the Scheduler and the Controller Manager?

**Expected Answer:**
The Scheduler decides **where** Pods run — it assigns unscheduled Pods to nodes based on resource availability, affinity rules, and constraints. The Controller Manager decides **what needs to happen** — it watches for differences between desired and actual state and takes corrective actions (creating Pods, updating EndpointSlices, marking nodes NotReady). They are complementary: the Controller Manager creates the Pod objects, and the Scheduler assigns them to nodes.

---

## 8. Best Practices

1. **Always run etcd on SSDs** — etcd performance is critical for cluster responsiveness.
2. **Run 3 or 5 etcd members** — odd numbers for Raft quorum.
3. **Back up etcd regularly** — schedule automated snapshots.
4. **Run Control Plane in HA** — 3 API Servers behind a load balancer.
5. **Monitor component health** — use `/healthz` and `/readyz` endpoints.
6. **Understand the request flow** — this is essential for troubleshooting.

---

## 9. Summary

| Component | Location | Port | Key Responsibility |
| :--- | :--- | :--- | :--- |
| kube-apiserver | Control Plane | 6443 | API gateway, authentication, authorization, admission |
| etcd | Control Plane | 2379/2380 | Cluster state storage (single source of truth) |
| kube-scheduler | Control Plane | 10259 | Pod-to-node assignment |
| kube-controller-manager | Control Plane | 10257 | Reconciliation loops (desired vs actual state) |
| cloud-controller-manager | Control Plane | - | Cloud provider integration (LB, routes, nodes) |
| kubelet | Worker Node | 10250 | Container lifecycle management via CRI/CNI/CSI |
| kube-proxy | Worker Node | 10256 | Service traffic routing via iptables/IPVS |
| containerd | Worker Node | - | Container execution (OCI runtime) |

---

## 10. Practice Assignment

1. Draw the complete Kubernetes architecture from memory (no reference). Include all Control Plane and Worker Node components with arrows showing communication direction.
2. Explain the complete step-by-step process of what happens when you run `kubectl apply -f deployment.yaml` (12 steps).
3. For each Control Plane component, write: Purpose, What happens if it fails, How to check its health.
4. Explain CRI, CNI, and CSI — what does each interface do and which component uses it?
5. Take an etcd snapshot backup on your lab cluster and verify it.
