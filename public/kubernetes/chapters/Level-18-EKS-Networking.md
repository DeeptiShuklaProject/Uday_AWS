# Level 18 — EKS Networking Deep Dive

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Advanced |
| **Theory Duration** | 8 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 17 — Amazon EKS |
| **Lab Required** | Yes — EKS cluster with VPC CNI |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | AWS Solutions Architect, AWS DevOps Engineer |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain the AWS VPC CNI architecture and how Pods get real VPC IPs.
2. Calculate max Pods per node based on ENI and IP limits.
3. Configure prefix delegation for higher Pod density.
4. Set up Security Groups for Pods.
5. Implement AWS Load Balancer Controller (ALB/NLB) for production traffic.
6. Configure ExternalDNS with Route 53 for automatic DNS management.
7. Implement Calico NetworkPolicies on EKS.

---

## 1. VPC CNI Architecture

### 1.1 How Pods Get IP Addresses on EKS

```
Traditional K8s (Overlay CNI):
  Pod IP: 192.168.1.50 (virtual, overlay network)
  Node IP: 10.0.1.10 (real VPC IP)
  → Pod IP is NOT routable in the VPC. Requires VXLAN/IPIP encapsulation.

AWS VPC CNI:
  Pod IP: 10.0.10.51 (real VPC IP from subnet CIDR!)
  Node IP: 10.0.10.50 (real VPC IP)
  → Pod IP IS directly routable in the VPC. No overlay. Native performance.
```

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   VPC CNI — ENI IP Assignment                            │
│                                                                          │
│  EC2 Instance: m5.large                                                  │
│  Max ENIs: 3    Max IPs per ENI: 10                                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ENI 0 (Primary — eth0)                                         │    │
│  │  Primary IP: 10.0.10.50 (Node IP — used by host networking)     │    │
│  │  Secondary IPs:                                                  │    │
│  │    10.0.10.51 → Pod-A                                           │    │
│  │    10.0.10.52 → Pod-B                                           │    │
│  │    10.0.10.53 → Pod-C                                           │    │
│  │    ... up to 9 secondary IPs                                    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ENI 1 (Secondary)                                               │    │
│  │  Primary IP: 10.0.10.100                                        │    │
│  │  Secondary IPs:                                                  │    │
│  │    10.0.10.101 → Pod-D                                          │    │
│  │    10.0.10.102 → Pod-E                                          │    │
│  │    ... up to 10 secondary IPs                                   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ENI 2 (Secondary)                                               │    │
│  │  Primary IP: 10.0.10.150                                        │    │
│  │  Secondary IPs available for more Pods                           │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Max Pods = (3 ENIs × 10 IPs/ENI) - 3 primary IPs = 27 Pods            │
│  Formula: (maxENIs × (maxIPsPerENI - 1)) + 2                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Max Pods Per Instance Type

| Instance Type | Max ENIs | IPs per ENI | Max Pods (Default) | Max Pods (Prefix Delegation) |
| :--- | :--- | :--- | :--- | :--- |
| t3.medium | 3 | 6 | 17 | 110 |
| m5.large | 3 | 10 | 29 | 110 |
| m5.xlarge | 4 | 15 | 58 | 110 |
| m5.2xlarge | 4 | 15 | 58 | 110 |
| c5.xlarge | 4 | 15 | 58 | 110 |
| r5.large | 3 | 10 | 29 | 110 |

```bash
# Check max Pods for your instance type
kubectl describe node <node-name> | grep "pods:"
# → pods: 29

# List instance ENI limits
aws ec2 describe-instance-types \
  --instance-types m5.large \
  --query 'InstanceTypes[].NetworkInfo.{MaxENIs:MaximumNetworkInterfaces,IPv4PerENI:Ipv4AddressesPerInterface}'
```

---

## 2. Prefix Delegation (Higher Pod Density)

### 2.1 Concept

Default VPC CNI assigns individual secondary IPs to Pods. **Prefix delegation** assigns /28 prefixes (16 IPs each) instead, dramatically increasing Pod density.

```
Without Prefix Delegation (default):
  ENI 0: 1 primary + 9 secondary IPs = 9 Pods
  ENI 1: 1 primary + 9 secondary IPs = 10 Pods  (primary can be used)
  ENI 2: 1 primary + 9 secondary IPs = 10 Pods
  Total: 29 Pods on m5.large

With Prefix Delegation:
  ENI 0: 1 primary + 9 /28 prefixes = 9 × 16 = 144 IPs → capped at 110 Pods
  Total: 110 Pods on m5.large (Kubernetes max default)
```

### 2.2 Enable Prefix Delegation

```bash
# Enable prefix delegation on VPC CNI
kubectl set env daemonset aws-node -n kube-system ENABLE_PREFIX_DELEGATION=true
kubectl set env daemonset aws-node -n kube-system WARM_PREFIX_TARGET=1

# Update max-pods on nodes
# Must also update kubelet --max-pods=110 on node launch template
```

---

## 3. AWS Load Balancer Controller

### 3.1 ALB vs NLB

| Feature | ALB (Application LB) | NLB (Network LB) |
| :--- | :--- | :--- |
| **Layer** | Layer 7 (HTTP/HTTPS) | Layer 4 (TCP/UDP/TLS) |
| **K8s Object** | Ingress | Service type: LoadBalancer |
| **Routing** | Host-based, path-based, header-based | Port-based |
| **TLS** | Terminates at ALB (ACM certificates) | Passthrough or terminate |
| **WebSocket** | ✅ Supported | ✅ Supported |
| **gRPC** | ✅ Supported | ✅ Supported |
| **Static IP** | ❌ No (DNS name only) | ✅ Yes (Elastic IPs) |
| **Performance** | Good | Excellent (millions of RPS) |
| **Cost** | Higher (per LCU) | Lower (per NLCU) |
| **Best for** | Web apps, APIs, microservices | TCP services, databases, extreme throughput |

### 3.2 ALB Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: production-ingress
  namespace: production
  annotations:
    # ALB configuration
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing        # or internal
    alb.ingress.kubernetes.io/target-type: ip                # ip (Pod IP) or instance (NodePort)
    
    # TLS
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/abc-123
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
    
    # Health check
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "15"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "3"
    
    # WAF (Web Application Firewall)
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:...
    
    # Access logging
    alb.ingress.kubernetes.io/load-balancer-attributes: >
      access_logs.s3.enabled=true,
      access_logs.s3.bucket=my-alb-logs,
      access_logs.s3.prefix=production
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: api-v1-svc
            port:
              number: 8080
      - path: /v2
        pathType: Prefix
        backend:
          service:
            name: api-v2-svc
            port:
              number: 8080
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-svc
            port:
              number: 80
```

### 3.3 NLB Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: tcp-service
  namespace: production
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
    
    # Cross-zone load balancing
    service.beta.kubernetes.io/aws-load-balancer-attributes: >
      load_balancing.cross_zone.enabled=true
    
    # Health check
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: TCP
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-port: "8080"
spec:
  type: LoadBalancer
  selector:
    app: tcp-service
  ports:
  - port: 443
    targetPort: 8080
    protocol: TCP
```

---

## 4. Target Type: IP vs Instance

```
Target Type: instance (default)
  Traffic flow: Client → ALB/NLB → NodePort → kube-proxy → Pod
  ├── Extra hop through kube-proxy (iptables)
  ├── Source IP is lost (SNAT by kube-proxy)
  └── Works with any CNI

Target Type: ip (RECOMMENDED for VPC CNI)
  Traffic flow: Client → ALB/NLB → Pod IP directly
  ├── No extra hop (better latency)
  ├── Source IP preserved
  ├── Requires VPC CNI (Pods have real VPC IPs)
  └── Better health check accuracy (per Pod, not per node)
```

---

## 5. ExternalDNS with Route 53

### 5.1 Concept

ExternalDNS automatically creates and manages DNS records in Route 53 based on Kubernetes Ingress and Service annotations.

### 5.2 Configuration

```yaml
# ExternalDNS deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: external-dns
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: external-dns
  template:
    metadata:
      labels:
        app: external-dns
    spec:
      serviceAccountName: external-dns-sa    # IRSA with Route53 permissions
      containers:
      - name: external-dns
        image: registry.k8s.io/external-dns/external-dns:v0.14.0
        args:
        - --source=service
        - --source=ingress
        - --domain-filter=example.com          # Only manage records for this domain
        - --provider=aws
        - --aws-zone-type=public
        - --policy=upsert-only                 # Create/update, never delete
        - --registry=txt
        - --txt-owner-id=my-eks-cluster
```

```yaml
# Ingress with ExternalDNS annotation
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    external-dns.alpha.kubernetes.io/hostname: app.example.com
    # ExternalDNS creates: app.example.com → ALB DNS name (ALIAS record)
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

## 6. Security Groups for Pods

### 6.1 Concept

With VPC CNI, Pods can be assigned dedicated AWS Security Groups, enabling per-Pod network security at the VPC level (beyond Kubernetes NetworkPolicies).

```yaml
# SecurityGroupPolicy (assigns SG to Pods matching selector)
apiVersion: vpcresources.k8s.aws/v1beta1
kind: SecurityGroupPolicy
metadata:
  name: backend-sg-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  securityGroups:
    groupIds:
    - sg-0abc123def456            # Backend security group
    - sg-0xyz789ghi012            # Common security group
```

---

## 7. NetworkPolicy on EKS

```bash
# AWS VPC CNI alone does NOT support Kubernetes NetworkPolicies.
# You need Calico installed alongside VPC CNI for policy enforcement.

# Install Calico on EKS (policy-only mode — VPC CNI handles networking)
kubectl apply -f https://raw.githubusercontent.com/aws/amazon-vpc-cni-k8s/master/config/master/calico-operator.yaml
kubectl apply -f https://raw.githubusercontent.com/aws/amazon-vpc-cni-k8s/master/config/master/calico-crs.yaml

# Now NetworkPolicy resources are enforced by Calico
```

---

## 8. Troubleshooting EKS Networking

| Problem | Symptoms | Diagnostic | Resolution |
| :--- | :--- | :--- | :--- |
| Pod stuck in ContainerCreating | No IP assigned | `kubectl describe pod` → "failed to assign an IP address" | Subnet exhausted; add subnets or enable prefix delegation |
| Max Pods reached | New Pods Pending | `kubectl describe node` → "Too many pods" | Enable prefix delegation or use larger instance type |
| ALB not created | Ingress has no ADDRESS | `kubectl describe ingress` → events | Check AWS LB Controller logs, IAM permissions, subnet tags |
| DNS resolution fails | Pods can't reach services by name | `nslookup` inside Pod fails | Check CoreDNS pods, Security Group rules for port 53 |
| Pod can't reach internet | Image pull fails, AWS API calls timeout | `kubectl exec — curl https://google.com` | Check NAT Gateway, route tables, Security Groups |
| Cross-AZ traffic slow | High latency between Pods | Check Pod placement | Use topology spread or Pod affinity for AZ-local communication |

---

## 9. Interview Questions

### Q1: How does VPC CNI assign IPs to Pods?

**Expected Answer:**
VPC CNI attaches Elastic Network Interfaces (ENIs) to EC2 instances and assigns secondary private IPs from the VPC subnet to Pods. Each Pod gets a real, routable VPC IP — no overlay network. The number of Pods per node is limited by the instance type's max ENIs × IPs per ENI. Prefix delegation can increase this limit by assigning /28 IP prefixes instead of individual IPs.

---

### Q2: What is the difference between ALB target type `ip` and `instance`?

**Expected Answer:**
**Instance mode**: Traffic goes Client → ALB → EC2 NodePort → kube-proxy → Pod. Extra hop, source IP lost, works with any CNI.
**IP mode** (recommended for EKS): Traffic goes Client → ALB → Pod IP directly. No extra hop, better latency, source IP preserved, more accurate health checks. Requires VPC CNI since Pods need routable VPC IPs.

---

## 10. Summary

| EKS Networking Concept | Key Takeaway |
| :--- | :--- |
| **VPC CNI** | Pods get real VPC IPs; no overlay; limited by ENI capacity |
| **Prefix Delegation** | Assigns /28 prefixes for higher Pod density (up to 110 per node) |
| **ALB** | L7 load balancing via Ingress; host/path routing; ACM TLS |
| **NLB** | L4 load balancing via Service; static IPs; extreme throughput |
| **Target Type IP** | Direct routing to Pod IPs; better performance and source IP preservation |
| **ExternalDNS** | Auto-creates Route 53 records from Ingress/Service annotations |
| **Security Groups for Pods** | VPC-level per-Pod firewall rules |
| **NetworkPolicies** | Requires Calico alongside VPC CNI for enforcement |

---

## 11. Practice Assignment

1. Check the max Pods on your EKS node. Compare with the instance type's ENI/IP limits.
2. Enable prefix delegation and verify the new max Pods limit.
3. Deploy an ALB Ingress with host-based and path-based routing, TLS from ACM.
4. Deploy an NLB Service for a TCP application.
5. Install ExternalDNS and verify automatic Route 53 record creation for an Ingress.
6. Install Calico on EKS and apply a NetworkPolicy to restrict Pod-to-Pod traffic.
