# Episode 01 Explanation: Building Your First Production-Ready AI Agent

* **Original Video**: [AWS Show & Tell - Episode 1](https://www.youtube.com/watch?v=wzIQDPFQx30)
* **Local Transcript**: [01_building_your_first_production_ready_ai_agent.txt](../transcripts/01_building_your_first_production_ready_ai_agent.txt)

## 🔍 Detailed Notes & Custom Explanations
### The "Prototype to Production" Gap
When building agentic applications, transitioning from a local proof-of-concept (POC) to a production-ready application introduces major infrastructural challenges:
1. **Security & Isolation**: Ensuring that concurrent user sessions have strict memory and data boundaries to prevent leaks.
2. **Execution Time**: Bypassing traditional serverless timeouts (e.g., Lambda's 15-minute limit) for agents that perform long-running multi-step tasks.
3. **Payload Limits**: Supporting large input files (up to 100MB) such as spreadsheets, documents, or media files.

---

### Deep Dive: Security & Isolation (Easy Explanation)
**What does it mean?**
* **The Problem (बिना Isolation के क्या होता है?)**: 
  जब आप एक सामान्य Flask/FastAPI या Shared Server पर एजेंट चलाते हैं, तो सभी users की requests एक ही Server Memory और CPU शेयर करती हैं। अगर User A कोई personal file अपलोड करता है, या chat history को local temp folder में save करता है, तो बहुत high risk होता है कि User B की request में वह data leak हो जाए।
* **The Solution (AgentCore का Isolation मॉडल)**:
  Bedrock AgentCore में हर एक Active User Session (जिसकी अपनी `session_id` होती है) को एक बिल्कुल **अलग, isolated microVM (Firecracker VM)** मिलता है। 
  1. **Zero Data Leakage**: User A का data, downloaded files, memory variables और execution state पूरी तरह से Container VM A के अंदर लॉक रहता है। User B का Container VM B इससे 100% अलग होता है।
  2. **Kernel-level Separation**: ये Firecracker MicroVMs hardware level पर isolated होते हैं, जिससे memory boundaries को bypass करना असंभव होता है।
  3. **Ephemeral Lifecycle**: जैसे ही user का session complete या time out होता है, microVM delete हो जाता है और सारा data automatically wipe हो जाता है।

---


### Architectural Primitives of Bedrock AgentCore
Amazon Bedrock AgentCore consists of five key pillars:
1. **Runtime**: Hosts containerized agents inside isolated Firecracker microVMs.
2. **Gateway**: Bridges enterprise internal APIs (via Lambda functions) to standard MCP definitions.
3. **Identity**: Integrates Cognito and IAM to authenticate users and propagate the authenticated **Actor ID** to downstream resources.
4. **Memory**: Manages session state and automates long-term profile summarizing.
5. **Observability**: Connects to OpenTelemetry for tracing LLM execution paths.

### Wrapping Strands Code for AgentCore Runtime
To run an orchestration framework like Strands on AgentCore, developers wrap the main execution loop with the `BedrockAgentCoreApp` SDK:

```python
from bedrock_agent_core import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

# The entrypoint decorator wraps the main invoke handler
@app.invoke
def invoke(payload, context):
    # payload contains user prompts, context contains metadata like session_id and actor_id
    prompt = payload.get("prompt")
    session_id = context.session_id
    
    # Execute the agent workflow loop
    response_stream = agent.run(prompt, session_id=session_id)
    return response_stream
```

### CLI Deployment Workflow
1. **Configure (`agentcore configure`)**:
   * Registers the entry point file (e.g., `main.py`).
   * Names the agent (e.g., `customer-support-demo`).
   * Sets up an execution IAM Role and registers/creates the ECR container repository.
   * Prompts for authentication provider. If selecting **Cognito**, it requests:
     * **Discovery URL** (Cognito Issuer OIDC URL).
     * **Client ID** (App client ID).
     * **Audience**.
2. **Test Locally (`agentcore launch --local`)**:
   * Spins up a local container instance mimicking the cloud runtime for debugging and iterative development.
3. **Deploy to Cloud (`agentcore launch`)**:
   * Compresses the directory, uploads it to Amazon S3, and triggers **AWS CodeBuild** to compile the Docker image.
   * Pushes the image to **Amazon ECR** and deploys it serverlessly as a Bedrock AgentCore endpoint.
4. **Test Invocation (`agentcore invoke`)**:
   * Directly queries the live endpoint with JSON payloads to test responses.
