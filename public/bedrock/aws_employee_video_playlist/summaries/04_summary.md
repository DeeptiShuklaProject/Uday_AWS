# Episode 04 Summary: Gateway Deep Dive

* **Original Video**: [AWS Show & Tell - Episode 4](https://www.youtube.com/watch?v=atWXM5lziY8)
* **Local Transcript**: [04_gateway_deep_dive.txt](../transcripts/04_gateway_deep_dive.txt)

## 📝 Key Takeaways & Core Concepts
* Focuses on the **AgentCore Gateway** for exposing enterprise internal databases, microservices, and legacy APIs to external agents.
* Explains how Gateway acts as a secure, managed broker, wrapping private targets (like AWS Lambda functions) and exposing them as standardized MCP servers.
* Details the usage of HTTP Server-Sent Events (SSE) for maintaining live streaming channels between agents and the gateway.
* Demonstrates querying customer profiles and warranty statuses from DynamoDB tables using Lambda function targets mapped to the gateway.
