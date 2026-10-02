import json

# =====================================================================
# EPISODE 04: Gateway Deep Dive
# File: ep04_lambda_mcp_server.py (AWS Lambda MCP server simulation)
# =====================================================================

DATABASE = {
    "user_101": {"name": "Deepti Shukla", "membership": "Premium", "balance": "$540.00"},
    "user_102": {"name": "Nishu Saxena", "membership": "Basic", "balance": "$12.50"}
}

def get_user_profile(user_id: str) -> dict:
    profile = DATABASE.get(user_id)
    if profile:
        return {
            "status": "success",
            "data": profile
        }
    return {
        "status": "error",
        "message": f"User ID {user_id} not found."
    }

def lambda_handler(event, context):
    print(f"[LAMBDA LOG] Incoming Gateway Event: {json.dumps(event)}")
    method = event.get("method", "")
    params = event.get("params", {})
    
    if method == "tools/list":
        return {
            "statusCode": 200,
            "body": {
                "tools": [
                    {
                        "name": "get_user_profile",
                        "description": "Fetch user profile details (membership status and balance) from database using user_id.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "user_id": {
                                    "type": "string",
                                    "description": "Unique identifier of the customer (e.g. user_101)"
                                }
                            },
                            "required": ["user_id"]
                        }
                    }
                ]
            }
        }
        
    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if tool_name == "get_user_profile":
            user_id = arguments.get("user_id")
            result = get_user_profile(user_id)
            return {
                "statusCode": 200,
                "body": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(result)
                        }
                    ]
                }
            }
        else:
            return {
                "statusCode": 404,
                "body": {"error": f"Unknown tool: {tool_name}"}
            }
            
    return {
        "statusCode": 400,
        "body": {"error": "Invalid method request format."}
    }

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: How does the Bedrock AgentCore Gateway act as a secure proxy?
# A1: The AI Agent executes inside sandboxed MicroVMs, which should not have direct, 
#     unmonitored access to enterprise VPCs or databases. The Gateway acts as a proxy: 
#     it intercept tools requests, validates signature claims, translates the request 
#     into Lambda invokers, executes the Lambda within private networks, and returns 
#     only raw textual data to the sandboxed agent, ensuring data isolation.
#
# Q2: Describe Server-Sent Events (SSE) streaming within AgentCore Gateway.
# A2: For responsive user interfaces, waiting for a complete LLM response can lead 
#     to high perceived latencies. The Gateway supports SSE streaming: it streams back 
#     model tokens character-by-character to the client as they are generated. 
#     If a tool call occurs, it suspends streaming, invokes the target tool, 
#     and resumes token generation once data results are received.
#
# Q3: How do you register private VPC endpoints as MCP servers?
# A3: You can map AWS Lambda handlers, API Gateways, or ECS tasks in your private subnets 
#     as MCP endpoints. In the AgentCore portal or CLI configuration, you associate 
#     the tool definition schema and supply the service ARN (Amazon Resource Name) 
#     which the Gateway calls on behalf of the agent.
# =====================================================================
