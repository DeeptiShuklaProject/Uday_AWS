# AWS Bedrock Course — Chapter 2

*From laptop prototype to production in one chapter — based on the AWS Show & Tell episode "Building your first production-ready AI agent with Amazon Bedrock AgentCore" featuring Mark Roy (Agentic AI Tech Lead) and Ishan Kaushik — EK (Solutions Architect).*

# 🤖 Amazon Bedrock AgentCore — Building & Deploying Production-Ready AI Agents

<AgentFlowStoryteller />

## 🎯 Learning Objectives

By the end of this chapter, the learner will be able to:

- Explain **what Amazon Bedrock AgentCore is** and the problem it solves
- Describe the **major AgentCore building blocks**: Runtime, Gateway, Memory, Identity, Observability, Browser and Code Interpreter
- Explain how **AgentCore Runtime** hosts agents securely at scale
- Convert a local **Strands agent** into a production deployment with the AgentCore SDK
- Use the **`agentcore` CLI** to configure, launch and invoke agents
- Understand how **Gateway** exposes existing APIs and Lambda functions as MCP tools
- Explain how **Memory** provides short-term and long-term context via Actor ID
- Describe how **Identity** handles OAuth authentication for first-party and third-party tools
- Use **Observability** in CloudWatch to trace agent behavior end to end
- Assemble all components into a **production Customer Support Assistant**
