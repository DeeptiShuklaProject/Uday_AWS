# AWS Bedrock Course — Chapter 3

# 🧵 Building Intelligent Agents with Strands SDK & Amazon Bedrock

<AgentFlowStoryteller />

## 🎯 Chapter Goal

By the end of this chapter, the learner will be able to:

- Understand the architecture of the **Strands Agents SDK** framework.
- Describe how **Large Language Models (LLMs)** provide native reasoning and tool-calling capabilities.
- Explain the role of the **Agentic Loop** in evaluating queries and orchestrating external tools.
- Contrast model-first agent frameworks with traditional prompt-template-heavy approaches.
- Deploy interactive agentic flows using Amazon Bedrock and Strands SDK.

---

## 3.1 🤖 What are Intelligent AI Agents?

An **AI Agent** is an autonomous software component that uses a Large Language Model (LLM) as its core reasoning engine to accomplish user goals.

Unlike simple linear workflows, an agent can:
1. **Understand** natural language user instructions.
2. **Decompose** complex goals into step-by-step tasks.
3. **Select & Invoke Tools** (APIs, databases, external services).
4. **Evaluate Responses** in an iterative loop until the answer is complete.

---

## 3.2 🔄 The Agentic Loop

The defining feature of an agent is the **Agentic Loop**:

```
User Query ──► Model Evaluation ──► Select Tool ──► Execute Tool ──► Evaluate Result ──► Final Response
                     ▲                                                    │
                     └────────────────── Iterate if needed ───────────────┘
```

This loop enables dynamic decision-making. If a tool call yields partial data, the agent can loop back, call another tool, or refine its approach automatically.

---

## 3.3 ⚡ The Strands Agents SDK Advantage

Traditional agent frameworks often relied on rigid, complex prompt templates and heavy boilerplate code.

Modern models (like **Anthropic Claude 3.5** and **Amazon Nova**) have native reasoning and tool-calling fine-tuned into their architecture. **Strands Agents SDK** leverages this native intelligence:

- **Model-First Architecture**: Relies on the LLM's built-in reasoning rather than prompt wrappers.
- **Lightweight Execution**: Reduces latency, complexity, and unnecessary token overhead.
- **Seamless Integration**: Connects cleanly with AWS Bedrock runtime APIs, Action Groups, and Lambda tools.

---

## 3.4 🛠️ Interactive Hands-On Exploration

Use the interactive visual storyteller deck above to step through each phase of the Strands SDK agent flow:

- **Slide 1**: AI Agent & LLM Natural Language Foundation.
- **Slide 2**: Integrating External Tools & API Actions.
- **Slide 3**: The Dynamic Agentic Loop & Prompt Evolution.
- **Slide 4**: Strands Agents SDK Model-First Framework.
