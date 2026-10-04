from bedrock_agentcore.memory import MemoryClient
from strands.hooks import HookProvider


class MemoryHook(HookProvider):
    """Strands hook that wires AgentCore Memory into the agent lifecycle."""

    def __init__(self, memory_client: MemoryClient, memory_id: str,
                 actor_id: str, session_id: str):
        self.memory_client = memory_client
        self.memory_id = memory_id
        self.actor_id = actor_id
        self.session_id = session_id

    def register_hooks(self, registry):
        registry.add_hook("on_agent_initialized", self.on_agent_initialized)
        registry.add_hook("on_message_added", self.on_message_added)

    def on_agent_initialized(self, event):
        """Inject recent turns + long-term context into the system prompt."""
        recent = self.memory_client.get_last_k_turns(
            memory_id=self.memory_id,
            actor_id=self.actor_id,
            session_id=self.session_id,
            k=5,
        )
        context = "\n".join(
            f"{m['role']}: {m['content']}" for m in recent or []
        )
        if context:
            event.agent.system_prompt += (
                "\n\nPrevious conversation context:\n" + context
            )

    def on_message_added(self, event):
        """Persist every user/agent message to short-term memory.

        Long-term extraction (preferences, facts, summaries) runs
        asynchronously inside AgentCore Memory.
        """
        self.memory_client.create_event(
            memory_id=self.memory_id,
            actor_id=self.actor_id,
            session_id=self.session_id,
            messages=[event.message],
        )
