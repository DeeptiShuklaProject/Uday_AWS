# Episode 01 Example: Runtime Basics & SDK Wrapping

This directory demonstrates how to wrap a local AI agent workflow so it can deploy and execute serverlessly inside Amazon Bedrock AgentCore Runtime.

## 🛠️ Concepts Illustrated:
1. **SDK Wrapper (`BedrockAgentCoreApp`)**: The wrapper that listens for cloud invocation events inside isolated MicroVMs.
2. **Invoke Handler (`@app.invoke`)**: Decorating the entrypoint so AgentCore knows how to forward payload inputs and context objects.
3. **Local Context Extraction**: Accessing metadata (like `session_id`) to maintain memory integrity.

## 💻 How to Run:
Run the script locally to simulate an AgentCore runtime execution event:
```bash
python 01_agentcore_app.py
```
