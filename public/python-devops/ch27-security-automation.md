<!-- TODO: Rewrite and humanize content from 15-security-devsecops\module-47-python-security.md, 15-security-devsecops\module-48-devsecops-automation.md -->

# Module 47 — Python Security for DevOps

## 1. Chapter Introduction
Security is not a feature you add at the end. It is a discipline woven into every line of code you write. In this module, we will learn the security practices every DevOps engineer must follow when writing Python automation—managing secrets, validating inputs, securing API communications, and avoiding the most common vulnerabilities that lead to breaches.

## 2. What You Will Learn
- How to manage secrets securely (never hardcode credentials).
- How to use environment variables, `.env` files, and cloud secret managers.
- How to validate and sanitize inputs.
- How to secure HTTP communications (TLS/SSL verification).
- Common Python security pitfalls and how to avoid them.

## 3. Why This Topic Matters in DevOps
DevOps engineers write scripts that have root access to production servers, admin credentials for cloud accounts, and the ability to deploy code to millions of users. A single hardcoded API key committed to GitHub can be discovered by a bot within seconds. A script that disables SSL verification "because it's easier" opens the door to man-in-the-middle attacks. Security is not optional in DevOps automation.

## 4. Concept Explained in Simple Language
### The Three Pillars of DevOps Security
1. **Secrets Management:** Never store passwords, API keys, or tokens in source code. Use environment variables, vault services, or cloud secret managers.
2. **Input Validation:** Never trust data from external sources (API responses, user input, webhook payloads). Validate before using.
3. **Secure Communication:** Always verify TLS certificates. Never set `verify=False` in production.

## 5. Real-World Analogy
Imagine you are a bank manager. You would never write the vault combination on a sticky note and leave it on your desk. You would never let a stranger walk into the vault without checking their identity. And you would never discuss confidential information on an unsecured phone line. The same principles apply to DevOps: protect your secrets, validate who is talking to you, and encrypt every conversation.

## 6. Basic Example: The Wrong Way vs The Right Way
```python
# ❌ THE WRONG WAY — Never do this
import requests

API_KEY = "sk-1234567890abcdef"  # Hardcoded secret!
response = requests.get(
    "https://api.example.com/servers",
    headers={"Authorization": f"Bearer {API_KEY}"},
    verify=False  # SSL verification disabled!
)
```

```python
# ✅ THE RIGHT WAY — Secrets from environment, SSL verified
import requests
import os
import sys

API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    print("❌ API_KEY environment variable is not set")
    sys.exit(1)

response = requests.get(
    "https://api.example.com/servers",
    headers={"Authorization": f"Bearer {API_KEY}"},
    # verify=True is the default — never change it
)
```

## 7. DevOps Example: Using Python-dotenv for Local Development
```python
# pip install python-dotenv
from dotenv import load_dotenv
import os

# Load .env file (local development only)
load_dotenv()

# Access secrets
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
API_TOKEN = os.environ.get("API_TOKEN")

# .env file (NEVER commit this to Git):
# DB_HOST=db-prod.internal
# DB_PASSWORD=super_secret_password
# API_TOKEN=ghp_1234567890abcdef
```

> ⚠️ **Critical:** Always add `.env` to your `.gitignore` file. Create a `.env.example` with placeholder values for documentation.

## 8. Cloud Secret Manager Example
```python
import boto3
import json

def get_secret_aws(secret_name, region="us-east-1"):
    """Retrieve a secret from AWS Secrets Manager."""
    client = boto3.client("secretsmanager", region_name=region)
    try:
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response["SecretString"])
    except client.exceptions.ResourceNotFoundException:
        print(f"❌ Secret '{secret_name}' not found")
        return None

# Usage
# credentials = get_secret_aws("prod/database/credentials")
# db_password = credentials["password"]
```

## 9. Production Example: Input Validation
```python
import re
import sys

def validate_hostname(hostname):
    """Validate that a hostname is safe to use in commands."""
    pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})*$'
    if not re.match(pattern, hostname):
        print(f"❌ Invalid hostname: {hostname}")
        sys.exit(1)
    return hostname

def validate_ip(ip_address):
    """Validate an IPv4 address."""
    parts = ip_address.split(".")
    if len(parts) != 4:
        return False
    for part in parts:
        try:
            num = int(part)
            if num < 0 or num > 255:
                return False
        except ValueError:
            return False
    return True

def safe_command(hostname):
    """Build a safe command — prevent command injection."""
    hostname = validate_hostname(hostname)
    # ✅ Safe: using list form with subprocess (no shell injection)
    import subprocess
    result = subprocess.run(["ping", "-c", "3", hostname], capture_output=True, text=True)
    return result.stdout
```

## 10. Security Checklist for Python DevOps Scripts

| Item | Check |
|---|---|
| No hardcoded secrets in source code | ✅ |
| `.env` file in `.gitignore` | ✅ |
| SSL/TLS verification enabled (`verify=True`) | ✅ |
| User inputs validated and sanitized | ✅ |
| `subprocess.run()` uses list form (no `shell=True`) | ✅ |
| File paths validated (no path traversal `../`) | ✅ |
| Minimal permissions (principle of least privilege) | ✅ |
| Dependencies scanned for vulnerabilities | ✅ |
| `yaml.safe_load()` used (never `yaml.load()`) | ✅ |
| Error messages do not leak sensitive information | ✅ |

## 11. Common Mistakes
- **Using `shell=True` in `subprocess.run()`:** Enables shell injection attacks. Always use list form: `subprocess.run(["cmd", "arg1"])`.
- **Catching all exceptions silently:** `except: pass` hides security errors. Always log exceptions.
- **Using `pickle` with untrusted data:** `pickle.loads()` can execute arbitrary code. Use JSON for data exchange.
- **Disabling SSL verification:** `verify=False` in `requests` opens you to man-in-the-middle attacks.

## 12. Troubleshooting
**Error:** `requests.exceptions.SSLError: certificate verify failed`
**Fix:** Do NOT set `verify=False`. Instead, update your CA certificates: `pip install --upgrade certifi`. If using an internal CA, point to the CA bundle: `requests.get(url, verify="/path/to/ca-bundle.crt")`.

## 13. Senior Engineer's Perspective
**Junior Engineer:** "I set `verify=False` because the internal API has a self-signed certificate. It works now."
**Senior Engineer:** "You just disabled the one mechanism that proves you're talking to the real server and not an attacker. Install the internal CA certificate on your machine or pass the CA bundle path to `requests`. Disabling SSL verification is never acceptable—not even in development."

## 14. Interview Questions
**Beginner:**
Q: Why should you never hardcode API keys in Python scripts?
A: Hardcoded keys get committed to Git, where they can be discovered by anyone with access to the repository—including bots that automatically scan public repos. Use environment variables or secret managers instead.

**Intermediate:**
Q: What is the risk of using `shell=True` in `subprocess.run()`?
A: It passes the command through the system shell, enabling shell injection attacks. If user-controlled input is part of the command, an attacker could inject malicious commands using `;`, `|`, or `&&`. Always use list form.

**Advanced:**
Q: Your team has 50 microservices, each needing database credentials. How do you manage secrets at scale?
A: Use a centralized secret manager (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault). Each service authenticates via IAM role/managed identity, retrieves secrets at startup, and caches them in memory. Secrets are rotated automatically without redeploying services. Never store secrets in environment variables of CI/CD pipelines—use the pipeline's native secret store.

## 15. Chapter Summary
Security in DevOps automation starts with three principles: never hardcode secrets, always validate inputs, and never disable SSL verification. Use environment variables for local development, cloud secret managers for production, and the `subprocess` list form to prevent injection attacks. Security is not an afterthought—it is built into every function you write.

## 16. Quick Revision Notes
- Secrets: environment variables → `.env` file → cloud secret manager
- Always `verify=True` for HTTPS (the default—never change it)
- `subprocess.run(["cmd", "arg"])` — SAFE (list form)
- `subprocess.run("cmd arg", shell=True)` — DANGEROUS
- `yaml.safe_load()` — SAFE. `yaml.load()` — CODE EXECUTION RISK
- `json.loads()` — SAFE. `pickle.loads()` — CODE EXECUTION RISK
- Add `.env` to `.gitignore`, always
- Validate all external inputs before using them in commands or queries


---

# Module 48 — DevSecOps Automation

## 1. Chapter Introduction
DevSecOps means integrating security into every stage of the CI/CD pipeline—not as a final gatekeeping step, but as an automated, continuous process. In this module, we will learn how to use Python to automate security scanning, dependency auditing, container image scanning, and compliance checks that run automatically in your pipelines.

## 2. What You Will Learn
- How to scan Python dependencies for known vulnerabilities.
- How to run static code analysis (SAST) with Python tools.
- How to scan Docker images for vulnerabilities.
- How to build security gates in CI/CD pipelines.
- How to automate compliance checks.

## 3. Why This Topic Matters in DevOps
A vulnerability in a single Python dependency can compromise your entire infrastructure. The Log4Shell vulnerability (2021) affected millions of systems worldwide because nobody was scanning dependencies. DevSecOps automation catches these issues before they reach production.

## 4. DevOps Example: Dependency Vulnerability Scanning
```python
import subprocess
import sys
import json

def scan_dependencies():
    """Scan Python dependencies for known vulnerabilities using pip-audit."""
    result = subprocess.run(
        ["pip-audit", "--format", "json", "--output", "-"],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        print("✅ No known vulnerabilities found in dependencies")
        return True

    vulnerabilities = json.loads(result.stdout)
    print(f"🔴 Found {len(vulnerabilities)} vulnerable dependencies:")
    for vuln in vulnerabilities:
        print(f"  ⚠️ {vuln['name']} {vuln['version']}: {vuln['id']}")
        print(f"     Fix: upgrade to {vuln.get('fix_versions', ['N/A'])}")

    sys.exit(1)  # Fail the CI/CD pipeline

scan_dependencies()
```

## 5. DevOps Example: Static Code Analysis
```python
import subprocess
import sys

def run_security_scan(target_dir="."):
    """Run Bandit (Python SAST tool) to find security issues in code."""
    result = subprocess.run(
        ["bandit", "-r", target_dir, "-f", "json", "-ll"],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        print("✅ No security issues found")
        return True

    import json
    report = json.loads(result.stdout)
    issues = report.get("results", [])
    print(f"🔴 Found {len(issues)} security issues:")
    for issue in issues:
        print(f"  ⚠️ [{issue['issue_severity']}] {issue['issue_text']}")
        print(f"     File: {issue['filename']}:{issue['line_number']}")

    sys.exit(1)

# run_security_scan("./src")
```

## 6. DevOps Example: Docker Image Scanning
```python
import subprocess
import json
import sys

def scan_docker_image(image_name):
    """Scan a Docker image for vulnerabilities using Trivy."""
    result = subprocess.run(
        ["trivy", "image", "--format", "json", "--severity", "HIGH,CRITICAL", image_name],
        capture_output=True, text=True
    )

    report = json.loads(result.stdout)
    total_vulns = 0

    for target in report.get("Results", []):
        vulns = target.get("Vulnerabilities", [])
        total_vulns += len(vulns)
        for vuln in vulns:
            print(f"  🔴 {vuln['VulnerabilityID']}: {vuln['PkgName']} ({vuln['Severity']})")

    if total_vulns > 0:
        print(f"\n❌ {total_vulns} HIGH/CRITICAL vulnerabilities found in {image_name}")
        sys.exit(1)
    else:
        print(f"✅ No HIGH/CRITICAL vulnerabilities in {image_name}")

# scan_docker_image("myapp:latest")
```

## 7. Production Example: CI/CD Security Gate
```python
#!/usr/bin/env python3
"""security_gate.py — Run all security checks as a CI/CD pipeline step."""
import subprocess
import sys

def run_check(name, command):
    """Run a security check and return pass/fail."""
    print(f"\n{'='*60}")
    print(f"🔍 Running: {name}")
    print(f"{'='*60}")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✅ {name}: PASSED")
        return True
    else:
        print(f"❌ {name}: FAILED")
        print(result.stdout[:500] if result.stdout else "")
        return False

checks = [
    ("Dependency Audit", ["pip-audit"]),
    ("Code Security Scan", ["bandit", "-r", "src/", "-ll"]),
    ("Linting", ["flake8", "src/"]),
    ("Type Checking", ["mypy", "src/"]),
]

results = {name: run_check(name, cmd) for name, cmd in checks}

print(f"\n{'='*60}")
print("SECURITY GATE SUMMARY")
print(f"{'='*60}")
all_passed = True
for name, passed in results.items():
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {status} — {name}")
    if not passed:
        all_passed = False

if not all_passed:
    print("\n🔴 SECURITY GATE: BLOCKED — Fix issues before deploying")
    sys.exit(1)
else:
    print("\n🟢 SECURITY GATE: PASSED — Safe to deploy")
    sys.exit(0)
```

## 8. Common Mistakes
- **Skipping security scans to speed up the pipeline:** Never disable security checks. If they are too slow, run them in parallel or as a separate pipeline.
- **Ignoring vulnerabilities without review:** Use `--ignore` flags only with documented justification and a remediation deadline.
- **Running security scans only in production pipeline:** Scan in development too—catch issues before they reach the main branch.

## 9. Security Tools Reference

| Tool | Purpose | Install |
|---|---|---|
| `pip-audit` | Dependency vulnerability scanning | `pip install pip-audit` |
| `bandit` | Python SAST (static analysis) | `pip install bandit` |
| `safety` | Dependency vulnerability database | `pip install safety` |
| `trivy` | Container image scanning | Binary install |
| `semgrep` | Advanced pattern-based SAST | `pip install semgrep` |
| `mypy` | Type checking for bug prevention | `pip install mypy` |

## 10. Senior Engineer's Perspective
**Junior Engineer:** "Security scanning slows down the pipeline by 3 minutes. Can we skip it?"
**Senior Engineer:** "A 3-minute security scan that catches a critical vulnerability before it reaches production will save you from a 3-day incident response. The cost of a breach—customer trust, legal liability, engineering time—is infinitely higher than 3 minutes of pipeline time. Security is non-negotiable."

## 11. Interview Questions
**Beginner:**
Q: What is DevSecOps and how does it differ from traditional security?
A: DevSecOps integrates security into every stage of the CI/CD pipeline as automated checks, rather than treating security as a final manual review before release. It shifts security "left" in the development process.

**Intermediate:**
Q: Name three types of security scanning you would add to a CI/CD pipeline.
A: (1) Dependency scanning (pip-audit/safety) to find vulnerable libraries, (2) SAST (Bandit) to find security bugs in code, (3) Container scanning (Trivy) to find vulnerabilities in Docker images.

**Advanced:**
Q: How do you handle a situation where a critical vulnerability is found in a dependency but no patch is available yet?
A: Assess the exploitability and impact. If the vulnerable function is not used in your code, document the risk and add a waiver with a review date. If it is exploitable, implement a workaround (e.g., input validation, WAF rules) and monitor for the patch. Track it in your vulnerability management system with an SLA.

## 12. Chapter Summary
DevSecOps automates security into the CI/CD pipeline. Python tools like `pip-audit`, `bandit`, and `trivy` can scan dependencies, code, and container images for vulnerabilities. Security gates should block deployments when critical issues are found. Never skip security scans, never ignore findings without justification, and always scan early in the development cycle.

## 13. Quick Revision Notes
- `pip-audit` — Scan Python dependencies for CVEs
- `bandit` — Static security analysis of Python code
- `trivy` — Container image vulnerability scanner
- Security gate = Python script that runs all checks and exits with `sys.exit(1)` on failure
- Shift-left security: scan in development, not just production
- Never `--ignore` without documentation and a remediation deadline


---

