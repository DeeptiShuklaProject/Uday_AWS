# Level 15 — Kubernetes Security & RBAC Deep Dive

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate → Advanced |
| **Theory Duration** | 10 hours |
| **Practical Duration** | 8 hours |
| **Prerequisites** | Level 14 — Autoscaling |
| **Lab Required** | Yes — Multi-namespace cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Top priority for Senior DevOps/CKS |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Non-negotiable for production |
| **Certification Alignment** | CKA (Security — 15%), CKS (Entire exam), CKAD |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain the Kubernetes authentication and authorization pipeline.
2. Configure RBAC (Roles, ClusterRoles, RoleBindings, ClusterRoleBindings).
3. Create and manage ServiceAccounts with least-privilege access.
4. Implement Pod Security Standards (PSA/PSS) and Pod Security Admission.
5. Configure SecurityContexts for Pods and containers.
6. Implement NetworkPolicies for zero-trust networking.
7. Understand image security (scanning, signed images, allowed registries).
8. Explain the relationship between AWS IAM and Kubernetes RBAC (IRSA).

---

## 1. Security Architecture — The 4 C's of Cloud Native Security

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    4 C's of Cloud Native Security                        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Cloud Layer (AWS)                                                 │  │
│  │  • VPC isolation, Security Groups, NACLs                           │  │
│  │  • IAM Policies, KMS encryption, CloudTrail audit                  │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │  Cluster Layer (Kubernetes)                                  │  │  │
│  │  │  • RBAC, Admission Controllers, NetworkPolicies              │  │  │
│  │  │  • etcd encryption, API Server audit logging                 │  │  │
│  │  │  ┌────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │  Container Layer                                       │  │  │  │
│  │  │  │  • Trusted base images, image scanning (Trivy)         │  │  │  │
│  │  │  │  • Read-only filesystem, non-root execution            │  │  │  │
│  │  │  │  ┌──────────────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  Code Layer                                      │  │  │  │  │
│  │  │  │  │  • Dependency scanning (Snyk, Dependabot)        │  │  │  │  │
│  │  │  │  │  • Static analysis, secrets in code detection    │  │  │  │  │
│  │  │  │  │  • TLS everywhere, input validation              │  │  │  │  │
│  │  │  │  └──────────────────────────────────────────────────┘  │  │  │  │
│  │  │  └────────────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Authorization Pipeline

```
kubectl apply -f deployment.yaml
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API Server Security Pipeline                         │
│                                                                         │
│  Step 1: AUTHENTICATION — "Who are you?"                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Method 1: X.509 Client Certificates (kubeconfig)                │  │
│  │  Method 2: Bearer Tokens (ServiceAccount tokens)                  │  │
│  │  Method 3: OIDC (AWS IAM Authenticator, Google OIDC)              │  │
│  │  Method 4: Webhook Token Authentication                           │  │
│  │                                                                   │  │
│  │  Result: Identity → "user:uday" or "system:serviceaccount:prod:sa"│  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Step 2: AUTHORIZATION — "What can you do?"                             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Mode 1: RBAC (Role-Based Access Control) ← PRIMARY              │  │
│  │  Mode 2: ABAC (Attribute-Based) ← Rarely used                    │  │
│  │  Mode 3: Node Authorization (kubelet access)                      │  │
│  │  Mode 4: Webhook (external authorization service)                 │  │
│  │                                                                   │  │
│  │  RBAC Check: Can "user:uday" perform "create" on "deployments"   │  │
│  │              in namespace "production"?                            │  │
│  │  → Looks up RoleBindings/ClusterRoleBindings                     │  │
│  │  → Result: ALLOWED ✅ or DENIED ❌ (403 Forbidden)               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Step 3: ADMISSION CONTROL — "Is this request acceptable?"              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Mutating Webhooks: Inject defaults, sidecars, labels             │  │
│  │  Validating Webhooks: Enforce policies (OPA, Kyverno)             │  │
│  │  Pod Security Admission: Enforce Pod Security Standards           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. RBAC (Role-Based Access Control)

### 3.1 RBAC Object Model

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          RBAC Architecture                               │
│                                                                          │
│  WHO (Subject)              WHAT (Permissions)         WHERE (Scope)     │
│  ┌──────────────┐          ┌────────────────┐         ┌──────────────┐  │
│  │ User         │          │ Role           │         │ Namespace    │  │
│  │ Group        │──Bound──►│ (Namespace)    │────────►│ (Single)     │  │
│  │ ServiceAcct  │   via    │                │         │              │  │
│  │              │          │ rules:         │         │              │  │
│  │              │          │ - resources    │         │              │  │
│  │              │          │ - verbs        │         │              │  │
│  │              │          │ - apiGroups    │         │              │  │
│  └──────────────┘          └────────────────┘         └──────────────┘  │
│        │                          │                          │           │
│        │                   ┌──────▼─────────┐                │           │
│        │                   │ RoleBinding    │                │           │
│        └──────────────────►│               │────────────────┘           │
│                            └────────────────┘                            │
│                                                                          │
│  CLUSTER-WIDE:                                                           │
│  ┌──────────────┐          ┌────────────────┐         ┌──────────────┐  │
│  │ User/Group/  │          │ ClusterRole    │         │ All          │  │
│  │ ServiceAcct  │──Bound──►│ (Cluster-wide) │────────►│ Namespaces   │  │
│  │              │   via    │                │         │              │  │
│  │              │          │ Can also define│         │              │  │
│  │              │          │ cluster-scoped │         │              │  │
│  │              │          │ resources      │         │              │  │
│  └──────────────┘          └────────────────┘         └──────────────┘  │
│        │                          │                          │           │
│        │                   ┌──────▼─────────────┐            │           │
│        └──────────────────►│ClusterRoleBinding  │────────────┘           │
│                            └────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 RBAC Verbs

| Verb | HTTP Method | Description |
| :--- | :--- | :--- |
| `get` | GET (single) | Read a single resource |
| `list` | GET (collection) | List all resources of a type |
| `watch` | GET (watch stream) | Real-time event stream |
| `create` | POST | Create a new resource |
| `update` | PUT | Replace an existing resource entirely |
| `patch` | PATCH | Partially modify a resource |
| `delete` | DELETE | Delete a resource |
| `deletecollection` | DELETE (collection) | Delete all resources of a type |

### 3.3 Role (Namespace-scoped)

```yaml
# Role: Allows read-only access to Pods in the "production" namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
- apiGroups: [""]              # "" = core API group (v1)
  resources: ["pods"]
  verbs: ["get", "list", "watch"]

- apiGroups: [""]
  resources: ["pods/log"]       # Sub-resource: Pod logs
  verbs: ["get"]

- apiGroups: ["apps"]           # apps API group (Deployments, etc.)
  resources: ["deployments"]
  verbs: ["get", "list"]
```

### 3.4 ClusterRole (Cluster-scoped)

```yaml
# ClusterRole: Full admin access to all resources cluster-wide
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-admin-custom
rules:
- apiGroups: ["*"]              # ALL API groups
  resources: ["*"]              # ALL resources
  verbs: ["*"]                  # ALL verbs
  # WARNING: This is equivalent to root access. Use sparingly.

---
# ClusterRole: Read-only access to nodes (cluster-scoped resource)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["persistentvolumes"]
  verbs: ["get", "list"]
```

### 3.5 RoleBinding

```yaml
# Bind "pod-reader" Role to user "uday" in namespace "production"
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: uday-pod-reader
  namespace: production
subjects:
- kind: User
  name: uday                    # User name (from certificate CN)
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader              # Reference the Role
  apiGroup: rbac.authorization.k8s.io
```

### 3.6 ClusterRoleBinding

```yaml
# Bind "node-reader" ClusterRole to a group "devops-team" cluster-wide
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: devops-node-readers
subjects:
- kind: Group
  name: devops-team             # Group name (from certificate O)
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: node-reader
  apiGroup: rbac.authorization.k8s.io

---
# Bind a ClusterRole to a ServiceAccount in a specific namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deploy-sa-deployer
  namespace: production
subjects:
- kind: ServiceAccount
  name: deploy-sa
  namespace: production
roleRef:
  kind: ClusterRole              # Can bind ClusterRole via RoleBinding
  name: edit                     # Built-in ClusterRole (namespace-scoped permissions)
  apiGroup: rbac.authorization.k8s.io
```

### 3.7 Built-in ClusterRoles

| ClusterRole | Permissions | Use Case |
| :--- | :--- | :--- |
| `cluster-admin` | Full access to everything | Platform team, emergency access |
| `admin` | Full access within a namespace | Namespace owner |
| `edit` | Read/write most resources, no RBAC | Developer deploying applications |
| `view` | Read-only access to most resources | Auditor, read-only user |

### 3.8 RBAC Verification Commands

```bash
# Check if you can perform an action
kubectl auth can-i create deployments -n production
# → yes

kubectl auth can-i delete pods -n kube-system
# → no

# Check as a specific user
kubectl auth can-i create pods -n production --as=user:developer
# → no

# Check as a ServiceAccount
kubectl auth can-i list secrets -n production --as=system:serviceaccount:production:deploy-sa
# → yes

# List all RBAC permissions for a user
kubectl auth can-i --list --as=user:developer -n production

# View all RoleBindings in a namespace
kubectl get rolebindings -n production
kubectl get clusterrolebindings
```

---

## 4. ServiceAccounts

### 4.1 Concept

Every Pod runs as a **ServiceAccount**. The ServiceAccount determines what the Pod's processes can do against the Kubernetes API.

```yaml
# Create a ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deploy-sa
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/PodRole  # IRSA
automountServiceAccountToken: false    # Don't auto-mount token (security best practice)
```

```yaml
# Use ServiceAccount in a Pod
apiVersion: v1
kind: Pod
metadata:
  name: deployer
  namespace: production
spec:
  serviceAccountName: deploy-sa        # Run as this ServiceAccount
  automountServiceAccountToken: true   # Mount token only when needed
  containers:
  - name: kubectl
    image: bitnami/kubectl:latest
```

### 4.2 Best Practices for ServiceAccounts

1. **Create dedicated ServiceAccounts** for each application (never use `default`).
2. **Set `automountServiceAccountToken: false`** on ServiceAccounts that don't need API access.
3. **Use IRSA (IAM Roles for Service Accounts)** on EKS for AWS API access.
4. **Apply least-privilege RBAC** — only grant permissions the application actually needs.

---

## 5. Pod Security Standards (PSS) & Pod Security Admission (PSA)

### 5.1 Pod Security Standards (3 Levels)

| Level | Policy | Description |
| :--- | :--- | :--- |
| **Privileged** | No restrictions | Unrestricted policy; allows all security settings |
| **Baseline** | Moderate restrictions | Prevents known privilege escalations; sane defaults |
| **Restricted** | Strict restrictions | Hardened; follows all security best practices |

### 5.2 What Each Level Restricts

| Security Control | Privileged | Baseline | Restricted |
| :--- | :--- | :--- | :--- |
| Host networking | ✅ Allowed | ❌ Blocked | ❌ Blocked |
| Host PID namespace | ✅ Allowed | ❌ Blocked | ❌ Blocked |
| Privileged containers | ✅ Allowed | ❌ Blocked | ❌ Blocked |
| hostPath volumes | ✅ Allowed | ✅ Allowed | ❌ Blocked |
| Non-root execution | Not required | Not required | ✅ Required |
| Read-only root FS | Not required | Not required | ✅ Required |
| Drop ALL capabilities | Not required | Not required | ✅ Required |
| Seccomp profile | Not required | Not required | ✅ Required (RuntimeDefault) |

### 5.3 Applying PSA to a Namespace

```bash
# Apply using namespace labels:
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted

# Modes:
# enforce: Reject Pods that violate the standard
# audit:   Log violations (but allow the Pod)
# warn:    Show warnings to the user (but allow the Pod)

# Typical production setup:
# enforce=baseline  (block dangerous configs)
# audit=restricted  (log non-compliant Pods for improvement)
# warn=restricted   (warn developers to improve)
```

---

## 6. AWS IAM & Kubernetes RBAC Integration (IRSA)

### 6.1 The Problem

A Pod needs to call AWS APIs (S3, SQS, DynamoDB). How does it authenticate?

**Bad approach:** Hard-code AWS access keys as environment variables or Secrets.
**Good approach:** IRSA (IAM Roles for Service Accounts) — link a Kubernetes ServiceAccount to an AWS IAM Role.

### 6.2 How IRSA Works

```
┌──────────────────────────────────────────────────────────────────────┐
│                    IRSA (IAM Roles for Service Accounts)              │
│                                                                      │
│  1. EKS cluster has an OIDC Identity Provider                        │
│  2. IAM Role has a trust policy allowing the K8s ServiceAccount      │
│  3. Pod uses the ServiceAccount → gets temporary AWS credentials     │
│                                                                      │
│  ┌────────────────┐        ┌──────────────────┐                     │
│  │ Pod             │        │ AWS STS           │                     │
│  │                │        │                  │                     │
│  │ SA: s3-access-sa│──────►│ AssumeRoleWith   │                     │
│  │                │  JWT   │ WebIdentity      │                     │
│  │                │  token │                  │                     │
│  └────────────────┘        └──────┬───────────┘                     │
│                                   │                                  │
│                                   ▼                                  │
│                            ┌──────────────┐                          │
│                            │ IAM Role     │                          │
│                            │ S3FullAccess │                          │
│                            └──────┬───────┘                          │
│                                   │                                  │
│                                   ▼                                  │
│                            ┌──────────────┐                          │
│                            │ AWS S3       │                          │
│                            │ (Authorized) │                          │
│                            └──────────────┘                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.3 IRSA Setup

```bash
# Step 1: Create IAM OIDC provider for EKS
eksctl utils associate-iam-oidc-provider --cluster my-cluster --approve

# Step 2: Create IAM Role + K8s ServiceAccount
eksctl create iamserviceaccount \
  --name s3-access-sa \
  --namespace production \
  --cluster my-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess \
  --approve
```

```yaml
# Step 3: Use the ServiceAccount in a Pod
apiVersion: v1
kind: Pod
metadata:
  name: s3-reader
  namespace: production
spec:
  serviceAccountName: s3-access-sa     # Uses IRSA-annotated ServiceAccount
  containers:
  - name: aws-cli
    image: amazon/aws-cli:latest
    command: ["aws", "s3", "ls"]
    # No AWS credentials needed! IRSA handles authentication automatically.
```

---

## 7. Image Security

### 7.1 Image Scanning

```bash
# Scan images with Trivy (open-source)
trivy image nginx:1.25-alpine
# → Checks for CVEs in OS packages and application dependencies
# → Reports: CRITICAL, HIGH, MEDIUM, LOW vulnerabilities

# Scan in CI pipeline (fail on CRITICAL)
trivy image --exit-code 1 --severity CRITICAL myapp:v1.0
```

### 7.2 Restrict Image Sources (Admission Controllers)

```yaml
# Kyverno Policy: Only allow images from approved registries
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-image-registries
spec:
  validationFailureAction: Enforce
  rules:
  - name: validate-registries
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "Images must be from approved registries."
      pattern:
        spec:
          containers:
          - image: "123456789012.dkr.ecr.us-east-1.amazonaws.com/*"
```

---

## 8. Hands-On Lab

### Lab 15.1: RBAC Configuration

```bash
kubectl create namespace lab-15

# Create a ServiceAccount
kubectl create serviceaccount developer-sa -n lab-15

# Create a Role (read Pods and Deployments)
cat <<'EOF' | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer-role
  namespace: lab-15
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "create", "update"]
EOF

# Create RoleBinding
kubectl create rolebinding developer-binding \
  --role=developer-role \
  --serviceaccount=lab-15:developer-sa \
  -n lab-15

# Test permissions
kubectl auth can-i list pods -n lab-15 --as=system:serviceaccount:lab-15:developer-sa
# → yes

kubectl auth can-i delete pods -n lab-15 --as=system:serviceaccount:lab-15:developer-sa
# → no

kubectl auth can-i list secrets -n lab-15 --as=system:serviceaccount:lab-15:developer-sa
# → no

kubectl delete namespace lab-15
```

---

## 9. Interview Questions

### Q1: Explain RBAC in Kubernetes.

**Expected Answer:**
RBAC (Role-Based Access Control) controls who can do what in the cluster. It has four objects:
- **Role**: Defines permissions (resources + verbs) within a namespace.
- **ClusterRole**: Defines permissions cluster-wide or for cluster-scoped resources (nodes, PVs).
- **RoleBinding**: Binds a Role to a user/group/ServiceAccount within a namespace.
- **ClusterRoleBinding**: Binds a ClusterRole to subjects across all namespaces.

Subjects can be Users, Groups, or ServiceAccounts. Permissions are additive (deny-by-default, no deny rules).

---

### Q2: What is IRSA and why is it important?

**Expected Answer:**
IRSA (IAM Roles for Service Accounts) links a Kubernetes ServiceAccount to an AWS IAM Role. When a Pod uses that ServiceAccount, it automatically receives temporary AWS credentials via STS AssumeRoleWithWebIdentity. This eliminates the need to store AWS access keys as Secrets, follows the principle of least privilege (each Pod gets only the AWS permissions it needs), and credentials are automatically rotated.

---

### Q3: What is the principle of least privilege in Kubernetes?

**Expected Answer:**
Least privilege means granting the minimum permissions required for a task:
1. Create dedicated ServiceAccounts per application (not `default`).
2. Grant only needed RBAC verbs and resources.
3. Disable auto-mounting of ServiceAccount tokens when API access isn't needed.
4. Run containers as non-root with read-only root filesystem.
5. Drop all Linux capabilities and add back only what's needed.
6. Use NetworkPolicies to restrict Pod-to-Pod communication.
7. Use IRSA for AWS access instead of shared credentials.

---

## 10. Best Practices

1. **Never use `cluster-admin` for applications** — create specific Roles.
2. **Create one ServiceAccount per application** — never use `default`.
3. **Set `automountServiceAccountToken: false`** by default.
4. **Use IRSA on EKS** for all AWS API access from Pods.
5. **Apply Pod Security Standards** — at minimum `baseline` enforcement.
6. **Run containers as non-root** — `runAsNonRoot: true`, `readOnlyRootFilesystem: true`.
7. **Scan images** in CI pipelines before deployment (Trivy, Snyk).
8. **Restrict image registries** using admission controllers (Kyverno, OPA).
9. **Enable audit logging** to track who accessed what.
10. **Use NetworkPolicies** for zero-trust Pod networking.

---

## 11. Summary

| Security Layer | Mechanism | Purpose |
| :--- | :--- | :--- |
| **Authentication** | X.509 certs, OIDC, ServiceAccount tokens | "Who are you?" |
| **Authorization** | RBAC (Roles, ClusterRoles, Bindings) | "What can you do?" |
| **Admission** | Mutating/Validating webhooks, PSA | "Is this request acceptable?" |
| **Pod Security** | SecurityContext, PSS/PSA | Non-root, read-only FS, drop capabilities |
| **Network** | NetworkPolicies | Zero-trust Pod-to-Pod communication |
| **Secrets** | IRSA, External Secrets, encryption at rest | Secure credential management |
| **Images** | Trivy scanning, registry restrictions | Vulnerability prevention |

---

## 12. Practice Assignment

1. Create a Role that allows creating and listing Deployments but not deleting them. Bind it to a ServiceAccount. Test with `kubectl auth can-i`.
2. Create a ClusterRole for read-only access to nodes and PersistentVolumes. Bind it to a user group.
3. Configure Pod Security Admission on a namespace to enforce the `restricted` standard. Try to deploy a privileged Pod (should be rejected).
4. Set up IRSA on EKS: create a ServiceAccount linked to an IAM Role with S3 read access. Deploy a Pod that lists S3 buckets.
5. Write a Kyverno policy that rejects Pods without resource limits.
6. Implement a complete security setup: RBAC + SecurityContext + NetworkPolicy + PSA for a 3-tier application.
