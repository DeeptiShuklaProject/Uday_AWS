<!-- TODO: Rewrite and humanize content from 12-monitoring\module-36-python-system-monitoring.md -->

# Module 36 — Python System Monitoring

## 1. Chapter Introduction
A server that crashes without warning is a server that nobody was monitoring. In this module, we will build Python scripts that monitor system health—CPU, memory, disk, and network—using the `psutil` library. These scripts form the foundation of custom monitoring solutions that alert your team before problems become outages.

## 2. What You Will Learn
- How to monitor CPU, memory, disk, and network with `psutil`.
- How to check running processes and services.
- How to build a health check endpoint.
- How to send alerts when thresholds are breached.

## 3. DevOps Example: System Health Check Script
```python
import psutil
import sys

def check_system_health():
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    print(f"CPU Usage:    {cpu}%")
    print(f"Memory Usage: {memory.percent}%")
    print(f"Disk Usage:   {disk.percent}%")

    alerts = []
    if cpu > 90: alerts.append(f"🔴 CPU critical: {cpu}%")
    if memory.percent > 85: alerts.append(f"🔴 Memory critical: {memory.percent}%")
    if disk.percent > 90: alerts.append(f"🔴 Disk critical: {disk.percent}%")

    if alerts:
        for alert in alerts:
            print(alert)
        sys.exit(1)
    else:
        print("✅ All systems healthy")

check_system_health()
```

## 4. Quick Revision Notes
- Install: `pip install psutil`
- CPU: `psutil.cpu_percent(interval=1)`
- Memory: `psutil.virtual_memory().percent`
- Disk: `psutil.disk_usage("/").percent`
- Processes: `psutil.process_iter(["pid", "name", "cpu_percent"])`
- Network: `psutil.net_io_counters()`


---

