# AgentCore Gateway via the starter toolkit — the demo's control-plane path.
# pip install bedrock-agentcore-starter-toolkit

from bedrock_agentcore_starter_toolkit.operations.gateway.client import GatewayClient
import json
import logging
import os

region = os.environ['AWS_DEFAULT_REGION']

# High-level Gateway client for the region
client = GatewayClient(region_name=region)
client.logger.setLevel(logging.DEBUG)   # see exactly what the control plane gets

# ── Inbound auth ─────────────────────────────────────────────────────────
# Helper that creates the Cognito user pool, domain and app client for you
# and returns the authorizer_config the Gateway needs.
cognito_response = client.create_oauth_authorizer_with_cognito("TestGateway")
print(f"✅ Cognito auth setup: {json.dumps(cognito_response, indent=2)}")

# ── Create the Gateway ───────────────────────────────────────────────────
# authorizerType becomes CUSTOM_JWT with allowedClients = [cognito client id]
# and the pool's OIDC discovery URL; searchType SEMANTIC enables tool search.
gateway = client.create_mcp_gateway(
    name="TestGateway",
    authorizer_config=cognito_response["authorizer_config"],
    enable_semantic_search=True,
)
gatewayID = gateway["gatewayUrl"].split("/")[2].split(".")[0]
print(f"Gateway URL: {gateway['gatewayUrl']}")   # …/mcp — the data-plane endpoint

# ── Add a Lambda target ──────────────────────────────────────────────────
# target_type="lambda" with no lambdaArn → the toolkit creates a default
# test Lambda exposing get_weather + get_time for you.
lambda_target = client.create_mcp_gateway_target(
    gateway=gateway,
    name="TestGatewayTarget",
    target_type="lambda",
)
print(f"Target status: {lambda_target['status']}")   # → "Target is ready"
