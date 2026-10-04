import urllib.parse

import requests


async def invoke_endpoint(agent_arn: str, payload, session_id: str, bearer_token: str):
    escaped_arn = urllib.parse.quote(agent_arn, safe="")
    url = (
        f"https://bedrock-agentcore.{region}.amazonaws.com"
        f"/runtimes/{escaped_arn}/invocations/"
    )

    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "Content-Type": "application/json",
        "X-Amzn-Bedrock-AgentCore-Runtime-Session-Id": session_id,
    }

    resp = requests.post(url, headers=headers, json=payload, stream=True)
    resp.raise_for_status()

    for line in resp.iter_lines(chunk_size=None):
        if line:
            line = line.decode("utf-8")
            if line.startswith("data: "):
                yield line[6:]
