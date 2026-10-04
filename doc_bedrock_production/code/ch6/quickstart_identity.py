from bedrock_agentcore.services.identity import IdentityClient

identity_client = IdentityClient("us-east-1")

# Create a Workload Identity — a stable identity for an agent running
# outside AgentCore Runtime.
workload_identity = identity_client.create_workload_identity(
    name="my-research-agent",
)
print("Workload Identity ARN:", workload_identity["workloadIdentityArn"])
print("Agent name:", workload_identity.get("name"))

# Configure Credential Providers

# OAuth2 Provider Example (Google)
google_provider = identity_client.create_oauth2_credential_provider(req={
    "name": "myGoogleOauth2Provider",
    "credentialProviderVendor": "GoogleOauth2",
    "oauth2ProviderConfigInput": {
        "customOAuth2ProviderConfig": {
            "clientId": "your-google-client-id",
            "clientSecret": "your-google-client-secret",
        }
    },
})

# API Key Provider Example (Perplexity AI)
perplexity_provider = identity_client.create_api_key_credential_provider(req={
    "name": "myPerplexityApiKeyCredentialProvider",
    "apiKey": "myApiKey",
})
