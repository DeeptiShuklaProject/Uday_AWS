# Level 9 — Kubernetes Networking Deep Dive

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate → Advanced |
| **Theory Duration** | 10 hours |
| **Practical Duration** | 8 hours |
| **Prerequisites** | Level 8 — Pods Deep Dive |
| **Lab Required** | Yes — Multi-node cluster recommended |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Most complex and heavily tested topic |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKA (Services & Networking — 20%), CKAD, CKS |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain the Kubernetes networking model and its four fundamental requirements.
2. Describe Pod-to-Pod, Pod-to-Service, and external-to-Service traffic flows.
3. Compare kube-proxy modes (iptables, IPVS, eBPF).
4. Understand CNI plugins (Calico, Cilium, AWS VPC CNI) and their differences.
5. Configure CoreDNS and debug DNS resolution issues.
6. Write and apply NetworkPolicies for Pod-to-Pod traffic control.
7. Configure Ingress Controllers for HTTP routing.
8. Understand the Gateway API as the next-generation Ingress.

---

## 1. The Kubernetes Networking Model

### 1.1 Four Fundamental Requirements

Kubernetes imposes these networking rules on any implementation:

| Requirement | Description |
| :--- | :--- |
| **Pod-to-Pod** | Every Pod can communicate with every other Pod without NAT |
| **Node-to-Pod** | Every Node can communicate with every Pod without NAT |
| **Pod IP identity** | The IP a Pod sees for itself is the same IP others see for it |
| **Service abstraction** | Services provide stable virtual IPs for dynamic Pod sets |

**Key Rule:** Kubernetes does NOT implement networking itself. It defines the model and delegates implementation to **CNI plugins**.

### 1.2 IP Address Allocation

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Kubernetes IP Address Spaces                          │
│                                                                          │
│  1. Node Network (Host IPs):                                            │
│     10.0.1.10 (master), 10.0.1.11 (worker-1), 10.0.1.12 (worker-2)    │
│     → Physical/VM network. Assigned by cloud provider or DHCP.          │
│                                                                          │
│  2. Pod Network (Pod CIDR):                                              │
│     192.168.0.0/16 (Calico default) or 10.0.0.0/16 (VPC CNI)          │
│     → Each Pod gets a unique IP from this range.                        │
│     → Each Node gets a /24 subnet (e.g., 192.168.1.0/24 for node-1)   │
│                                                                          │
│  3. Service Network (Service CIDR):                                      │
│     10.96.0.0/12 (default range)                                        │
│     → Virtual IPs (ClusterIPs) assigned to Services.                    │
│     → These IPs exist ONLY in iptables/IPVS rules — no real interface. │
│                                                                          │
│  4. DNS:                                                                 │
│     CoreDNS ClusterIP: 10.96.0.10 (configured in Pod /etc/resolv.conf) │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pod-to-Pod Communication

### 2.1 Same-Node Communication

```
┌─────────────────────────────────────────────────┐
│               Worker Node 1                      │
│                                                  │
│  ┌──────────────┐        ┌──────────────┐       │
│  │   Pod A       │        │   Pod B       │       │
│  │ 192.168.1.10  │        │ 192.168.1.11  │       │
│  │   eth0        │        │   eth0        │       │
│  └──────┬───────┘        └──────┬───────┘       │
│         │                       │                │
│         └───────────┬───────────┘                │
│                     │                            │
│              ┌──────▼──────┐                     │
│              │ Virtual     │                     │
│              │ Bridge      │                     │
│              │ (cbr0/cni0) │                     │
│              └──────┬──────┘                     │
│                     │                            │
│              ┌──────▼──────┐                     │
│              │   eth0      │                     │
│              │ 10.0.1.11   │                     │
│              └─────────────┘                     │
└─────────────────────────────────────────────────┘

Traffic: Pod A (192.168.1.10) → Pod B (192.168.1.11)
Route: Pod A eth0 → veth pair → bridge (cbr0) → veth pair → Pod B eth0
→ Stays within the node kernel. Very fast.
```

### 2.2 Cross-Node Communication

```
┌──────────────────────┐                 ┌──────────────────────┐
│    Worker Node 1     │                 │    Worker Node 2     │
│                      │                 │                      │
│  ┌────────────────┐  │                 │  ┌────────────────┐  │
│  │   Pod A         │  │                 │  │   Pod C         │  │
│  │ 192.168.1.10    │  │                 │  │ 192.168.2.20    │  │
│  └───────┬────────┘  │                 │  └───────┬────────┘  │
│          │            │                 │          │            │
│   ┌──────▼──────┐    │                 │   ┌──────▼──────┐    │
│   │   Bridge    │    │                 │   │   Bridge    │    │
│   └──────┬──────┘    │                 │   └──────┬──────┘    │
│          │            │                 │          │            │
│   ┌──────▼──────┐    │   VXLAN/IPIP/  │   ┌──────▼──────┐    │
│   │   eth0      │────│───BGP tunnel───│───│   eth0      │    │
│   │ 10.0.1.11   │    │                 │   │ 10.0.1.12   │    │
│   └─────────────┘    │                 │   └─────────────┘    │
└──────────────────────┘                 └──────────────────────┘

Traffic: Pod A (192.168.1.10) → Pod C (192.168.2.20)
Route: Pod A → bridge → encapsulate (VXLAN/IPIP) → Node 1 eth0
       → Network → Node 2 eth0 → decapsulate → bridge → Pod C

Encapsulation methods:
  VXLAN: Wraps L2 frame in UDP packet. Default for Calico on cloud.
  IPIP:  Wraps L3 packet in another IP packet. Lower overhead.
  BGP:   No encapsulation (direct routing). Best for bare metal.
  AWS VPC CNI: No overlay — Pods use real VPC IPs from ENI secondary addresses.
```

---

## 3. CNI Plugins Comparison

| Feature | Calico | Cilium | AWS VPC CNI |
| :--- | :--- | :--- | :--- |
| **Overlay** | VXLAN, IPIP, BGP | VXLAN, native routing | None (native VPC IPs) |
| **Technology** | iptables/eBPF | eBPF (kernel-level) | AWS ENI + secondary IPs |
| **NetworkPolicy** | Yes (rich rules) | Yes (L3/L4/L7 with eBPF) | Calico on EKS (separate) |
| **Performance** | Good (excellent with eBPF mode) | Excellent (eBPF bypasses iptables) | Excellent (no overlay) |
| **Pod IPs** | From Pod CIDR (overlay) | From Pod CIDR or native | From VPC subnet (real IPs) |
| **Best For** | General-purpose, multi-cloud | High-performance, advanced security | AWS EKS (native integration) |
| **Observability** | Basic | Hubble (L7 visibility) | VPC Flow Logs |

---

## 4. Service Networking (kube-proxy)

### 4.1 How ClusterIP Works

```
Client Pod (10.0.1.50) → Service ClusterIP (10.96.0.100:80) → Backend Pod (10.0.2.60:8080)

1. Client Pod sends packet to 10.96.0.100:80
2. Packet hits iptables rules installed by kube-proxy on the node
3. iptables performs DNAT:
   - Original destination: 10.96.0.100:80
   - Rewritten destination: 10.0.2.60:8080 (randomly selected backend Pod)
4. Packet routed via CNI to backend Pod
5. Response follows the reverse path (conntrack remembers the mapping)

NOTE: ClusterIP 10.96.0.100 does NOT exist as a real interface.
      It exists ONLY as an iptables/IPVS rule. You cannot ping it.
```

### 4.2 kube-proxy Modes Comparison

| Mode | Data Structure | Lookup Complexity | Scalability | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **iptables** | Chains of rules | O(n) — sequential scan | Good up to ~10,000 Services | Default, works everywhere |
| **IPVS** | Hash table | O(1) — constant lookup | Excellent at any scale | Large clusters (>5,000 Services) |
| **eBPF** (Cilium) | BPF maps | O(1) — kernel fast path | Superior | Modern high-perf clusters |

---

## 5. CoreDNS — Cluster DNS

### 5.1 DNS Records

```
CoreDNS creates DNS records for every Service and Pod:

Service DNS:
  <service>.<namespace>.svc.cluster.local → ClusterIP
  Example: web-app.production.svc.cluster.local → 10.96.0.100

Headless Service DNS (ClusterIP: None):
  <service>.<namespace>.svc.cluster.local → Returns ALL Pod IPs (A records)
  <pod-name>.<service>.<namespace>.svc.cluster.local → Individual Pod IP
  Example: postgres-0.postgres-headless.production.svc.cluster.local → 10.0.1.50

Pod DNS (not commonly used):
  <pod-ip-dashed>.<namespace>.pod.cluster.local
  Example: 10-0-1-50.production.pod.cluster.local → 10.0.1.50
```

### 5.2 Pod DNS Configuration

```bash
# Every Pod gets this /etc/resolv.conf automatically:
nameserver 10.96.0.10                    # CoreDNS Service ClusterIP
search default.svc.cluster.local svc.cluster.local cluster.local
options ndots:5

# ndots:5 means:
# If a hostname has fewer than 5 dots, the search domains are appended first.
# "web-app" (0 dots < 5) → tries:
#   1. web-app.default.svc.cluster.local  ← Usually resolves here
#   2. web-app.svc.cluster.local
#   3. web-app.cluster.local
#   4. web-app                            ← External DNS lookup (last resort)
#
# "api.example.com" (2 dots < 5) → tries search domains first (wasteful!)
# This is why external DNS lookups are slower inside Kubernetes.
```

### 5.3 DNS Troubleshooting

```bash
# Test DNS resolution from inside a Pod
kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -- nslookup kubernetes
# → Expected:
# Name:    kubernetes.default.svc.cluster.local
# Address: 10.96.0.1

# Test DNS for a specific service
kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -- \
  nslookup web-app.production.svc.cluster.local

# Check CoreDNS pods are running
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Check CoreDNS logs
kubectl logs -n kube-system -l k8s-app=kube-dns

# Check CoreDNS ConfigMap
kubectl get configmap coredns -n kube-system -o yaml
```

---

## 6. NetworkPolicy — Pod Firewall

### 6.1 Concept

**Simple Analogy:** NetworkPolicies are like firewall rules between apartments in a building. By default, all doors are open. Once you install a lock on any apartment (create a NetworkPolicy selecting those Pods), all doors to that apartment are locked, and only explicitly allowed visitors can enter.

### 6.2 Default Behavior

| Without NetworkPolicy | With NetworkPolicy |
| :--- | :--- |
| All Pods can communicate with all other Pods | Only explicitly allowed traffic is permitted |
| No restrictions on ingress or egress | Default DENY for all traffic not matching a rule |

### 6.3 Default Deny All Ingress

```yaml
# Block ALL incoming traffic to all Pods in the namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}            # Empty = select ALL Pods in namespace
  policyTypes:
  - Ingress                  # Apply to incoming traffic
  # No ingress rules = deny all ingress
```

### 6.4 Allow Specific Traffic

```yaml
# Allow frontend Pods to access backend Pods on port 8080
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend              # This policy applies to backend Pods
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend          # Allow traffic FROM frontend Pods
    - namespaceSelector:
        matchLabels:
          name: monitoring       # Allow traffic FROM monitoring namespace
    ports:
    - protocol: TCP
      port: 8080                 # Only on port 8080
```

### 6.5 Egress Policy

```yaml
# Backend Pods can only access database on port 5432 and DNS on port 53
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  - to:                          # Allow DNS (required for name resolution)
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

### 6.6 Important Notes

- NetworkPolicies require a CNI plugin that supports them (Calico, Cilium, Weave — NOT Flannel).
- Policies are **additive** — multiple policies selecting the same Pod combine their allow rules.
- You must always allow DNS egress (port 53) or Pods cannot resolve service names.
- AWS VPC CNI does NOT natively support NetworkPolicies; install Calico alongside for policy enforcement on EKS.

---

## 7. Ingress — HTTP Routing

### 7.1 Concept

An **Ingress** defines HTTP/HTTPS routing rules that map external hostnames and paths to internal Services. An **Ingress Controller** (e.g., NGINX Ingress, AWS ALB Ingress) implements the rules.

```
┌─────────────────────────────────────────────────────────────┐
│                     External Traffic                         │
│                                                             │
│  https://app.example.com/api  ──►  ALB / NGINX Ingress     │
│  https://app.example.com/     ──►  Controller               │
│                                     │                       │
│                    ┌────────────────┼───────────────┐       │
│                    ▼                ▼               │       │
│             ┌──────────┐    ┌──────────┐           │       │
│             │ backend  │    │ frontend │           │       │
│             │ Service  │    │ Service  │           │       │
│             │ :8080    │    │ :80      │           │       │
│             └──────────┘    └──────────┘           │       │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Ingress YAML

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx              # Which Ingress Controller to use
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls-secret         # TLS certificate (from Cert-Manager or manual)
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-svc
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-svc
            port:
              number: 80
```

---

## 8. Gateway API (Next-Generation Ingress)

### 8.1 Why Gateway API?

The Ingress API has limitations: vendor-specific annotations, no TCP/UDP routing, limited traffic splitting. **Gateway API** is the official successor with richer features.

### 8.2 Key Resources

| Resource | Purpose | Managed By |
| :--- | :--- | :--- |
| **GatewayClass** | Defines the controller implementation (like IngressClass) | Platform team |
| **Gateway** | Configures the actual load balancer (ports, TLS, addresses) | Platform team |
| **HTTPRoute** | HTTP routing rules (host, path, headers → Service) | Application team |
| **TCPRoute** | TCP routing rules | Application team |
| **TLSRoute** | TLS passthrough routing | Application team |

```yaml
# Gateway (provisioned by platform team)
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
spec:
  gatewayClassName: aws-alb
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    tls:
      certificateRefs:
      - name: app-tls-cert
---
# HTTPRoute (created by app team)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: app-route
spec:
  parentRefs:
  - name: production-gateway
  hostnames:
  - "app.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: backend-svc
      port: 8080
      weight: 90                       # Canary: 90% to current, 10% to new
    - name: backend-svc-canary
      port: 8080
      weight: 10
```

---

## 9. Hands-On Lab

### Lab 9.1: Service Networking and DNS

```bash
kubectl create namespace lab-9

# Deploy backend
kubectl create deployment backend --image=hashicorp/http-echo:0.2.3 -n lab-9 -- -text="Hello from backend"
kubectl expose deployment backend --port=5678 -n lab-9

# Deploy frontend
kubectl create deployment frontend --image=nginx:1.25-alpine --replicas=2 -n lab-9

# Test DNS resolution
kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -n lab-9 -- \
  nslookup backend.lab-9.svc.cluster.local

# Test connectivity
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -n lab-9 -- \
  curl -s http://backend.lab-9.svc.cluster.local:5678

kubectl delete namespace lab-9
```

### Lab 9.2: NetworkPolicy

```bash
kubectl create namespace lab-9-np

# Deploy web and database
kubectl create deployment web --image=nginx:1.25-alpine -n lab-9-np
kubectl create deployment db --image=postgres:16-alpine -n lab-9-np
kubectl label deployment web app=web -n lab-9-np
kubectl label deployment db app=db -n lab-9-np

# Apply default deny
cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: lab-9-np
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
EOF

# Test: web cannot reach db (should timeout)
kubectl exec -it $(kubectl get pod -l app=web -n lab-9-np -o name | head -1) -n lab-9-np -- \
  wget --timeout=3 -qO- http://db 2>&1 || echo "Connection blocked!"

# Allow web → db on port 5432 + DNS
cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-db
  namespace: lab-9-np
spec:
  podSelector:
    matchLabels:
      app: db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    ports:
    - port: 5432
EOF

kubectl delete namespace lab-9-np
```

---

## 10. Interview Questions

### Q1: Explain the Kubernetes networking model.

**Expected Answer:**
Kubernetes networking has four fundamental rules: (1) Every Pod gets its own unique IP address. (2) Pods can communicate with all other Pods across all nodes without NAT. (3) Nodes can communicate with all Pods without NAT. (4) The IP a Pod sees for itself is the same IP that other Pods see. This flat network model is implemented by CNI plugins like Calico, Cilium, or AWS VPC CNI.

---

### Q2: How does a Service route traffic to Pods?

**Expected Answer:**
A Service uses a label selector to discover backend Pods. The EndpointSlice Controller maintains a list of Pod IPs matching the selector. kube-proxy on each node watches for Service and EndpointSlice changes and programs iptables/IPVS rules. When traffic arrives for the Service's ClusterIP, the iptables DNAT rule rewrites the destination to a randomly selected backend Pod IP, providing load balancing.

---

### Q3: What is a NetworkPolicy? What is the default behavior?

**Expected Answer:**
A NetworkPolicy is a Kubernetes resource that controls Pod-to-Pod network traffic, acting as a firewall. By default, all Pods can communicate with all other Pods (allow all). Once any NetworkPolicy selects a Pod, all traffic to that Pod is denied except what is explicitly allowed by the policy rules. Policies are additive. Important: NetworkPolicies require a CNI plugin that supports them (Calico, Cilium); they do NOT work with Flannel.

---

## 11. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **Networking Model** | Flat network; every Pod gets a unique routable IP; no NAT |
| **CNI Plugins** | Calico (general), Cilium (eBPF), AWS VPC CNI (native IPs) |
| **Service Routing** | kube-proxy programs iptables/IPVS for ClusterIP → Pod DNAT |
| **CoreDNS** | `<svc>.<ns>.svc.cluster.local` resolves to ClusterIP |
| **NetworkPolicy** | Default allow-all; once policy applied, default-deny for selected Pods |
| **Ingress** | HTTP/HTTPS L7 routing; requires Ingress Controller |
| **Gateway API** | Next-gen Ingress with traffic splitting, TCP/UDP support |

---

## 12. Practice Assignment

1. Deploy two applications in different namespaces. Verify they can communicate by default.
2. Apply a default-deny NetworkPolicy. Verify communication is blocked, then create an allow rule.
3. Configure CoreDNS custom domain forwarding by editing the CoreDNS ConfigMap.
4. Set up an NGINX Ingress Controller and create Ingress rules for host-based and path-based routing.
5. Debug a DNS resolution failure: identify whether the issue is CoreDNS, Pod resolv.conf, or NetworkPolicy.
