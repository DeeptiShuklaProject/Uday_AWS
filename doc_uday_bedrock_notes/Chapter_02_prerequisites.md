# Chapter_02_prerequisites

## 1. Introduction
Developing and deploying Amazon Bedrock AgentCore applications requires establishing a robust, standardized local development environment.

### What is it?
Local Environment Prerequisites refer to the set of core software tools, programming runtimes, and command-line utilities required on your computer to build, test, and run Bedrock AgentCore applications locally before deploying them to the cloud.

### Why is it important?
Building software without a standardized toolset leads to missing software libraries, system crashes, and code discrepancies between local computers and cloud servers. Installing validated prerequisite tools ensures your workstation matches AWS production standards, guaranteeing predictable code execution.

### How does it work?
Your local workstation uses Python to execute application code, Git to track source code revisions, Docker to emulate container execution environments, 'uv' to manage library packages at high speeds, and the AWS Command Line Interface (CLI) to authenticate and communicate with AWS cloud services.

### Key Responsibilities
- Provide a stable local runtime environment for executing Python code and framework packages.
- Package application code and dependencies into standardized containers using Docker.
- Synchronize source code revisions and track repository history using Git.
- Authorize and execute secure API commands between your computer and your AWS account.

---

## 2. Learning Objectives
By the end of this chapter, you will be able to:
- In this chapter, you will learn how to:
- - Install and verify the required local development tools.
- - Configure virtual environments to manage python packages.
- - Install the `uv` toolchain and verify Docker container configurations.
- - Verify AWS account authentication and API credentials access.

---

## 3. Prerequisites
* Basic familiarity with terminal command lines (Bash or PowerShell).
* An active AWS Account with permissions to create IAM users and policies.

---

## 4. Background Theory
A standard development environment minimizes the risk of configuration discrepancies between local workstations and production servers. Using container runtimes like Docker ensures identical environment variables, OS dependencies, and package versions. Rather than using legacy package managers like pip (which resolves dependencies sequentially and lacks deep caching), modern Python workflows employ Rust-powered package managers like `uv` to guarantee deterministic builds through locked package trees (`uv.lock`).

---

## 5. Core Concepts
**📦 Technical Term: SDK**

* **Simple Explanation:** A collection of pre-written libraries and utilities used to build applications for a platform.
* **Why it exists:** Eliminates the need to write raw HTTP requests for API actions.
* **Where is it used:** Python script imports like `import boto3`.

**📦 Technical Term: AWS CLI**

* **Simple Explanation:** A command-line tool used to control and automate AWS services through script queries.
* **Why it exists:** Allows developers to manage cloud assets without clicking the AWS web console.
* **Where is it used:** Configuring access keys and initiating deployment pipelines.

**📦 Technical Term: Virtual Environment**

* **Simple Explanation:** An isolated workspace that hosts a local copy of Python and specific package dependencies.
* **Why it exists:** Prevents version conflicts between different Python projects running on the same host.
* **Where is it used:** Locally installed pip libraries.

---

## 6. Internal Mechanics
1. Developer inputs command in terminal (e.g., `git clone` or `docker run`).
2. The shell resolves the binary location in the system PATH variable.
3. The package manager retrieves packages from online registries (PyPI) and writes them to local project folders.
4. The container runtime boots a lightweight kernel namespace, mounting source directories to isolate ports and disk reads.

---

## 7. Architecture Overview
The following architectural details outline the components and relationship schemas active in this module:

```mermaid
graph LR
    Dev[Local Workstation] -->|Git| Repo[Git Repository]
    Dev -->|Python & uv| Venv[Isolated Python Virtual Env]
    Dev -->|Docker Engine| Containers[Local Test Containers]
    Dev -->|AWS CLI / SDK| AWS[AWS Cloud Services]
```

---

## 8. Installation & Setup
Execute the following terminal commands to check installation status of required tools:
```bash
git --version
python --version
docker --version
aws --version
```
To install `uv` on Windows, use:
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```
On macOS/Linux, run:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## 9. Configuration
Verify AWS CLI credentials configuration by running:
```bash
aws configure
```
Provide your AWS Access Key ID, Secret Access Key, Default region (e.g., `us-east-1`), and output format (`json`). The configurations are saved locally under `~/.aws/credentials` and `~/.aws/config`.

---

## 10. Hands-on Examples

In this section, we analyze the hands-on code implementations for **Local Environment Prerequisites** step-by-step, explaining the architecture, syntax choices, logic flow, and production patterns across all three implementation tiers.

---

### 1. Simple Implementation Tier Walkthrough

```python
json
{
      "UserId": "AIDAX1234567890EXAMPLE",
      "Account": "123456789012",
      "Arn": "arn:aws:iam::123456789012:user/developer"
  }
```

#### Code Logic & Syntax Breakdown:
* **Package Imports (`from bedrock_agent_core import ...`)**:
  - Brings in the core `BedrockAgentCoreApp` engine. This class handles runtime container startup, manages the microVM event loop, and deserializes incoming JSON API invocations.
* **Application Instance (`app = BedrockAgentCoreApp()`)**:
  - Instantiates the primary application object `app`. This object serves as the main registry for invocation routes, memory session hooks, and tool bindings.
* **Invocation Decorator (`@app.invoke`)**:
  - A Python decorator that registers the function immediately below as the primary entrypoint for Bedrock AgentCore runtime triggers.
* **Handler Signature (`def handler(payload, context):`)**:
  - **`payload`**: A Python dictionary holding client parameters, user prompt strings, and input arguments.
  - **`context`**: A metadata object containing active runtime details such as `session_id`, `actor_id`, and AWS IAM execution identities.
* **Return Payload (`return {"statusCode": 200, "response": ...}`)**:
  - Constructs a standard HTTP response dictionary. The `statusCode: 200` communicates success to the API Gateway, and `response` delivers the agent payload back to the client.

---

### 2. Intermediate Implementation Tier Walkthrough

```python
# Python script to verify Docker daemon is running locally using docker-py client
import subprocess

def check_docker():
    try:
        res = subprocess.run(["docker", "info"], capture_output=True, text=True)
        if res.returncode == 0:
            print("Docker Daemon is active and responding.")
        else:
            print("Docker Daemon is not running or active.")
    except FileNotFoundError:
        print("Docker CLI binary was not found in path.")

if __name__ == "__main__":
    check_docker()
```

#### Code Logic & Syntax Breakdown:
* **System Logging Setup (`import logging` & `logger = logging.getLogger(...)`)**:
  - Configures structured logging via Python's standard `logging` module.
  - In production, log messages emitted by `logger.info()` stream into Amazon CloudWatch Logs for real-time monitoring and debugging.
* **Safe Parameter Extraction (`payload.get(...)`)**:
  - Uses `payload.get("prompt", "")` to safely retrieve user queries. Using `.get()` with a default fallback (`""`) prevents `KeyError` exceptions if optional fields are missing.
* **Runtime Session Inspection (`getattr(context, ...)`)**:
  - Inspects the `context` object for `session_id`. Using `getattr()` ensures compatibility when testing locally without a live AWS microVM context.
* **Operational Telemetry (`logger.info(...)`)**:
  - Emits formatted log entries containing session parameters and query strings to track execution flow.

---

### 3. Advanced Production Tier Walkthrough

```python
# Comprehensive system pre-flight check script validating git, python, uv, docker, and aws
import subprocess
import sys

def run_check(binary_name, args):
    try:
        res = subprocess.run([binary_name] + args, capture_output=True, text=True, check=True)
        print(f"[OK] {binary_name} is active: {res.stdout.splitlines()[0]}")
        return True
    except Exception:
        print(f"[FAIL] {binary_name} is missing or returned errors.")
        return False

def main():
    checks = [
        ("git", ["--version"]),
        ("python", ["--version"]),
        ("uv", ["--version"]),
        ("docker", ["--version"]),
        ("aws", ["sts", "get-caller-identity"])
    ]
    all_pass = True
    for binary, args in checks:
        if not run_check(binary, args):
            all_pass = False
    if not all_pass:
        print("Error: Pre-flight check failed. Please install missing toolchains.")
        sys.exit(1)
    print("All prerequisites validated successfully!")

if __name__ == "__main__":
    main()
```

#### Code Logic & Syntax Breakdown:
* **Defensive Error Trapping (`try: ... except Exception as e:`)**:
  - Wraps the entire invocation handler inside a `try-except` block to catch unhandled errors gracefully, preventing container crashes in multi-tenant runtime environments.
* **Input Parameter Validation (`if not prompt:`)**:
  - Inspects inbound arguments before executing core agent logic. If mandatory parameters are missing, it short-circuits execution and returns a structured `statusCode: 400` (Bad Request) payload.
* **Environment Overrides (`os.getenv(...)`)**:
  - Reads system environment variables (e.g., `APP_ENV`) to dynamically adapt behavior across `development`, `staging`, and `production` environments without modifying codebase files.
* **Sanitized Production Error Response**:
  - Logs internal error details using `logger.error(...)` while returning a clean, safe `statusCode: 500` response to prevent internal stack traces from leaking to client callers.

---

### Summary Sequence of Execution

```
[Incoming Invocation] ──► [Bedrock AgentCore Runtime]
                                  │
                                  ▼
                      [Route to @app.invoke Handler]
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
       [Input Validated (200)]        [Input Missing (400)]
                   │                             │
                   ▼                             ▼
       [Execute Agent Core Logic]     [Return Error Payload]
                   │
                   ▼
       [Deliver JSON to Client]
```

---

## 11. Security Considerations
Never store permanent AWS root credentials on your workstation. Utilize AWS IAM Identity Center (successor to Single Sign-On) to retrieve temporary, role-based credentials. Ensure local private keys and `.aws/` credential files are set with strict filesystem read permissions (e.g., `chmod 600`).

---

## 12. Performance Optimization
Set `uv` to use a global package cache. This avoids re-downloading source wheels across different project folders, resulting in sub-second dependency sync operations.

---

## 13. Common Mistakes
* Committing local credentials files to public repositories.
* Running container runtimes without administrative group privileges, leading to permission access denied errors on socket files.

---

## 14. Troubleshooting
Below is the diagnostic reference table for identifying and resolving issues:

| Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| Docker command returns permission denied | Current user is not associated with the administrative docker group. | Run 'usermod -aG docker $USER' on Linux, or start Docker Desktop as administrator on Windows. |
| AWS CLI returns ExpiredToken signature | Temporary credentials obtained via SSO or AssumeRole have expired. | Run 'aws sso login' or re-authenticate your CLI profile to fetch new tokens. |

---

## 15. Interview Questions
### Q: Why is Git essential in automated CI/CD deployment pipelines?
* **Answer:** Git acts as the source of truth for the codebase. Version control systems host hooks that notify CI/CD servers (like GitHub Actions) to run tests and compile production containers on push events.

### Q: What is the role of the system PATH environment variable?
* **Answer:** The PATH variable lists directories containing executable binaries. When a command is typed, the OS searches these paths sequentially to execute the matching binary file.

### Q: How does uv guarantee deterministic package installations?
* **Answer:** uv uses a lockfile (`uv.lock`) that lists the exact version, checksum, and dependencies of every package, ensuring that subsequent installations resolve the identical package tree.

---

## 16. Real-World Use Cases
**Enterprise Scenario:** Healthtech Software Engineering Division & Remote Onboarding

* **Business Challenge:** Onboarding 50+ remote software engineers across different OS environments (Windows, macOS, Linux) led to "works on my machine" bugs, mismatched Python library dependencies, and security vulnerabilities during local AI agent development.
* **Bedrock AgentCore Solution:** Standardizing local engineering workstations with precise Python versions, `uv` package isolation, AWS CLI profiles, Docker engine runtime, and mandatory environment verification checks.
* **Production Impact:**
  * Reduced engineering onboarding time from 3 days to under 30 minutes.
  * Achieved 100% environment parity between local dev machines and staging/production AWS Fargate environments.
  * Eliminated security risks associated with unverified third-party Python packages by locking dependencies via `uv.lock`.

---

## 17. Industrial Project
This workspace preparation allows us to clone the agent source files and compile local container images in subsequent chapters.

---

## 18. Summary
This chapter walked through setting up, configuring, and verifying the complete local developer toolchain required to build and run Bedrock AgentCore applications. We established workstation readiness by installing Python 3.12+, configuring `uv` for lightning-fast virtual environment management, verifying Docker container engine execution, and authenticating the AWS CLI.

Key architectural insights and practical lessons learned in this chapter include:
* **Isolated Virtual Environments:** Utilizing virtual environments prevents system-wide Python package pollution and guarantees that project dependencies remain strictly isolated.
* **Local Container Emulation:** Maintaining an active local Docker daemon enables developers to emulate cloud execution targets locally before deploying containers to AWS Fargate.
* **Cloud Credential Authentication:** Completing AWS CLI configuration and credential verification is an essential prerequisite before any cloud resource provisioning or deployment steps can occur.

By standardizing your local development environment, you eliminate "works on my machine" inconsistencies and establish a predictable, production-grade foundation for developing Bedrock AgentCore applications.

---

## 19. Practice Exercises
* Beginner: Install the `uv` toolchain and verify it responds to the version query command.
* Intermediate: Configure an AWS CLI profile named `dev-profile` targeting the `us-west-2` region.

---

## 20. Further Reading
* [AWS CLI Command Reference Guide](https://awscli.amazonaws.com/v2/documentation/api/latest/index.html)
* [Docker Containerization Engine Documentation](https://docs.docker.com/)
