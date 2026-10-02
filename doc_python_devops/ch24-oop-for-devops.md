<!-- TODO: Rewrite and humanize content from 13-advanced-python\module-40-oop.md, 13-advanced-python\module-41-advanced-modules.md -->

# Module 40 — Object-Oriented Python for DevOps

## 1. Chapter Introduction
As your automation scripts grow beyond 200 lines, functions alone are not enough to keep code organized. Object-Oriented Programming (OOP) lets you model real infrastructure components—servers, clusters, pipelines—as Python objects with attributes and behaviors. In this module, we will learn OOP through the lens of DevOps automation.

## 2. DevOps Example: Server Class
```python
class Server:
    def __init__(self, hostname, ip, environment="production"):
        self.hostname = hostname
        self.ip = ip
        self.environment = environment
        self.is_healthy = True

    def health_check(self):
        # Simulated health check
        print(f"Checking {self.hostname} ({self.ip})...")
        return self.is_healthy

    def __repr__(self):
        return f"Server({self.hostname}, {self.ip}, env={self.environment})"

# Usage
web = Server("web-01", "10.0.1.50")
db = Server("db-01", "10.0.2.10", environment="staging")
print(web.health_check())
```

## 3. Production Example: Inheritance for Cloud Providers
```python
from abc import ABC, abstractmethod

class CloudInstance(ABC):
    def __init__(self, instance_id, region):
        self.instance_id = instance_id
        self.region = region

    @abstractmethod
    def start(self): pass

    @abstractmethod
    def stop(self): pass

class AWSInstance(CloudInstance):
    def start(self):
        print(f"Starting EC2 {self.instance_id} in {self.region}")

    def stop(self):
        print(f"Stopping EC2 {self.instance_id} in {self.region}")

class AzureVM(CloudInstance):
    def start(self):
        print(f"Starting Azure VM {self.instance_id} in {self.region}")

    def stop(self):
        print(f"Deallocating Azure VM {self.instance_id} in {self.region}")
```

## 4. Quick Revision Notes
- **Class**: Blueprint for objects. **Object**: Instance of a class.
- `__init__`: Constructor method, runs when object is created
- **Inheritance**: Child class extends parent class
- **ABC (Abstract Base Class)**: Defines an interface that subclasses must implement
- Use OOP when modeling real-world entities (servers, clusters, pipelines)
- Use functions when you just need a reusable operation


---

# Module 41 — Advanced Python Modules for DevOps

## 1. Chapter Introduction
Python's standard library is enormous. In this module, we will cover the advanced modules that DevOps engineers use daily but rarely learn formally—`collections`, `itertools`, `functools`, `datetime`, `hashlib`, `socket`, and `shutil`. These modules solve common infrastructure problems elegantly.

## 2. Key Modules

### collections — Specialized data structures
```python
from collections import Counter, defaultdict, OrderedDict

# Count occurrences of log levels
log_levels = ["ERROR", "INFO", "INFO", "WARNING", "ERROR", "ERROR"]
print(Counter(log_levels))  # Counter({'ERROR': 3, 'INFO': 2, 'WARNING': 1})

# Group servers by region
from collections import defaultdict
servers_by_region = defaultdict(list)
servers_by_region["us-east"].append("web-01")
servers_by_region["us-east"].append("web-02")
servers_by_region["eu-west"].append("api-01")
```

### datetime — Timestamp management
```python
from datetime import datetime, timedelta
now = datetime.now()
one_week_ago = now - timedelta(days=7)
print(f"Checking resources older than: {one_week_ago.isoformat()}")
```

### hashlib — File integrity verification
```python
import hashlib
def file_checksum(filepath):
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()
```

## 3. Quick Revision Notes
- `Counter` — count occurrences, `defaultdict` — auto-initialize dict values
- `datetime.now()`, `timedelta(days=7)` — time arithmetic
- `hashlib.sha256()` — file integrity / checksum verification
- `shutil.copy2()`, `shutil.rmtree()` — file/directory operations
- `socket.gethostbyname()` — DNS resolution


---

