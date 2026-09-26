# Episode 01 Summary: Building Your First Production-Ready AI Agent

* **Original Video**: [AWS Show & Tell - Episode 1](https://www.youtube.com/watch?v=wzIQDPFQx30)
* **Local Transcript**: [01_building_your_first_production_ready_ai_agent.txt](../transcripts/01_building_your_first_production_ready_ai_agent.txt)

## 📝 Key Takeaways & Core Concepts
* Introduces the core philosophy of **Amazon Bedrock AgentCore**: decoupling agent orchestration frameworks (like AWS Strands, LangGraph, or CrewAI) from their secure, scalable deployment in the cloud.
* Details the **AgentCore Runtime** infrastructure, which packages the agent code into a Docker image, pushes it to ECR, and deploys it in serverless microVMs (powered by AWS Firecracker) for hardware-level session isolation.
* Covers default runtime thresholds: up to 100MB payloads, 8-hour execution times, and fast container cold starts.
* Shows how to quickly adapt a local Strands agent for AgentCore by initializing the `BedrockAgentCoreApp` wrapper and using CLI commands: `agentcore configure`, `launch`, and `invoke`.
