import os
import json
import asyncio
from datetime import datetime
from typing import Optional

import requests
from bedrock_agentcore.services.identity import IdentityClient
from bedrock_agentcore.identity.auth import requires_access_token
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


class ResearchAgent:
    def __init__(self):
        self.client = IdentityClient("us-east-1")
        self.perplexity_api_key: Optional[str] = None
        self.google_access_token: Optional[str] = None

    @requires_access_token(
        provider_name="myPerplexityApiKeyCredentialProvider",
        scopes=[],
        auth_flow="M2M",
    )
    def get_perplexity_key(self, access_token=None):
        self.perplexity_api_key = access_token

    def research(self, topic: str) -> str:
        self.get_perplexity_key()
        resp = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={"Authorization":
                     f"Bearer {self.perplexity_api_key}"},
            json={
                "model": "sonar",
                "messages": [{
                    "role": "user",
                    "content": f"Comprehensive research: {topic}",
                }],
            },
        )
        return resp.json()["choices"][0]["message"]["content"]

    @requires_access_token(
        provider_name="myGoogleOauth2Provider",
        scopes=["https://www.googleapis.com/auth/drive.file"],
        auth_flow="USER_FEDERATION",
        on_auth_url=lambda url: print(f"Authorize: {url}"),
    )
    def get_google_token(self, access_token=None):
        self.google_access_token = access_token

    def save_to_drive(self, title: str, content: str):
        self.get_google_token()
        creds = Credentials(token=self.google_access_token)
        drive = build("drive", "v3", credentials=creds)
        drive.files().create(
            body={"name": f"{title}.md"},
            media_body=content,
        ).execute()
