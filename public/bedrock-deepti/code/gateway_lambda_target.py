# Bring your own Lambda — paste the ARN and describe the tools it exposes.
# The Gateway converts the MCP JSON-RPC calls into Lambda invocations
# using exactly this schema — you never write the translation.

lambda_target_payload = {
    "lambdaArn": "<your-lambda-arn>",   # ARN of the Lambda to MCP-ify
    "toolSchema": {
        "inlinePayload": [
            {
                "name": "get_weather",
                "description": "Get weather for a location",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The location to get weather for",
                        }
                    },
                    "required": ["location"],
                },
            },
            {
                "name": "get_time",
                "description": "Get time for a timezone",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "timezone": {
                            "type": "string",
                            "description": "The timezone to get the time for",
                        }
                    },
                    "required": ["timezone"],
                },
            },
        ]
    },
}

# Same ARN, different schema → the SAME Lambda can back two different
# gateways exposing different tools (the tenancy trick from the demo).
