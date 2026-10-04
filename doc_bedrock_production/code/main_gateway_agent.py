# continuation of main.py — agent + app wiring

app = BedrockAgentCoreApp()

agent = None


def create_agent(access_token=None):
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

    return Agent(model=model, tools=tools, system_prompt=system_prompt)


@app.entrypoint
async def invoke(payload, context):
    global agent
    if agent is None:
        agent = create_agent(ACCESS_TOKEN)

    session_id = context.session_id
    user_prompt = payload.get("prompt", "")

    async for event in agent.stream_async(user_prompt):
        yield event


app.run()
