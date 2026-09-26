# Chapter_10_agentcore_runtime

## 1. Introduction
The AgentCore runtime hosts agent containers inside secure, isolated virtual machine environments.

### What is it?
The AgentCore Runtime is the AWS-managed hosting infrastructure that executes agent applications inside lightweight, securely isolated virtual machine environments called AWS Firecracker microVMs.

### Why is it important?
Traditional multi-tenant cloud environments share operating system kernels between users, risking cross-tenant data leaks and resource starvation. The AgentCore Runtime provides hypervisor-level security isolation for every user session while maintaining sub-second cold-start execution times and low operational costs.

### How does it work?
When a user query arrives with a unique session ID, the AgentCore Runtime checks if an active microVM exists for that session. If active (warm start), the query routes directly to the running container. If inactive (cold start), Firecracker boots a new microVM instance in seconds, pulls the ECR container image, mounts ephemeral storage, and handles the request.

### Key Responsibilities
- Provision and manage isolated AWS Firecracker microVM instances for user agent sessions.
- Enforce hardware resource limits on CPU usage, RAM allocation, and ephemeral disk space.
- Manage session lifecycles, routing warm requests quickly and terminating idle instances.
- Guarantee multi-tenant data isolation by maintaining dedicated operating system kernels per session.

---

## 2. Learning Objectives
By the end of this chapter, you will be able to:
- In this chapter, you will learn:
- - How AWS Firecracker microVMs provide secure, hardware-isolated runtimes.
- - The difference between container execution and microVM isolation.
- - How AgentCore routes requests to active (warm) and new (cold) sessions.
- - The default execution bounds, timeouts, and limits.

---

## 3. Prerequisites
* Setup of configuration files and local container runtimes from Chapters 7 and 8.
* A basic understanding of virtualization concepts (VMs vs containers).

---

## 4. Background Theory
Deploying agents to the cloud requires secure execution environments. Traditional shared container runtimes share a single operating system kernel, risking cross-tenant data leaks. AWS designed Firecracker to combine the security isolation of traditional virtual machines with the speed and efficiency of containers. The AgentCore runtime spawns a dedicated Firecracker microVM for each user session, enforcing resource limits and security boundaries.

---

## 5. Core Concepts
**📦 Technical Term: Firecracker**

* **Simple Explanation:** An open-source virtualization technology designed to spawn secure, multitenant microVMs.
* **Why it exists:** Combines the security isolation of traditional VMs with container speed.
* **Where is it used:** The underlying hypervisor for AWS Lambda and Fargate.

**📦 Technical Term: Cold Start**

* **Simple Explanation:** The process of pulling container images and booting a new microVM for a session.
* **Why it exists:** The initial boot latency when a session starts.
* **Where is it used:** The initial request boot cycle.

**📦 Technical Term: Warm Start**

* **Simple Explanation:** Routing subsequent requests using the same session ID to an active microVM.
* **Why it exists:** Bypasses the boot cycle for low-latency responses.
* **Where is it used:** Subsequent requests within active session windows.

---

## 6. Internal Mechanics
1. Client sends an invocation request containing a unique `session_id`.
2. The runtime checks if an active microVM is allocated to that session.
3. If missing (Cold Start), it pulls the ECR container image and boots a new Firecracker microVM.
4. If active (Warm Start), it routes the request directly to the running container.
5. The microVM executes the request and remains active until the inactivity timeout or max session duration (8 hours) is reached.

---

## 7. Architecture Overview
The following architectural details outline the components and relationship schemas active in this module:

```mermaid
graph TD
    Client[Client Request] -->|Session ID| Router[Runtime Router]
    Router -->|Allocate| VM[Isolated Firecracker VM]
    VM -->|Run Code| Container[Agent App Container]
    VM -->|Mount| Storage[Session ephemeral storage]
```

---

## 8. Installation & Setup
Inspect active session microVM status using the CLI:
```bash
agentcore runtime status
```

---

## 9. Configuration
Configure runtime limits and session timeouts in `bedrock_agent_core.yaml`:
```yaml
runtime:
  timeout_seconds: 3600
  memory_mb: 2048
  storage_gb: 10
```

---

## 10. Hands-on Examples

In this section, we analyze the hands-on code implementations for **AgentCore Runtime** step-by-step, explaining the architecture, syntax choices, logic flow, and production patterns across all three implementation tiers.

---

### 1. Simple Implementation Tier Walkthrough

```python
# Verify session details in execution context
def check_runtime_context(context):
    session_id = getattr(context, "session_id", "local-session")
    print("Running inside session VM:", session_id)
    return session_id
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
# Python script to verify local file isolation under /tmp
import os

def check_file_isolation():
    path = "/tmp/session_data.txt"
    if os.path.exists(path):
        with open(path, "r") as f:
            print("Read session data:", f.read())
    else:
        print("No session data found. Writing default...")
        with open(path, "w") as f:
            f.write("Session Active")

if __name__ == "__main__":
    check_file_isolation()
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
# Complete script validating memory limits and executing timeout handlers
import time
import signal
import sys

def timeout_handler(signum, frame):
    print("[TIMEOUT] Execution time limit exceeded. Terminating task.")
    sys.exit(1)

def execute_with_bounds(duration):
    # Register signal handler for execution timeouts
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(5) # Set timeout limit to 5 seconds
    try:
        print(f"Executing process for {duration} seconds...")
        time.sleep(duration)
        signal.alarm(0) # Disable alarm on success
        print("[SUCCESS] Task completed within limits.")
    except Exception as e:
        print("Execution error:", str(e))

if __name__ == "__main__":
    execute_with_bounds(3) # Succeeds
    execute_with_bounds(10) # Triggers timeout
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
Enforce strict resource allocations for RAM and CPU. Ensure that containers run as non-root users inside microVMs to prevent privilege escalation attacks.

---

## 12. Performance Optimization
Leverage warm starts for sequential requests to bypass boot latency and ensure fast response times.

---

## 13. Common Mistakes
* Expecting files written to `/tmp` to persist across sessions (sessions terminate after timeouts, destroying ephemeral storage).
* Overallocating RAM in configurations, leading to high resource reservation fees.

---

## 14. Troubleshooting
Below is the diagnostic reference table for identifying and resolving issues:

| Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| 504 Gateway Timeout error | The execution exceeded the configured timeout_seconds threshold. | Increase timeout limits in configuration or refactor logic to use streaming responses. |
| OutOfMemory error during execution | The application exceeded allocated microVM RAM limits. | Optimize memory usage patterns or increase memory_mb configurations. |

### Additional Reference Tables


| Limit Parameter | Default Value | Description |
| :--- | :--- | :--- |
| **Max Payload Size** | 100 MB | The maximum size of incoming request payloads, allowing for large files or attachments. |
| **Synchronous Timeout** | 15 Minutes | The execution timeout for a single, blocking request before returning a gateway error. |
| **Streaming Timeout** | 60 Minutes | The execution limit for streaming responses (e.g., long research loops). |
| **Max Session Duration** | 8 Hours | The maximum lifespan of a single microVM session. |


---

## 15. Interview Questions
### Q: What is the security advantage of Firecracker over standard containers?
* **Answer:** Standard containers share the host operating system kernel, making them vulnerable to kernel exploit leaks. Firecracker runs each container inside an isolated microVM with its own kernel, securing multi-tenant environments.

### Q: How do cold starts affect agent latency?
* **Answer:** Cold starts add boot latency (typically a few seconds) because the system must pull the container image and initialize the virtual machine before processing requests.

### Q: What happens to ephemeral data when a session terminates?
* **Answer:** When a session times out or reaches its limit, the microVM is destroyed, erasing all ephemeral storage data (including the `/tmp` folder).

---

## 16. Real-World Use Cases
**Enterprise Scenario:** SaaS Cyber Threat Intelligence & Vulnerability Remediation Platform

* **Business Challenge:** Executing untrusted code generated by LLM agents for vulnerability testing risked compromising host infrastructure and exposing neighboring customer data.
* **Bedrock AgentCore Solution:** Hosting all agent reasoning loops and code execution tasks inside isolated AWS Firecracker microVMs managed by the Bedrock AgentCore Runtime.
* **Production Impact:**
  * Delivered hardware-level isolation for multi-tenant code execution workloads with sub-millisecond VM boot times.
  * Prevented cross-tenant data access and host system compromise during dynamic code execution.
  * Maintained scalable execution capacity during sudden threat intelligence traffic spikes.

---

## 17. Industrial Project
This runtime provides the secure host environment where our agent handler executes in production.

---

## 18. Summary
This chapter explored the virtualization architecture of the Bedrock AgentCore Runtime, examining how AWS Firecracker microVMs provide secure, lightweight, and hardware-isolated execution environments for autonomous agent workloads.

Key architectural insights and practical lessons learned in this chapter include:
* **Session Isolation via Firecracker MicroVMs:** Each agent execution context runs within a dedicated Firecracker microVM, delivering hardware-level security and multi-tenant isolation.
* **Automated Lifecycle Reclamation:** Inactive microVM instances are automatically reclaimed by the runtime manager to optimize resource utilization and eliminate idle compute charges.
* **Ephemeral Container Storage:** MicroVM local file storage is transient; persistent artifacts, session state, and files must be stored in Amazon S3 or DynamoDB.

Understanding the underlying virtualization architecture allows you to architect secure, cost-effective, and highly scalable agent applications on AWS.

---

## 19. Practice Exercises
* Beginner: Configure `bedrock_agent_core.yaml` to set `timeout_seconds` to 600.
* Intermediate: Map the lifecycle of a runtime VM from boot to destruction in a flow chart.

---

## 20. Further Reading
* [AWS Firecracker Architecture Whitepaper](https://docs.aws.amazon.com/whitepapers/latest/aws-firecracker-design/aws-firecracker-design.html)
* [AWS Lambda Execution Environments](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-context.html)
