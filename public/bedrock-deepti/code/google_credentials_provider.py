import boto3

from scripts.utils import delete_ssm_param, get_ssm_parameter, put_ssm_parameter

identity_client = boto3.client("bedrock-agentcore-control")

PROVIDER_SSM_KEY = "/app/customersupport/agentcore/google_provider"


def store_provider_name_in_ssm(provider_name: str):
    put_ssm_parameter(PROVIDER_SSM_KEY, provider_name)


def get_provider_name_from_ssm() -> str:
    return get_ssm_parameter(PROVIDER_SSM_KEY)


def cleanup():
    delete_ssm_param(PROVIDER_SSM_KEY)


def create_google_provider(client_id: str, client_secret: str):
    """One-time setup: an OAuth2 credential provider managed by Identity.

    Holds YOUR Google OAuth app's client id + secret; Identity uses it to
    broker per-user consent and tokens at runtime.
    """
    return identity_client.create_oauth2_credential_provider(
        name="google-provider",
        credentialProviderVendor="GoogleOauth2",
        oauth2ProviderConfigInput={
            "googleOauth2ProviderConfig": {
                "clientId": client_id,
                "clientSecret": client_secret,
            }
        },
    )
