# math-agent-with-checkpointing.ipynb — transcribed from the episode's notebook
# (blocks that scrolled past the bottom of the screen are marked)

# ── Cell 1: Install ────────────────────────────────────────────────
# !pip install -qr requirements.txt

# ── Cell 2: LangGraph / LangChain imports ──────────────────────────
# Import LangGraph and LangChain components
from langchain.chat_models import init_chat_model
from langchain.tools import tool
from langgraph.prebuilt import create_react_agent

# ── Cell 3: AgentCore Memory imports + memory resource ─────────────
# Import the AgentCoreMemorySaver that we will use as a checkpointer
import os
import logging

from langgraph_checkpoint_aws import AgentCoreMemorySaver
from bedrock_agentcore.memory import MemoryClient

region = os.getenv('AWS_REGION', 'us-west-2')
logging.getLogger("math-agent").setLevel(logging.DEBUG)

# Create or get the memory resource
memory_name = "MathLangraphAgent"
# ... (memory client + create_or_get call continues below the fold;
#      the created memory id shown on screen: 'MathLangraphAgent-VeyRYx5jhJ')

# ── Cell 4: Checkpointer + model + tools ───────────────────────────
# checkpointer = AgentCoreMemorySaver(memory_id, region_name=region)
# llm = init_chat_model(MODEL_ID, model_provider="bedrock_converse", region_name=region)

# Simple math tools
# @tool
# def add(a: int, b: int) -> int: ...
# @tool
# def multiply(a: int, b: int) -> int: ...
# tools = [add, multiply]

# ── Cell 5: Build the agent ────────────────────────────────────────
graph = create_react_agent(
    model=llm,                 # Bedrock model via init_chat_model
    tools=tools,               # [add, multiply]
    prompt="You are a helpful assistant",
    checkpointer=checkpointer  # AgentCoreMemorySaver — every step checkpoints to short-term memory
)

# ── Cell 6: Runtime config — the two REQUIRED ids ──────────────────
config = {
    "configurable": {
        "thread_id": "session-1",      # REQUIRED: maps to Bedrock AgentCore session_id under the hood
        "actor_id": "react-agent-1",   # REQUIRED: maps to Bedrock AgentCore actor_id under the hood
    }
}

inputs = {"messages": [{"role": "user", "content":
    "What is 1337 times 515321? Then add 412 and return the value to me."}]}

# Streamed updates showed the agent calling the tools:
#   multiply {"a": 1337, "b": 515321}  →  688984177
#   add      {"a": 688984177, "b": 412} → 688984589

# ── Inspect state + checkpoint history ─────────────────────────────
# graph.get_state(config)
# list(graph.get_state_history(config))   # 6 checkpoints, reverse chronological

# Follow-up that proves persistence:
#   "What were the first calculations I asked you to do?"
#   → agent recalls: multiply 1337 × 515321, then add 412
