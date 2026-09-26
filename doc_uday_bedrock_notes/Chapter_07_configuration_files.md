# Chapter_07_configuration_files

## 1. Introduction
Separating configuration settings from application source code is key to building reusable, secure enterprise applications.

### What is it?
Configuration Files are structured text documents ('.env', 'bedrock_agent_core.yaml', 'pyproject.toml') used to store operational parameters, environment settings, entrypoint references, and access keys separately from application source code.

### Why is it important?
Hardcoding parameters like database names, API endpoints, or secret keys directly inside Python code creates severe security vulnerabilities and prevents the same application from running in different environments (such as testing or production). Storing settings in configuration files decouples environment parameters from codebase logic.

### How does it work?
At startup, the application reads parameters from local '.env' environment files using helper tools like 'python-dotenv' and parses project settings from 'bedrock_agent_core.yaml'. These configuration values are injected into runtime memory, configuring database targets, logging levels, and IAM roles without modifying source code.

### Key Responsibilities
- Store secret access credentials locally in '.env' files while keeping them out of Git repositories.
- Declare deployment metadata, entrypoint paths, and execution role ARNs in YAML files.
- Centralize build settings, project metadata, and package dependencies in 'pyproject.toml'.
- Enable seamless transitions between local development, testing, and cloud production environments.

---

## 2. Learning Objectives
By the end of this chapter, you will be able to:
- In this chapter, you will learn how to:
- - Configure local environment variables in a `.env` file.
- - Manage dependencies and metadata in a `pyproject.toml` file.
- - Configure deployment settings in `bedrock_agent_core.yaml`.
- - Enforce security best practices for project configurations.

---

## 3. Prerequisites
* Successful project setup and dependency synchronization from Chapter 6.
* Familiarity with YAML, TOML, and INI configuration formats.

---

## 4. Background Theory
The Twelve-Factor App methodology dictates that configuration parameters (endpoints, resource names, access keys) must be kept separate from application code. This ensures the same codebase can run in development, testing, and production without changes. Committing sensitive keys to source code repos poses severe security risks; env files store local secrets, pyproject.toml defines dependencies, and bedrock_agent_core.yaml configures deployment settings.

---

## 5. Core Concepts
**📦 Technical Term: Environment Variables**

* **Simple Explanation:** Variables defined in the execution environment that configure runtime settings.
* **Why it exists:** Separates secret credentials from the codebase.
* **Where is it used:** AWS access keys loaded from a local `.env` file.

**📦 Technical Term: Metadata File**

* **Simple Explanation:** A settings file declaring parameters like execution entry points and IAM roles.
* **Why it exists:** Configures how the service runs and scales the application container.
* **Where is it used:** The parameters defined in `bedrock_agent_core.yaml`.

**📦 Technical Term: pyproject.toml**

* **Simple Explanation:** The configuration file used to declare build options and packages.
* **Why it exists:** Centralizes python tool settings and dependencies.
* **Where is it used:** Managing packaging options.

---

## 6. Internal Mechanics
1. The application boots and imports `os` and `dotenv`.
2. The dotenv helper reads variables from the local `.env` file and injects them into the shell environment.
3. The YAML parser parses `bedrock_agent_core.yaml` to configure agent parameters.
4. If validation succeeds, the runtime assumes the declared IAM execution role and starts the agent container.

---

## 7. Architecture Overview
The following architectural details outline the components and relationship schemas active in this module:

```mermaid
graph TD
    YAML[bedrock_agent_core.yaml] -->|Parses config| App[AgentCore Application]
    App -->|Connects to| IAM[IAM Role ARN]
    App -->|Invokes| Model[Model Target]
    App -->|Saves state to| Table[DynamoDB Table]
```

---

## 8. Installation & Setup
Verify that your YAML configuration file parses correctly by running:
```bash
python -c "import yaml; print(yaml.safe_load(open('bedrock_agent_core.yaml')))"
```

---

## 9. Configuration
### 1. Environment File `.env`
```ini
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=us-east-1
```

### 2. Metadata File `bedrock_agent_core.yaml`
```yaml
version: "1.0"
agent:
  name: "bedrock-agent-core-sample"
  entry_point: "src/main.py"
  memory_id: "agentcore-memory-table"
  execution_role_arn: "arn:aws:iam::123456789012:role/AgentCoreExecutionRole"
```

---

## 10. Hands-on Examples

In this section, we analyze the hands-on code implementations for **Configuration Files** step-by-step, explaining the architecture, syntax choices, logic flow, and production patterns across all three implementation tiers.

---

### 1. Simple Implementation Tier Walkthrough

```python
yaml
# Folder Location: agentcore-samples/bedrock_agent_core.yaml

agent_name: "aws_show_and_tell_agent"
entry_point: "src/main.py"
runtime_settings:
  python_version: "3.11"
  execution_role_arn: "arn:aws:iam::123456789012:role/AgentCoreExecutionRole"
  memory_id: "agentcore-memory-user-db-987"
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
# Python script to parse and validate YAML metadata configuration fields
import yaml

def validate_yaml():
    try:
        with open("bedrock_agent_core.yaml", "r") as f:
            config = yaml.safe_load(f)
        agent_cfg = config.get("agent", {})
        print("Agent Name:", agent_cfg.get("name"))
        print("Entrypoint:", agent_cfg.get("entry_point"))
        if not agent_cfg.get("execution_role_arn"):
            print("WARNING: execution_role_arn is missing!")
    except FileNotFoundError:
        print("bedrock_agent_core.yaml file was not found.")

if __name__ == "__main__":
    validate_yaml()
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
# Structured configuration manager class for loading and validating configurations
import os
import yaml
from dotenv import load_dotenv

class ConfigManager:
    def __init__(self):
        load_dotenv()
        self.aws_region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
        self.agent_config = {}
        self.load_yaml_config()

    def load_yaml_config(self):
        path = "bedrock_agent_core.yaml"
        if os.path.exists(path):
            with open(path, "r") as f:
                self.agent_config = yaml.safe_load(f).get("agent", {})

    def validate(self):
        errors = []
        if not os.getenv("AWS_ACCESS_KEY_ID"):
            errors.append("Missing AWS_ACCESS_KEY_ID in environment.")
        if not self.agent_config.get("execution_role_arn"):
            errors.append("Missing execution_role_arn in bedrock_agent_core.yaml.")
        
        if errors:
            print("[CONFIG ERROR] Validation failed:")
            for err in errors:
                print(f"- {err}")
            return False
        print("[CONFIG OK] Configuration parameters validated successfully.")
        return True

if __name__ == "__main__":
    cfg = ConfigManager()
    cfg.validate()
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
Never commit credentials or private keys to version control. In production, load secrets dynamically from AWS Secrets Manager or Systems Manager Parameter Store rather than using static local files.

---

## 12. Performance Optimization
Cache configuration parameters in memory to avoid repeated disk reads during execution loops.

---

## 13. Common Mistakes
* Committing the `.env` file to Git, exposing access keys in the commit history.
* Defining invalid YAML syntax (like mixed tabs and spaces), causing parser crashes during startup.

---

## 14. Troubleshooting
Below is the diagnostic reference table for identifying and resolving issues:

| Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| yaml.scanner.ScannerError | Invalid YAML syntax or tab spacing characters used in bedrock_agent_core.yaml. | Use spaces instead of tabs, and validate the file using an online YAML validator. |
| Variables return None on getenv | The .env file was not loaded or does not exist in the working folder. | Call 'load_dotenv()' before fetching environment variables, and verify the file is named exactly '.env'. |

---

## 15. Interview Questions
### Q: What is the Twelve-Factor App recommendation for configuration?
* **Answer:** The Twelve-Factor App methodology recommends storing configuration in the environment, separating settings from the codebase. This allows the application to move between environments without modification.

### Q: Why is YAML commonly used for configuration over JSON?
* **Answer:** YAML supports comments, handles multiline strings cleanly, and features a readable syntax without brackets and braces, simplifying configuration management.

### Q: How do you load environment variables in Python?
* **Answer:** Use the `os.getenv('KEY')` method to fetch values, and utilize the `python-dotenv` library's `load_dotenv()` function to load them from a local `.env` file.

---

## 16. Real-World Use Cases
**Enterprise Scenario:** SaaS Multi-Region Legal Document Analysis Engine

* **Business Challenge:** Hardcoded database URIs, API keys, and model identifiers caused accidental staging database overwrites and regional compliance violations during global deployments.
* **Bedrock AgentCore Solution:** Centralizing application settings inside `bedrock_agent_core.yaml` and isolating sensitive API keys and environment overrides inside `.env` files loaded dynamically at runtime.
* **Production Impact:**
  * Enabled seamless deployment of the same container image across US, EU, and APAC AWS regions with zero code changes.
  * Eliminated zero-day security exposures caused by committing sensitive keys to Git repositories.
  * Allowed DevOps teams to modify model execution parameters without rebuilding application containers.

---

## 17. Industrial Project
These configuration files define the environment settings and entry points that authorize and run the application in Chapter 8.

---

## 18. Summary
This chapter detailed how to manage application settings across environments using `bedrock_agent_core.yaml` for deployment parameters and `.env` files for local environment variables and sensitive credentials.

Key architectural insights and practical lessons learned in this chapter include:
* **Decoupling Configuration from Code:** Separating application logic from environment configuration simplifies multi-region and multi-environment deployments.
* **Credential Protection & `.gitignore`:** Environment files containing sensitive keys or local overrides must always be excluded from Git repositories to prevent credential leaks.
* **Boot-Time Validation:** Validating configuration schemas during container startup ensures early detection of missing or invalid environment variables.

By implementing strict configuration management, you guarantee secure key handling, seamless multi-environment deployments, and operational flexibility.

---

## 19. Practice Exercises
* Beginner: Add `LOG_LEVEL=DEBUG` to `.env` and read it in a Python script.
* Intermediate: Configure `bedrock_agent_core.yaml` to reference a different IAM Role ARN and verify parsing.

---

## 20. Further Reading
* [The Twelve-Factor App - Config](https://12factor.net/config)
* [YAML Specification Guide](https://yaml.org/spec/)
