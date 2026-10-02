# Level 30 — Capstone: "What Happens When..." & Final Projects

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Advanced → Expert |
| **Duration** | 6 hours theory + project work |
| **Prerequisites** | All previous levels |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Tests deep understanding |

---

## Part 1: "What Happens When You Run `kubectl apply -f deployment.yaml`?"

This is the single most important interview question. A complete answer demonstrates mastery of the entire Kubernetes architecture.

```
Step 1: kubectl reads the YAML file
  → Parses YAML into a Deployment object
  → Validates fields locally (apiVersion, kind, metadata)
  → Reads kubeconfig (~/.kube/config) for cluster endpoint and credentials

Step 2: kubectl sends HTTP POST to API server
  → POST https://api-server:6443/apis/apps/v1/namespaces/default/deployments
  → Request includes authentication token (from kubeconfig)
  → TLS connection (HTTPS)

Step 3: API Server — Authentication
  → Verifies client certificate or bearer token
  → Determines identity: "user:uday" or "system:serviceaccount:default:deploy-sa"

Step 4: API Server — Authorization (RBAC)
  → Checks: can "user:uday" CREATE "deployments" in namespace "default"?
  → Looks up RoleBindings/ClusterRoleBindings
  → If denied → 403 Forbidden

Step 5: API Server — Admission Controllers
  → Mutating webhooks: inject defaults (e.g., ServiceAccount, resource defaults, sidecar injection)
  → Validating webhooks: enforce policies (e.g., "must have resource limits")
  → Pod Security Admission: check against security standards

Step 6: API Server — Persist to etcd
  → Serializes Deployment object to JSON
  → Stores in etcd: /registry/deployments/default/web-app
  → Returns 201 Created to kubectl

Step 7: Deployment Controller detects new Deployment
  → Watches API server for Deployment changes (via watch stream)
  → Creates a ReplicaSet object matching the Deployment template
  → API server stores ReplicaSet in etcd

Step 8: ReplicaSet Controller detects new ReplicaSet
  → Calculates: desired = 3, current = 0 → need to create 3 Pods
  → Creates 3 Pod objects (spec.nodeName = empty — unscheduled)
  → API server stores Pods in etcd

Step 9: kube-scheduler detects unscheduled Pods
  → Filtering: which nodes can run this Pod? (resources, taints, affinity, etc.)
  → Scoring: which node is best? (balanced resources, image cached, etc.)
  → Assigns: spec.nodeName = "worker-02"
  → API server updates Pod in etcd

Step 10: kubelet on worker-02 detects new Pod assigned to it
  → Watches API server for Pods assigned to this node
  → Calls container runtime (containerd) via CRI:
    a. Pull image (if not cached)
    b. Create sandbox (pause container for network namespace)
    c. Create application container

Step 11: VPC CNI plugin configures networking
  → Allocates a secondary IP from ENI for the Pod
  → Sets up veth pair connecting Pod to node network
  → Configures routing rules

Step 12: kubelet starts the container
  → Runs init containers (if any) sequentially
  → Starts main containers
  → Starts liveness and readiness probes
  → Reports Pod status to API server

Step 13: Pod becomes Ready
  → Readiness probe passes
  → EndpointSlice controller adds Pod IP to Service endpoints
  → kube-proxy updates iptables/IPVS rules on all nodes
  → Traffic can now reach the Pod through the Service ClusterIP

Step 14: kubectl apply returns
  → "deployment.apps/web-app created"
  → The entire process takes 5-30 seconds depending on image pull and startup time
```

---

## Part 2: "What Happens When a Pod Crashes?"

```
Step 1: Container process exits (exit code != 0)
  → containerd detects container termination
  → Reports to kubelet

Step 2: kubelet records the container death
  → Updates Pod status: containerStatuses[].lastState = Terminated
  → Increments restartCount
  → Reports to API server

Step 3: kubelet checks restartPolicy
  → Always (default for Deployments): restart the container
  → OnFailure (for Jobs): restart only if exit code != 0
  → Never: don't restart

Step 4: kubelet applies backoff delay
  → 1st restart: immediate
  → 2nd restart: 10 seconds
  → 3rd restart: 20 seconds
  → 4th restart: 40 seconds
  → ... doubles each time, capped at 5 minutes
  → This is why you see "CrashLoopBackOff"

Step 5: EndpointSlice controller removes Pod from Service
  → Readiness probe is failing (container isn't running)
  → Pod IP removed from endpoints
  → No traffic routed to this Pod

Step 6: kubelet restarts the container
  → Pulls image (if imagePullPolicy requires)
  → Creates new container in same Pod (same IP, same volumes)
  → Probes start again

Step 7: If container becomes healthy
  → Readiness probe passes
  → Pod IP added back to Service endpoints
  → Traffic resumes
```

---

## Part 3: "What Happens When a Node Fails?"

```
Step 1: Node stops sending heartbeats to API server
  → kubelet reports heartbeat every 10 seconds (via Lease object)
  → node-lifecycle-controller detects missing heartbeat

Step 2: Node marked as Unknown (after 40 seconds by default)
  → node-lifecycle-controller updates Node condition: Ready=Unknown
  → Pods on that node still show as "Running" (controller doesn't know for sure)

Step 3: After 5 minutes (pod-eviction-timeout):
  → node-lifecycle-controller marks Pods as "Terminating"
  → Actually: it sets deletionTimestamp on the Pods
  → But since the node is down, kubelet can't execute graceful shutdown

Step 4: ReplicaSet/Deployment controller reacts
  → Detects that desired (3) != available (2) — one Pod is on failed node
  → Creates replacement Pod on healthy nodes
  → Scheduler assigns the new Pod

Step 5: The old Pod remains in "Terminating" until node returns or is forcefully deleted
  → kubectl delete pod <pod> --grace-period=0 --force (manual cleanup)
  → Or: if Karpenter manages the node, it terminates the EC2 instance after TTL

Step 6: If the node comes back online:
  → kubelet reconnects to API server
  → Reports actual Pod status (containers stopped)
  → Terminating Pods are cleaned up
```

---

## Part 4: Capstone Projects

### Project 1: Deploy a 3-Tier Application on EKS

```
Objective: Deploy a production-grade 3-tier application

Architecture:
  Frontend (React/Vue) → Backend (Node.js/Go API) → Database (PostgreSQL)

Requirements:
  □ EKS cluster with Terraform (VPC + EKS + node groups)
  □ Frontend: Deployment + Service + ALB Ingress
  □ Backend: Deployment + Service + HPA + ConfigMap + Secrets (IRSA for AWS access)
  □ Database: StatefulSet + PVC (EBS gp3) + Headless Service
  □ Networking: NetworkPolicies (frontend → backend → database only)
  □ Security: RBAC per namespace, Pod Security Standards (restricted)
  □ Monitoring: Prometheus + Grafana dashboards
  □ CI/CD: GitHub Actions (CI) + Argo CD (CD)
  □ DNS: ExternalDNS + Route 53
  □ TLS: cert-manager + ACM

Verification:
  □ Application accessible via https://app.example.com
  □ HPA scales under load (run load test)
  □ Database survives Pod restart (data persists)
  □ Rolling update with zero downtime
  □ Rollback to previous version
  □ NetworkPolicy blocks unauthorized traffic
```

### Project 2: Disaster Recovery Drill

```
Objective: Prove your cluster can survive failures

Tasks:
  □ Back up cluster with Velero
  □ Simulate node failure (terminate EC2 instance) — verify Pods reschedule
  □ Simulate bad deployment — rollback within 60 seconds
  □ Delete a namespace — restore from Velero backup
  □ Drain a node — verify PDB protects application
  □ Simulate AZ failure — verify multi-AZ deployment keeps serving
  □ Create an EBS snapshot — restore to new PVC
```

### Project 3: Cost-Optimized Auto-Scaling Architecture

```
Objective: Build a cost-efficient auto-scaling platform

Requirements:
  □ Karpenter with mixed Spot/On-Demand (70/30 split)
  □ HPA for all stateless services (CPU + custom metrics)
  □ VPA in recommendation mode for right-sizing
  □ Kubecost for cost attribution
  □ Resource Quotas per namespace
  □ Savings Plan for baseline capacity
  □ Cost report: compare before/after optimization
```

---

## Part 5: Course Completion Checklist

```
By completing this course, you should be able to:

□ Explain Kubernetes from first principles (architecture, controllers, scheduling)
□ Deploy, manage, and troubleshoot applications on Kubernetes
□ Design and manage production EKS clusters on AWS
□ Implement security (RBAC, IRSA, PSA, NetworkPolicies)
□ Build CI/CD pipelines (GitHub Actions → ECR → Argo CD → EKS)
□ Manage infrastructure as code (Terraform for VPC + EKS)
□ Implement observability (Prometheus + Grafana + Fluent Bit)
□ Handle production incidents and write post-mortems
□ Design enterprise architectures (multi-cluster, DR, HA)
□ Pass CKA, CKAD, CKS, and AWS certifications
□ Answer 95%+ of Kubernetes/AWS/DevOps interview questions
□ Architect Kubernetes solutions at the staff/principal engineer level
```

---

## Summary

This course has taken you from **zero knowledge** to **production architect** across 30 levels:

| Phase | Levels | Topics |
| :--- | :--- | :--- |
| **Foundations** | 0–2 | Linux, Docker, containers vs K8s |
| **Core K8s** | 3–8 | Architecture, installation, kubectl, objects, Pods |
| **Infrastructure** | 9–11 | Networking, storage, configuration |
| **Operations** | 12–14 | Scheduling, deployments, autoscaling |
| **Security** | 15 | RBAC, IRSA, PSA, SecurityContext |
| **AWS & EKS** | 16–18 | AWS fundamentals, EKS, EKS networking |
| **DevOps Toolchain** | 19–23 | Git, CI/CD, Terraform, Helm, GitOps |
| **Observability** | 24 | Prometheus, Grafana, Fluent Bit, alerting |
| **Production** | 25–28 | Operations, troubleshooting, incidents, architecture |
| **Career** | 29–30 | Interview questions, capstone projects |

**Total content: ~600 KB across 31 chapters, covering every topic needed for a Kubernetes + AWS EKS career.**
