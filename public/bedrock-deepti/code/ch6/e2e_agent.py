import json

import boto3

agentcore_client = boto3.client("bedrock-agentcore-control",
                                region_name=REGION)
secrets_client = boto3.client("secretsmanager", region_name=REGION)

# Retrieve GitHub OAuth credentials from AWS Secrets Manager
secret_name = "github-oauth-credentials"  # Update this to match your secret name

try:
    secret_response = secrets_client.get_secret_value(SecretId=secret_name)
    secret_data = json.loads(secret_response["SecretString"])

    github_client_id = secret_data["clientId"]
    github_client_secret = secret_data["clientSecret"]
    print("✅ Successfully retrieved GitHub OAuth credentials "
          "from Secrets Manager")

    # Create GitHub OAuth credential provider
    github_provider_response = agentcore_client.create_oauth2_credential_provider(
        name="github-provider-gateway-demo",
        credentialProviderVendor="GitHubOauth2",
        oauth2ProviderConfigInput={
            "githubOauth2ProviderConfig": {
                "clientId": github_client_id,
                "clientSecret": github_client_secret,
            }
        },
    )
except Exception as e:
    print(f"❌ Error: {e}")


async def needs_authentication(response_text: str):
    """Watch tool responses for a consent URL — emit it so the caller can
    complete the OAuth flow, then retry the tool."""
    if "authorization" in response_text.lower() and "http" in response_text:
        pass  # emit the URL, await user consent, then re-invoke
