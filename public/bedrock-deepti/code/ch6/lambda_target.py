lambda_target_config = {
    "mcp": {
        "lambda": {
            "lambdaArn": lambda_resp["lambda_function_arn"],
            "toolSchema": {
                "inlinePayload": [
                    {
                        "name": "get_order_tool",
                        "description": "Tool to get the order",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "orderId": {"type": "string"},
                            },
                            "required": ["orderId"],
                        },
                    },
                    {
                        "name": "update_order_tool",
                        "description": "Tool to update the order",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "orderId": {"type": "string"},
                                "status":  {"type": "string"},
                            },
                            "required": ["orderId"],
                        },
                    },
                ]
            },
        }
    }
}

credential_config = [{"credentialProviderType": "GATEWAY_IAM_ROLE"}]

targetname = "LambdaUsingSDK"
response = gateway_client.create_gateway_target(
    gatewayIdentifier=gatewayID,
    name=targetname,
    description="Lambda Target using SDK",
    targetConfiguration=lambda_target_config,
    credentialProviderConfigurations=credential_config,
)
print("Target created:", response["targetId"])
