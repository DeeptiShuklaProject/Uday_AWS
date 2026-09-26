# Episode 08 Example: Production CI/CD & ECR Deployment

This directory contains an AWS CodeBuild **`buildspec.yml`** blueprint that shows how to automate compiling, building, and deploying your Bedrock AgentCore container images to ECR.

## 🛠️ Build Pipeline Phases Explained:
1. **`install`**: Installs Docker inside the build runner.
2. **`pre_build`**: Authenticates CodeBuild to your private ECR registry using AWS CLI authentication.
3. **`build`**: Runs the Docker compiler to pack your python application, tags it with a unique commit version.
4. **`post_build`**: Pushes the compiled image to ECR and writes a deployment configuration metadata file (`imageDetail.json`) so the AgentCore control plane can perform rolling serverless updates.

## 💡 Python Developer Tip:
In production, you do not need to write this Docker build script manually. The `agentcore launch` command compiles and configures this pipeline automatically behind the scenes on your AWS account.
