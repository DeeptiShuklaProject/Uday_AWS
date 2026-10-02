# =====================================================================
# EPISODE 01: Building Your First Production-Ready AI Agent
# File: ep01_simple_agent.py (Basic Wrapper Implementation)
# =====================================================================

try:
    from bedrock_agent_core import BedrockAgentCoreApp
except ImportError:
    class BedrockAgentCoreApp:
        def __init__(self):
            pass
        def invoke(self, func):
            self.handler = func
            return func

app = BedrockAgentCoreApp()

@app.invoke
def invoke(payload: dict, context) -> str:
    prompt = payload.get("prompt", "")
    session_id = getattr(context, "session_id", "local-session-123")
    return f"[Simple Agent] Prompt: '{prompt}' | Session: {session_id}"
