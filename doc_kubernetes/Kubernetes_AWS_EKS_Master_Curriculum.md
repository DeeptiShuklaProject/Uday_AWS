# Production-Grade Kubernetes & AWS EKS Master Class: Zero to Cloud Native Architect

## Course Overview & Metadata

* **Course Title:** Production-Grade Kubernetes & AWS EKS Master Class: Zero to Cloud Native Architect
* **Course Objective:** Deliver an industry-oriented, production-ready curriculum covering Linux, Networking, Docker, Kubernetes Core, EKS Architecture, Terraform, DevSecOps CI/CD, GitOps, Observability, Production Operations, Troubleshooting, and Enterprise Architecture.
* **Target Audience:** Freshers, College Students, IT Professionals, Linux/System Administrators, DevOps Engineers, Cloud Engineers, Software Engineers, and Candidates targeting Senior/Architect roles.
* **Prerequisites:** None (Level 0 covers all required IT, Linux, and Networking foundations).
* **Expected Delivery Duration:** 24 Weeks (160 Hours Theory + 240 Hours Hands-on Labs & Capstones).

---

## 1. Learning Path & Sequence Roadmap

```
Phase 1: Linux & Networking Foundations (Level 0)
   │
   ▼
Phase 2: Containers & Docker Engineering (Level 1 - Level 2)
   │
   ▼
Phase 3: Kubernetes Architecture & Core Objects (Level 3 - Level 8)
   │
   ▼
Phase 4: Kubernetes Networking, Storage & Config (Level 9 - Level 11)
   │
   ▼
Phase 5: Scheduling, Deployment Strategies & Autoscaling (Level 12 - Level 14)
   │
   ▼
Phase 6: Kubernetes Security, IAM vs RBAC & Compliance (Level 15)
   │
   ▼
Phase 7: AWS Foundations & Deep EKS Integration (Level 16 - Level 18)
   │
   ▼
Phase 8: Git, Jenkins, DevSecOps & Infrastructure as Code (Level 19 - Level 22)
   │
   ▼
Phase 9: Package Management (Helm) & GitOps (Argo CD) (Level 23 - Level 24)
   │
   ▼
Phase 10: Observability & AWS Native Monitoring (Level 25 - Level 26)
   │
   ▼
Phase 11: Production Operations, Backup & DR (Level 27 - Level 28)
   │
   ▼
Phase 12: Systematic Troubleshooting & Real-World Incidents (Level 29 - Level 30)
   │
   ▼
Phase 13: Architect Level Design & Enterprise Reference Architecture (Level 31 - Level 32)
   │
   ▼
Phase 14: Comprehensive Interview Question Bank & Request Flows (Level 33 - Level 34)
   │
   ▼
Phase 15: Hands-on Practical Labs & Capstone Projects (Level 35 - Level 36)
   │
   ▼
Phase 16: Skills Matrix, Interview Readiness & Final Job-Readiness Checklist
```

---

## 2. Missing Topics & Curriculum Enhancement Analysis

To ensure this curriculum represents a true enterprise-grade platform engineering & architecture program, the following missing industry-critical topics have been integrated:

1. **Kubernetes Custom Resource Definitions (CRDs) & Operator Pattern:**
   * *Why:* Modern enterprise add-ons (Cert-Manager, Prometheus Operator, Argo CD, Karpenter) rely on CRDs and Controllers.
   * *Level:* Advanced / Production (Level 14 & 24).
2. **Service Mesh (Istio / Linkerd):**
   * *Why:* Enterprise microservices require mTLS encryption, traffic splitting, circuit breaking, and telemetry.
   * *Level:* Advanced / Architect (Level 9 & 31).
3. **FinOps, Cost Optimization & Capacity Planning (Karpenter & Kubecost):**
   * *Why:* EKS cluster cost management is a top enterprise requirement.
   * *Level:* Advanced / Architect (Level 14 & 27).
4. **Policy as Code & Governance (Kyverno & OPA Gatekeeper):**
   * *Why:* Security teams require automated guardrails for security standards.
   * *Level:* Advanced / Security (Level 15).
5. **Multi-Tenancy & Virtual Clusters (vCluster):**
   * *Why:* Enterprise multi-team workload isolation strategies.
   * *Level:* Architect Level (Level 31).
6. **Chaos Engineering & Resilience Testing (LitmusChaos / Chaos Mesh):**
   * *Why:* Proactive production cluster stability validation.
   * *Level:* Production / Architect (Level 27).

---

## 3. Course Modules (Levels 0 to 36)

### LEVEL 0 — IT, Linux, Networking & Cloud Prerequisites

#### 0.1 Linux Systems Engineering
* **Linux Fundamentals:** OS architecture, Kernel vs Shell, Distros (RHEL, Ubuntu, Alpine, Amazon Linux 2023).
* **Filesystem Hierarchy Standard (FHS):** `/var`, `/etc`, `/usr`, `/proc`, `/sys`, `/dev`, `/tmp`.
* **Process & Service Management:** Process trees, PID, signals (`SIGTERM`, `SIGKILL`), `systemd`, `systemctl` service units, `journalctl` log inspection.
* **User & Access Administration:** Users, Groups, File Permissions (`chmod`, `chown`, `umask`), SUID/SGID, `sudoers` configuration, SSH key pairs, security hardened SSH config (`/etc/ssh/sshd_config`).
* **Package Management & System Tuning:** `apt`, `dnf`/`yum`, environment variables (`/etc/environment`, `~/.bashrc`), sysctl kernel parameters (`net.ipv4.ip_forward`, `fs.file-max`).
* **Storage & Resource Inspection:** `df -h`, `du -sh`, `free -m`, `top`, `htop`, `uptime`, `lsblk`, `fdisk`, swap memory setup.
* **Linux Text Wrangling & Automation:** `grep`, `egrep`, `awk` syntax, `sed` stream editor, `find`, `xargs`, `tar`, `gzip`, `tee`, pipelines, redirection.

#### 0.2 Computer Networking Fundamentals
* **IP Addressing & Subnetting:** IPv4 anatomy, Classless Inter-Domain Routing (CIDR), Subnet masks, Private RFC 1918 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Public IPs.
* **Routing & Gateways:** Default gateway, routing tables (`ip route`), NAT (SNAT vs DNAT), Port Forwarding.
* **DNS Resolution Mechanics:** `/etc/hosts`, `/etc/resolv.conf`, DNS record types (A, AAAA, CNAME, MX, TXT, SRV, PTR), Recursive vs Authoritative resolvers, TTL.
* **Transport Protocols & Traffic Analysis:** OSI 7-Layer Model vs TCP/IP 4-Layer Model, TCP 3-way handshake, TCP connection states (`LISTEN`, `ESTABLISHED`, `TIME_WAIT`), UDP stateless communication, Ports & Services (`22`, `80`, `443`, `6443`, `53`).
* **Security & Load Balancing:** HTTP/HTTPS, SSL/TLS Handshake, Certificate Authorities, Public/Private Keys, Firewalls (`iptables`, `nftables`, `ufw`), AWS Security Groups vs Network ACLs.
* **Diagnostic Toolkit:** `ping`, `traceroute`/`tracepath`, `nslookup`, `dig +trace`, `netstat`/`ss -tulpn`, `curl -iv`, `wget`, `ip addr`, `ip link`, `tcpdump -i any port 443 -w capture.pcap`.

---

### LEVEL 1 — Containers & Docker Engineering

* **Containerization vs Virtualization:** Type-1 & Type-2 Hypervisors vs OS-level virtualization. Kernel sharing, boot time, resource overhead, density comparison.
* **Linux Kernel Primitives:**
  * *Namespaces:* `PID` (process isolation), `NET` (network interfaces), `MNT` (mount points), `IPC` (inter-process communication), `UTS` (hostname), `USER` (UID mapping).
  * *Control Groups (cgroups v1/v2):* CPU shares/quotas, Memory limits, OOM Killer behavior.
  * *Union File Systems:* Overlay2 storage driver, read-only image layers, copy-on-write (CoW) writable container layer.
* **Container Lifecycle & OCI Standard:** Open Container Initiative (OCI), `containerd`, `runc`, `CRI-O`.
* **Dockerfile Deep Dive & Best Practices:** Multi-stage builds, base image optimization (Distroless vs Alpine), layer caching optimization, `.dockerignore`, running non-root users (`USER 1001`), `ENTRYPOINT` vs `CMD`.
* **Container Networking & Volumes:** Docker bridge network, host network, custom user-defined bridges, container port binding (`-p 8080:80`). Anonymous volumes, named volumes, bind mounts (`-v /host:/container`).
* **Docker Compose:** Multi-container orchestration, `docker-compose.yml` specification, service dependencies (`depends_on`), network aliases, environment files (`.env`).
* **Health Checks & Logs:** Docker `HEALTHCHECK` instruction, `docker logs --tail 100 -f`, JSON-file logging driver tuning.

---

### LEVEL 2 — Docker vs Docker Compose vs Kubernetes

#### 2.1 The Architectural Transition

```
Single Host (Docker) ──► Multi-Container Single Host (Docker Compose) ──► Multi-Host Distributed Enterprise Cluster (Kubernetes)
```

#### 2.2 Comparative Feature Analysis Matrix

| Feature | Docker Engine | Docker Compose | Kubernetes (K8s) |
| :--- | :--- | :--- | :--- |
| **Scope** | Single container execution | Multi-container on single host | Multi-host distributed cluster |
| **High Availability** | None (manual restart) | Single host failure point | Automatic self-healing & rescheduling |
| **Autoscaling** | Manual (`docker run`) | Manual (`scale service=N`) | Automatic (HPA, VPA, Karpenter) |
| **Service Discovery** | Host port binding | Internal DNS (Compose network) | Built-in DNS, Services, Ingress, Mesh |
| **Storage Management** | Local volumes / mounts | Local volumes | Dynamic PV/PVC provisioning via CSI |
| **Rolling Upgrades** | Manual container replacement | Manual restart of service | Zero-downtime RollingUpdate & Rollbacks |
| **State Management** | Ephemeral | Ephemeral | StatefulSets with persistent storage |

#### 2.3 Real-World Enterprise Scenario
* **Scenario:** Deploying 500 microservice containers across 50 physical servers.
* **Docker/Compose Failures:** Host 12 crashes (10 containers lost, manual intervention required); Host 04 CPU reaches 100% (no automated load rebalancing); secret keys stored in plaintext environment variables; traffic bursts require manual instance launching.
* **Kubernetes Resolution:** Control plane detects Host 12 failure via heartbeat timeout, automatically reschedules 10 Pods to healthy nodes; HPA scales Pods based on CPU/memory usage; Karpenter provisions new AWS EC2 nodes automatically; Secrets encrypted via etcd KMS.

---

### LEVEL 3 — Kubernetes Fundamentals & Ecosystem

* **What is Kubernetes?** Production-grade container orchestration engine originally built by Google (Borg project descendant), open-sourced in 2014, hosted by Cloud Native Computing Foundation (CNCF).
* **Core Philosophy:** Declarative state management vs Imperative execution.
* **Reconciliation Loop:** Desired State (YAML manifests stored in etcd) vs Actual State (Observed status from node agents) -> Controller Manager continuously reconciles differences.
* **Kubernetes API Architecture:** Everything is an API resource. RESTful endpoints, JSON/YAML payloads, versioning (`v1`, `apps/v1`, `networking.k8s.io/v1`).

---

### LEVEL 4 — Kubernetes Internal Architecture Deep Dive

#### 4.1 Architecture Diagram

```
                             ┌────────────────────────────────────────────────────────┐
                             │                    CONTROL PLANE                       │
                             │                                                        │
┌──────────────┐             │   ┌────────────────┐          ┌───────────────────┐    │
│   kubectl    ├────────────►│──►│ kube-apiserver │◄────────►│       etcd        │    │
└──────────────┘             │   └───────┬────────┘          └───────────────────┘    │
                             │           │                                            │
                             │           ├───────────────────┐                        │
                             │           ▼                   ▼                        │
                             │  ┌─────────────────┐ ┌─────────────────┐               │
                             │  │ kube-scheduler  │ │controller-mgr   │               │
                             │  └─────────────────┘ └─────────────────┘               │
                             └───────────┬────────────────────────────────────────────┘
                                         │
                                         │ gRPC / TLS (Port 10250)
                                         ▼
                             ┌────────────────────────────────────────────────────────┐
                             │                    WORKER NODE                         │
                             │                                                        │
                             │   ┌────────────────┐          ┌───────────────────┐    │
                             │   │    kubelet     │◄────────►│ Container Runtime │    │
                             │   └───────┬────────┘          │  (containerd)     │    │
                             │           │                   └─────────┬─────────┘    │
                             │           ▼                             ▼              │
                             │   ┌────────────────┐          ┌───────────────────┐    │
                             │   │   kube-proxy   │          │  Pods / Containers│    │
                             │   └────────────────┘          └───────────────────┘    │
                             │   (iptables/eBPF)                     │                │
                             │           │                           ▼                │
                             │           └─────────────────────► CNI Plugin           │
                             └────────────────────────────────────────────────────────┘
```

#### 4.2 Control Plane Components
* **`kube-apiserver`:** Exposes the API. Handles Authentication, Authorization (RBAC), Admission Control, Validation, and writes exclusively to `etcd`. Horizontal scaling ready.
* **`etcd`:** Distributed, consistent key-value store (Raft consensus algorithm). Stores all cluster state, object manifests, and secrets. Port `2379` (client) & `2380` (peer).
* **`kube-scheduler`:** Assigns unscheduled Pods to suitable nodes. 2-phase process: Filtering (Predicates) & Scoring (Priorities).
* **`kube-controller-manager`:** Runs core controllers in a single binary: Node Controller, ReplicaSet Controller, EndpointSlice Controller, ServiceAccount Controller.
* **`cloud-controller-manager` (CCM):** Interfaces with underlying cloud providers (AWS) for Node IP discovery, Route table creation, and ELB/ALB provisioning.

#### 4.3 Worker Node Components
* **`kubelet`:** Primary node daemon. Watches API Server for PodSpecs assigned to its node. Communicates with Container Runtime via Container Runtime Interface (CRI) over Unix domain sockets. Reports node health/status.
* **`kube-proxy`:** Network proxy running on each node. Implements Kubernetes Service abstraction by maintaining network rules (iptables, IPVS, or eBPF/Cilium) to route traffic to Pod backends.
* **Container Runtime:** `containerd` or `CRI-O`. Executes container images pulled from registries.
* **CNI & CSI Plugins:** Container Network Interface (Calico, AWS VPC CNI) for IP assignment; Container Storage Interface (AWS EBS CSI Driver) for volume mounting.

---

### LEVEL 5 — Kubernetes Cluster Installation & Bootstrap

#### 5.1 Local & Lab Environments
* **Minikube:** Single-node VM/Container installation. Best for quick local development.
* **Kind (Kubernetes in Docker):** Runs cluster nodes as Docker containers. Fast multi-node local simulation for CI testing.
* **Docker Desktop K8s:** Integrated single-node cluster for developers.

#### 5.2 Enterprise Production Installation (`kubeadm`)
* **Prerequisites Setup:** Linux kernel modules (`overlay`, `br_netfilter`), sysctl settings (`net.bridge.bridge-nf-call-iptables = 1`, `net.ipv4.ip_forward = 1`), Swap disabling (`swapoff -a`).
* **Container Runtime Bootstrap:** Installing `containerd`, generating default config, setting `SystemdCgroup = true`.
* **Control Plane Initialization:**
  ```bash
  sudo kubeadm init \
    --apiserver-advertise-address=10.0.1.10 \
    --pod-network-cidr=192.168.0.0/16 \
    --upload-certs
  ```
* **Kubeconfig Setup:** Copying `/etc/kubernetes/admin.conf` to `~/.kube/config`.
* **CNI Plugin Deployment:** Applying Calico CNI manifest (`kubectl apply -f calico.yaml`).
* **Worker Node Join:** Executing `kubeadm join 10.0.1.10:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>`.

---

### LEVEL 6 — `kubectl` Deep Dive & Request Processing Lifecycle

#### 6.1 `kubectl` Command Master Reference
* **Context & Namespace Control:**
  ```bash
  kubectl config get-contexts
  kubectl config use-context production-cluster
  kubectl config set-context --current --namespace=finance
  ```
* **Imperative vs Declarative Operations:**
  ```bash
  # Imperative
  kubectl run nginx --image=nginx:1.25 --port=80
  kubectl create deployment web --image=nginx:1.25 --replicas=3
  kubectl expose deployment web --type=ClusterIP --port=80
  
  # Declarative
  kubectl apply -f deployment.yaml
  kubectl diff -f deployment.yaml
  kubectl delete -f deployment.yaml
  ```
* **Debugging & Introspection:**
  ```bash
  kubectl get pods -o wide --show-labels
  kubectl describe pod <pod-name>
  kubectl logs -f <pod-name> -c <container-name> --tail=100
  kubectl exec -it <pod-name> -- /bin/sh
  kubectl port-forward pod/<pod-name> 8080:80
  kubectl top nodes / pods
  ```

#### 6.2 Internal Request Execution Sequence: `kubectl apply -f deployment.yaml`

```
1. Client Side (kubectl)
   └─ Parses YAML, validates client-side syntax, converts to JSON payload.
   └─ Reads ~/.kube/config (extracts API endpoint & client certificates/tokens).
   └─ Sends HTTP POST/PUT request to https://kube-apiserver:6443/apis/apps/v1/namespaces/default/deployments.

2. API Server Processing (kube-apiserver)
   ├─ Authentication: Validates client TLS certificate / Bearer token (X.509 / OIDC).
   ├─ Authorization: Checks RBAC policies (Can user "dev" "create" "deployments" in namespace "default"?).
   ├─ Mutating Admission Webhook: Injects defaults or sidecars (e.g., Istio sidecar injection).
   ├─ Object Schema Validation: Verifies field types against Kubernetes API schema.
   ├─ Validating Admission Webhook: Verifies security policies (e.g., Gatekeeper/Kyverno policies).
   └─ etcd Write: API server commits JSON payload to etcd path (/registry/deployments/default/my-app).

3. Controller Reconciliation (kube-controller-manager)
   ├─ Deployment Controller notices new Deployment object in etcd via API Watch stream.
   └─ Creates a ReplicaSet object targeting the specified label selector.
   ├─ ReplicaSet Controller notices new ReplicaSet object.
   └─ Creates N Pod objects with status "Pending" and no nodeName assigned.

4. Scheduling Phase (kube-scheduler)
   ├─ Scheduler watches for unassigned Pods (nodeName == "").
   ├─ Filters nodes (NodeResources, Taints/Tolerations, NodeAffinity).
   ├─ Scores remaining healthy nodes.
   └─ Binds Pod to selected node (Updates Pod object in etcd: nodeName = "node-02").

5. Execution Phase (kubelet on node-02)
   ├─ kubelet watches API server, detects Pod assigned to node-02.
   ├─ Calls CNI plugin to configure network namespace & assign IP address.
   ├─ Calls CSI plugin to attach & mount required persistent volumes.
   ├─ Calls CRI (containerd) via gRPC to pull container image and execute containers.
   └─ Reports Pod status = "Running" & Pod IP back to API server.
```

---

### LEVEL 7 — Kubernetes Core Objects Master Class

#### 7.1 Overview of Core Objects
* **Workloads:** Pod, ReplicaSet, Deployment, StatefulSet, DaemonSet, Job, CronJob.
* **Discovery & Networking:** Service (ClusterIP, NodePort, LoadBalancer, Headless), EndpointSlice, Ingress.
* **Config & Storage:** ConfigMap, Secret, PersistentVolume (PV), PersistentVolumeClaim (PVC), StorageClass.
* **Metadata & Governance:** Namespace, ResourceQuota, LimitRange, ServiceAccount, NetworkPolicy.

#### 7.2 Object Manifest Anatomy & Specification
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
    tier: frontend
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
      - name: nginx
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

---

### LEVEL 8 — Pod Engineering Deep Dive

#### 8.1 Pod Lifecycle & State Progression

```
[ Pod Scheduled ] ──► [ Init Containers Run ] ──► [ Main Containers Launch ] ──► [ Startup Probe ] 
                                                                                        │
                                                                                        ▼
[ Pod Terminated ] ◄── [ Readiness Probe (Traffic) ] ◄──► [ Liveness Probe (Health) ]
```

* **Pod Phases:** `Pending` (scheduling/image pulling), `Running` (at least 1 container running), `Succeeded` (all containers exited 0), `Failed` (container exited non-zero), `Unknown` (kubelet unreachable).

#### 8.2 Container Types & Patterns
* **Init Containers:** Run sequentially to completion before main app containers start. Used for database migrations, waiting for dependent services, or file preparation.
* **Sidecar Containers:** Auxiliary containers running alongside main application (e.g., Fluent Bit log forwarder, Vault agent, Envoy proxy).
* **Multi-Container Shared Resources:** Shared Network Namespace (localhost communication) & Shared Volumes (`emptyDir`).

#### 8.3 Health Probes (Liveness, Readiness, Startup)
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  tcpSocket:
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
startupProbe:
  httpGet:
    path: /started
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```
* **Liveness Probe Failure:** Kubelet kills container and applies `restartPolicy`.
* **Readiness Probe Failure:** Kubelet removes Pod IP from Service EndpointSlices (traffic stops).
* **Startup Probe:** Disables Liveness/Readiness probes until application completes slow startup.

#### 8.4 Resource Management & Quality of Service (QoS)
* **Resource Requests:** Minimum guaranteed CPU/Memory for scheduling.
* **Resource Limits:** Maximum allowed CPU/Memory usage.
  * CPU exceeded -> Throttled via cgroups.
  * Memory exceeded -> OOMKilled (Exit Code 137).
* **QoS Classes:**
  * **Guaranteed:** `requests == limits` for both CPU and Memory across all containers. (Lowest eviction priority).
  * **Burstable:** At least one container has requests set, but limits != requests.
  * **BestEffort:** No requests or limits specified. (First to be evicted under Node memory pressure).

---

### LEVEL 9 — Kubernetes Networking Architecture

#### 9.1 The Fundamental Network Rules
1. Every Pod receives a unique, routable IP address within the cluster.
2. Pods on any node can communicate with Pods on any other node without Network Address Translation (NAT).
3. Agents on a node (kubelet) can communicate with all Pods on that node.

#### 9.2 Service Discovery & Routing Mechanics
* **ClusterIP (Default):** Virtual IP accessible only within the cluster.
* **NodePort:** Exposes Service on each node's IP at a static port (`30000-32767`).
* **LoadBalancer:** Integrates with Cloud Provider (AWS ALB/NLB) to provision external load balancer pointing to NodePorts or direct Pod IPs.
* **Headless Service (`clusterIP: None`):** Returns A records containing direct Pod IPs via DNS. Used for StatefulSets.

#### 9.3 Packet Flow Diagram (Client to Pod via Load Balancer)

```
[ External Client ] ──► [ AWS ALB / NLB ] ──► [ Node IP : NodePort (31245) ]
                                                           │
                                                           ▼
                                                [ kube-proxy / iptables ]
                                                           │
                                                           ▼
                                            [ Pod IP (192.168.2.14) : 80 ]
```

#### 9.4 `kube-proxy` Engines
* **iptables Mode:** Sequential rule checking. High CPU usage at scale (>10,000 services).
* **IPVS Mode:** Hash table lookup (O(1) complexity). High performance for enterprise clusters.
* **eBPF (Cilium):** Bypass kernel network stack entirely. Direct socket lookup, kernel-level tracing, extreme throughput.

#### 9.5 Container Network Interfaces (CNI)
* **Calico:** BGP routing, VXLAN overlay, rich NetworkPolicy engine.
* **Cilium:** eBPF-powered CNI for high performance, dynamic security, and Hubble observability.
* **AWS VPC CNI:** Assigns real AWS VPC Secondary IPs directly to Pod ENIs. Native AWS routing performance.

#### 9.6 Network Policies (Firewall for Pods)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: secure-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

---

### LEVEL 10 — Kubernetes Storage Systems & AWS Integration

#### 10.1 Storage Architecture Abstraction

```
[ Pod ] ──► [ PersistentVolumeClaim (PVC) ] ──► [ StorageClass ] ──► [ CSI Driver ] ──► [ AWS EBS / EFS ]
                       │                                                    │
                       └──────────────(Binds to PV)◄────────────────────────┘
```

* **Ephemeral Storage:** `emptyDir` (wiped on Pod termination), `hostPath` (mounts node directory).
* **PersistentVolume (PV):** Cluster-scoped storage resource provisioned statically by admin or dynamically by StorageClass.
* **PersistentVolumeClaim (PVC):** Namespace-scoped request for storage by a user.
* **StorageClass:** Defines provisioner driver (`ebs.csi.aws.com`), parameters (`type: gp3`), and `reclaimPolicy` (`Delete` or `Retain`).
* **Access Modes:** `ReadWriteOnce` (RWO - single node mount, e.g. EBS), `ReadWriteMany` (RWX - multi-node mount, e.g. EFS), `ReadOnlyMany` (ROX).

---

### LEVEL 11 — Configuration, Secrets & External Secret Management

* **ConfigMaps:** Plaintext key-value pairs or configuration files injected as env vars or mounted files.
* **Secrets:** Base64 encoded sensitive objects (`Opaque`, `kubernetes.io/dockerconfigjson`, `kubernetes.io/tls`).
* **Security Limitation:** Native secrets are Base64 encoded ONLY—not encrypted unless etcd EncryptionAtRest is enabled.
* **Enterprise Secret Management Architecture:**
  * **External Secrets Operator (ESO):** Synchronizes secrets from AWS Secrets Manager / SSM Parameter Store into native Kubernetes Secrets.
  * **AWS Secrets Manager Integration:** IRSA-authenticated fetches, dynamic rotation support, KMS envelope encryption.

---

### LEVEL 12 — Advanced Workload Scheduling & Placement Controls

* **`nodeSelector`:** Simple key-value matching against node labels.
* **Node Affinity / Anti-Affinity:**
  * `requiredDuringSchedulingIgnoredDuringExecution` (Hard requirement).
  * `preferredDuringSchedulingIgnoredDuringExecution` (Soft weighting 1-100).
* **Pod Affinity / Anti-Affinity:** Rules based on labels of other Pods running on nodes (e.g., keep database replicas on separate nodes across zones).
* **Taints & Tolerations:**
  * *Taint (Node):* `kubectl taint nodes node-1 key=value:NoSchedule` (repels Pods).
  * *Toleration (Pod):* Allows Pod to be scheduled on tainted node.
  * Effects: `NoSchedule`, `PreferNoSchedule`, `NoExecute` (evicts existing non-tolerating Pods).
* **Topology Spread Constraints:** Distributes Pods evenly across Availability Zones or Racks:
  ```yaml
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: web
  ```

---

### LEVEL 13 — Deployments, Rollouts & Advanced Release Strategies

* **Deployment Strategies:**
  * **Recreate:** Terminates all old Pods before creating new ones (Downtime occurs).
  * **RollingUpdate:** Gradual replacement controlled by `maxSurge` (e.g., 25%) and `maxUnavailable` (e.g., 0%). Zero downtime.
* **Advanced Progressive Delivery:**
  * **Blue/Green Deployment:** Maintain two identical production environments; switch Service selector instantly.
  * **Canary Deployment:** Route 5% of live traffic to new version using Ingress / Service Mesh; analyze error metrics before scaling to 100%.
* **Rollout Commands:**
  ```bash
  kubectl rollout status deployment/web-app
  kubectl rollout history deployment/web-app
  kubectl rollout undo deployment/web-app --to-revision=2
  kubectl rollout pause / resume deployment/web-app
  ```

---

### LEVEL 14 — Kubernetes Autoscaling Ecosystem

#### 14.1 Pod Autoscaling
* **Horizontal Pod Autoscaler (HPA v2):** Scales Pod replica count based on CPU, Memory, or custom Prometheus metrics (e.g., HTTP request rate).
* **Vertical Pod Autoscaler (VPA):** Adjusts CPU/Memory requests and limits of existing Pods over time based on historical usage analysis.

#### 14.2 Node Autoscaling: Cluster Autoscaler vs Karpenter

```
                  ┌───────────────────────────────────────────────────────────┐
                  │                 KARPENTER ARCHITECTURE                    │
                  └─────────────────────────────────────────────────────────┬─┘
                                                                            │
   ┌──────────────────────┐      Watches Unschedulable      ┌───────────────▼─────────────┐
   │ Unschedulable Pod    ├────────────────────────────────►│ Karpenter Controller        │
   │ (Pending State)      │                                 └───────────────┬─────────────┘
   └──────────────────────┘                                                 │ Direct AWS EC2 API
                                                                            │ (No Node Groups)
                                                                            ▼
                                                            ┌─────────────────────────────┐
                                                            │ Just-In-Time Provisioned    │
                                                            │ EC2 Instance (Spot/On-Dem) │
                                                            └─────────────────────────────┘
```

| Metric / Capability | Cluster Autoscaler (CA) | Karpenter (Next-Gen AWS Native) |
| :--- | :--- | :--- |
| **Provisioning Speed** | Slow (3-5 minutes via Auto Scaling Groups) | Extremely Fast (30-45 seconds) |
| **Abstraction Level** | Requires managed ASGs / Node Groups | Direct EC2 API provisioning |
| **Node Selection** | Rigid node group matching | Dynamic instance selection (CPU/RAM/GPU/AZ/Spot) |
| **Consolidation & Bin-Packing**| Limited | Advanced automated node consolidation & termination |

---

### LEVEL 15 — Kubernetes Security, RBAC & Policy Enforcement

#### 15.1 Authentication vs Authorization
* **Authentication (Who are you?):** X.509 Client Certs, OIDC Tokens (Okta/Keycloak), AWS IAM Tokens.
* **Authorization (What can you do?):** Role-Based Access Control (RBAC).

#### 15.2 RBAC Objects & Mapping

| Scope | Permission Definition | Assignment Binding |
| :--- | :--- | :--- |
| **Namespace Scope** | `Role` (rules for specific namespace) | `RoleBinding` (binds Role to Subject in NS) |
| **Cluster Scope** | `ClusterRole` (cluster-wide rules) | `ClusterRoleBinding` (binds across all NS) |

#### 15.3 SecurityContext & Pod Security Standards (PSS)
* **Privilege Escalation Prevention:**
  ```yaml
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
      - ALL
  ```
* **Pod Security Standards (Admission Control):** `Privileged`, `Baseline`, `Restricted`.

#### 15.4 Policy Enforcement (Kyverno & OPA Gatekeeper)
* Mutating & Validating webhooks enforcing security rules (e.g., "Disallow latest image tag", "Require team cost-center label", "Block root containers").

---

### LEVEL 15.5 — Deep Dive: AWS IAM vs Kubernetes RBAC

#### Comparison Matrix

| Aspect | AWS IAM | Kubernetes RBAC |
| :--- | :--- | :--- |
| **Domain** | AWS Cloud Infrastructure Resources (EC2, S3, EKS API) | Inside Kubernetes API Resources (Pods, Services, PVCs) |
| **Identity Objects** | IAM User, IAM Role, IAM Group | ServiceAccount, User / Group (external identity string) |
| **Policy Definitions** | IAM Policy JSON (`Allow`/`Deny` Statements) | `Role` / `ClusterRole` YAML (`verbs`, `apiGroups`, `resources`) |
| **Binding Mechanism** | Attaching policy to IAM Role/User | `RoleBinding` / `ClusterRoleBinding` |

#### Authentication & Authorization Request Flow

```
[ Developer / CI-CD ] ──► `aws eks update-kubeconfig` ──► Authenticates with AWS IAM 
                                                                    │
                                                                    ▼
[ Bearer Token Generated ] ──► Sent to `kube-apiserver` ──► Validates Token via AWS IAM Authenticator
                                                                    │
                                                                    ▼
[ IAM Identity Mapped ] ──► Mapped to K8s User/Group via `aws-auth` ConfigMap or EKS Access Entries
                                                                    │
                                                                    ▼
[ K8s RBAC Check ] ──► Evaluates RoleBinding / ClusterRoleBinding ──► Access Granted / Denied
```

---

### LEVEL 16 — AWS Core Cloud Architecture for Kubernetes

* **AWS VPC Networking:** Public & Private Subnets, Route Tables, Internet Gateway (IGW), NAT Gateways (Multi-AZ setup), Elastic IPs.
* **AWS Security Infrastructure:** Security Groups (Stateful host-level firewalls), Network ACLs (Stateless subnet firewalls), AWS KMS (Customer Managed Keys).
* **AWS Storage Services:** EBS (Elastic Block Store - `gp3`), EFS (Elastic File System - NFS multi-attach shared storage), S3 (Object storage).
* **AWS Identity & Access:** IAM Roles, Policies, Trust Relationships, AssumeRole permissions.
* **AWS Application Delivery:** AWS Application Load Balancers (ALB - Layer 7 Path/Host routing), Network Load Balancers (NLB - Layer 4 high-throughput TCP/UDP), Route 53 DNS, AWS Certificate Manager (ACM TLS certs).

---

### LEVEL 17 — Amazon EKS (Elastic Kubernetes Service) Deep Dive

* **What is EKS?** AWS-managed control plane offering 99.95% SLA. AWS manages `kube-apiserver`, `etcd`, `scheduler`, and `controller-manager` across 3 Availability Zones.

#### EKS Shared Responsibility Matrix

| Component / Layer | AWS Managed Responsibility | Customer Managed Responsibility |
| :--- | :--- | :--- |
| **Control Plane (`etcd`, API Server)** | High Availability, Backups, Patching, Scaling | Access policies, API configuration |
| **Worker Nodes (EC2 / OS)** | EC2 hardware & AMI creation | OS Patching (if self-managed), Auto Scaling |
| **Managed Node Groups** | Automated node provisioning & drain | Node group scaling limits, instance types |
| **AWS Fargate for EKS** | Serverless node infrastructure & OS | Pod resource requests/limits |
| **Kubernetes Workloads** | None | Pods, Deployments, Secrets, Apps |
| **Network & Security** | VPC CNI plugin binary maintenance | Subnets, Security Groups, IAM RBAC mapping |

#### EKS Compute Options
1. **Managed Node Groups:** AWS handles EC2 lifecycle, OS updates, and graceful draining.
2. **Self-Managed Nodes:** Custom AMIs, specialized configurations.
3. **AWS Fargate:** Serverless execution environment (no EC2 management; 1 Pod per Fargate VM).
4. **Karpenter Provisioned Nodes:** Dynamic, high-speed EC2 provisioning.

#### Workload IAM Authentication: IRSA vs EKS Pod Identity
* **IAM Roles for Service Accounts (IRSA):** Uses OIDC Identity Provider + WebIdentity Token Projection.
* **EKS Pod Identity (New Standard):** Direct EKS Agent daemon set handling IAM credentials. Simplifies trust policies and supports cross-account roles natively.

---

### LEVEL 18 — EKS Advanced Networking & AWS Load Balancer Controller

#### 18.1 AWS VPC CNI Mechanics
* **Primary ENI:** Attached to EC2 Node for cluster communication.
* **Secondary ENIs & Secondary IPs:** VPC CNI allocates real Private Subnet IP addresses directly to Pods.
* **Prefix Delegation:** Enables allocating `/28` IP prefixes (16 IPs per slot) to overcome EC2 ENI limit constraints on smaller instances.

#### 18.2 AWS Load Balancer Controller (ALB / NLB Provisioning)

```
[ Ingress Manifest ] ──► [ AWS LB Controller ] ──► Calls AWS APIs ──► Provisions AWS ALB
                                │                                            │
                                └──────► TargetGroupBinding ─────────────────┘
                                                │
                                                ▼ (Direct Pod IP Routing)
                                  [ Pod 1 IP ]     [ Pod 2 IP ]
```

* **Target Binding Modes:**
  * `instance` mode: Routes traffic to NodePort -> kube-proxy -> Pod (Extra hop).
  * `ip` mode: Routes traffic directly from AWS ALB to Pod IPs via VPC CNI (Zero extra latency).

---

### LEVEL 19 — Version Control & Git Strategy for DevOps

* **Git Core Commands:** `git init`, `git clone`, `git branch`, `git checkout -b`, `git add`, `git commit -m`, `git push origin`, `git pull --rebase`, `git stash`, `git cherry-pick`.
* **Branching Strategies:**
  * **GitFlow:** `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`.
  * **Trunk-Based Development (Recommended for Cloud Native):** Developers commit small, frequent updates to a single `main` branch protected by feature flags and automated CI pipelines.
* **Pull Request (PR) Governance:** Code reviews, mandatory status checks, branch protection rules.

---

### LEVEL 20 — CI/CD Pipelines with Jenkins & Kubernetes

* **Jenkins Architecture on Kubernetes:** Jenkins Controller running as StatefulSet; dynamic Jenkins Agents launched as ephemeral Kubernetes Pods on-demand.
* **Declarative Pipeline (`Jenkinsfile`) Structure:**
  ```groovy
  pipeline {
      agent {
          kubernetes {
              yaml '''
  apiVersion: v1
  kind: Pod
  spec:
    containers:
    - name: maven
      image: maven:3.9-eclipse-temurin-17
      command: ['cat']
      tty: true
    - name: kaniko
      image: gcr.io/kaniko-project/executor:debug
      command: ['cat']
      tty: true
  '''
          }
      }
      stages {
          stage('Build & Test') {
              steps {
                  container('maven') {
                      sh 'mvn clean package'
                  }
              }
          }
          stage('Docker Build & Push (Kaniko)') {
              steps {
                  container('kaniko') {
                      sh '/kaniko/executor --context=. --dockerfile=Dockerfile --destination=123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:${BUILD_NUMBER}'
                  }
              }
          }
      }
  }
  ```

---

### LEVEL 21 — Infrastructure as Code (Terraform + AWS EKS)

* **Terraform Fundamentals:** HCL syntax, Providers (`aws`, `kubernetes`, `helm`), Resources, Data Sources, Variables, Outputs.
* **State Management:** Remote S3 Backend + DynamoDB state locking table (`terraform_locks.hash`).
* **Modular Infrastructure Provisioning:**
  ```
  terraform-eks-project/
  ├── main.tf
  ├── variables.tf
  ├── outputs.tf
  ├── terraform.tfvars
  └── modules/
      ├── vpc/
      ├── eks/
      └── irsa/
  ```
* **Provisioning EKS Cluster via Terraform:**
  * VPC Module (Public/Private Subnets, NAT Gateways, VPC tags `kubernetes.io/role/elb = 1`).
  * EKS Module (`aws_eks_cluster`, `aws_eks_node_group`, OIDC provider enablement).
  * Helm Provider integration to auto-install AWS Load Balancer Controller and Metrics Server.

---

### LEVEL 22 — Production DevSecOps Pipeline Architecture

```
[ Developer Git Push ]
        │
        ▼
[ GitHub / GitLab Webhook ]
        │
        ▼
[ Jenkins Pipeline Execution ]
        ├─► Stage 1: SAST Code Analysis (SonarQube)
        ├─► Stage 2: Software Bill of Materials & Dependency Scan (Dependency-Check)
        ├─► Stage 3: Container Build (Kaniko - Daemonless Rootless Build)
        ├─► Stage 4: Container Vulnerability Scan (Trivy / Grype)
        │      └─► (Fails build if Critical CVEs found)
        ├─► Stage 5: Push Signed Image to AWS ECR (Cosign Signing)
        ├─► Stage 6: Update GitOps Repository Manifests (Image Tag Update)
        └─► Stage 7: Automated Slack / Teams Notification
```

---

### LEVEL 23 — Helm Package Manager for Kubernetes

* **Helm Concepts:** Chart (Package), Repository, Release (Installed instance), `values.yaml` (Configuration interface).
* **Helm Chart Directory Structure:**
  ```
  my-chart/
  ├── Chart.yaml
  ├── values.yaml
  ├── templates/
  │   ├── _helpers.tpl
  │   ├── deployment.yaml
  │   ├── service.yaml
  │   ├── ingress.yaml
  │   └── NOTES.txt
  └── charts/
  ```
* **Templating Engine (Go Templates):** Functions (`quote`, `upper`, `toYaml`), Conditionals (`if/else`), Loops (`range`), Variables (`.Values.image.repository`, `.Release.Name`).
* **Helm Commands:** `helm create`, `helm lint`, `helm template .`, `helm install my-app ./my-chart -f values-prod.yaml`, `helm upgrade`, `helm rollback my-app 1`, `helm list`.

---

### LEVEL 24 — GitOps Architecture with Argo CD

* **GitOps Core Principles:**
  1. The entire system is described declaratively.
  2. The desired system state is versioned in Git.
  3. Approved changes are automatically applied to the cluster.
  4. Software agents continuously ensure state correctness and reconcile drift.

```
┌─────────────┐   Git Push   ┌────────────────┐   Sync / Reconcile   ┌─────────────────┐
│ Git Repo    ├─────────────►│ Argo CD        ├─────────────────────►│ Amazon EKS      │
│ (Manifests) │              │ Controller     │                      │ Cluster         │
└─────────────┘              └───────┬────────┘                      └─────────────────┘
                                     │
                                     └────── Monitors Drift ◄─────────┘
```

* **Argo CD Application Custom Resource Definition (CRD):**
  ```yaml
  apiVersion: argoproj.io/v1alpha1
  kind: Application
  metadata:
    name: production-microservices
    namespace: argocd
  spec:
    project: default
    source:
      repoURL: https://github.com/enterprise/k8s-manifests.git
      targetRevision: HEAD
      path: environments/production
    destination:
      server: https://kubernetes.default.svc
      namespace: production
    syncPolicy:
      automated:
        prune: true
        selfHeal: true
  ```
* **App-of-Apps Pattern & Multi-Cluster Deployment.**

---

### LEVEL 25 — Monitoring, Logging & Observability (The 3 Pillars)

```
                              ┌───────────────────────────────────┐
                              │    ENTERPRISE OBSERVABILITY       │
                              └─────────────────┬─────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│     METRICS      │                  │      LOGS        │                  │     TRACES       │
│  (Prometheus)    │                  │  (Fluent Bit)    │                  │ (OpenTelemetry)  │
└────────┬─────────┘                  └────────┬─────────┘                  └────────┬─────────┘
         │                                     │                                     │
         ▼                                     ▼                                     ▼
 [Grafana Dashboards]                  [OpenSearch / Loki]                    [Jaeger / Tempo]
```

* **Metrics (Prometheus & Grafana):**
  * **Prometheus Architecture:** Time-series database, pull-model scraper, PromQL query language, Alertmanager routing.
  * **Exporters:** `node-exporter` (host metrics), `kube-state-metrics` (Kubernetes object state), CoreDNS metrics.
  * **Prometheus Operator:** ServiceMonitor and PodMonitor CRDs.
* **Logging (Fluent Bit & Vector):**
  * DaemonSet deployment collecting container log streams (`/var/log/pods/*`), parsing JSON, enriching with K8s metadata (Namespace, Pod name, Container name), forwarding to OpenSearch / Loki.
* **Tracing (OpenTelemetry & Jaeger):**
  * Context propagation across microservice HTTP/gRPC boundaries to visualize end-to-end request latencies and bottleneck tracing.

---

### LEVEL 26 — AWS Native Observability & Auditing

* **Amazon CloudWatch Container Insights:** Automated metric and log collection for EKS via AWS Distro for OpenTelemetry (ADOT) or CloudWatch Agent.
* **EKS Control Plane Logging:** Enabling API server, audit, authenticator, controller manager, and scheduler logs to CloudWatch Log Groups.
* **AWS CloudTrail Integration:** Auditing AWS API calls made by EKS service roles, IRSA roles, and IAM users.
* **VPC Flow Logs:** Capturing IP traffic flows on network interfaces in the EKS VPC for security and network troubleshooting.

---

### LEVEL 27 — Production Operations, Upgrades & Cluster Lifecycle

* **EKS In-Place Upgrades Strategy:** Upgrading Control Plane (N -> N+1) via EKS API; updating `kubelet`, `kubectl`, and default add-ons (`vpc-cni`, `kube-proxy`, `coredns`).
* **Node Group Rolling Updates:**
  1. Launch new node group with updated AMI / K8s version.
  2. `kubectl cordon <old-node>` (marks node as unschedulable).
  3. `kubectl drain <old-node> --ignore-daemonsets --delete-emptydir-data` (evicts Pods gracefully).
  4. Terminate old node group.
* **Certificate Management:** Automated TLS certificate issuance and renewal via Cert-Manager + Let's Encrypt / AWS Private CA.
* **Chaos Engineering:** Injecting node failures, network latency, and Pod terminations using LitmusChaos to validate self-healing capabilities.

---

### LEVEL 28 — Backup, Disaster Recovery & High Availability

* **Disaster Recovery Metrics:**
  * **RTO (Recovery Time Objective):** Maximum acceptable duration of cluster downtime.
  * **RPO (Recovery Point Objective):** Maximum acceptable data loss duration.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               VELERO DISASTER RECOVERY                                 │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
┌─────────────────────────────┐                           ┌─────────────────────────────┐
│ Kubernetes API Metadata     │                           │ Persistent Volume Data      │
│ (Deployments, Secrets, PVCs)│                           │ (AWS EBS Snapshots via CSI) │
└──────────────┬──────────────┘                           └──────────────┬──────────────┘
               │                                                         │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            ▼ (Encrypted TLS Transmission)
                              ┌──────────────────────────┐
                              │  AWS S3 Bucket (Backup)  │
                              └──────────────────────────┘
```

* **Cluster State Backup (Velero):**
  * Velero CLI schedules daily backups of cluster CRDs, namespaces, secrets, and PV snapshots to an S3 bucket in a secondary AWS region.
  * **Cross-Region DR Execution:** Provision secondary EKS cluster via Terraform in region `us-west-2` -> Run `velero restore create --from-backup prod-backup`.

---

### LEVEL 29 — Systematic Kubernetes Troubleshooting Methodology

#### 29.1 The Diagnostic Flowchart

```
                          [ Issue Reported ]
                                  │
                                  ▼
                     [ Run: kubectl get pods -A ]
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
  [ Status: Pending ]     [ Status: CrashLoop ]     [ Status: Evicted ]
         │                        │                        │
         ▼                        ▼                        ▼
Check Node Resources     Inspect Pod Logs         Check Node Disk Space
 & Taints/Affinity       (`kubectl logs`)          & Resource Limits
         │                        │                        │
         ▼                        ▼                        ▼
`kubectl describe pod`   Check Exit Code          Check Node Pressures
 (Inspect Events)        (Exit 137 = OOMKilled)   (`kubectl describe node`)
```

#### 29.2 Common Pod Failures & Resolution Matrix

| Symptom | Root Cause | Diagnostic Command | Resolution |
| :--- | :--- | :--- | :--- |
| `Pending` | Insufficient CPU/Memory, Taints, No Node matching `nodeSelector` | `kubectl describe pod <name>` (Events section) | Add cluster capacity, adjust resource requests, fix node labels/tolerations. |
| `CrashLoopBackOff` | Application crash, missing config, failed DB connection | `kubectl logs <name> --previous` | Fix app bugs, supply missing ConfigMaps/Secrets, fix DB endpoints. |
| `ImagePullBackOff` | Incorrect image tag, private registry auth failure | `kubectl describe pod <name>` | Fix image name, verify ECR IAM permissions, create `imagePullSecrets`. |
| `OOMKilled` (Exit 137) | Container memory usage exceeded `limits.memory` | `kubectl get pod <name> -o yaml` | Increase memory limit in PodSpec or fix app memory leaks. |
| `Terminating` (Stuck) | Finalizers blocking deletion, un-mountable volume | `kubectl get pod <name> -o json` | Remove blocking finalizer or force detach storage volume. |

---

### LEVEL 30 — Real-World Production Incident Scenarios

#### Incident Scenario 1: AWS Load Balancer Returns 502 Bad Gateway
* **Symptoms:** Live website throws HTTP 502.
* **Diagnostic Steps:**
  1. Check AWS ALB Target Group health via AWS Console / CLI -> Target instances marked `Unhealthy`.
  2. Inspect AWS Load Balancer Controller logs: `kubectl logs -n kube-system deployment/aws-load-balancer-controller`.
  3. Verify Pod Readiness Probes: `kubectl describe pod <backend-pod>`.
* **Root Cause:** Backend Pod application port changed from `8080` to `8000`, causing readiness probe failures and target group deregistration.
* **Resolution:** Update container `readinessProbe` target port to `8000` and re-apply manifest.

#### Incident Scenario 2: VPC CNI IP Exhaustion Causes Pending Pods
* **Symptoms:** Newly deployed microservice Pods remain stuck in `Pending` state despite nodes having 80% free CPU/Memory.
* **Diagnostic Steps:**
  1. `kubectl describe pod` shows `FailedCreatePodSandBox: CNI plugin failed to allocate IP address`.
  2. Check subnet IP usage in AWS VPC Console -> Subnet has 0 available IP addresses.
* **Root Cause:** VPC Subnet `/24` prefix ran out of available IPs due to high Pod density per node.
* **Resolution:** Enable VPC CNI Prefix Delegation (`ENABLE_PREFIX_DELEGATION=true`) or attach a secondary CIDR block (`100.64.0.0/16`) to the EKS VPC.

---

### LEVEL 31 — Kubernetes Architect Level: Enterprise Design Principles

* **Multi-Account AWS Landing Zone Strategy:** Separate AWS Accounts for `Control-Tower`, `Shared-Services` (Jenkins, ECR, Argo CD), `Development`, `Staging`, and `Production`.
* **Namespace Isolation vs Virtual Clusters (vCluster):**
  * **Hard Multi-Tenancy:** Separate EKS clusters per business unit.
  * **Soft Multi-Tenancy:** Shared cluster isolated via Namespaces, RBAC, NetworkPolicies, and ResourceQuotas.
  * **Virtual Clusters (vCluster):** Runs lightweight nested control planes inside a host Kubernetes cluster for true control plane isolation.
* **Multi-Region Active-Active / Active-Passive Architecture:** Route 53 Latency-Based / Failover DNS routing traffic between `us-east-1` and `us-west-2` EKS clusters backed by AWS Aurora Global Databases.

---

### LEVEL 32 — Enterprise Reference Architecture Diagram

```
                                    [ USERS / CLIENTS ]
                                             │
                                             ▼
                                    [ AWS Route 53 DNS ]
                                             │
                                             ▼
                                   [ AWS CloudFront CDN ]
                                             │
                                             ▼
                                      [ AWS WAF ]
                                             │
                                             ▼
                               [ AWS Application Load Balancer ]
                                             │
       ┌─────────────────────────────────────┴─────────────────────────────────────┐
       │ (Availability Zone A)                                                     │ (Availability Zone B)
       ▼                                                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        AMAZON EKS VPC (10.0.0.0/16)                                    │
│                                                                                                        │
│   ┌─────────────────────────────────────────┐             ┌─────────────────────────────────────────┐  │
│   │ Private Subnet A (10.0.1.0/24)          │             │ Private Subnet B (10.0.2.0/24)          │  │
│   │                                         │             │                                         │  │
│   │  ┌───────────────────────────────────┐  │             │  ┌───────────────────────────────────┐  │  │
│   │  │ Node 01 (AWS EC2 / Karpenter)    │  │  AWS VPC    │  │ Node 02 (AWS EC2 / Karpenter)    │  │  │
│   │  │                                   │  │  CNI        │  │                                   │  │  │
│   │  │  ┌─────────────┐ ┌─────────────┐  │  │ ◄─────────► │  │  ┌─────────────┐ ┌─────────────┐  │  │  │
│   │  │  │ Ingress Pod │ │ Frontend Pod│  │  │ Direct IP   │  │  │ Frontend Pod│ │ Backend Pod │  │  │  │
│   │  │  └──────┬──────┘ └──────┬──────┘  │  │             │  │  └──────┬──────┘ └──────┬──────┘  │  │  │
│   │  └─────────┼───────────────┼─────────┘             └─────────┼───────────────┼─────────┘  │
│   └────────────┼───────────────┼─────────────────────────────────┼───────────────┼────────────┘  │
│                │               │                                 │               │               │
└────────────────┼───────────────┼─────────────────────────────────┼───────────────┼───────────────┘
                 │               │                                 │               │
                 ▼               ▼                                 ▼               ▼
         ┌───────────────┐ ┌───────────────┐               ┌───────────────┐ ┌───────────────┐
         │ AWS Secrets   │ │ AWS EBS (gp3) │               │ AWS EFS (RWX) │ │ Amazon Aurora │
         │ Manager / KMS │ │ Volume (CSI)  │               │ Shared Volume │ │ PostgreSQL DB │
         └───────────────┘ └───────────────┘               └───────────────┘ └───────────────┘
```

---

### LEVEL 33 — Master Interview Question Bank

#### Category 1: Beginner Level (Sample Blueprint)
* **Q: What is the difference between a Pod and a Container?**
  * *Expected Answer:* A container is a single isolated process running on an OS kernel. A Pod is the smallest deployable unit in Kubernetes that encapsulates one or more containers sharing the same storage volumes, network namespace, and IP address.
* **Q: What is the function of `etcd` in Kubernetes?**
  * *Expected Answer:* `etcd` is a strongly consistent, distributed key-value store used to save all cluster state data, configuration settings, and object metadata.

#### Category 2: Production Troubleshooting (Sample Blueprint)
* **Q: A Pod is stuck in `CrashLoopBackOff` with Exit Code 137. What happened and how do you fix it?**
  * *Expected Answer:* Exit Code 137 signifies that the container was terminated by the Linux Out-Of-Memory (OOM) Killer because its memory usage exceeded the configured `limits.memory`. Fix: Inspect application memory leaks using profilers, or increase the `limits.memory` value in the PodSpec.

#### Category 3: AWS EKS & Enterprise Architecture (Sample Blueprint)
* **Q: How does IRSA (IAM Roles for Service Accounts) securely provide AWS permissions to a Pod?**
  * *Expected Answer:* IRSA leverages an OpenID Connect (OIDC) identity provider associated with the EKS cluster. The API server projects an OIDC JSON Web Token (JWT) into the Pod volume. The AWS SDK inside the container exchanges this token with AWS STS (`AssumeRoleWithWebIdentity`) to retrieve temporary AWS IAM credentials.

---

### LEVEL 34 — "What Happens When..." Request Flow Masterclass

#### 34.1 Scenario: "What happens internally when a Pod requests AWS IAM permissions via IRSA?"

```
1. Pod Spec Definition
   └─ ServiceAccount specified: `serviceAccountName: backend-sa`.
   └─ ServiceAccount annotated: `eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/s3-reader`.

2. Mutating Pod Admission Webhook (EKS Control Plane)
   ├─ Detects annotation on ServiceAccount.
   ├─ Injects environment variables into container:
   │    AWS_ROLE_ARN=arn:aws:iam::123456789012:role/s3-reader
   │    AWS_WEB_IDENTITY_TOKEN_FILE=/var/run/secrets/eks.amazonaws.com/serviceaccount/token
   └─ Mounts Projected Volume containing signed OIDC JWT token file.

3. Application SDK Execution (Inside Container)
   ├─ Application invokes AWS SDK (e.g., `boto3.client('s3')`).
   ├─ SDK reads `AWS_WEB_IDENTITY_TOKEN_FILE` and `AWS_ROLE_ARN`.
   └─ Sends HTTPS request to AWS STS API: `AssumeRoleWithWebIdentity`.

4. AWS STS Validation & Token Exchange
   ├─ AWS STS verifies signature of JWT against EKS Cluster OIDC Issuer URL.
   ├─ Validates IAM Role Trust Policy (Subject matches `system:serviceaccount:default:backend-sa`).
   └─ Returns temporary AWS Access Key, Secret Key, and Session Token to SDK.

5. Resource Access
   └─ Container authenticates to Amazon S3 using temporary credentials.
```

---

### LEVEL 35 — Comprehensive Hands-On Lab Manual

#### Lab 35.1: Zero-Downtime Rolling Update & Automated Rollback
* **Objective:** Deploy an application, perform a rolling update to a broken image, observe failed health probes, and execute an instant rollback.
* **Commands:**
  ```bash
  # Step 1: Deploy initial version v1
  kubectl create deployment web-test --image=nginx:1.24 --replicas=4
  kubectl expose deployment web-test --port=80 --type=ClusterIP

  # Step 2: Trigger update to non-existent image v2
  kubectl set image deployment/web-test nginx=nginx:1.9999

  # Step 3: Monitor failed rollout
  kubectl rollout status deployment/web-test

  # Step 4: Undo rollout
  kubectl rollout undo deployment/web-test
  ```

#### Lab 35.2: Provisioning an EKS Cluster with Terraform & Karpenter
* **Objective:** Write modular Terraform code to provision an EKS cluster and deploy Karpenter for auto-scaling.

---

### LEVEL 36 — Capstone Projects

#### Capstone Project 1: Three-Tier Microservice Deployment on Kubernetes
* **Architecture:** React Frontend -> Node.js API Gateway -> Java Microservices -> PostgreSQL StatefulSet with PV/PVC and ConfigMaps/Secrets.

#### Capstone Project 2: Production DevSecOps EKS Pipeline
* **Architecture:** Enterprise GitHub repo -> Jenkins Agent on EKS -> SonarQube -> Trivy Container Scanner -> AWS ECR -> Helm Chart Deployment to EKS via Argo CD GitOps -> Prometheus/Grafana Alerting.

#### Capstone Project 3: Highly Available Enterprise Multi-AZ EKS Platform
* **Architecture:** Complete execution of Level 32 Reference Architecture utilizing Terraform, AWS ALB Controller, IRSA, External Secrets, Velero DR, Karpenter, and Cilium eBPF CNI.

---

## 4. Industry Skills Matrix

| Skill Domain | Beginner Level | Intermediate Level | Advanced Level | Architect Level |
| :--- | :--- | :--- | :--- | :--- |
| **Linux & Networking** | Basic CLI, File Perms, DNS | Systemd, sysctl, `tcpdump` | Kernel tuning, Overlay network | Network Architecture |
| **Docker & Containers**| Dockerfile, `docker run` | Multi-stage, Docker Compose | OCI Runtimes, Custom base imgs | Enterprise Image Security |
| **Kubernetes Core** | Pods, Deployments, Services | PV/PVC, ConfigMaps, Probes | CRDs, Custom Controllers | API Architecture |
| **Kubernetes Security**| Namespaces, Basic RBAC | PodSecurityStandards, NetworkPolicy | Kyverno, Falco runtime sec | Zero-Trust Architecture |
| **AWS & EKS** | EC2, VPC basics, IAM | Managed Node Groups, ECR | IRSA, VPC CNI, Karpenter | Multi-Region Active-Active |
| **DevOps & IaC** | Git basic, Jenkins jobs | Terraform modules, Helm | Argo CD GitOps, DevSecOps | Enterprise IDP Design |
| **Observability** | Basic `kubectl logs` | Prometheus & Grafana setup | OpenTelemetry Tracing | Enterprise SLO/SLI Platform|

---

## 5. Interview Readiness Matrix

| Targeted Job Role | Primary Module Focus | Critical Skill Verification |
| :--- | :--- | :--- |
| **Fresher / Junior DevOps** | Levels 0, 1, 3, 5, 6, 7, 19 | Linux CLI, Dockerfile creation, basic `kubectl` operations. |
| **Kubernetes Administrator (CKA)**| Levels 4, 5, 8, 9, 10, 12, 27, 29 | Cluster bootstrap (`kubeadm`), Troubleshooting, RBAC, CNI/CSI. |
| **DevOps / Cloud Engineer** | Levels 14, 16, 17, 20, 21, 22, 23 | EKS, Terraform, Jenkins DevSecOps, Helm, Autoscaling. |
| **Senior DevOps / Platform Eng**| Levels 15, 18, 24, 25, 26, 28, 30 | GitOps (Argo CD), Observability, Incident Management, Velero DR. |
| **Cloud / Kubernetes Architect** | Levels 14.2, 15.5, 31, 32, 34, 36 | Karpenter, Enterprise Ref Arch, FinOps, Multi-Cluster DR design. |

---

## 6. Final Job-Readiness Checklist

- [ ] Can explain Linux Kernel Namespaces & cgroups from first principles.
- [ ] Able to write optimized, secure multi-stage Dockerfiles.
- [ ] Understand `kubectl apply` internal request lifecycle through API Server, Admission Webhooks, etcd, Scheduler, and Kubelet.
- [ ] Proficient in writing Kubernetes YAML manifests for all core workload objects.
- [ ] Understand Kubernetes networking packet flow across Pods, Nodes, iptables/eBPF, and Load Balancers.
- [ ] Able to configure persistent storage using PV, PVC, StorageClass, and AWS EBS/EFS CSI drivers.
- [ ] Master advanced scheduling techniques (Taints, Tolerations, Affinity, TopologySpreadConstraints).
- [ ] Deeply understand Kubernetes RBAC and AWS IRSA / Pod Identity integration.
- [ ] Capable of provisioning an production-ready EKS cluster using Terraform modules.
- [ ] Able to build a complete DevSecOps pipeline with SonarQube, Trivy, Kaniko, ECR, and Jenkins.
- [ ] Proficient in package management with Helm and GitOps continuous delivery with Argo CD.
- [ ] Capable of deploying and configuring Prometheus Operator, Grafana, and Fluent Bit on EKS.
- [ ] Demonstrate systematic troubleshooting methodology for Pod CrashLoopBackOff, Pending, and OOMKilled states.
- [ ] Can design a multi-AZ highly available enterprise cloud native architecture on AWS EKS.
