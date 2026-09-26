# Chapter_01_introduction_to_bedrock_agentcore

## 🎯 Learning Objectives
In this chapter, you will learn:
- What Amazon Bedrock and Bedrock AgentCore are.
- Why AWS built AgentCore and how it solves the prototype-to-production gap.
- The differences between console-first Bedrock Agents and code-first Bedrock AgentCore.
- The high-level architecture of AgentCore and its 7 core infrastructure components.

### Importance of This Chapter
Before writing code or running commands, you must understand the infrastructure model of Bedrock AgentCore. This chapter explains the shift from static APIs to serverless runtime VMs, providing the conceptual foundation for the rest of the workbook.

### Prerequisites
There are no technical prerequisites for this chapter. A basic understanding of cloud computing and web applications is helpful.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** Amazon Bedrock
>
> **Simple Explanation:** Amazon Bedrock is an AWS service that lets developers use foundation AI models (like Claude, Llama, and Mistral) through a managed API without having to host or manage the underlying GPU infrastructure.
>
> **Why do we need it?** It simplifies model integration, provides enterprise security boundaries, and charges per token.
>
> **Where is it used?** It is used in applications that generate text, answer user questions, analyze documents, or route agent decisions.

---

> **📦 Technical Term Explained**
>
> **Term:** Amazon Bedrock AgentCore
>
> **Simple Explanation:** Amazon Bedrock AgentCore is a code-first, framework-agnostic runtime and hosting infrastructure platform on AWS. It allows developers to deploy, run, and scale autonomous AI agents securely.
>
> **Why do we need it?** It decouples the reasoning code (e.g. written in Python) from the hosting infrastructure, automatically providing session isolation, memory databases, observability, and tool routing.
>
> **Where is it used?** It is used in production systems to run multi-step AI agents that require long execution times, large payloads, secure sandboxing, and session state persistence.

---

> **📦 Technical Term Explained**
>
> **Term:** Foundation Model (FM)
>
> **Simple Explanation:** A Foundation Model is a large-scale AI model trained on broad data that can be adapted to a wide range of tasks (e.g. summarizing documents, translating languages, writing code, or reasoning).
>
> **Why do we need it?** Instead of training a custom AI model from scratch for every task, developers can use a foundation model as a general-purpose reasoning engine.
>
> **Where is it used?** FMs are the core cognitive engine of AI agents, deciding what actions to take and generating text responses.

---

> **📦 Technical Term Explained**
>
> **Term:** Large Language Model (LLM)
>
> **Simple Explanation:** An LLM is a type of foundation model trained on text data to understand, process, and generate human-like language.
>
> **Why do we need it?** It provides the natural language interface and reasoning capabilities required for chatbots, agents, and search tools.
>
> **Where is it used?** It serves as the text processor inside your agent codebase.

---

> **📦 Technical Term Explained**
>
> **Term:** Agent
>
> **Simple Explanation:** An Agent is an autonomous software system powered by a foundation model that can make decisions, use external tools, access memory, and execute multi-step tasks to achieve a user's goal.
>
> **Why do we need it?** Unlike standard chatbots that only reply to prompts, agents can perform actions (like calling database APIs, running calculations, or searching websites) to complete tasks.
>
> **Where is it used?** Customer support automation, data analysis, report generation, and automated backend operations.

---

## 🧠 The Prototype-to-Production Reality Gap

When developers build a proof-of-concept (POC) AI agent locally, they typically run it inside a single Python script. However, when deploying that agent to production for thousands of users, they face three major infrastructural challenges:

1. **Session Data Isolation:** If multiple users interact with the same agent backend concurrently, there is a risk that temporary data, user files, or conversation histories could leak across sessions.
2. **Compute Time Constraints:** Standard serverless functions (like AWS Lambda) time out after 15 minutes. A complex agent running web research, executing code, or checking databases may require hours to complete a task.
3. **Payload Limitations:** Users may need to upload large files (such as 50MB spreadsheets or documents) for the agent to analyze, which exceeds standard REST API payload limits.

Bedrock AgentCore resolves these issues by running each agent session inside an isolated AWS Firecracker microVM.

---

## 📊 Bedrock Agents (Console-First) vs. AgentCore (Code-First)

The table below contrasts the legacy console-first approach with the new AgentCore platform:

| Feature / Dimension | Bedrock Agents (Console-First) | Bedrock AgentCore (Code-First) |
| :--- | :--- | :--- |
| **Development Workflow** | Configured via forms in the AWS Management Console. | Written as standard Python files in a code repository, configured via YAML. |
| **Orchestration Frameworks** | Restricted to the built-in AWS console orchestrator. | **Framework-agnostic:** Compatible with Strands, LangChain, CrewAI, LangGraph, or custom loops. |
| **Testing Capability** | Tested using the built-in console playground. | Tested locally using container runtimes (Docker/Podman) and standard unit testing frameworks (pytest). |
| **Deployment Lifecycle** | Deployment is managed directly inside the AWS Console. | Managed using standard CI/CD pipelines, ECR image registries, and CloudFormation/CDK. |

---

## 📐 High-Level Architecture Overview

The diagram below illustrates the 7 core components of the Bedrock AgentCore infrastructure:

```
┌────────────────────────────────────────────────────────┐
│                      AGENT RUNTIME CONTAINER           │
│   (Houses reasoning logic: Python, Strands, LangChain) │
└──────────────────────────┬─────────────────────────────┘
                           │
 ┌─────────────────────────┼──────────────────────────┐
 │                    AWS AGENTCORE                   │
 │  ┌──────────────────┐  ┌────────────────────────┐  │
 │  │ 1. Memory Engine │  │ 2. Tool Gateway (MCP)  │  │
 │  └──────────────────┘  └────────────────────────┘  │
 │  ┌──────────────────┐  ┌────────────────────────┐  │
 │  │ 3. Observability │  │ 4. Identity Engine     │  │
 │  └──────────────────┘  └────────────────────────┘  │
 └─────────────────────────┬──────────────────────────┘
                           ▼
             Enterprise APIs, Models, Databases
```

### The 7 Infrastructure Pillars:
1. **Runtime:** Hosts your agent container inside an isolated Firecracker microVM.
2. **Memory:** Manages short-term session histories and long-term user profiles in DynamoDB.
3. **Gateway:** Routes requests to database APIs and Lambdas using the Model Context Protocol (MCP).
4. **Identity:** Authenticates end-users and propagates user identities (Actor IDs) to downstream services.
5. **Observability:** Records execution logs and performance metrics using OpenTelemetry.
6. **Policy:** Restricts tool access and model operations using Cedar access control rules.
7. **Evaluations:** Audits agent response correctness and safety using built-in evaluation suites.

---

## 📊 System Screenshots

Let's review the visual interfaces of the Bedrock AgentCore system.

![Figure 1-1: Persistent Memory Demo](images/agent_section_1.png)
*Caption: Terminal output demonstrating memory persistence across user sessions.*
- **What to Observe:** The terminal log shows the agent recalling the user's name ("Johnny") and exam interests in a completely new chat session.
- **Why it Matters:** Verifies that the runtime session isolation and long-term memory services are integrated and functioning.

![Figure 1-2: CLI Configuration Setup](images/agent_section_2.png)
*Caption: File layout and configuration files in VS Code.*
- **What to Observe:** The left side shows the older console wizard; the right side shows standard code files, including `main.py` and configuration YAMLs managed in VS Code.
- **Why it Matters:** Illustrates the shift to code-first practices, allowing for automated testing and CI/CD integration.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Attempting to build production-grade, custom-orchestrated agents using the legacy console-first Bedrock Agents wizard.
  - **Resolution:** Migrate your reasoning code to standard Python scripts and use the `agentcore` CLI toolchain to package and deploy your application.
- **Mistake:** Deploying an agent to an AWS region that does not support Bedrock AgentCore.
  - **Resolution:** Verify region availability and configure your AWS CLI to target supported regions (such as `us-east-1` or `us-west-2`).

---

## 📝 Practical Exercise
1. Create a workspace directory named `agentcore_workbook/` on your computer.
2. Inside the directory, create a text file named `architecture_notes.txt`.
3. In the text file, write a 3-sentence summary describing the difference between the Runtime layer and the Gateway layer in Bedrock AgentCore.

---

## 🔄 Chapter Recap
- **Amazon Bedrock AgentCore** is a code-first, framework-agnostic platform for deploying production AI agents.
- It secures concurrent user sessions using isolated Firecracker microVMs and manages state using built-in memory engines.
- It standardizes tool access using the Model Context Protocol (MCP) and manages permissions using IAM and Cedar.
