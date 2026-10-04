import os

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands_tools import current_time, retrieve

app = BedrockAgentCoreApp()

agent = None


def create_agent():
    model_id = "us.anthropic.claude-sonnet-4-20250514-v1:0"
    model = BedrockModel(model_id=model_id)
    tools = [current_time, retrieve]
    return Agent(model=model, tools=tools)


@app.entrypoint
async def invoke(payload, context):
    global agent
    if agent is None:
        agent = create_agent()

    session_id = context.session_id
    user_prompt = payload.get("prompt", "")

    async for event in agent.stream_async(user_prompt):
        yield event


app.run()
