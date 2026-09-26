# Chapter_11_gateway

## 🎯 Learning Objectives
In this chapter, you will learn:
- The role of the AgentCore Gateway as an API broker.
- How the Model Context Protocol (MCP) standardizes tool routing.
- How to configure tool gateways using JSON settings files.
- How semantic tool routing reduces prompt tokens and latency.

### Importance of This Chapter
Hardcoding API endpoints and credentials inside your agent container introduces security risks and makes updates difficult. The Gateway acts as a managed broker, decoupling tool integration from your agent code.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** MCP (Model Context Protocol)
>
> **Simple Explanation:** Model Context Protocol is an open-source standard that defines how AI models interact with data sources and tools.
>
> **Why do we need it?** It standardizes tool schemas and responses, allowing the same tool code to work across different models and orchestrators.
>
> **Where is it used?** In the communications between the AgentCore runtime and the Gateway.

---

> **📦 Technical Term Explained**
>
> **Term:** REST API
>
> **Simple Explanation:** A REST API is a web service architecture that uses standard HTTP methods (like GET, POST, PUT, DELETE) to enable client-server interactions.
>
> **Why do we need it?** It provides a lightweight, stateless standard for requesting and sending data over the web.
>
> **Where is it used?** When calling downstream microservices, databases, or third-party web portals.

---

## 🧠 Gateway Architecture and MCP

The Gateway is built on the open-source **Model Context Protocol (MCP)**, standardizing tool calls and data access.

```
┌────────────────────────────────────────────────────────┐
│               AGENT CORE RUNTIME CONTAINER             │
└──────────────────────────┬─────────────────────────────┘
                           │ JSON-RPC / SSE
                           ▼
┌────────────────────────────────────────────────────────┐
│                  AGENTCORE GATEWAY                     │
│  - Standardizes tool schemas                           │
│  - Manages API credentials                             │
│  - Performs semantic tool filtering                    │
└──────────────────────────┬─────────────────────────────┘
                           │ Private IAM / Credentials
                           ▼
┌────────────────────────────────────────────────────────┐
│            DOWNSTREAM ENTERPRISE SERVICES              │
│       (AWS Lambda, Database APIs, Third-Party APIs)    │
└────────────────────────────────────────────────────────┘
```

---

## 🔍 Semantic Tool Routing

When an agent has access to hundreds of enterprise tools, passing every tool schema to the LLM increases latency, costs, and the risk of incorrect tool calls.

The Gateway resolves this by performing **Semantic Tool Routing**:
1. When a user prompt is received, the Gateway extracts semantic embeddings from the text.
2. It compares the prompt embeddings against its index of registered tool descriptions.
3. It passes only the matching tool schemas to the model, reducing prompt sizes and invocation costs.

---

## 📄 Gateway Configuration (`gateway_config.json`)

To register downstream tools with the Gateway, define them in a configuration file:

```json
{
  "gatewayName": "enterprise-tool-gateway",
  "mcpServers": {
    "database-tools": {
      "type": "lambda",
      "functionArn": "arn:aws:lambda:us-east-1:123456789012:function:DatabaseToolExecutor",
      "tools": [
        {
          "name": "lookup_customer_profile",
          "description": "Lookup customer tier, registration date, and email by customer ID.",
          "inputSchema": {
            "type": "object",
            "properties": {
              "customer_id": {
                "type": "string",
                "description": "The unique 6-digit customer identifier."
              }
            },
            "required": ["customer_id"]
          }
        }
      ]
    }
  }
}
```

---

## 📊 Visual Reference

Let's look at how the Gateway maps tool configurations in the AWS console:

![Figure 11-1: Gateway Tool Configurations](images/agent_section_5.png)
*Caption: Registered tools and server configurations in the Gateway Console.*
- **What to Observe:** The MCP tool servers list and associated IAM roles.
- **Why it Matters:** Allows developers to register and update tools without modifying the core agent codebase.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Ambiguous tool descriptions that cause semantic routing to miss relevant prompts.
  - **Resolution:** Write descriptive docstrings detailing when the tool should be called and what parameters it accepts.
- **Mistake:** Missing Lambda resource permissions.
  - **Resolution:** Configure the trust policy to allow the Gateway service principal (`gateway.agentcore.amazonaws.com`) to invoke the function.

---

## 📝 Practical Exercise
Add a second tool configuration to the `gateway_config.json` file named `check_inventory`. Define its parameters and verify the JSON file matches formatting requirements.

---

## 🔄 Chapter Recap
- We studied the Gateway architecture and the MCP protocol.
- We analyzed semantic tool routing.
- We configured downstream tools in `gateway_config.json`.
- We are ready to secure our workflows using Identity.
