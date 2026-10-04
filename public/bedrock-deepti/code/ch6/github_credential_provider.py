import json

import boto3

identity_client = boto3.client("bedrock-agentcore-control", region_name=REGION)
secrets_client = boto3.client("secretsmanager", region_name=REGION)

secret_name = "github-oauth-credentials"  # Update this to match your secret name
secret_response = secrets_client.get_secret_value(SecretId=secret_name)
secret_data = json.loads(secret_response["SecretString"])

github_client_id = secret_data["clientId"]
github_client_secret = secret_data["clientSecret"]
print("✅ Successfully retrieved GitHub OAuth credentials from Secrets Manager")

github_provider_response = identity_client.create_oauth2_credential_provider(
    name="github-provider-sep16",
    credentialProviderVendor="GitHubOauth2",
    oauth2ProviderConfigInput={
        "githubOauth2ProviderConfig": {
            "clientId": github_client_id,
            "clientSecret": github_client_secret,
        }
    },
)
print("Provider created:",
      github_provider_response["credentialProviderArn"])
# arn:aws:bedrock-agentcore:us-east-1:<acct>:token-vault/default/
# oauth2credentialprovider/github-provider-sep16
