import os

from bedrock_agentcore.identity.auth import requires_access_token
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from mcp.client.streamable_http import streamablehttp_client
from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from strands_tools import current_time, retrieve

from scripts.utils import get_ssm_parameter

os.environ["KNOWLEDGE_BASE_ID"] = get_ssm_parameter(
    "/app/customersupport/knowledge_base/knowledge_base_id"
)

gateway_url = get_ssm_parameter("/app/customersupport/agentcore/gateway_url")
SSM_COGNITO_PROVIDER = get_ssm_parameter("/app/customersupport/agentcore/cognito_provider")

system_prompt = """
You are a helpful customer support agent.

Guidelines:
1. Use retrieve() to answer warranty policy questions from the knowledge base.
2. Use the gateway tools (check_warranty, get_customer_profile) for account data.
3. Be concise and professional; always verify policy details before answering.
"""

ACCESS_TOKEN = None


@requires_access_token(provider_name=SSM_COGNITO_PROVIDER, scopes=[], auth_flow="M2M")
def get_access_token(access_token=None):
    global ACCESS_TOKEN
    ACCESS_TOKEN = access_token
