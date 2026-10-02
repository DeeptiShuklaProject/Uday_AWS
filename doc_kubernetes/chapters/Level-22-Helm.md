# Level 22 — Helm: Kubernetes Package Manager

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate |
| **Theory Duration** | 5 hours |
| **Practical Duration** | 5 hours |
| **Prerequisites** | Level 21 — Terraform |
| **Lab Required** | Yes — Any K8s cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — De facto standard for K8s packaging |
| **Certification Alignment** | CKA, CKAD |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain Helm concepts: charts, releases, repositories, templates.
2. Install, upgrade, rollback, and uninstall Helm releases.
3. Create custom Helm charts with templates and values.
4. Use Helm functions, conditionals, and loops in templates.
5. Manage chart dependencies and subcharts.
6. Use Helm with Argo CD for GitOps.

---

## 1. Helm Concepts

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Helm Architecture                                     │
│                                                                          │
│  Chart (Package):                                                        │
│  ├── A bundle of Kubernetes YAML templates + default values             │
│  ├── Like an "apt package" for Kubernetes                               │
│  └── Published to chart repositories (public or private)                │
│                                                                          │
│  Release (Installed Instance):                                           │
│  ├── A chart installed with specific values in a namespace              │
│  ├── You can install the same chart multiple times (each is a release)  │
│  └── Has version history for rollbacks                                  │
│                                                                          │
│  Repository (Chart Store):                                               │
│  ├── HTTP server hosting chart packages (.tgz)                          │
│  ├── Like DockerHub for images, but for Helm charts                     │
│  └── Examples: Bitnami, eks-charts, prometheus-community                │
│                                                                          │
│  Values (Configuration):                                                 │
│  ├── Key-value pairs that customize a chart for your environment        │
│  ├── Override defaults with --set or -f values.yaml                     │
│  └── Same chart → different values → dev / staging / production         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Helm Commands

```bash
# ─── Repository Management ──────────────────────────────────
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus https://prometheus-community.github.io/helm-charts
helm repo update
helm repo list
helm search repo nginx

# ─── Install ────────────────────────────────────────────────
helm install my-nginx bitnami/nginx \
  --namespace production \
  --create-namespace \
  --set replicaCount=3 \
  --set service.type=ClusterIP

# Install with custom values file
helm install my-app ./my-chart -f values-production.yaml

# ─── Upgrade ────────────────────────────────────────────────
helm upgrade my-nginx bitnami/nginx \
  --namespace production \
  --set replicaCount=5 \
  --set image.tag=1.26

# Upgrade or install if not exists
helm upgrade --install my-nginx bitnami/nginx -n production

# ─── Rollback ───────────────────────────────────────────────
helm history my-nginx -n production
helm rollback my-nginx 1 -n production

# ─── Uninstall ──────────────────────────────────────────────
helm uninstall my-nginx -n production

# ─── Status & Debug ─────────────────────────────────────────
helm list -n production
helm status my-nginx -n production
helm get values my-nginx -n production
helm get manifest my-nginx -n production     # See rendered YAML

# ─── Template Rendering (dry-run) ───────────────────────────
helm template my-nginx bitnami/nginx --set replicaCount=3
helm install my-nginx bitnami/nginx --dry-run --debug
```

---

## 3. Creating a Custom Helm Chart

### 3.1 Chart Structure

```bash
helm create my-web-app

my-web-app/
├── Chart.yaml                  # Chart metadata (name, version, description)
├── values.yaml                 # Default configuration values
├── charts/                     # Dependencies (subcharts)
├── templates/                  # K8s manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── serviceaccount.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl            # Template helper functions
│   ├── NOTES.txt               # Post-install notes shown to user
│   └── tests/
│       └── test-connection.yaml
└── .helmignore                 # Files to exclude from packaging
```

### 3.2 Chart.yaml

```yaml
apiVersion: v2
name: my-web-app
description: A Helm chart for my web application
type: application
version: 1.0.0              # Chart version (increment on chart changes)
appVersion: "2.0.0"          # Application version (your app version)

dependencies:
- name: redis
  version: "18.x.x"
  repository: https://charts.bitnami.com/bitnami
  condition: redis.enabled
```

### 3.3 values.yaml

```yaml
# values.yaml — defaults (overridden per environment)
replicaCount: 2

image:
  repository: 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-web-app
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
  hosts:
  - host: app.example.com
    paths:
    - path: /
      pathType: Prefix

resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
  limits:
    cpu: "1000m"
    memory: "512Mi"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

redis:
  enabled: true                  # Enable Redis subchart
```

### 3.4 Template Example

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-web-app.fullname" . }}
  labels:
    {{- include "my-web-app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-web-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-web-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.service.targetPort }}
        {{- if .Values.resources }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
        {{- end }}
```

---

## 4. Helm Functions and Flow Control

```yaml
# ─── Conditionals ────────────────────────────────────────────
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
...
{{- end }}

# ─── Loops ───────────────────────────────────────────────────
{{- range .Values.ingress.hosts }}
  - host: {{ .host }}
    http:
      paths:
      {{- range .paths }}
      - path: {{ .path }}
        pathType: {{ .pathType }}
      {{- end }}
{{- end }}

# ─── Default values ─────────────────────────────────────────
{{ .Values.service.port | default 80 }}

# ─── Quoting ────────────────────────────────────────────────
{{ .Values.name | quote }}

# ─── Indentation ────────────────────────────────────────────
{{ toYaml .Values.resources | nindent 10 }}
```

---

## 5. Environment Overrides

```bash
# Same chart, different values per environment:
helm upgrade --install my-app ./my-web-app -f values-dev.yaml -n dev
helm upgrade --install my-app ./my-web-app -f values-prod.yaml -n production
```

```yaml
# values-dev.yaml
replicaCount: 1
image:
  tag: "dev-latest"
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
autoscaling:
  enabled: false
ingress:
  hosts:
  - host: dev.app.example.com
```

```yaml
# values-prod.yaml
replicaCount: 3
image:
  tag: "v2.0.0"
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
ingress:
  hosts:
  - host: app.example.com
```

---

## 6. Interview Questions

### Q1: What is Helm and why is it used?

**Expected Answer:**
Helm is the package manager for Kubernetes. It packages multiple K8s manifests (Deployment, Service, ConfigMap, etc.) into a **chart** — a reusable, versioned bundle with configurable values. Benefits: (1) Templating eliminates YAML duplication across environments. (2) Values files allow the same chart for dev/staging/prod. (3) Release management provides upgrade/rollback history. (4) Dependency management bundles subcharts (e.g., Redis, PostgreSQL). (5) Large ecosystem of community charts (Bitnami, Prometheus, etc.).

---

### Q2: How do you rollback a Helm release?

**Expected Answer:**
`helm rollback <release-name> <revision-number>`. First, check history with `helm history <release-name>` to see available revisions. Helm stores the rendered manifests for each revision, so rollback reapplies the previous revision's manifests. This is similar to `kubectl rollout undo` but manages ALL resources in the chart (not just Deployments).

---

## 7. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **Chart** | Package of K8s templates + default values |
| **Release** | Installed instance of a chart in a namespace |
| **Values** | Override defaults per environment (dev/staging/prod) |
| **Templates** | Go-templated K8s YAML with functions and conditionals |
| **Commands** | `install`, `upgrade`, `rollback`, `uninstall`, `template` |
| **Workflow** | Create chart → values per env → `helm upgrade --install` |

---

## 8. Practice Assignment

1. Install NGINX from the Bitnami Helm chart. Customize replicas and service type.
2. Create a custom Helm chart for a web application with Deployment, Service, and Ingress templates.
3. Create `values-dev.yaml` and `values-prod.yaml` with different configurations.
4. Deploy your chart to two namespaces (dev and prod) with different values.
5. Upgrade the chart version and rollback to the previous release.
6. Add a Redis dependency subchart. Enable/disable it via values.
