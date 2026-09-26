# Amazon Bedrock AgentCore Practical Workbook

This workbook provides a step-by-step practical guide to installing, configuring, building, running, and deploying applications on Amazon Bedrock AgentCore.

---

## 📖 Table of Contents

- [**01_Chapter_introduction_to_bedrock_agentcore**](Chapter_01_introduction_to_bedrock_agentcore.md)
  - What is AgentCore, why it was created, and differences from console-based Bedrock Agents.
- [**02_Chapter_prerequisites**](Chapter_02_prerequisites.md)
  - System requirements, installation commands, verification, and output validation.
- [**03_Chapter_aws_configuration**](Chapter_03_aws_configuration.md)
  - Requesting model access, creating IAM execution roles, and trust policies.
- [**04_Chapter_clone_repository**](Chapter_04_clone_repository.md)
  - Cloning the repository and analyzing the workspace directory layout.
- [**05_Chapter_repository_walkthrough**](Chapter_05_repository_walkthrough.md)
  - Walkthrough of core files and understanding imports, classes, and decorators.
- [**06_Chapter_project_setup**](Chapter_06_project_setup.md)
  - Package synchronization using `uv venv` and `uv sync`.
- [**07_Chapter_configuration_files**](Chapter_07_configuration_files.md)
  - Configuring `.env`, `pyproject.toml`, and `bedrock_agent_core.yaml`.
- [**08_Chapter_running_the_application**](Chapter_08_running_the_application.md)
  - Executing local and cloud runs, deploying containers, and invoking endpoints.
- [**09_Chapter_understanding_the_code**](Chapter_09_understanding_the_code.md)
  - Line-by-line breakdown of entry points, validation layers, and retry loops.
- [**10_Chapter_agentcore_runtime**](Chapter_10_agentcore_runtime.md)
  - Firecracker microVM virtualization, session isolation, and execution bounds.
- [**11_Chapter_gateway**](Chapter_11_gateway.md)
  - Model Context Protocol (MCP) integrations and semantic tool routing.
- [**12_Chapter_identity**](Chapter_12_identity.md)
  - Cognito authentication, JWT verification, and Actor ID propagation.
- [**13_Chapter_memory**](Chapter_13_memory.md)
  - Short-term session memory, DynamoDB stores, and memory compaction.
- [**14_Chapter_tools**](Chapter_14_tools.md)
  - Custom tool JSON schemas, registries, and function executions.
- [**15_Chapter_deployment**](Chapter_15_deployment.md)
  - Containerization configurations, ECR deployments, and CodeBuild pipelines.
- [**16_Chapter_observability**](Chapter_16_observability.md)
  - OpenTelemetry context propagation, spans, and CloudWatch metrics.
- [**17_Chapter_complete_end_to_end_flow**](Chapter_17_complete_end_to_end_flow.md)
  - Complete sequence diagram mapping requests from client to database.
- [**Appendix: Glossary, Troubleshooting, and Cheat Sheet**](appendix.md)
- [**References and Video Index**](references.md)
