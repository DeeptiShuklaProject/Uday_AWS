# Level 24 — Monitoring, Logging & Observability

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate → Advanced |
| **Theory Duration** | 8 hours |
| **Practical Duration** | 8 hours |
| **Prerequisites** | Level 23 — GitOps with Argo CD |
| **Lab Required** | Yes — K8s cluster with Helm |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Critical for SRE/DevOps roles |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — "No observability = no production" |
| **Certification Alignment** | CKA, AWS DevOps Engineer |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain the three pillars of observability (metrics, logs, traces).
2. Deploy Prometheus + Grafana for metrics and dashboards.
3. Configure alerting with Alertmanager.
4. Implement centralized logging with Fluent Bit and CloudWatch/EFK.
5. Understand distributed tracing concepts (Jaeger, OpenTelemetry).
6. Design a production observability stack for EKS.

---

## 1. Three Pillars of Observability

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Three Pillars of Observability                         │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │     METRICS          │  │     LOGS             │  │     TRACES       │  │
│  │                     │  │                     │  │                 │  │
│  │  "What is happening"│  │  "What happened"     │  │  "Why is it     │  │
│  │                     │  │                     │  │   slow?"        │  │
│  │  • CPU usage        │  │  • Application logs  │  │                 │  │
│  │  • Memory usage     │  │  • Error messages     │  │  • Request flow │  │
│  │  • Request rate     │  │  • Access logs        │  │    across       │  │
│  │  • Error rate       │  │  • Audit logs         │  │    services     │  │
│  │  • Latency (P99)    │  │  • Event logs         │  │  • Latency per  │  │
│  │                     │  │                     │  │    service      │  │
│  │  Tool: Prometheus   │  │  Tool: Fluent Bit    │  │  Tool: Jaeger   │  │
│  │  Display: Grafana   │  │  Store: CloudWatch   │  │  or Tempo       │  │
│  │  Alert: Alertmanager│  │  Query: CloudWatch    │  │                 │  │
│  │                     │  │  Insights            │  │                 │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prometheus — Metrics Collection

### 2.1 Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                    Prometheus Architecture                             │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    Prometheus Server                            │  │
│  │                                                                │  │
│  │  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐ │  │
│  │  │ Scrape   │    │ Time Series  │    │ PromQL Query Engine │ │  │
│  │  │ Engine   │    │ Database     │    │                      │ │  │
│  │  │          │    │ (TSDB)       │    │ rate(http_requests   │ │  │
│  │  │ Pull     │    │              │    │ _total[5m])          │ │  │
│  │  │ metrics  │    │ Stores all   │    │                      │ │  │
│  │  │ from     │    │ metrics with │    │                      │ │  │
│  │  │ targets  │    │ timestamps   │    │                      │ │  │
│  │  └──────┬───┘    └──────────────┘    └──────────┬───────────┘ │  │
│  │         │                                       │              │  │
│  └─────────┼───────────────────────────────────────┼──────────────┘  │
│            │ scrape every 15s                      │ query           │
│            ▼                                       ▼                 │
│  ┌──────────────────┐                    ┌──────────────────────┐   │
│  │ Targets:          │                    │ Grafana              │   │
│  │ • Node Exporter   │                    │ (Visualization)      │   │
│  │ • kube-state-     │                    │                      │   │
│  │   metrics         │                    │ Dashboards, graphs   │   │
│  │ • App /metrics    │                    │ alerts, panels       │   │
│  │ • cAdvisor        │                    └──────────────────────┘   │
│  └──────────────────┘                                                │
│                                           ┌──────────────────────┐   │
│                                           │ Alertmanager          │   │
│                                           │ (Notifications)       │   │
│                                           │ → Slack, PagerDuty,  │   │
│                                           │   email, webhook      │   │
│                                           └──────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

### 2.2 Installing kube-prometheus-stack

```bash
# Install Prometheus + Grafana + Alertmanager (all-in-one)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=15d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=gp3 \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi

# Access Grafana
kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring
# → Open http://localhost:3000 → Login: admin / admin
```

### 2.3 Key Metrics

| Metric | What It Tells You | PromQL Example |
| :--- | :--- | :--- |
| `container_cpu_usage_seconds_total` | CPU usage per container | `rate(container_cpu_usage_seconds_total{pod="web-app"}[5m])` |
| `container_memory_working_set_bytes` | Memory usage per container | `container_memory_working_set_bytes{pod="web-app"}` |
| `kube_pod_status_phase` | Pod phase (Running, Pending, etc.) | `kube_pod_status_phase{phase="Pending"} > 0` |
| `kube_deployment_status_replicas_unavailable` | Unavailable replicas | `kube_deployment_status_replicas_unavailable > 0` |
| `kubelet_running_pods` | Pods per node | `kubelet_running_pods` |
| `node_cpu_seconds_total` | Node CPU | `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` |

---

## 3. Alerting with Alertmanager

```yaml
# PrometheusRule (defines when to fire alerts)
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: critical-alerts
  namespace: monitoring
spec:
  groups:
  - name: kubernetes-apps
    rules:
    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[15m]) * 60 * 5 > 0
      for: 15m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash-looping"
        description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has been restarting."

    - alert: HighCPUUsage
      expr: (sum(rate(container_cpu_usage_seconds_total[5m])) by (pod) / sum(kube_pod_container_resource_requests{resource="cpu"}) by (pod)) * 100 > 90
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage on Pod {{ $labels.pod }}"

    - alert: DeploymentReplicasMismatch
      expr: kube_deployment_spec_replicas != kube_deployment_status_ready_replicas
      for: 10m
      labels:
        severity: critical
      annotations:
        summary: "Deployment {{ $labels.deployment }} has mismatched replicas"
```

---

## 4. Centralized Logging

### 4.1 EKS Logging Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    EKS Logging Architecture                              │
│                                                                          │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────────────┐  │
│  │ Pod stdout/  │──►│ Fluent Bit     │──►│ CloudWatch Logs          │  │
│  │ stderr       │   │ (DaemonSet)    │   │                          │  │
│  │              │   │                │   │ Log Group:               │  │
│  │ App logs     │   │ Parses, filters│   │ /aws/eks/cluster/app     │  │
│  │ written to   │   │ enriches with  │   │                          │  │
│  │ stdout       │   │ K8s metadata   │   │ Query with CloudWatch    │  │
│  │              │   │ (pod, ns, node)│   │ Logs Insights            │  │
│  └──────────────┘   └────────────────┘   └──────────────────────────┘  │
│                                                                          │
│  Alternative: EFK Stack (Self-Managed)                                   │
│  ┌──────────────┐   ┌────────────┐   ┌─────────────┐   ┌───────────┐  │
│  │ Pods         │──►│ Fluent Bit │──►│ Elasticsearch│──►│ Kibana    │  │
│  └──────────────┘   └────────────┘   └─────────────┘   └───────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Fluent Bit on EKS

```bash
# Install Fluent Bit for CloudWatch
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonSet/container-insights-monitoring/fluent-bit/fluent-bit.yaml

# Or install via Helm
helm repo add fluent https://fluent.github.io/helm-charts
helm install fluent-bit fluent/fluent-bit \
  -n logging --create-namespace \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::123456789012:role/FluentBitRole
```

---

## 5. Essential Grafana Dashboards

| Dashboard | ID | Shows |
| :--- | :--- | :--- |
| **Kubernetes Cluster Overview** | 7249 | Cluster resource usage, node status |
| **Pod Overview** | 15760 | Pod CPU, memory, network, restarts |
| **Node Exporter** | 1860 | Node-level CPU, memory, disk, network |
| **NGINX Ingress** | 9614 | Request rate, error rate, latency per ingress |
| **CoreDNS** | 15762 | DNS query rate, latency, errors |

```bash
# Import dashboard in Grafana:
# → Dashboards → Import → Enter dashboard ID → Select Prometheus data source
```

---

## 6. Interview Questions

### Q1: How would you set up monitoring for a Kubernetes cluster?

**Expected Answer:**
Deploy the **kube-prometheus-stack** (Prometheus + Grafana + Alertmanager) via Helm. Prometheus scrapes metrics from node-exporter (node metrics), kube-state-metrics (K8s object metrics), and cAdvisor (container metrics). Grafana provides dashboards. Alertmanager sends notifications (Slack, PagerDuty) when thresholds are breached. For EKS, also enable Control Plane logging to CloudWatch and deploy Fluent Bit for application log shipping.

Key metrics to monitor: Pod CPU/memory usage, Pod restart count, Deployment replica availability, node resource utilization, and API server latency.

---

### Q2: What are the three pillars of observability?

**Expected Answer:**
1. **Metrics** (Prometheus): Numeric measurements over time — CPU, memory, request rate, error rate, latency percentiles. Used for dashboards and alerting.
2. **Logs** (Fluent Bit + CloudWatch/EFK): Textual records of events — application errors, audit events, access logs. Used for debugging specific incidents.
3. **Traces** (Jaeger/Tempo/X-Ray): End-to-end request flow across microservices with timing. Used for performance analysis and identifying bottlenecks in distributed systems.

All three are needed: metrics tell you something is wrong, logs tell you what happened, traces tell you where the bottleneck is.

---

## 7. Summary

| Component | Tool | Purpose |
| :--- | :--- | :--- |
| **Metrics** | Prometheus | Scrape and store time-series metrics |
| **Dashboards** | Grafana | Visualize metrics, create dashboards |
| **Alerting** | Alertmanager | Send notifications on threshold breaches |
| **Logging** | Fluent Bit + CloudWatch | Centralized log aggregation |
| **Tracing** | Jaeger / AWS X-Ray | Distributed request tracing |
| **Control Plane** | CloudWatch Logs | EKS API server, audit, scheduler logs |

---

## 8. Practice Assignment

1. Install kube-prometheus-stack via Helm. Access Grafana and import the Cluster Overview dashboard.
2. Create a PrometheusRule that alerts when any Pod is in CrashLoopBackOff for more than 5 minutes.
3. Write PromQL to calculate the 95th percentile request latency for an application.
4. Deploy Fluent Bit and verify application logs appear in CloudWatch (or Elasticsearch).
5. Configure Alertmanager to send alerts to a Slack channel.
6. Create a custom Grafana dashboard for a specific application (CPU, memory, request rate, error rate).
