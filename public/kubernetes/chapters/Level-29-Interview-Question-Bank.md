# Level 29 — Comprehensive Interview Question Bank

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Total Questions** | 300+ with detailed answers |
| **Difficulty Range** | Beginner → Expert / Architect |
| **Target Roles** | DevOps Engineer, SRE, Platform Engineer, K8s Admin, Cloud Architect |
| **Certification Alignment** | CKA, CKAD, CKS, AWS SA, AWS DevOps |

---

## Part 1: Kubernetes Fundamentals (Beginner)

### Q1: What is Kubernetes and why is it needed?
**Answer:** Kubernetes (K8s) is an open-source container orchestration platform that automates deployment, scaling, and management of containerized applications. It's needed because containers alone don't handle: service discovery, load balancing, self-healing, rolling updates, scaling, secrets management, and persistent storage across multiple machines. Kubernetes solves these production challenges.

### Q2: What is the difference between Docker and Kubernetes?
**Answer:** Docker is a container runtime — it builds and runs individual containers on a single host. Kubernetes is a container orchestrator — it manages containers across multiple hosts, providing scheduling, scaling, networking, and self-healing. Docker packages applications into containers; Kubernetes deploys and manages those containers at scale. Analogy: Docker is a single ship's engine; Kubernetes is the fleet management system.

### Q3: What is a Pod? Why not run containers directly?
**Answer:** A Pod is the smallest deployable unit in K8s — a wrapper around one or more containers that share network (same IP), storage, and lifecycle. K8s uses Pods instead of bare containers to: (1) group tightly-coupled containers (e.g., app + sidecar), (2) share networking context (localhost between containers), (3) manage lifecycle as a unit (restart policy applies to the whole Pod).

### Q4: What is a namespace?
**Answer:** A namespace is a virtual cluster within a K8s cluster that provides logical isolation. Resources in different namespaces are independent. Use cases: separate environments (dev/staging/prod), separate teams, apply RBAC per namespace, enforce ResourceQuotas. Default namespaces: `default`, `kube-system`, `kube-public`, `kube-node-lease`.

### Q5: What are the main K8s object types?
**Answer:** **Workloads:** Pod, Deployment (stateless), StatefulSet (stateful), DaemonSet (per-node), Job/CronJob (batch). **Networking:** Service (ClusterIP/NodePort/LoadBalancer), Ingress. **Configuration:** ConfigMap, Secret. **Storage:** PersistentVolume (PV), PersistentVolumeClaim (PVC), StorageClass. **Security:** Role, ClusterRole, RoleBinding, ServiceAccount, NetworkPolicy.

### Q6: What is kubectl?
**Answer:** kubectl is the command-line tool for interacting with the Kubernetes API server. Common commands: `kubectl get` (list resources), `kubectl describe` (detailed info), `kubectl apply -f` (create/update from YAML), `kubectl delete` (remove resources), `kubectl logs` (container logs), `kubectl exec` (execute commands inside containers).

### Q7: What is a Deployment?
**Answer:** A Deployment manages a set of identical Pods (via a ReplicaSet) and provides declarative updates. It handles: desired replica count, rolling updates, rollbacks, and self-healing (recreating failed Pods). You declare the desired state (image, replicas, resources) and the Deployment controller ensures the actual state matches.

### Q8: What is a Service? What types exist?
**Answer:** A Service provides a stable network endpoint for a set of Pods selected by labels. Types: **ClusterIP** (internal-only virtual IP, default), **NodePort** (exposes on each node's IP at a static port 30000-32767), **LoadBalancer** (provisions a cloud load balancer, e.g., AWS NLB), **ExternalName** (DNS CNAME to an external service).

### Q9: What is the difference between a Deployment and a StatefulSet?
**Answer:** **Deployment:** For stateless apps. Pods are interchangeable, have random names, share the same PVC, and can be created/destroyed in any order. **StatefulSet:** For stateful apps. Pods have stable names (app-0, app-1), stable persistent storage (each Pod gets its own PVC via volumeClaimTemplates), ordered startup/shutdown, and stable DNS hostnames via headless Service. Use for databases (PostgreSQL, MySQL, MongoDB).

### Q10: What is a DaemonSet?
**Answer:** A DaemonSet ensures one Pod runs on every (or selected) node. When nodes are added, DaemonSet Pods are automatically scheduled on them. Use cases: log collectors (Fluent Bit), monitoring agents (Prometheus node-exporter), network plugins (Calico, VPC CNI), storage daemons (EBS CSI node plugin).

---

## Part 2: Kubernetes Architecture (Intermediate)

### Q11: Explain the Kubernetes architecture.
**Answer:** K8s has two planes: **Control Plane** (brain): kube-apiserver (API gateway), etcd (key-value store for all cluster state), kube-scheduler (places Pods on nodes), kube-controller-manager (runs control loops for Deployments, ReplicaSets, etc.). **Data Plane** (workers): kubelet (manages Pods on each node), kube-proxy (Service networking via iptables/IPVS), container runtime (containerd/CRI-O runs containers). All components communicate through the API server.

### Q12: What is etcd? Why is it critical?
**Answer:** etcd is a distributed key-value store that stores ALL cluster state — every Pod, Service, ConfigMap, Secret, RBAC rule, etc. It's the single source of truth. If etcd is lost, the entire cluster state is lost. That's why it's replicated across 3+ nodes (for HA), encrypted at rest, and regularly backed up. On EKS, AWS manages etcd (HA across 3 AZs).

### Q13: What does kube-scheduler do?
**Answer:** kube-scheduler assigns Pods to nodes through a two-phase process: (1) **Filtering** — eliminates nodes that can't run the Pod (insufficient resources, taints, node selectors, affinity rules, port conflicts). (2) **Scoring** — ranks remaining nodes by preference (least resource usage, balanced allocation, image locality, affinity preferences). The highest-scoring node is selected.

### Q14: What is a controller and the reconciliation loop?
**Answer:** A controller watches the actual state of the cluster and works to make it match the desired state. The reconciliation loop is: observe current state → compare with desired state → take corrective action. Example: Deployment controller observes 2 running Pods but desired is 3 → creates 1 new Pod via ReplicaSet. This loop runs continuously, making K8s self-healing.

### Q15: How does kube-proxy work?
**Answer:** kube-proxy runs on every node and implements Service networking. It watches for Service and EndpointSlice changes and programs rules. In **iptables mode** (default): creates iptables chains that DNAT ClusterIP traffic to random backend Pod IPs. In **IPVS mode**: uses hash tables for O(1) lookups (better for large clusters with 5000+ Services). ClusterIPs don't exist as real interfaces — they exist only in these routing rules.

---

## Part 3: Networking (Intermediate-Advanced)

### Q16: Explain the Kubernetes networking model.
**Answer:** Four rules: (1) Every Pod gets a unique IP. (2) All Pods can communicate without NAT. (3) Nodes can communicate with all Pods without NAT. (4) The Pod IP is the same from inside and outside. K8s doesn't implement networking — it delegates to CNI plugins (Calico, Cilium, AWS VPC CNI).

### Q17: How does CoreDNS work?
**Answer:** CoreDNS is the cluster DNS server. It creates DNS records for every Service: `<service>.<namespace>.svc.cluster.local` → ClusterIP. Every Pod gets a `/etc/resolv.conf` pointing to CoreDNS (10.96.0.10). With `ndots:5`, short names (e.g., "web-app") first try appending the search domains. Headless Services (ClusterIP: None) return individual Pod IPs instead of a single ClusterIP.

### Q18: What is a NetworkPolicy?
**Answer:** A firewall for Pod-to-Pod traffic. By default, all Pods can communicate. Once a NetworkPolicy selects a Pod, all traffic to it is denied except what's explicitly allowed. Policies define ingress/egress rules using Pod selectors, namespace selectors, and IP blocks. Requires a CNI that supports it (Calico, Cilium — NOT Flannel). Always allow DNS egress (port 53).

### Q19: What is the difference between Ingress and Service?
**Answer:** **Service** operates at L4 (TCP/UDP) — routes traffic based on IP and port. Provides basic load balancing. **Ingress** operates at L7 (HTTP/HTTPS) — routes traffic based on hostname, URL path, headers. Supports TLS termination, virtual hosting, path-based routing. Ingress requires an Ingress Controller (NGINX, ALB).

### Q20: How does AWS VPC CNI differ from overlay CNIs?
**Answer:** VPC CNI assigns real VPC subnet IPs to Pods using secondary IPs on EC2 ENIs. No overlay/encapsulation — Pods are directly routable in the VPC. Benefits: native performance, VPC Security Groups for Pods, VPC Flow Logs. Limitation: Pod count limited by instance type ENI/IP capacity (e.g., m5.large = 29 Pods). Prefix delegation increases to ~110.

---

## Part 4: Storage (Intermediate)

### Q21: What is the PV/PVC/StorageClass relationship?
**Answer:** **StorageClass**: Template defining how to provision storage (provider, type, parameters). **PVC**: User's request for storage (size, access mode, StorageClass). **PV**: Actual provisioned storage resource (e.g., EBS volume). Dynamic provisioning flow: PVC created → StorageClass triggers CSI driver → PV auto-created → PV bound to PVC → Pod mounts PVC.

### Q22: What are access modes?
**Answer:** **ReadWriteOnce (RWO)**: Mounted read-write by one node (EBS, Azure Disk). **ReadOnlyMany (ROX)**: Read-only by many nodes (NFS, EFS). **ReadWriteMany (RWX)**: Read-write by many nodes (EFS, NFS). **ReadWriteOncePod (RWOP)**: Read-write by a single Pod (K8s 1.27+).

### Q23: What is WaitForFirstConsumer?
**Answer:** A volume binding mode on StorageClass that delays PV provisioning until a Pod is scheduled. Ensures the PV is created in the same AZ as the node. Without it (Immediate mode), the PV might be in AZ-a while the Pod is in AZ-b — causing an "AZ mismatch" error. Critical for EBS (AZ-specific volumes).

---

## Part 5: Security (Advanced)

### Q24: Explain RBAC in Kubernetes.
**Answer:** RBAC has four objects: **Role** (namespace-scoped permissions), **ClusterRole** (cluster-wide permissions), **RoleBinding** (binds Role to subject in a namespace), **ClusterRoleBinding** (binds ClusterRole cluster-wide). Subjects: Users, Groups, ServiceAccounts. Permissions are additive (no deny rules). Built-in ClusterRoles: cluster-admin, admin, edit, view.

### Q25: What is IRSA?
**Answer:** IAM Roles for Service Accounts — links a K8s ServiceAccount to an AWS IAM Role. Pods using the ServiceAccount get temporary AWS credentials via STS AssumeRoleWithWebIdentity. Benefits: no static credentials, per-Pod IAM permissions, automatic credential rotation. Eliminates the need to store AWS access keys in Secrets.

### Q26: What are Pod Security Standards?
**Answer:** Three levels: **Privileged** (no restrictions), **Baseline** (prevents known privilege escalations — no host networking, no privileged containers), **Restricted** (full hardening — non-root, read-only FS, drop all capabilities, seccomp profile). Applied per namespace using labels: `pod-security.kubernetes.io/enforce=restricted`.

---

## Part 6: Scheduling (Advanced)

### Q27: Difference between Taints/Tolerations and Node Affinity?
**Answer:** **Taints** repel Pods from nodes (node's perspective). **Node Affinity** attracts Pods to nodes (Pod's perspective). Used together for dedicated node pools: taint GPU nodes (keep non-GPU Pods away) + affinity on GPU Pods (attract them to GPU nodes). Taints prevent; affinity attracts.

### Q28: What are Topology Spread Constraints?
**Answer:** Control how Pods are distributed across topology domains (nodes, AZs, regions). `maxSkew` defines the maximum difference in Pod count between any two domains. More flexible than Pod Anti-Affinity — allows fine-grained control over evenness of distribution.

---

## Part 7: Deployment Strategies (Advanced)

### Q29: Compare Rolling Update, Blue/Green, and Canary.
**Answer:** **Rolling Update** (K8s native): Gradual Pod replacement; zero downtime; configurable with maxSurge/maxUnavailable. **Blue/Green**: Two full environments; instant switch via Service selector; 2x resources; instant rollback. **Canary**: Small % of traffic to new version; monitor metrics; gradual promotion; lowest risk. Choose based on risk tolerance, resource budget, and rollback speed requirements.

### Q30: What is a PodDisruptionBudget?
**Answer:** PDB limits voluntary disruptions (drain, autoscaler scale-down). Specifies `minAvailable` or `maxUnavailable`. During `kubectl drain`, PDB ensures enough replicas remain running before evicting Pods. Without PDB, drain could evict all replicas simultaneously, causing an outage.

---

## Part 8: Autoscaling (Advanced)

### Q31: How does HPA work?
**Answer:** HPA scales replica count based on metrics (CPU, memory, custom). Algorithm: `desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)`. Evaluates every 15 seconds via Metrics API. Requires resource requests. Stabilization windows prevent flapping. Behavior policies control scale-up/down rate.

### Q32: Karpenter vs Cluster Autoscaler?
**Answer:** **CA**: Works with pre-defined ASGs; fixed instance types; minutes to scale; multi-cloud. **Karpenter**: Directly provisions EC2; auto-selects instance type; seconds to scale; active consolidation; Spot support. Karpenter is faster, cheaper (right-sizing), but AWS-only.

---

## Part 9: AWS & EKS (Advanced)

### Q33: Design a production EKS architecture.
**Answer:** VPC (3 AZs, private subnets for nodes, public for ALBs) → EKS cluster (managed control plane) → Karpenter + managed node groups → VPC CNI → ALB Controller (Ingress) → Argo CD (GitOps) → Prometheus + Grafana (monitoring) → Fluent Bit + CloudWatch (logging) → External Secrets (secrets) → Velero (backup) → IRSA for Pod IAM → Terraform (IaC).

### Q34: How do you upgrade an EKS cluster?
**Answer:** One minor version at a time. Sequence: (1) Review release notes. (2) Test in staging. (3) Upgrade control plane (`aws eks update-cluster-version`). (4) Update add-ons. (5) Upgrade node groups (rolling: new nodes → drain old). (6) Verify all Pods running. Ensure PDBs protect application availability during node drain.

---

## Part 10: DevOps & GitOps (Advanced)

### Q35: What is GitOps? How does Argo CD implement it?
**Answer:** GitOps uses Git as the single source of truth. Argo CD watches a Git repo, compares desired state (Git) with actual state (cluster), and auto-syncs differences. Key features: automated sync, self-healing (reverts manual changes), PR-based workflows, audit trail. Pull-based CD is more secure than push-based (no cluster credentials outside the cluster).

### Q36: Describe a CI/CD pipeline for K8s.
**Answer:** **CI**: Code push → unit tests → build Docker image → Trivy scan → push to ECR with immutable tag (git SHA). **CD**: Update image tag in Git manifest repo → Argo CD detects change → syncs to cluster (rolling update) → verify with smoke tests and monitoring. Never use `latest` tag.

---

## Part 11: Troubleshooting (Critical for All Interviews)

### Q37: Pod is in CrashLoopBackOff. How do you troubleshoot?
**Answer:** (1) `kubectl describe pod` — check Events, exit code. (2) `kubectl logs --previous` — read crashed container logs. (3) Exit code 1 = app error, 137 = OOMKilled, 126/127 = permission/command. (4) OOMKilled → increase memory limits. (5) App error → check config, dependencies, env vars. (6) Permission → fix SecurityContext.

### Q38: Pod is Pending. What are the causes?
**Answer:** `kubectl describe pod` Events: (1) Insufficient CPU/memory → scale nodes. (2) nodeSelector mismatch → fix labels. (3) Taint not tolerated → add toleration. (4) PVC not bound → check StorageClass/CSI. (5) Topology spread unsatisfiable → relax constraint. (6) Pod anti-affinity can't be met → reduce replicas.

### Q39: Service not routing traffic. How to debug?
**Answer:** (1) `kubectl get endpoints` — if empty, selector doesn't match Pod labels. (2) Check labels match between Service selector and Pod template. (3) Verify target port matches container port. (4) Test DNS: `nslookup <service>`. (5) Test connectivity: `curl <service>:<port>`. (6) Check NetworkPolicies blocking ingress.

### Q40: How do you handle a production outage?
**Answer:** (1) **Detect**: Alert fires. (2) **Triage**: Classify severity (SEV1/2/3). (3) **Diagnose**: Check recent deployments, events, dashboards. (4) **Mitigate**: Fastest fix — rollback, scale up, restart. (5) **Resolve**: Root cause fix. (6) **Post-mortem**: What happened, why, prevention action items.

---

## Part 12: Scenario-Based Questions (Senior/Architect)

### Q41: Your application is slow. How do you diagnose?
**Answer:** (1) Check metrics: Pod CPU/memory usage (kubectl top, Grafana). (2) Check HPA — is it scaling? Are replicas sufficient? (3) Check latency breakdown: is it the app, database, or network? (4) Check DNS resolution time (ndots:5 overhead for external calls). (5) Check Pod readiness — are unhealthy Pods receiving traffic? (6) Check node resource usage — are nodes overcommitted? (7) Distributed tracing (Jaeger) to pinpoint the slow service.

### Q42: How would you migrate from VMs to Kubernetes?
**Answer:** (1) Containerize applications (Dockerfile, multi-stage builds). (2) Start with stateless services (web servers, APIs). (3) Create K8s manifests (Deployment, Service, ConfigMap). (4) Set up CI/CD pipeline (build → scan → push → deploy). (5) Implement monitoring and alerting before going live. (6) Run parallel (VMs + K8s) during migration. (7) Migrate stateful services last (databases need careful planning — StatefulSets, data migration). (8) Decommission VMs after validation.

### Q43: Design for 99.99% availability.
**Answer:** (1) Multi-AZ deployment (3 AZs minimum). (2) Multi-region active-passive or active-active (for regional failure). (3) Pod anti-affinity across AZs. (4) PDB with minAvailable ≥ 67%. (5) HPA + Karpenter for auto-scaling. (6) Health checks on all endpoints. (7) Database: RDS Multi-AZ + read replicas. (8) CDN (CloudFront) for static content. (9) Circuit breakers between services. (10) Chaos engineering (regular failure injection).

---

## Summary

| Interview Level | Focus Areas |
| :--- | :--- |
| **Junior** | Pods, Deployments, Services, kubectl, basic YAML |
| **Mid-Level** | Architecture, Networking, Storage, RBAC, CI/CD |
| **Senior** | Autoscaling, Troubleshooting, Production Ops, GitOps, Security |
| **Staff/Architect** | Multi-cluster, DR, Cost optimization, Architecture design, Trade-offs |
| **All Levels** | Troubleshooting scenarios, "What happens when" questions |
