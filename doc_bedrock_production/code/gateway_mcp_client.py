# Data plane — talk to the Gateway with a stock MCP client.
# No AWS SDK needed here: just streamable HTTP + a bearer token.

from strands.tools.mcp.mcp_client import MCPClient
from mcp.client.streamable_http import streamablehttp_client
from strands import Agent
from strands.models import BedrockModel


def create_streamable_http_transport(mcp_url: str, access_token: str):
    # The Gateway URL is the MCP endpoint; the ONLY auth is the header.
    return streamablehttp_client(
        mcp_url, headers={"Authorization": f"Bearer {access_token}"}
    )


def get_full_tools_list(client):
    # tools/list paginates — loop until pagination_token is exhausted
    more_tools = True
    tools = []
    pagination_token = None
    while more_tools:
        tmp_tools = client.list_tools_sync(pagination_token=pagination_token)
        tools.extend(tmp_tools)
        if tmp_tools.pagination_token is None:
            break
        pagination_token = tmp_tools.pagination_token
    return tools


def run_agent(mcp_url: str, access_token: str):
    bedrockmodel = BedrockModel(
        inference_profile_id="us.amazon.nova-pro-v1:0",
        temperature=0.7,
        streaming=True,
        region_name="us-east-1"
    )

    mcp_client = MCPClient(lambda: create_streamable_http_transport(mcp_url, access_token))

    with mcp_client:
        tools = get_full_tools_list(mcp_client)
        print(f"Found the following tools: {[tool.tool_name for tool in tools]}")
        # The Gateway's tools land in a normal Strands agent like any MCP server
        agent = Agent(model=bedrockmodel, tools=tools)

        while True:
            user_input = input("\nThis is an interactive Strands Agent. Ask me something. When you're finished, say exit or quit: ")
            if user_input.lower() in ["exit", "quit", "bye"]:
                print("Goodbye!")
                break
            print("\nThinking...\n")
            agent(user_input)


# get access token
access_token = client.get_access_token_for_cognito(cognito_response["client_info"])

# Run your agent!
run_agent(gateway["gatewayUrl"], access_token)
