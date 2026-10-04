import os

import boto3
import utils

REGION = os.environ["AWS_DEFAULT_REGION"]
USER_POOL_NAME = "sample-agentcore-gateway-pool"
RESOURCE_SERVER_ID = "sample-agentcore-gateway-id"
CLIENT_NAME = "sample-agentcore-gateway-client"
SCOPES = [
    {"ScopeName": "gateway:read",  "ScopeDescription": "Read Access"},
    {"ScopeName": "gateway:write", "ScopeDescription": "Write Access"},
]
scopeString = f"{RESOURCE_SERVER_ID}/gateway:read {RESOURCE_SERVER_ID}/gateway:write"

# Setup AWS IAM role — the role the Gateway assumes to invoke targets
agentcore_gateway_iam_role = utils.create_agentcore_gateway_role(
    "sample-lambdagateway"
)
print("Agentcore gateway role ARN:",
      agentcore_gateway_iam_role["Role"]["Arn"])

# Setup Amazon Cognito pool for Inbound authorization
cognito = boto3.client("cognito-idp", region_name=REGION)
print("Creating or retrieving Cognito resources…")

user_pool_id = utils.get_or_create_user_pool(cognito, USER_POOL_NAME)
print("User Pool ID:", user_pool_id)

utils.get_or_create_resource_server(
    cognito, user_pool_id, RESOURCE_SERVER_ID, SCOPES
)
client_id, client_secret = utils.get_or_create_m2m_client(
    cognito, user_pool_id, CLIENT_NAME, RESOURCE_SERVER_ID
)
cognito_discovery_url = (
    f"https://cognito-idp.{REGION}.amazonaws.com/{user_pool_id}"
    "/.well-known/openid-configuration"
)

# Create the Gateway — CUSTOM_JWT authorizer against Cognito
gateway_client = boto3.client("bedrock-agentcore-control",
                              region_name=REGION)

auth_config = {
    "customJWTAuthorizer": {
        "allowedClients": [client_id],
        "discoveryUrl": cognito_discovery_url,
    }
}
create_response = gateway_client.create_gateway(
    name="TestGWforLambdaSep16",
    roleArn=agentcore_gateway_iam_role["Role"]["Arn"],
    protocolType="MCP",
    authorizerType="CUSTOM_JWT",
    authorizerConfiguration=auth_config,
    description="AgentCore Gateway with AWS Lambda target type",
)
gatewayURL = create_response["gatewayUrl"]
gatewayID = create_response["gatewayId"]
print("Gateway URL:", gatewayURL)
