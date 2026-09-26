<!-- TODO: Rewrite and humanize content from 12-monitoring\module-38-cloud-monitoring.md, 12-monitoring\module-39-prometheus-grafana.md -->

# Module 38 — Cloud Monitoring

## 1. Chapter Introduction
On-premises monitoring with `psutil` works for individual servers, but in the cloud, you need to monitor hundreds of resources across multiple regions. In this module, we will learn how to use Python to interact with cloud-native monitoring services—AWS CloudWatch, Azure Monitor, and GCP Cloud Monitoring—to query metrics, create alarms, and build custom dashboards programmatically.

## 2. DevOps Example: Query AWS CloudWatch Metrics
```python
import boto3
from datetime import datetime, timedelta

def get_cpu_metrics(instance_id, region="us-east-1"):
    cw = boto3.client("cloudwatch", region_name=region)
    response = cw.get_metric_statistics(
        Namespace="AWS/EC2",
        MetricName="CPUUtilization",
        Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
        StartTime=datetime.utcnow() - timedelta(hours=1),
        EndTime=datetime.utcnow(),
        Period=300,
        Statistics=["Average"]
    )
    for point in sorted(response["Datapoints"], key=lambda x: x["Timestamp"]):
        print(f"  {point['Timestamp']}: {point['Average']:.1f}%")
```

## 3. Cloud Monitoring Comparison

| Feature | AWS CloudWatch | Azure Monitor | GCP Cloud Monitoring |
|---|---|---|---|
| Metrics | `get_metric_statistics` | `MetricsClient` | `MetricServiceClient` |
| Alarms | `put_metric_alarm` | Alert Rules | Alerting Policies |
| Logs | CloudWatch Logs | Log Analytics | Cloud Logging |
| Python SDK | `boto3` | `azure-monitor-query` | `google-cloud-monitoring` |

## 4. Quick Revision Notes
- AWS: `boto3.client("cloudwatch")` → `get_metric_statistics()`
- Azure: `azure-monitor-query` → `MetricsQueryClient`
- GCP: `google-cloud-monitoring` → `MetricServiceClient`
- Always specify time ranges to avoid pulling excessive data
- Use cloud-native alarms for real-time alerting; use Python for custom analysis


---

# Module 39 — Prometheus & Grafana Integration

## 1. Chapter Introduction
Prometheus is the open-source monitoring standard in Kubernetes environments, and Grafana is its visualization companion. In this module, we will learn how to expose Python application metrics to Prometheus, query the Prometheus API with Python, and automate Grafana dashboard creation.

## 2. DevOps Example: Expose Custom Metrics from Python
```python
# pip install prometheus-client
from prometheus_client import start_http_server, Counter, Gauge, Histogram
import time
import random

# Define metrics
REQUESTS_TOTAL = Counter("app_requests_total", "Total requests", ["method", "endpoint"])
CPU_USAGE = Gauge("app_cpu_usage_percent", "Current CPU usage")
REQUEST_DURATION = Histogram("app_request_duration_seconds", "Request duration")

def simulate_app():
    start_http_server(8000)  # Prometheus will scrape localhost:8000/metrics
    print("📊 Metrics server started on :8000/metrics")

    while True:
        REQUESTS_TOTAL.labels(method="GET", endpoint="/api/health").inc()
        CPU_USAGE.set(random.uniform(20, 80))
        with REQUEST_DURATION.time():
            time.sleep(random.uniform(0.01, 0.5))

simulate_app()
```

## 3. Production Example: Query Prometheus API
```python
import requests
from datetime import datetime

def query_prometheus(prom_url, query):
    response = requests.get(f"{prom_url}/api/v1/query", params={"query": query})
    response.raise_for_status()
    results = response.json()["data"]["result"]
    for result in results:
        metric = result["metric"]
        value = result["value"][1]
        print(f"  {metric}: {value}")

# Example: Find pods using more than 80% CPU
# query_prometheus("http://prometheus:9090", 'container_cpu_usage_seconds_total > 0.8')
```

## 4. Quick Revision Notes
- Install: `pip install prometheus-client`
- **Counter**: monotonically increasing (requests, errors)
- **Gauge**: goes up and down (CPU, memory, temperature)
- **Histogram**: distribution of values (request duration)
- Expose metrics on `/metrics` endpoint for Prometheus scraping
- Query Prometheus API: `GET /api/v1/query?query=...`
- Grafana API: `POST /api/dashboards/db` to create dashboards programmatically


---

