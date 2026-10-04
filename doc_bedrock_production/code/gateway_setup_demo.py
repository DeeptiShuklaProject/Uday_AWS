import boto3

from scripts.utils import get_ssm_parameter, put_ssm_parameter

gateway_client = boto3.client("bedrock-agentcore-control")

EXECUTION_ROLE_ARN = get_ssm_parameter("/app/customersupport/agentcore/runtime_iam_role")

# --- target config: expose the Lambda functions as MCP tools -------------
lambda_target_config = {
    "mcp": {
        "lambda": {
            "lambdaArn": get_ssm_parameter("/app/customersupport/agentcore/lambda_arn"),
            "toolSchema": {
                "inlinePayload": [
                    {
                        "name": "check_warranty",
                        "description": "Check the warranty status of a device by customer id",
                        "parameters": {"customer_id": {"type": "string"}},
                    },
                    {
                        "name": "get_customer_profile",
                        "description": "Fetch the customer profile by customer id",
                        "parameters": {"customer_id": {"type": "string"}},
                    },
                ]
            },
        }
    }
}

# --- inbound auth: Cognito JWTs only -------------------------------------
auth_config = {
    "customJWTAuthorizer": {
        "allowedClients": ["<cognito-app-client-id>"],
        "discoveryUrl": get_ssm_parameter("/app/customersupport/agentcore/cognito_discovery_url"),
    }
}

response = gateway_client.create_gateway(
    name="customersupport-gw",
    roleArn=EXECUTION_ROLE_ARN,
    protocolType="MCP",
    authorizerType="CUSTOM_JWT",
    authorizerConfiguration=auth_config,
)
gateway_id = response["gatewayId"]
gateway_url = response["gatewayUrl"]

gateway_client.create_gateway_target(
    gatewayIdentifier=gateway_id,
    name="lambda-target",
    targetConfiguration=lambda_target_config,
    credentialProviderConfigurations=[
        {"credentialProviderType": "GATEWAY_IAM_ROLE"}
    ],
)

# persist so the agent can read them at startup
put_ssm_parameter("/app/customersupport/agentcore/gateway_url", gateway_url)
put_ssm_parameter("/app/customersupport/agentcore/gateway_id", gateway_id)
