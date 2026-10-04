import asyncio
import json
import os
from typing import Optional

import httpx
from strands import Agent, tool
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from bedrock_agentcore.identity.auth import requires_access_token

os.environ["STRANDS_OTEL_ENABLE_CONSOLE_EXPORT"] = "false"

app = BedrockAgentCoreApp()

github_access_token: Optional[str] = None


def stream_with_tasks():
    """Yield agent events while the background tasks complete."""


@tool
def inspect_github_repos() -> str:
    """List the authenticated user's private GitHub repositories."""
    global github_access_token
    if not github_access_token:
        return json.dumps({
            "status": "auth_required",
            "message": "Authentication required for GitHub access. "
                       "Starting authorization flow...",
        })

    async def fetch():
        async with httpx.AsyncClient() as http:
            user = (await http.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {github_access_token}"},
            )).json()
            username = user["login"]
            print(f"✅ User: {username}")
            repos = (await http.get(
                "https://api.github.com/search/repositories",
                headers={"Authorization": f"Bearer {github_access_token}"},
                params={"q": f"user:{username}", "per_page": 50},
            )).json()
            print(f"📦 Found {repos['total_count']} repositories")
            return repos["items"]

    repos = asyncio.run(fetch())
    return json.dumps([
        {
            "name": r["name"],
            "language": r["language"],
            "stars": r["stargazers_count"],
            "description": r["description"],
        }
        for r in repos
    ], indent=2)


@requires_access_token(
    provider_name="github-provider-sep16",
    scopes=["repo"],
    auth_flow="USER_FEDERATION",
    on_auth_url=lambda url: print(f"Authorization URL: {url}"),
    force_authentication=True,
)
async def get_github_token(access_token: str = None):
    global github_access_token
    github_access_token = access_token


async def task():
    await get_github_token()


@app.entrypoint
async def invoke(payload, context):
    await task()
    agent = Agent(tools=[inspect_github_repos])
    return stream_with_tasks()


if __name__ == "__main__":
    app.run()
