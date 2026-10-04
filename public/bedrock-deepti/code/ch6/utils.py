import base64
import json
import urllib.request

import boto3

REGION = "us-east-1"


def setup_cognito_user_pool():
    cognito = boto3.client("cognito-idp", region_name=REGION)

    pool = cognito.create_user_pool(PoolName="github-inspector-pool")
    user_pool_id = pool["UserPool"]["Id"]

    cognito.create_resource_server(
        UserPoolId=user_pool_id,
        Identifier="github-inspector",
        Name="GitHub Inspector",
        Scopes=[{"ScopeName": "invoke",
                 "ScopeDescription": "Invoke the agent"}],
    )

    client = cognito.create_user_pool_client(
        UserPoolId=user_pool_id,
        ClientName="github-inspector-client",
        GenerateSecret=True,
        AllowedOAuthFlows=["client_credentials"],
        AllowedOAuthScopes=["github-inspector/invoke"],
        AllowedOAuthFlowsUserPoolClient=True,
    )
    client_id = client["UserPoolClient"]["ClientId"]
    client_secret = client["UserPoolClient"]["ClientSecret"]

    discovery_url = (
        f"https://cognito-idp.{REGION}.amazonaws.com/{user_pool_id}"
        "/.well-known/openid-configuration"
    )
    bearer_token = _client_credentials_token(
        user_pool_id, client_id, client_secret
    )

    return {
        "user_pool_id": user_pool_id,
        "client_id": client_id,
        "client_secret": client_secret,
        "discovery_url": discovery_url,
        "bearer_token": bearer_token,
    }


def reauthenticate_user(client_id):
    return _client_credentials_token(USER_POOL_ID, client_id, CLIENT_SECRET)


def _client_credentials_token(user_pool_id, client_id, client_secret):
    auth = base64.b64encode(
        f"{client_id}:{client_secret}".encode()
    ).decode()
    req = urllib.request.Request(
        f"https://{user_pool_id}.auth.{REGION}.amazoncognito.com/oauth2/token",
        data=(b"grant_type=client_credentials"
              b"&scope=github-inspector/invoke"),
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    return json.loads(urllib.request.urlopen(req).read())["access_token"]
