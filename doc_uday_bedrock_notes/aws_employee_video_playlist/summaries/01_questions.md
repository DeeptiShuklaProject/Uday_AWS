# Episode 01 Practice Questions: Building Your First Production-Ready AI Agent

Test your understanding of the episode's concepts below. Click on the dropdowns to reveal the answers.

---

### Question 1: Session Isolation
**Q**: What virtual machine technology does Amazon Bedrock AgentCore Runtime use under the hood to ensure session isolation, and how does it prevent data leaks?
**Answer (Click to expand)**:
<details>
<summary>View Answer</summary>
It uses **AWS Firecracker** to run each user session inside a hardware-isolated microVM. This ensures that every session has its own memory and kernel space, preventing any possibility of cross-session data leakage.
</details>

### Question 2: Execution Limits
**Q**: What is the maximum payload size and execution time limit supported by Bedrock AgentCore Runtime?
**Answer (Click to expand)**:
<details>
<summary>View Answer</summary>
* **Payload Limit**: Up to **100MB** (supports large files/media).
* **Execution Limit**: Up to **8 hours** (supports long-running background loops).
</details>

### Question 3: CLI Commands
**Q**: List the primary CLI commands in the AgentCore starter toolkit and their purposes.
**Answer (Click to expand)**:
<details>
<summary>View Answer</summary>
1. `agentcore configure`: Configures agent entry points, ECR container repositories, Cognito credentials, and roles.
2. `agentcore launch --local`: Deploys the container locally on local host for testing and debugging.
3. `agentcore launch`: Containerizes the code via AWS CodeBuild, pushes it to ECR, and deploys it serverlessly in the cloud.
4. `agentcore invoke`: Tests the deployed cloud endpoint by sending JSON payloads.
</details>

### Question 4: Cognito Integration
**Q**: What OIDC credentials must you provide when configuring Amazon Cognito via `agentcore configure`?
**Answer (Click to expand)**:
<details>
<summary>View Answer</summary>
You must provide the Cognito **OIDC Discovery URL** (Issuer URL), the **Client ID**, and the **Audience**.
</details>

### Question 5: SDK Wrapping
**Q**: How do you wrap a python agent loop (e.g. Strands) using the Bedrock AgentCore SDK?
**Answer (Click to expand)**:
<details>
<summary>View Answer</summary>
You initialize the `BedrockAgentCoreApp` and use the `@app.invoke` decorator to wrap your entrypoint function:
```python
from bedrock_agent_core import BedrockAgentCoreApp
app = BedrockAgentCoreApp()

@app.invoke
def invoke(payload, context):
    prompt = payload.get("prompt")
    session_id = context.session_id
    # Call your agent orchestration code here
```
</details>

