# Episode 04: Gateway & MCP Servers Deep Dive

This directory explains how the **AgentCore Gateway** connects to internal AWS services (like Lambda functions) and exposes them to your AI Agents as standard Model Context Protocol (MCP) tools.

---

## 💡 What is Model Context Protocol (MCP)?
Model Context Protocol is an open standard designed by Anthropic that allows LLMs to query external databases, invoke terminal commands, or use custom APIs. It operates via JSON-RPC 2.0 messages.

---

## 🛠️ How to Create an MCP Server (Two Approaches)

### Approach A: Serverless Lambda (Custom JSON-RPC Wrapper)
When running inside AWS Lambda, there is no persistent socket or stdio connection. Instead, Lambda acts as a serverless RPC handler that responds to inbound payload triggers matching standard MCP paths.

1. **Implement `tools/list`** to declare the agent tools:
   ```json
   {
     "method": "tools/list",
     "params": {}
   }
   ```
2. **Implement `tools/call`** to execute the logic:
   ```json
   {
     "method": "tools/call",
     "params": {
       "name": "search_inventory",
       "arguments": { "make": "Tesla" }
     }
   }
   ```

*Refer to [ep04_industry_dealership_inventory.py](file:///c:/Users/nishu/workspace/aws-bedrock/examples/04_gateway_lambda/ep04_industry_dealership_inventory.py) to see this in action.*

---

### Approach B: Long-Running Server (Using the Official Python `mcp` SDK)
For containerized services (ECS/Fargate) or local development, you can use the official `mcp` Python SDK:

```bash
pip install mcp
```

#### Code Pattern (FastMCP):
```python
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("DealershipInventory")

# Register tool using python decorators
@mcp.tool()
def search_vehicles(make: str) -> str:
    """Search for vehicles in the inventory by brand."""
    # Custom DB fetch goes here
    return f"Found Model Y and Model 3 for brand {make}"

if __name__ == "__main__":
    # Runs standard MCP server on stdio transport stream
    mcp.run()
```

---

## 💻 How to Run Tests locally:
```bash
$env:PYTHONPATH="examples/04_gateway_lambda"
python examples/04_gateway_lambda/test_ep04.py
python examples/04_gateway_lambda/test_ep04_industry.py
```
