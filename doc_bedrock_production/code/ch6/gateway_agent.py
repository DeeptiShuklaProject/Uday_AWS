import logging
import time

from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

# Request the access token from the Amazon Cognito authorizer
time.sleep(10)
print("Requesting the access token from Amazon Cognito authorizer… "
      "(May fail for some time till the domain name propagation completes)")
token_response = utils.get_token(
    user_pool_id, client_id, client_secret, scopeString, REGION
)
token = token_response["access_token"]


def create_streamable_http_transport():
    return streamablehttp_client(
        gatewayURL, headers={"Authorization": f"Bearer {token}"}
    )


client = MCPClient(create_streamable_http_transport)

yourmodel = BedrockModel(model_id="amazon.nova-pro-v1:0", temperature=0.7)

logging.basicConfig(
    format="%(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler()],
)

with client:
    # Call the listTools — the LLM retrieves whatever the gateway exposes
    tools = client.list_tools_sync()
    agent = Agent(model=yourmodel, tools=tools)
    agent("Hi, can you list all tools available to you")
    agent("Check the order status for order id 123 and show me the "
          "exact response from the tool")

    # Call the MCP tool explicitly — the MCP tool name and arguments must
    # match your AWS Lambda function or OpenAPI/Smithy API
    result = client.call_tool_sync(
        tool_use_id="get-order-id-123-call-1",
        name=targetname + "___get_order_tool",
        arguments={"orderId": "123"},
    )
    print(f"Tool call result: {result['content'][0]['text']}")
