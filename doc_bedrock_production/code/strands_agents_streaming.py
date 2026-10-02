# strands_agents_streaming.py — Deepti's demo agent (local project file,
# not committed to awslabs/agentcore-samples; recreated from the episode).
import asyncio
import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"

from strands import Agent
from strands_tools import calculator

# Initiate our agent without a callback handler
agent = Agent(
    tools=[calculator],
    callback_handler=None,
    model="anthropic.claude-3-5-haiku-20241022-v1:0",
)

from bedrock_agentcore.runtime import BedrockAgentCoreApp
app = BedrockAgentCoreApp()

@app.entrypoint
async def agent_invocation(payload, context):
    """Handler for agent invocation with streaming support"""
    user_message = payload.get(
        "prompt",
        "No prompt found in input, please guide customer to create a json payload with prompt key",
    )
    print("context:\n-------\n", context)
    print("processing message:\n========\n", user_message)

    # Get the agent stream
    agent_stream = agent.stream_async(user_message)
    async for event in agent_stream:
        # Check if this is a string representation of an event
        if isinstance(event, str):
            yield event
        elif "data" in event:
            yield event["data"]

if __name__ == "__main__":
    app.run()
