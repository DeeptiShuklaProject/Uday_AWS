# Level 23 — GitOps with Argo CD

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate → Advanced |
| **Theory Duration** | 6 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 22 — Helm |
| **Lab Required** | Yes — K8s cluster + Git repository |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Top DevOps topic |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Standard for modern K8s operations |
| **Certification Alignment** | DevOps certifications, Argo Project certifications |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain GitOps principles and how they differ from traditional CI/CD.
2. Install and configure Argo CD on a Kubernetes cluster.
3. Create Argo CD Applications pointing to Git repositories.
4. Implement automated sync and self-healing.
5. Configure Argo CD ApplicationSets for multi-cluster/multi-environment.
6. Use Argo CD with Helm charts and Kustomize.

---

## 1. GitOps Principles

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    GitOps vs Traditional CI/CD                              │
│                                                                              │
│  Traditional (Push-Based CD):                                               │
│                                                                              │
│  Developer → CI Pipeline → Build Image → Push to Registry                   │
│       → Pipeline runs: kubectl apply / helm upgrade (PUSH to cluster)       │
│       → Pipeline needs cluster credentials (security risk)                  │
│       → Drift possible: someone manually changes cluster                    │
│                                                                              │
│  GitOps (Pull-Based CD):                                                    │
│                                                                              │
│  Developer → CI Pipeline → Build Image → Push to Registry                   │
│       → CI updates image tag in Git manifest repo                           │
│       → Argo CD watches Git repo (PULL from Git)                            │
│       → Argo CD applies changes to cluster                                  │
│       → Self-healing: if someone manually changes cluster,                  │
│         Argo CD reverts it back to match Git (source of truth)              │
│                                                                              │
│  GitOps Core Principles:                                                    │
│  1. Declarative: Desired state described in Git (YAML)                      │
│  2. Versioned: All changes go through Git (audit trail)                     │
│  3. Automated: Changes auto-applied by the operator                         │
│  4. Self-healing: Drift is automatically corrected                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Argo CD Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Argo CD Architecture                                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    Argo CD (in-cluster)                           │    │
│  │                                                                  │    │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌────────────────┐  │    │
│  │  │ API Server     │  │ Repo Server      │  │ Application    │  │    │
│  │  │                │  │                  │  │ Controller     │  │    │
│  │  │ UI / CLI / API │  │ Clones Git repos │  │                │  │    │
│  │  │ Authentication │  │ Renders manifests│  │ Watches Git    │  │    │
│  │  │ RBAC           │  │ (Helm, Kustomize,│  │ Compares with  │  │    │
│  │  │                │  │  plain YAML)     │  │  cluster state │  │    │
│  │  │                │  │                  │  │ Syncs changes  │  │    │
│  │  └────────────────┘  └──────────────────┘  └────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                │                              │                          │
│                │ UI/API                        │ kubectl apply            │
│                ▼                              ▼                          │
│  ┌──────────────────┐              ┌──────────────────────┐             │
│  │ Browser / CLI    │              │ Kubernetes Cluster    │             │
│  │ (argocd CLI)     │              │ (target)              │             │
│  └──────────────────┘              └──────────────────────┘             │
│                                               ▲                          │
│                                               │                          │
│                                    ┌──────────┴──────────┐              │
│                                    │ Git Repository       │              │
│                                    │ (Source of Truth)     │              │
│                                    │                      │              │
│                                    │ k8s-manifests/       │              │
│                                    │ ├── base/            │              │
│                                    │ └── overlays/prod/   │              │
│                                    └─────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Installing Argo CD

```bash
# Install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# → Open https://localhost:8080 → Login: admin / <password>

# Install argocd CLI
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd && sudo mv argocd /usr/local/bin/

# Login via CLI
argocd login localhost:8080 --insecure
argocd account update-password
```

---

## 4. Creating Argo CD Applications

### 4.1 Application CRD (Declarative)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: web-app
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io    # Cascade delete on app deletion
spec:
  project: default

  source:
    repoURL: https://github.com/org/k8s-manifests.git
    targetRevision: main                       # Branch/tag/commit
    path: overlays/production                  # Path in repo

  destination:
    server: https://kubernetes.default.svc     # In-cluster
    namespace: production

  syncPolicy:
    automated:
      prune: true                              # Delete resources removed from Git
      selfHeal: true                           # Revert manual cluster changes
    syncOptions:
    - CreateNamespace=true                     # Create namespace if it doesn't exist
    - PrunePropagationPolicy=foreground
    retry:
      limit: 3
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### 4.2 Application with Helm

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: prometheus
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://prometheus-community.github.io/helm-charts
    chart: kube-prometheus-stack
    targetRevision: "55.0.0"
    helm:
      releaseName: monitoring
      values: |
        grafana:
          enabled: true
          adminPassword: admin
        prometheus:
          prometheusSpec:
            retention: 15d
            storageSpec:
              volumeClaimTemplate:
                spec:
                  storageClassName: gp3
                  resources:
                    requests:
                      storage: 50Gi
  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
  syncPolicy:
    automated:
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

---

## 5. ApplicationSets (Multi-Environment)

```yaml
# Deploy same app to dev, staging, and production
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: web-app-set
  namespace: argocd
spec:
  generators:
  - list:
      elements:
      - env: dev
        namespace: dev
        branch: develop
        replicas: "1"
      - env: staging
        namespace: staging
        branch: main
        replicas: "2"
      - env: production
        namespace: production
        branch: main
        replicas: "5"
  template:
    metadata:
      name: 'web-app-{{env}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/org/k8s-manifests.git
        targetRevision: '{{branch}}'
        path: 'overlays/{{env}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          selfHeal: true
          prune: true
```

---

## 6. Sync Statuses and Health

```
Sync Status:
  Synced      → Cluster state matches Git
  OutOfSync   → Cluster state differs from Git
  Unknown     → Cannot determine status

Health Status:
  Healthy     → All resources are healthy (Pods Running, Services have endpoints)
  Progressing → Resources are being created/updated (Deployment rolling out)
  Degraded    → Resources are unhealthy (Pods CrashLoopBackOff)
  Suspended   → Application sync is paused
  Missing     → Resources in Git don't exist in cluster

Self-Healing:
  If someone runs "kubectl edit" to manually change a Deployment,
  Argo CD detects the drift (OutOfSync) and reverts it back to
  match Git within 3 minutes (default reconciliation interval).
```

---

## 7. Interview Questions

### Q1: What is GitOps and how does Argo CD implement it?

**Expected Answer:**
GitOps is an operational framework where Git is the single source of truth for declarative infrastructure and application state. Argo CD implements GitOps by continuously watching a Git repository and comparing the desired state (in Git) with the actual state (in the cluster). When they differ, Argo CD automatically synchronizes the cluster to match Git. Key features: automated sync (no manual kubectl), self-healing (reverts manual changes), audit trail (every change is a Git commit), and PR-based workflows (changes require code review).

---

### Q2: What is the difference between push-based and pull-based CD?

**Expected Answer:**
**Push-based:** The CI pipeline pushes changes to the cluster (e.g., `kubectl apply` from Jenkins/GitHub Actions). Requires cluster credentials in the pipeline. Risk of drift if someone changes the cluster manually.

**Pull-based (GitOps):** An operator inside the cluster (Argo CD) pulls changes from Git and applies them. Cluster credentials stay inside the cluster (more secure). Self-healing prevents drift. Git history provides complete audit trail.

---

## 8. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **GitOps** | Git is the source of truth; operator syncs cluster to Git |
| **Argo CD** | K8s-native GitOps tool; watches Git, auto-deploys |
| **Application** | CRD defining source (Git) → destination (cluster/namespace) |
| **Automated Sync** | Auto-apply Git changes; self-heal manual drift |
| **ApplicationSet** | Deploy same app across multiple environments/clusters |
| **Workflow** | Developer → PR → Merge to main → Argo CD auto-deploys |

---

## 9. Practice Assignment

1. Install Argo CD on a cluster. Access the UI and CLI.
2. Create an Application pointing to a Git repo with plain YAML manifests. Enable auto-sync.
3. Make a change in Git (update replica count). Verify Argo CD auto-deploys.
4. Manually edit a Deployment in the cluster. Observe self-healing.
5. Create an Application using a Helm chart from a public repository.
6. Create an ApplicationSet that deploys to dev, staging, and production namespaces.
