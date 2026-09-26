# Episode 03 Example: Runtime Deep Dive & CLI Configuration

This directory details how the Amazon Bedrock AgentCore compilation phase processes your files to build secure Firecracker microVM templates.

## 🛠️ Concepts Illustrated:
1. **Dockerfile Configuration**:
   - Building clean environments starting with slim python bases.
   - Injecting Chromium components needed for headless browser tools.
   - Exposing runtime endpoints on port `8080`.
2. **`agentcore.json` Config**:
   - Setting system limits (`timeoutSeconds` up to 15 min synchronous, `sessionTTL` up to 8 hours).
   - Mapping JWT Cognito parameters to validate inbound token signatures.
   - Explicitly naming target ECR registries.

## 💡 How it works:
When running `agentcore launch`, the tool searches for these files in the directory root, starts a CodeBuild run, compiles the Dockerfile, pushes it to ECR, and provisions the serverless endpoints.
