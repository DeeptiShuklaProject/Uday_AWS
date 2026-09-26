# Chapter_14_tools

## 🎯 Learning Objectives
In this chapter, you will learn how to:
- Define parameter schemas for custom tools using JSON.
- Register Python functions in a central Tool Registry.
- Coordinate tool invocation requests from the foundation model.
- Enforce exception handling in tool executions.

### Importance of This Chapter
AI models cannot query databases or interact with external APIs out of the box. Specifying tool schemas allows the model to request external operations, extending the agent's capabilities.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** Tool
>
> **Simple Explanation:** A Tool is a registered function or API endpoint that an AI model can request to execute when it needs external information or actions.
>
> **Why do we need it?** Models are static; tools allow them to read databases, run calculations, or query websites in real time.
>
> **Where is it used?** In agent codebases, where tools are defined as JSON schemas and Python functions.

---

> **📦 Technical Term Explained**
>
> **Term:** Tool Invocation
>
> **Simple Explanation:** Tool Invocation is the execution step where the agent runtime runs a registered function using the parameter arguments returned by the model.
>
> **Why do we need it?** To perform the actual work requested by the model and return the output.
>
> **Where is it used?** Inside the agent's execution loop when processing a `toolUse` model response.

---

## 🧠 Custom Tools Registration Workflow

The tool invocation sequence flows as follows:

```
┌──────────────┐     1. Invoke Prompt       ┌───────────────┐
│ Client App   ├───────────────────────────>│ Agent Runtime │
└──────────────┘                            └───────┬───────┘
                                                    │
                                                    │ 2. Evaluate Tools list
                                                    ▼
┌──────────────┐     4. Return Output       ┌───────────────┐
│ Tool Handler │<───────────────────────────┤ Model Converse│
└──────────────┘                            └───────────────┘
```

1. **Schema Definition:** Define your tools and input schemas (parameter types, descriptions) in your code.
2. **Model Call:** Send these tool schemas to the model along with the user's prompt.
3. **Execution request:** If the model requires external data, it returns a `toolUse` block and pauses generation.
4. **Local execution:** The agent runtime intercepts the request, runs the registered function, and passes the output back to the model.

---

## 📝 Custom Tool Implementation

Here is how to register custom tools in Python:

```python
# File: src/tools_impl.py
# Folder Location: agentcore-samples/src/tools_impl.py

import json
from typing import Dict, Any

# =====================================================================
# 1. Define Tool Schema
# =====================================================================
LOOKUP_WARRANTY_SCHEMA = {
    "name": "lookup_warranty_status",
    "description": "Retrieve the warranty coverage status for a specific customer order ID.",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "The unique 5-digit order identifier (e.g., '12345')."
                }
            },
            "required": ["order_id"]
        }
    }
}

# =====================================================================
# 2. Implement Tool Executor
# =====================================================================
class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register_tool(self, name: str, func):
        self.tools[name] = func

    def execute_tool(self, name: str, arguments: Dict[str, Any]) -> str:
        if name not in self.tools:
            return f"Error: Tool '{name}' is not registered."
            
        try:
            return self.tools[name](**arguments)
        except Exception as e:
            return f"Execution error in tool '{name}': {str(e)}"

# Define the python function
def lookup_warranty_status(order_id: str) -> str:
    db_mock = {
        "12345": "Expired (254 days ago)",
        "67890": "Active - Under coverage"
    }
    return db_mock.get(order_id, "Order ID not found.")

# Register tool
registry = ToolRegistry()
registry.register_tool("lookup_warranty_status", lookup_warranty_status)
```

### Line-by-Line Code Explanation

- **`LOOKUP_WARRANTY_SCHEMA`:** The JSON schema defining the tool name, description, parameter types, and required fields.
- **`class ToolRegistry`:** Manages tool registration and execution.
- **`execute_tool(...)`:** Executes the requested function with the arguments provided by the model and catches any exceptions.
- **`lookup_warranty_status(...)`:** The function containing the tool's business logic.

---

## 📊 Visual Reference

Let's look at the tool definitions in our editor:

![Figure 14-1: Custom tool decorator code structure](images/agent_section_12.png)
*Caption: Tool declarations and schemas.*
- **What to Observe:** The import statements and schema properties defined for the tool.
- **Why it Matters:** The model uses the tool description and parameter schema to decide when and how to call the tool.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Invalid JSON Schema formatting (e.g. missing `inputSchema` key), causing model validation errors.
  - **Resolution:** Verify your schemas match the Bedrock parameters specification.
- **Mistake:** Tool functions throwing unhandled exceptions, crashing the agent runtime.
  - **Resolution:** Wrap tool execution steps in try-except blocks to catch exceptions and return the error message to the model.

---

## 📝 Practical Exercise
Add a new tool named `calculate_tax` that accepts a `subtotal` (number) and a `tax_rate` (number), calculates the total, and returns the result as a string.

---

## 🔄 Chapter Recap
- We studied the tool invocation lifecycle.
- We declared parameter schemas for our tools.
- We implemented a Tool Registry to manage and execute custom Python functions.
- We are ready to deploy our application.
