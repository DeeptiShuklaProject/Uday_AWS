# Level 19 — Git for DevOps & Kubernetes

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Beginner → Intermediate |
| **Theory Duration** | 4 hours |
| **Practical Duration** | 4 hours |
| **Prerequisites** | Level 18 — EKS Networking |
| **Lab Required** | Yes — Git + GitHub/GitLab account |
| **Interview Importance** | ⭐⭐⭐⭐ (4/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Foundation for GitOps |
| **Certification Alignment** | DevOps Engineer certifications |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Use Git effectively for infrastructure and Kubernetes manifest management.
2. Implement branching strategies suitable for DevOps (GitFlow, trunk-based).
3. Structure Kubernetes manifest repositories following best practices.
4. Implement Git-based workflows for manifest review and approval.
5. Understand Git as the foundation for GitOps (Argo CD, Flux).

---

## 1. Git Essentials for DevOps

### 1.1 Key Commands

```bash
# Repository setup
git init
git clone https://github.com/org/k8s-manifests.git

# Daily workflow
git status                          # Check file status
git add -A                          # Stage all changes
git commit -m "feat: add redis deployment for caching layer"
git push origin main

# Branching
git checkout -b feature/redis-cache   # Create and switch to new branch
git checkout main                     # Switch to main branch
git merge feature/redis-cache         # Merge feature into main
git branch -d feature/redis-cache     # Delete merged branch

# Viewing history
git log --oneline -20               # Last 20 commits
git diff HEAD~1                     # Changes in last commit
git blame deployment.yaml           # Who changed each line
```

### 1.2 Commit Message Convention

```
Type: Description (max 50 chars)

Types:
  feat:     New feature / resource
  fix:      Bug fix / config fix
  chore:    Maintenance (update deps, cleanup)
  docs:     Documentation
  refactor: Restructure without changing behavior
  security: Security-related changes

Examples:
  feat: add HPA for web-app deployment
  fix: correct memory limit on postgres StatefulSet
  security: restrict RBAC for dev namespace
  chore: upgrade nginx image from 1.25 to 1.26
```

---

## 2. Repository Structure for Kubernetes

### 2.1 Recommended Layout

```
k8s-manifests/
├── base/                           # Base manifests (shared across environments)
│   ├── deployments/
│   │   ├── web-app.yaml
│   │   ├── api-server.yaml
│   │   └── redis.yaml
│   ├── services/
│   │   ├── web-app-svc.yaml
│   │   └── api-server-svc.yaml
│   ├── configmaps/
│   │   └── app-config.yaml
│   └── namespace.yaml
│
├── overlays/                       # Environment-specific overrides (Kustomize)
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   ├── replicas-patch.yaml
│   │   └── configmap-patch.yaml
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── replicas-patch.yaml
│   └── production/
│       ├── kustomization.yaml
│       ├── replicas-patch.yaml
│       ├── hpa.yaml
│       └── pdb.yaml
│
├── charts/                         # Helm charts (if using Helm)
│   └── web-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-prod.yaml
│       └── templates/
│
└── README.md
```

### 2.2 Branching Strategy

```
Trunk-Based Development (Recommended for GitOps):

  main ──●──●──●──●──●──●──●──●──● (always deployable)
          \     / \     /
           ●──●   ●──●
          (short-lived feature branches, < 1 day)

  • All changes go through Pull Requests with review
  • main branch is the source of truth for production
  • Argo CD / Flux watches main and auto-deploys
  • Feature branches are short-lived (merged within hours/1 day)

GitFlow (Traditional, for release-based workflows):

  main ────────●────────────────●──── (releases)
               │                │
  develop ──●──●──●──●──●──●──●──── (integration)
             \   / \       /
              ●─●   ●──●──●
             (feature branches)
```

---

## 3. Pull Request Workflow for K8s Changes

```
Developer's workflow for a Kubernetes config change:

1. Create feature branch
   git checkout -b feat/increase-replicas

2. Modify manifests
   Edit deployment.yaml: replicas: 3 → replicas: 5

3. Commit and push
   git add -A && git commit -m "feat: scale web-app to 5 replicas for traffic spike"
   git push origin feat/increase-replicas

4. Open Pull Request
   → Automated checks run:
     • YAML lint (yamllint)
     • Kubernetes manifest validation (kubeval, kubeconform)
     • Policy check (OPA conftest — e.g., "must have resource limits")
     • Cost estimation (Infracost for Terraform changes)

5. Code Review
   → Team reviews the change, approves

6. Merge to main
   → GitOps tool (Argo CD) detects change and applies to cluster

7. Monitor
   → Verify deployment via kubectl, dashboards, alerts
```

---

## 4. Interview Questions

### Q1: Why is Git important for Kubernetes operations?

**Expected Answer:**
Git serves as the **single source of truth** for cluster configuration. All Kubernetes manifests are stored in Git, providing version history, audit trail, code review via PRs, and rollback capability. This is the foundation of GitOps — tools like Argo CD and Flux continuously reconcile the cluster state to match what's in Git. Any change to the cluster goes through Git, making operations reproducible, auditable, and collaborative.

---

## 5. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **Git** | Source of truth for all Kubernetes manifests and IaC |
| **Branching** | Trunk-based (recommended for GitOps) or GitFlow |
| **Repo Structure** | base/ + overlays/ (Kustomize) or charts/ (Helm) |
| **PR Workflow** | Code review + automated validation before merge |
| **GitOps Foundation** | Git → PR → Merge → Argo CD auto-deploys |

---

## 6. Practice Assignment

1. Create a Git repository with the recommended K8s manifest structure.
2. Create a feature branch, modify a Deployment, and open a PR.
3. Add a pre-commit hook that validates YAML files before committing.
4. Set up a GitHub Actions workflow that runs `kubeconform` on every PR.
