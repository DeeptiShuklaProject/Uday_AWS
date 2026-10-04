# main.py — memory-wired version (adds to the gateway version)

from bedrock_agentcore.memory import MemoryClient

from memory_hook_provider import MemoryHook
from scripts.utils import get_ssm_parameter

memory_client = MemoryClient(region_name="us-east-1")


def create_agent(access_token=None, memory_hook=None):
    model_id = "us.anthropic.claude-sonnet-4-20250514-v1:0"
    model = BedrockModel(model_id=model_id)

    mcp_client = MCPClient(
        lambda: streamablehttp_client(
            gateway_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    )
    mcp_client.start()
    tools = [current_time, retrieve] + mcp_client.list_tools_sync()

    return Agent(model=model, tools=tools,
                 system_prompt=system_prompt, hooks=[memory_hook])


@app.entrypoint
async def invoke(payload, context):
    actor_id = payload["actor_id"]          # who the user is
    session_id = context.session_id

    memory_hook = MemoryHook(
        memory_client=memory_client,
        memory_id=get_ssm_parameter("/app/customersupport/agentcore/memory_id"),
        actor_id=actor_id,
        session_id=session_id,
    )

    agent = create_agent(ACCESS_TOKEN, memory_hook)

    async for event in agent.stream_async(payload.get("prompt", "")):
        yield event
