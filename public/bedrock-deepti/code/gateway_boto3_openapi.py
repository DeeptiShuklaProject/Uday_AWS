# Same control plane, raw boto3 — no starter toolkit sugar.
# Service name: bedrock-agentcore-control

import boto3
import os
from pprint import pprint
from botocore.config import Config

acps = boto3.client(service_name="bedrock-agentcore-control")
gateway_client = boto3.client('bedrock-agentcore-control', region_name=os.environ['AWS_DEFAULT_REGION'])

# ── Step 1: outbound credential provider ─────────────────────────────────
# NASA's API wants an API key — store it ONCE in the Identity credential
# vault (backed by Secrets Manager), not in the agent.
response = acps.create_api_key_credential_provider(
    name="NasaDemov2",
    apiKey="DEMO_KEY",  # Get an API key by signing up at api.nasa.gov — 2 min, in your email
)
pprint(response)
credentialProviderARN = response['credentialProviderArn']
print(f"Egress Credentials provider ARN, {credentialProviderARN}")

# ── Step 2: point the target at the OpenAPI spec on S3 ───────────────────
# The Gateway reads the spec and converts each operation into an MCP tool —
# MCP JSON-RPC in, OpenAPI/REST call out. Zero code.
nasa_openapi_s3_target_config = {
    "mcp": {
        "openApiSchema": {
            "s3": {
                "uri": "s3://openapi-gateway/nasa_mars_insights_openapi.json"
            }
        }
    }
}

# ── Step 3: wire the credential provider to the target ───────────────────
# credentialLocation QUERY_PARAMETER → the key is appended to the request
# URL as ?api_key=… — exactly what api.nasa.gov expects.
api_key_credential_config = [
    {
        "credentialProviderType": "API_KEY",
        "credentialProvider": {
            "apiKeyCredentialProvider": {
                "credentialParameterName": "api_key",  # name of the api key expected by the API provider
                "providerArn": credentialProviderARN,
                "credentialLocation": "QUERY_PARAMETER",  # "HEADER" and "QUERY_PARAMETER" are the options
                # "credentialPrefix": " "   # valid values are "Basic" — applies only for tokens
            }
        }
    }
]

targetname = 'DemoOpenAPITargetS3NasaMars'
response = gateway_client.create_gateway_target(
    gatewayIdentifier=gatewayID,
    name=targetname,
    description='OpenAPI Target with s3Uri using SDK',
    targetConfiguration=nasa_openapi_s3_target_config,
    credentialProviderConfigurations=api_key_credential_config)
