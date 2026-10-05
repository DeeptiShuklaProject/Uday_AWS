# customer-support / lab-02-agentcore-memory notebook — transcribed from the episode
# (blocks that scrolled past the bottom of the screen are marked)

# ── Imports ────────────────────────────────────────────────────────
import logging

# Import AgentCore Memory
from bedrock_agentcore_starter_toolkit.operations.memory.manager import MemoryManager
from bedrock_agentcore.memory.client import MemoryClient
from bedrock_agentcore.memory.constants import StrategyType

from strands.hooks import AfterInvocationEvent, HookProvider, HookRegistry, MessageAddedEvent

import boto3
from boto3.session import Session

boto_session = Session()
REGION = boto_session.region_name

logger = logging.getLogger(__name__)

from lab_helpers.utils import get_ssm_parameter, put_ssm_parameter

# ── Step 2: Create the memory resource with all 3 strategies ───────
memory_client = MemoryClient(region_name=REGION)
memory_name = "CustomerSupportChat"


def create_or_get_memory_resource():
    try:
        memory_id = get_ssm_parameter("/app/customersupport/agentcore/memory_id")
        memory_client.gmcp_client.get_memory(memoryId=memory_id)
        return memory_id
    except:
        try:
            strategies = [
                {
                    StrategyType.USER_PREFERENCE.value: {
                        "name": "CustomerPreferences",
                        "description": "Captures customer preferences and behavior",
                        "namespaces": ["support/customer/{actorId}/preferences"],
                    }
                },
                {
                    StrategyType.SEMANTIC.value: {
                        "name": "CustomerSupportSemantic",
                        "description": "Stores facts from conversations",
                        "namespaces": ["support/customer/{actorId}/semantic"],
                    }
                },
                {
                    StrategyType.SUMMARY.value: {
                        "name": "CustomerSupportSummary",
                        "description": "Stores summary of conversations",
                        "namespaces": ["support/customer/{actorId}/{sessionId}"],
                    }
                }
            ]
            print("Creating AgentCore Memory resources. This will take 2-3 minutes...")
            # ... (create_or_get_memory call + put_ssm_parameter continue
            #      below the fold — event_expiry_days=90 was set on screen)

# Output on screen:
#   ✅ AgentCore Memory created successfully!
#      Memory ID: CustomerSupportChat-I1PHXEBT4w

# ── Step 3: Seed previous customer interactions ────────────────────
CUSTOMER_ID = "customer_001"
previous_interactions = [
    ("I'm having issues with my MacBook Pro overheating during video editing.", "USER"),
    # ... further USER/ASSISTANT pairs below the fold (gaming headphones,
    #     FPS games, laptop budget under $1200 with 16GB RAM)
]

memory_client.create_event(
    memory_id=memory_id,
    actor_id=CUSTOMER_ID,
    session_id="previous_session",
    messages=previous_interactions
)
# Output: ✅ Seeded customer history successfully
#         💾 Interactions saved to Short-Term Memory
#         ⏳ Long-Term Memory processing will begin automatically…

# ── Retrieve extracted preferences ─────────────────────────────────
# memory_client.retrieve_memories(
#     namespace=f"support/customer/{CUSTOMER_ID}/preferences", ...)
#
# Output on screen: "Found 3 preference memories after 0 seconds!"
#   - concern about laptop performance / thermal management (MacBook Pro overheating)
#   - prefers low-latency gaming headphones (competitive FPS games)
#   - laptop under $1200 with 16GB RAM
#
# Semantic namespace retrieval shown at bottom of the same cell:
#   namespace=f"support/customer/{CUSTOMER_ID}/semantic"
