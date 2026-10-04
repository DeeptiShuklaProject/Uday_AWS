import boto3

ZENDESK_DOMAIN = "https://your-company.zendesk.com"
ZENDESK_AUTH_ENDPOINT = f"{ZENDESK_DOMAIN}/oauth/authorizations/new"
ZENDESK_TOKEN_ENDPOINT = f"{ZENDESK_DOMAIN}/oauth/tokens"
ZENDESK_CLIENT_ID = "<zendesk-client-id>"
ZENDESK_SECRET = "<zendesk-client-secret>"

acps = boto3.client(service_name="bedrock-agentcore-control",
                    config=sdk_config)

provider_config = {
    "customOauth2ProviderConfig": {
        "oauthDiscovery": {
            "authorizationServerMetadata": {
                "issuer": ZENDESK_DOMAIN,
                "authorizationEndpoint": ZENDESK_AUTH_ENDPOINT,
                "tokenEndpoint": ZENDESK_TOKEN_ENDPOINT,
                "responseTypes": ["token"],
            }
        },
        "clientId": ZENDESK_CLIENT_ID,
        "clientSecret": ZENDESK_SECRET,
    }
}

response = acps.create_oauth2_credential_provider(
    name="ZendeskOAuthTokenCfg",
    credentialProviderVendor="CustomOauth2",
    oauth2ProviderConfigInput=provider_config,
)
print("Zendesk provider ARN:", response["credentialProviderArn"])
