<!-- TODO: Rewrite and humanize content from 04-data-configuration\module-14-json.md, 04-data-configuration\module-15-yaml.md, 04-data-configuration\module-16-csv-xml-config.md -->

# Module 14 — JSON

## 1. Chapter Introduction
In DevOps, data does not travel as plain text. When you ask AWS for a list of servers, it does not reply with a paragraph. It replies with a structured data format called JSON. When you write a Kubernetes manifest, you often choose YAML (which we cover next), but the Kubernetes API itself communicates in JSON. In this module, we will master JSON—reading it, writing it, and manipulating it with Python.

## 2. What You Will Learn
- What JSON is and why it is the universal language of APIs.
- How JSON maps directly to Python dictionaries and lists.
- How to read JSON from files and API responses.
- How to write JSON back to files.
- How to handle deeply nested JSON structures.

## 3. Why This Topic Matters in DevOps
Every cloud API, every CI/CD webhook, every monitoring alert, and every Terraform state file uses JSON. If you cannot parse a 500-line JSON response from the AWS API and extract the three fields you need, you cannot automate cloud infrastructure. JSON is not optional—it is mandatory.

## 4. Concept Explained in Simple Language
### What is JSON?
JSON stands for JavaScript Object Notation. Despite the name, it has nothing to do with JavaScript in practice. It is simply a way to write structured data as text. Think of it as a universal translator that every programming language, every cloud provider, and every API can read and write.

### JSON and Python: A Natural Fit
JSON has only a few data types, and they map perfectly to Python:

| JSON Type | Python Type | Example |
|---|---|---|
| Object `{}` | Dictionary `dict` | `{"name": "web-01"}` |
| Array `[]` | List `list` | `["web-01", "web-02"]` |
| String `""` | String `str` | `"running"` |
| Number | Integer/Float `int/float` | `443`, `99.5` |
| Boolean | Boolean `bool` | `true` → `True` |
| Null | None `NoneType` | `null` → `None` |

## 5. Real-World Analogy
Imagine you are a postal service. Every country in the world has a different language, but every package label must follow a universal format: Name, Address, City, Zip Code. JSON is that universal label format for data. Whether the sender is AWS (English), Azure (another dialect), or GCP (yet another), the label format is always the same.

## 6. Basic Example
```python
import json

# A Python dictionary (this is NOT JSON yet—it is a Python object)
server = {
    "hostname": "web-prod-01",
    "ip": "10.0.1.50",
    "port": 443,
    "is_healthy": True,
    "tags": ["production", "web", "us-east"]
}

# Convert Python dictionary → JSON string
json_string = json.dumps(server, indent=2)
print(json_string)

# Convert JSON string → Python dictionary
parsed = json.loads(json_string)
print(parsed["hostname"])  # Output: web-prod-01
```

## 7. Step-by-Step Example: Reading JSON from a File
DevOps engineers frequently read configuration from JSON files.

**File: `config.json`**
```json
{
  "environment": "production",
  "max_retries": 3,
  "timeout_seconds": 30,
  "allowed_regions": ["us-east-1", "eu-west-1", "ap-south-1"]
}
```

**File: `read_config.py`**
```python
import json

# Step 1: Open the file safely using a context manager
with open("config.json", "r") as file:
    # Step 2: Parse the JSON into a Python dictionary
    config = json.load(file)

# Step 3: Use the configuration
print(f"Environment: {config['environment']}")
print(f"Timeout: {config['timeout_seconds']} seconds")
print(f"Regions: {', '.join(config['allowed_regions'])}")
```

## 8. DevOps Example: Parsing a Cloud API Response
When you query a cloud API, you receive a JSON response containing server information.

```python
import json

# Simulated API response (in reality, this comes from requests.get())
api_response = '''
{
  "servers": [
    {"id": "i-001", "name": "web-01", "state": "running", "cpu": 45.2},
    {"id": "i-002", "name": "web-02", "state": "stopped", "cpu": 0.0},
    {"id": "i-003", "name": "db-01", "state": "running", "cpu": 88.7}
  ],
  "total_count": 3
}
'''

# Parse the JSON response
data = json.loads(api_response)

# Find servers with high CPU
for server in data["servers"]:
    if server["state"] == "running" and server["cpu"] > 80:
        print(f"⚠️ HIGH CPU: {server['name']} at {server['cpu']}%")
```

## 9. Cloud Example: Comparing JSON Across Providers
All three major cloud providers return JSON, but their structure differs:

**AWS EC2 (Boto3 response structure):**
```json
{"Reservations": [{"Instances": [{"InstanceId": "i-001"}]}]}
```

**Azure VM (Azure SDK response structure):**
```json
{"value": [{"name": "vm-001", "properties": {"vmId": "..."}}]}
```

**GCP Compute Engine (Google Cloud response structure):**
```json
{"items": [{"name": "instance-001", "status": "RUNNING"}]}
```

The concept is the same—a list of virtual machines—but navigating the JSON requires understanding each provider's nesting structure.

## 10. Production Example: Writing JSON with Error Handling
```python
import json
import sys

def save_inventory(inventory, filepath):
    """Save server inventory to a JSON file with production-grade error handling."""
    try:
        with open(filepath, "w") as file:
            json.dump(inventory, file, indent=2, sort_keys=True)
        print(f"✅ Inventory saved to {filepath}")
    except PermissionError:
        print(f"❌ ERROR: No write permission for {filepath}")
        sys.exit(1)
    except TypeError as e:
        print(f"❌ ERROR: Data is not JSON-serializable: {e}")
        sys.exit(1)

# Usage
servers = [
    {"hostname": "web-01", "ip": "10.0.1.50", "healthy": True},
    {"hostname": "db-01", "ip": "10.0.2.10", "healthy": False},
]
save_inventory(servers, "/var/data/inventory.json")
```

## 11. Common Mistakes
- **Using single quotes:** JSON requires double quotes `"key"`. Python dictionaries accept both, but JSON does not. `json.dumps()` handles this for you.
- **Forgetting `json.load()` vs `json.loads()`:** `load()` reads from a **file**, `loads()` reads from a **string**. Similarly, `dump()` writes to a file, `dumps()` writes to a string.
- **Not handling `KeyError`:** If you access `data["servers"]` and the key does not exist, your script crashes. Use `data.get("servers", [])` for safety.

## 12. Troubleshooting
**Error:** `json.decoder.JSONDecodeError: Expecting property name enclosed in double quotes`
**Fix:** Your JSON file contains single quotes or trailing commas. JSON is strict—use double quotes and no trailing commas.

**Error:** `TypeError: Object of type datetime is not JSON serializable`
**Fix:** Convert `datetime` objects to strings using `str()` or `.isoformat()` before serializing.

## 13. Security Considerations
- Never store passwords, API keys, or tokens in JSON configuration files that are committed to Git. Use environment variables or a secrets manager instead.
- When loading JSON from an untrusted source (e.g., a webhook payload), always validate the structure before accessing nested keys.

## 14. Best Practices
- Always use `indent=2` or `indent=4` when writing JSON files for human readability.
- Use `json.load()` with a context manager (`with open(...)`) to ensure files are properly closed.
- Use `.get()` with default values when accessing keys that may not exist.
- Sort keys with `sort_keys=True` for consistent, diff-friendly output.

## 15. Senior Engineer's Perspective
**Junior Engineer:** "I wrote a script that reads our server inventory from a JSON file. It works great!"
**Senior Engineer:** "What happens if the JSON file is malformed? What if someone accidentally deletes a comma? Your script will crash with a `JSONDecodeError` and the on-call engineer will get paged at 3 AM. Wrap every `json.load()` in a `try/except` block, log the error with the filename, and exit with a non-zero code so the CI pipeline knows something is wrong."

## 16. Hands-on Exercise
**Beginner Exercise:**
Create a file called `servers.json` containing an array of 3 server objects, each with `hostname`, `ip`, `state`, and `cpu_percent` fields. Write a Python script that reads the file and prints only the servers where `state` is `"running"`.

**Intermediate Exercise:**
Write a script that reads `servers.json`, adds a new field `checked_at` with the current timestamp to each server, and writes the modified data back to a new file called `servers_checked.json`.

*Expected Outcome:* The new file should contain all original data plus the timestamp field.

## 17. Mini Project: Configuration Validator
Build a Python script that reads a `deployment_config.json` file and validates that:
1. The `environment` field exists and is one of `["dev", "staging", "production"]`
2. The `max_retries` field is an integer between 1 and 10
3. The `timeout_seconds` field is a positive number
Print `✅ Configuration valid` or `❌ Configuration invalid: <reason>`.

## 18. Interview Questions
**Beginner:**
Q: What is the difference between `json.load()` and `json.loads()` in Python?
A: `json.load()` reads JSON from a file object, while `json.loads()` parses a JSON string. Similarly, `json.dump()` writes to a file and `json.dumps()` converts to a string.

**Intermediate:**
Q: How would you safely access a deeply nested key in a JSON structure without crashing if any intermediate key is missing?
A: Use chained `.get()` calls with default values: `data.get("servers", {}).get("primary", {}).get("ip", "unknown")`. This returns `"unknown"` instead of crashing with a `KeyError`.

**Advanced:**
Q: You receive a 10 MB JSON response from a cloud API containing 50,000 server records. How do you process it efficiently?
A: For very large JSON files, consider using `ijson` for streaming/incremental parsing instead of loading the entire file into memory with `json.load()`. For the standard library, process the data in chunks or use generators to avoid holding all records in memory simultaneously.

## 19. Chapter Summary
JSON is the universal data format of DevOps. Every cloud API, webhook, and configuration file uses it. Python's `json` module provides simple, powerful tools to read, write, and manipulate JSON data. Always handle parsing errors, validate data before using it, and never store secrets in JSON files committed to version control.

## 20. Quick Revision Notes
- `json.loads(string)` → Parse JSON string to Python dict/list
- `json.dumps(obj, indent=2)` → Convert Python object to JSON string
- `json.load(file)` → Read JSON from a file
- `json.dump(obj, file)` → Write JSON to a file
- Use `.get("key", default)` for safe key access
- JSON uses `true/false/null` → Python uses `True/False/None`


---

# Module 15 — YAML

## 1. Chapter Introduction
If JSON is the language of APIs, YAML is the language of DevOps configuration. Kubernetes manifests, Ansible playbooks, Docker Compose files, GitHub Actions workflows, and Terraform variable files all use YAML. In this module, we will learn how to read, write, and manipulate YAML files using Python—a skill you will use daily as a DevOps engineer.

## 2. What You Will Learn
- What YAML is and how it differs from JSON.
- How YAML maps to Python dictionaries and lists.
- How to read and write YAML files using the `PyYAML` library.
- How to handle multi-document YAML files.
- YAML pitfalls that cause silent bugs in DevOps.

## 3. Why This Topic Matters in DevOps
Consider a typical Kubernetes deployment. You define your pods, services, and ingress rules in YAML files. If your Python automation needs to dynamically generate or modify these files—for example, changing the container image tag during a CI/CD deployment—you must parse YAML correctly. A single indentation error in YAML can bring down an entire deployment.

## 4. Concept Explained in Simple Language
### What is YAML?
YAML stands for "YAML Ain't Markup Language." It is a human-friendly data format designed to be easy to read and write. Unlike JSON (which uses braces and brackets), YAML uses indentation—similar to Python itself.

### YAML vs JSON Comparison

| Feature | JSON | YAML |
|---|---|---|
| Readability | Good, but noisy with `{}` and `""` | Excellent—clean and minimal |
| Comments | ❌ Not supported | ✅ Supported with `#` |
| Usage | APIs, data exchange | Configuration files |
| Indentation | Decorative | **Structural** (like Python) |
| Multi-document | ❌ No | ✅ Yes (with `---`) |
| Boolean values | `true` / `false` | `true`, `yes`, `on` / `false`, `no`, `off` |

## 5. Real-World Analogy
JSON is like a formal legal contract—precise, structured, but hard to skim. YAML is like a well-organized to-do list—clean, readable, and anyone can understand it at a glance. DevOps chose YAML for configuration files because engineers need to read and modify them quickly during incidents.

## 6. Basic Example
```python
# First, install PyYAML: pip install pyyaml
import yaml

# A Python dictionary
deployment = {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
        "name": "web-app",
        "namespace": "production"
    },
    "spec": {
        "replicas": 3
    }
}

# Convert Python dict → YAML string
yaml_string = yaml.dump(deployment, default_flow_style=False)
print(yaml_string)
```

**Output:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 3
```

## 7. Step-by-Step Example: Reading a YAML Config File

**File: `pipeline_config.yaml`**
```yaml
# CI/CD Pipeline Configuration
pipeline:
  name: deploy-web-app
  trigger: push
  branches:
    - main
    - staging

stages:
  - name: build
    image: python:3.12-slim
    commands:
      - pip install -r requirements.txt
      - python -m pytest

  - name: deploy
    image: aws-cli:latest
    commands:
      - aws ecs update-service --cluster prod --service web
```

**File: `read_pipeline.py`**
```python
import yaml

with open("pipeline_config.yaml", "r") as file:
    config = yaml.safe_load(file)

print(f"Pipeline: {config['pipeline']['name']}")
print(f"Trigger: {config['pipeline']['trigger']}")

for stage in config["stages"]:
    print(f"\nStage: {stage['name']}")
    print(f"  Image: {stage['image']}")
    for cmd in stage["commands"]:
        print(f"  → {cmd}")
```

> ⚠️ **Critical:** Always use `yaml.safe_load()`, never `yaml.load()`. The unsafe version can execute arbitrary Python code embedded in YAML files—a severe security vulnerability.

## 8. DevOps Example: Modifying Kubernetes YAML Programmatically
During CI/CD, you often need to update the container image tag in a Kubernetes manifest before deploying.

```python
import yaml

# Read the existing deployment manifest
with open("k8s-deployment.yaml", "r") as file:
    manifest = yaml.safe_load(file)

# Update the container image tag
new_tag = "v2.5.1"
containers = manifest["spec"]["template"]["spec"]["containers"]
for container in containers:
    if container["name"] == "web-app":
        container["image"] = f"myregistry/web-app:{new_tag}"
        print(f"✅ Updated image to: {container['image']}")

# Write the modified manifest back
with open("k8s-deployment.yaml", "w") as file:
    yaml.dump(manifest, file, default_flow_style=False, sort_keys=False)
```

## 9. Cloud Example: Generating Cloud Configuration
```python
import yaml

def generate_cloud_config(provider, region, instance_count):
    """Generate a cloud-neutral configuration in YAML format."""
    config = {
        "cloud": {
            "provider": provider,
            "region": region,
        },
        "compute": {
            "count": instance_count,
            "type": {
                "aws": "t3.medium",
                "azure": "Standard_B2s",
                "gcp": "e2-medium"
            }.get(provider, "unknown")
        },
        "tags": {
            "environment": "production",
            "managed_by": "python-automation"
        }
    }
    return yaml.dump(config, default_flow_style=False)

print(generate_cloud_config("aws", "us-east-1", 3))
```

## 10. Production Example
```python
import yaml
import sys
import os

def load_config(filepath):
    """Load YAML configuration with production-grade validation."""
    if not os.path.exists(filepath):
        print(f"❌ Config file not found: {filepath}")
        sys.exit(1)

    try:
        with open(filepath, "r") as file:
            config = yaml.safe_load(file)
    except yaml.YAMLError as e:
        print(f"❌ YAML parsing error in {filepath}: {e}")
        sys.exit(1)

    if config is None:
        print(f"❌ Config file is empty: {filepath}")
        sys.exit(1)

    # Validate required keys
    required_keys = ["pipeline", "stages"]
    for key in required_keys:
        if key not in config:
            print(f"❌ Missing required key '{key}' in {filepath}")
            sys.exit(1)

    print(f"✅ Configuration loaded from {filepath}")
    return config
```

## 11. Common Mistakes
- **Indentation errors:** YAML uses spaces (not tabs) for indentation. A single tab character will cause a parsing error. Always configure your editor to use spaces.
- **The Norway Problem:** In YAML, `NO` is interpreted as a boolean `False`. If you have a country code field with value `NO` (Norway), YAML silently converts it to `False`. Always quote strings that could be misinterpreted: `"NO"`.
- **Using `yaml.load()` instead of `yaml.safe_load()`:** The unsafe version can execute arbitrary code—a critical security vulnerability.

## 12. Troubleshooting
**Error:** `yaml.scanner.ScannerError: mapping values are not allowed here`
**Fix:** Your indentation is inconsistent. Ensure all nested items use the same number of spaces (typically 2).

**Error:** `yaml.parser.ParserError: expected <block end>`
**Fix:** You likely mixed tabs and spaces. Configure your editor to convert tabs to spaces.

## 13. Security Considerations
- **Never use `yaml.load()` with untrusted data.** Always use `yaml.safe_load()`. An attacker can craft a YAML file that executes arbitrary Python code when loaded with the unsafe function.
- Do not store secrets in YAML config files. Use references to environment variables or external secret managers.

## 14. Best Practices
- Always use `yaml.safe_load()` and `yaml.safe_dump()`.
- Use `sort_keys=False` when writing YAML to preserve the original key order.
- Validate YAML structure after loading—check for required keys before using data.
- Use comments in YAML files to document configuration decisions.
- Use `default_flow_style=False` to produce human-readable block-style YAML.

## 15. Senior Engineer's Perspective
**Junior Engineer:** "I'm generating Kubernetes YAML by concatenating strings in Python. It mostly works."
**Senior Engineer:** "String concatenation for YAML is a ticking time bomb. One wrong indent and your deployment fails silently—or worse, deploys to the wrong namespace. Always parse YAML into a Python dictionary, modify the dictionary, and dump it back. Let the `yaml` library handle the formatting. This is how reliable tools work."

## 16. Hands-on Exercise
**Beginner Exercise:**
Create a YAML file called `team.yaml` with a list of 3 team members, each having `name`, `role`, and `email` fields. Write a Python script to read and print each member's details.

**Advanced Exercise:**
Write a script that reads a Kubernetes deployment YAML, checks if `replicas` is less than 3, and if so, increases it to 3 and saves the modified file. Print a message indicating whether the file was modified.

## 17. Mini Project: YAML Config Merger
Build a script that reads a `default_config.yaml` and an `override_config.yaml`, merges them (overrides take precedence), and writes the merged result to `final_config.yaml`. This simulates how many DevOps tools handle environment-specific configuration.

## 18. Interview Questions
**Beginner:**
Q: What is the main advantage of YAML over JSON for configuration files?
A: YAML supports comments, is more human-readable due to its minimal syntax (no braces/brackets), and uses indentation for structure, making it easier to scan during incident response.

**Intermediate:**
Q: Why should you always use `yaml.safe_load()` instead of `yaml.load()` in Python?
A: `yaml.load()` can deserialize arbitrary Python objects, meaning a malicious YAML file could execute code on your system. `yaml.safe_load()` only deserializes basic data types (strings, numbers, lists, dicts), preventing code execution attacks.

**Advanced:**
Q: Your CI/CD pipeline modifies a Kubernetes YAML file, but after the modification, the file's formatting changes significantly (key order, quoting style). How do you prevent this?
A: Use `yaml.dump()` with `sort_keys=False` to preserve original key order. For more precise YAML manipulation that preserves comments and formatting, consider using the `ruamel.yaml` library instead of PyYAML, as it supports round-trip parsing.

## 19. Chapter Summary
YAML is the configuration language of DevOps. Kubernetes, Ansible, Docker Compose, and GitHub Actions all rely on it. Python's `PyYAML` library makes it easy to read, modify, and generate YAML files programmatically. Always use `safe_load()`, validate structure after parsing, and let the library handle formatting instead of building YAML strings manually.

## 20. Quick Revision Notes
- Install: `pip install pyyaml`
- Read: `yaml.safe_load(file)` (always safe!)
- Write: `yaml.dump(data, file, default_flow_style=False)`
- YAML uses indentation (spaces only, no tabs)
- `true/false/yes/no/on/off` are all booleans in YAML
- Quote strings that could be misinterpreted: `"NO"`, `"3.0"`, `"true"`
- Never use `yaml.load()` — security risk


---

# Module 16 — CSV, XML & Configuration Files

## 1. Chapter Introduction
JSON and YAML dominate modern DevOps, but they are not the only data formats you will encounter. Legacy monitoring systems export metrics as CSV. Enterprise applications use XML for SOAP APIs and configuration. Python applications use `.ini` and `.env` files for settings. In this module, we will cover the remaining data formats a DevOps engineer must handle.

## 2. What You Will Learn
- How to read and write CSV files for inventory and reporting.
- How to parse XML data from legacy systems and SOAP APIs.
- How to use Python's `configparser` for `.ini` configuration files.
- How to read `.env` files for application configuration.

## 3. Why This Topic Matters in DevOps
Your cloud cost report arrives as a CSV download. Your legacy CMDB exports server inventory as XML. Your application reads database credentials from a `.env` file. A DevOps engineer who can only handle JSON will be blocked the moment they encounter these formats. Versatility is a production requirement.

## 4. Concept Explained in Simple Language
### CSV (Comma-Separated Values)
A CSV file is a spreadsheet stored as plain text. Each line is a row, and commas separate the columns. It is the simplest data format—no nesting, no hierarchy, just rows and columns.

### XML (Extensible Markup Language)
XML is like HTML but for data. It uses opening and closing tags to define structure. It was the standard before JSON replaced it for most modern APIs, but many enterprise systems still use it.

### INI / Configuration Files
INI files use sections (`[database]`) and key-value pairs (`host = localhost`). They are common in older applications and tools like Ansible's inventory format.

## 5. Real-World Analogy
- **CSV** is like a simple attendance register—names in one column, dates in another. No fancy structure.
- **XML** is like a filing cabinet with labeled folders, sub-folders, and documents inside each one.
- **INI** is like a set of sticky notes on different monitors, each group labeled with the monitor's purpose.

## 6. Basic Example: CSV
```python
import csv

# Writing a server inventory to CSV
servers = [
    {"hostname": "web-01", "ip": "10.0.1.50", "state": "running"},
    {"hostname": "web-02", "ip": "10.0.1.51", "state": "stopped"},
    {"hostname": "db-01", "ip": "10.0.2.10", "state": "running"},
]

with open("inventory.csv", "w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=["hostname", "ip", "state"])
    writer.writeheader()
    writer.writerows(servers)

# Reading the CSV back
with open("inventory.csv", "r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(f"{row['hostname']} → {row['state']}")
```

## 7. Step-by-Step Example: Parsing XML
```python
import xml.etree.ElementTree as ET

# Simulated XML from a legacy monitoring system
xml_data = """
<servers>
    <server>
        <hostname>web-01</hostname>
        <ip>10.0.1.50</ip>
        <status>healthy</status>
    </server>
    <server>
        <hostname>db-01</hostname>
        <ip>10.0.2.10</ip>
        <status>warning</status>
    </server>
</servers>
"""

# Parse the XML
root = ET.fromstring(xml_data)

# Iterate through each server element
for server in root.findall("server"):
    hostname = server.find("hostname").text
    status = server.find("status").text
    if status != "healthy":
        print(f"⚠️ {hostname} status: {status}")
```

## 8. DevOps Example: Processing Cloud Cost Reports
AWS Cost Explorer and Azure Cost Management export billing data as CSV.

```python
import csv

def analyze_cost_report(filepath):
    """Analyze a cloud cost CSV report and find expensive services."""
    total_cost = 0.0
    service_costs = {}

    with open(filepath, "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            service = row["service_name"]
            cost = float(row["cost_usd"])
            total_cost += cost
            service_costs[service] = service_costs.get(service, 0) + cost

    print(f"\n💰 Total Cost: ${total_cost:,.2f}")
    print("\nTop 5 Services by Cost:")
    sorted_services = sorted(service_costs.items(), key=lambda x: x[1], reverse=True)
    for service, cost in sorted_services[:5]:
        print(f"  {service}: ${cost:,.2f}")

# analyze_cost_report("aws_monthly_cost.csv")
```

## 9. Production Example: INI Configuration Reader
```python
import configparser
import sys

def load_app_config(filepath):
    """Load application configuration from an INI file."""
    config = configparser.ConfigParser()
    read_files = config.read(filepath)

    if not read_files:
        print(f"❌ Config file not found: {filepath}")
        sys.exit(1)

    # Validate required sections
    required = ["database", "logging"]
    for section in required:
        if not config.has_section(section):
            print(f"❌ Missing section [{section}] in {filepath}")
            sys.exit(1)

    return config

# Example INI file: app.ini
# [database]
# host = db-prod.internal
# port = 5432
# name = app_production
#
# [logging]
# level = INFO
# file = /var/log/app.log
```

## 10. Common Mistakes
- **CSV quoting:** If a CSV field contains a comma (e.g., `"New York, NY"`), it must be quoted. Python's `csv` module handles this automatically—never parse CSV with `split(",")`.
- **XML namespaces:** Enterprise XML often uses namespaces that break simple `find()` calls. You must include the namespace in your search queries.
- **Encoding issues:** CSV files from Excel may use Windows encoding (`cp1252`). Specify `encoding="utf-8"` when opening files.

## 11. Troubleshooting
**Error:** `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff`
**Fix:** The file uses a different encoding. Try `open(filepath, "r", encoding="utf-8-sig")` for files with BOM markers, or `encoding="latin-1"` for legacy files.

## 12. Security Considerations
- **CSV Injection:** If you write user-controlled data to CSV and someone opens it in Excel, a value starting with `=` could execute a formula. Prefix user data with a single quote to prevent this.
- **XML External Entity (XXE):** Never parse untrusted XML without disabling external entity processing. Use `defusedxml` library for security-critical XML parsing.

## 13. Best Practices
- Use `csv.DictReader` and `csv.DictWriter` for readable code—accessing columns by name is much safer than by index.
- For XML, prefer `xml.etree.ElementTree` for simple parsing. Use `lxml` for complex XPath queries.
- Store application configuration in INI or YAML files, not hardcoded in Python scripts.
- Always specify file encoding explicitly when opening files.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "I'm parsing our CSV inventory file using `line.split(',')`. It's simple and fast!"
**Senior Engineer:** "That will break the moment a hostname contains a comma, or a field is empty, or a value is quoted. The `csv` module exists precisely because CSV parsing is deceptively complex. Use `csv.DictReader`—it handles edge cases that you haven't even thought of yet."

## 15. Interview Questions
**Beginner:**
Q: Why should you use Python's `csv` module instead of simply splitting each line by commas?
A: The `csv` module correctly handles edge cases like quoted fields containing commas, escaped quotes, empty fields, and different line endings. Manual splitting with `split(",")` will fail on any of these.

**Intermediate:**
Q: You need to parse a large XML configuration file from a legacy CMDB. What Python library would you use and why?
A: For simple XML, `xml.etree.ElementTree` from the standard library is sufficient. For complex XPath queries or very large files, `lxml` provides better performance and more features. For untrusted XML, use `defusedxml` to prevent XXE attacks.

## 16. Chapter Summary
CSV, XML, and INI files remain common in DevOps environments. Python provides built-in modules (`csv`, `xml.etree.ElementTree`, `configparser`) to handle all of them. Always use the proper parsing libraries instead of manual string manipulation, validate data after loading, and be aware of security risks like CSV injection and XML XXE attacks.

## 17. Quick Revision Notes
- **CSV:** `csv.DictReader(file)` / `csv.DictWriter(file, fieldnames=[...])`
- **XML:** `xml.etree.ElementTree.parse(file)` or `ET.fromstring(string)`
- **INI:** `configparser.ConfigParser()` then `config.read(filepath)`
- Never parse CSV with `split(",")` — use the `csv` module
- Never parse untrusted XML without XXE protection
- Always specify `encoding` when opening files


---

