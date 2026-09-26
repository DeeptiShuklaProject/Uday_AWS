# Appendix: Glossary, Troubleshooting, and Cheat Sheet

This appendix contains glossary definitions, troubleshooting steps, and a limits reference table.

---

## 1. Glossary of Terms

- **AgentCore Runtime:** The serverless compute layer hosting containerized agent code in isolated Firecracker microVMs.
- **AgentCore Gateway:** The secure broker mapping and routing tool schemas using JSON-RPC and SSE streams.
- **Model Context Protocol (MCP):** The open-source protocol that standardizes agent-to-tool communication.
- **Actor ID:** The user identity context propagated to downstream services to enforce row-level access control.
- **Episodic Vector Memory:** A semantic retrieval pattern used to fetch relevant historical context and keep prompt token counts small.

---

## 2. Troubleshooting Guide

### Issue 1: Model Access Error
- **Symptoms:** API calls fail with `AccessDeniedException` or similar model access errors.
- **Resolutions:** Verify in the Amazon Bedrock Console that model access was requested and granted for the selected model.

### Issue 2: Docker Build Failure during Cloud deployment
- **Symptoms:** `agent-core launch` fails during the AWS CodeBuild compile task.
- **Resolutions:** Test the build locally before deploying (`agent-core launch --local`) and review CodeBuild logs in CloudWatch.

### Issue 3: 401 Unauthorized Tool Calls
- **Symptoms:** Lambda tool returns `401 Unauthorized` errors when executed.
- **Resolutions:** Ensure your tool handlers are extracting and validating the `Actor ID` propagated in the `userContext` payload.

---

## 3. Limits Reference Table

- **Max Payload Size:** 100 MB
- **Synchronous Timeout:** 15 Minutes
- **Streaming Timeout:** 60 Minutes
- **Max VM Lifespan:** 8 Hours
