from scripts.utils import get_ssm_parameter
import os

from strands import Agent
from strands.models import BedrockModel
from strands_tools import current_time, retrieve

os.environ["KNOWLEDGE_BASE_ID"] = get_ssm_parameter(
    "/app/customersupport/knowledge_base/knowledge_base_id"
)


def create_agent():
    model_id = "us.anthropic.claude-sonnet-4-20250514-v1:0"

    model = BedrockModel(
        model_id=model_id,
    )

    tools = [current_time, retrieve]

    return Agent(model=model, tools=tools)


agent = create_agent()

prompt = "What are the warranty support guidelines ?"

print(agent(prompt=prompt))
