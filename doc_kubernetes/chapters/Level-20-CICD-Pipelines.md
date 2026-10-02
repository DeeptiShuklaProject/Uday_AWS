# Level 20 — CI/CD Pipelines for Kubernetes

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate |
| **Theory Duration** | 6 hours |
| **Practical Duration** | 8 hours |
| **Prerequisites** | Level 19 — Git for DevOps |
| **Lab Required** | Yes — GitHub/GitLab + K8s cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | AWS DevOps Engineer, DevOps certifications |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Design end-to-end CI/CD pipelines for containerized applications.
2. Implement CI with GitHub Actions (build, test, scan, push to ECR).
3. Implement CD with Kubernetes deployment (rolling update, canary).
4. Integrate security scanning into the pipeline (Trivy, SAST, DAST).
5. Implement pipeline best practices (image tagging, rollback, notifications).

---

## 1. CI/CD Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline for Kubernetes                             │
│                                                                              │
│  ┌─────────┐   ┌──────────────────────────────────────────────────────────┐ │
│  │Developer│   │                    CI (Build & Test)                      │ │
│  │         │   │                                                          │ │
│  │ git push│──►│ 1. Code checkout                                        │ │
│  │         │   │ 2. Unit tests                                           │ │
│  └─────────┘   │ 3. Static analysis (SonarQube, ESLint)                  │ │
│                │ 4. Build Docker image                                   │ │
│                │ 5. Security scan (Trivy — CVE detection)                │ │
│                │ 6. Push image to ECR (tag: git-sha + semver)            │ │
│                │ 7. Update K8s manifest with new image tag               │ │
│                └──────────────────────┬───────────────────────────────────┘ │
│                                       │                                      │
│                                       ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                    CD (Deploy & Verify)                                  ││
│  │                                                                          ││
│  │  Option A: Push-based CD (GitHub Actions / Jenkins)                     ││
│  │  └── kubectl apply / helm upgrade to cluster                            ││
│  │                                                                          ││
│  │  Option B: Pull-based CD (GitOps — Argo CD / Flux)                      ││
│  │  └── Argo CD watches Git repo and auto-syncs to cluster                 ││
│  │                                                                          ││
│  │  Post-deploy:                                                           ││
│  │  8. Run smoke tests / integration tests                                 ││
│  │  9. Monitor metrics (error rate, latency)                               ││
│  │  10. Rollback if health checks fail                                     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: 123456789012.dkr.ecr.us-east-1.amazonaws.com
  ECR_REPOSITORY: myapp
  EKS_CLUSTER: production-cluster

jobs:
  build-test-push:
    runs-on: ubuntu-latest
    steps:
    # 1. Checkout code
    - name: Checkout
      uses: actions/checkout@v4

    # 2. Run unit tests
    - name: Unit Tests
      run: |
        npm install
        npm test

    # 3. Configure AWS credentials
    - name: Configure AWS
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
        aws-region: ${{ env.AWS_REGION }}

    # 4. Login to ECR
    - name: Login to ECR
      id: ecr-login
      uses: aws-actions/amazon-ecr-login@v2

    # 5. Build Docker image
    - name: Build Image
      env:
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
                   $ECR_REGISTRY/$ECR_REPOSITORY:latest

    # 6. Security scan with Trivy
    - name: Trivy Scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: '${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}'
        format: 'table'
        exit-code: '1'               # Fail pipeline on CRITICAL vulnerabilities
        severity: 'CRITICAL,HIGH'

    # 7. Push to ECR
    - name: Push Image
      env:
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

    # 8. Update Kubernetes manifest (for GitOps)
    - name: Update K8s Manifest
      env:
        IMAGE_TAG: ${{ github.sha }}
      run: |
        git clone https://github.com/org/k8s-manifests.git
        cd k8s-manifests
        sed -i "s|image: .*|image: $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG|" \
          overlays/production/deployment.yaml
        git add -A
        git commit -m "chore: update image to $IMAGE_TAG"
        git push
        # Argo CD will detect this change and deploy automatically
```

---

## 3. Image Tagging Strategy

```
WRONG approach:
  myapp:latest           ← NEVER use 'latest' in production
  myapp:v1               ← Mutable tags can be overwritten

CORRECT approach:
  myapp:abc123def         ← Git SHA (immutable, traceable to commit)
  myapp:v1.2.3            ← Semantic version (for releases)
  myapp:v1.2.3-abc123def  ← Best: version + SHA

Benefits:
  • Immutable: Same tag always points to the same image
  • Traceable: Image tag → Git commit → code change → PR → author
  • Rollback: Deploy any previous tag instantly
```

---

## 4. Jenkins Pipeline (Alternative)

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '123456789012.dkr.ecr.us-east-1.amazonaws.com'
        IMAGE_NAME = 'myapp'
        IMAGE_TAG = "${env.GIT_COMMIT.take(7)}"
    }
    
    stages {
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Build') {
            steps {
                sh "docker build -t ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }
        stage('Scan') {
            steps {
                sh "trivy image --exit-code 1 --severity CRITICAL ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }
        stage('Push') {
            steps {
                sh "aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                sh "docker push ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }
        stage('Deploy') {
            steps {
                sh "kubectl set image deployment/myapp myapp=${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                sh "kubectl rollout status deployment/myapp --timeout=300s"
            }
        }
    }
}
```

---

## 5. DevSecOps — Security in the Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    DevSecOps Pipeline                                    │
│                                                                          │
│  Pre-Commit:                                                             │
│  ├── git-secrets: Detect AWS keys, passwords in code                    │
│  └── pre-commit hooks: YAML lint, Dockerfile lint                       │
│                                                                          │
│  CI (Build time):                                                        │
│  ├── SAST: SonarQube, Semgrep (static code analysis)                    │
│  ├── Dependency scan: Snyk, Dependabot (vulnerable packages)            │
│  ├── Image scan: Trivy, Grype (OS + app CVEs)                          │
│  ├── Dockerfile lint: hadolint (best practices)                         │
│  └── K8s manifest lint: kubeconform, OPA conftest                       │
│                                                                          │
│  CD (Deploy time):                                                       │
│  ├── Admission controllers: Kyverno, OPA Gatekeeper (enforce policies)  │
│  ├── Image signing: cosign / Notary (verify image integrity)            │
│  └── Registry restriction: Only allow images from approved registries   │
│                                                                          │
│  Runtime:                                                                │
│  ├── Falco: Runtime threat detection (suspicious syscalls)              │
│  ├── Network Policies: Zero-trust Pod networking                        │
│  └── Audit logging: Track all API server access                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Interview Questions

### Q1: Describe a CI/CD pipeline for deploying to Kubernetes.

**Expected Answer:**
**CI phase:** Developer pushes code → Pipeline triggers → Run unit tests → Build Docker image → Scan for vulnerabilities (Trivy) → Push image to ECR with immutable tag (git SHA) → Update K8s manifest in Git with new image tag.

**CD phase:** Two approaches:
- **Push-based:** Pipeline runs `kubectl apply` or `helm upgrade` directly (simpler but less secure — pipeline needs cluster credentials).
- **Pull-based (GitOps):** Argo CD watches the manifest Git repo and automatically syncs changes to the cluster (more secure — no cluster credentials outside the cluster).

Post-deploy: Run smoke tests, monitor error rate and latency, auto-rollback if health checks fail.

---

### Q2: Why should you never use the `latest` tag in production?

**Expected Answer:**
The `latest` tag is mutable — it gets overwritten with every new push. Problems: (1) You can't tell which version is running by looking at the tag. (2) Different nodes may pull different versions if caching is inconsistent. (3) Rollback is impossible — there's no previous `latest` to revert to. (4) `imagePullPolicy: Always` is required, adding pull latency. Use immutable tags like Git SHA (`abc123def`) or semantic version (`v1.2.3`).

---

## 7. Best Practices

1. **Use immutable image tags** (Git SHA or semantic version).
2. **Scan images in the pipeline** before pushing to registry.
3. **Use multi-stage Docker builds** to minimize image size and attack surface.
4. **Prefer GitOps (pull-based CD)** over push-based deployment.
5. **Never store secrets in Git** — use External Secrets Operator or Sealed Secrets.
6. **Run tests before building** — fail fast on code errors.
7. **Pin base image versions** in Dockerfiles.

---

## 8. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **CI** | Build → Test → Scan → Push immutable image to registry |
| **CD (Push)** | Pipeline deploys directly via kubectl/helm |
| **CD (Pull/GitOps)** | Argo CD watches Git and auto-syncs to cluster |
| **DevSecOps** | Security at every stage: pre-commit, build, deploy, runtime |
| **Image Tags** | Immutable (Git SHA or semver); never use `latest` |
| **Tools** | GitHub Actions, Jenkins, Trivy, SonarQube, Argo CD |

---

## 9. Practice Assignment

1. Create a GitHub Actions workflow that builds a Docker image and pushes it to ECR.
2. Add Trivy scanning to the pipeline. Configure it to fail on CRITICAL vulnerabilities.
3. Implement an image tagging strategy using Git SHA.
4. Set up a pipeline that updates a K8s manifest repo with the new image tag (for GitOps).
5. Add a deployment verification step that checks rollout status and rolls back on failure.
