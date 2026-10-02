import json

# =====================================================================
# EPISODE 07: Memory Deep Dive
# File: ep07_dynamo_longterm.py (DynamoDB Memory Management)
# =====================================================================

class SessionMemory:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.turns = []

    def add_message(self, role: str, content: str):
        self.turns.append({"role": role, "content": content})

    def get_conversation_history(self) -> list:
        return self.turns

class LongTermMemoryStore:
    def __init__(self):
        self.db = {}

    def fetch_user_profile(self, user_id: str) -> dict:
        return self.db.get(user_id, {
            "user_id": user_id,
            "interests": [],
            "past_topics": [],
            "summary": "New user. No historical context."
        })

    def update_user_profile(self, user_id: str, new_profile: dict):
        self.db[user_id] = new_profile

class MemoryManager:
    def __init__(self, db_store: LongTermMemoryStore):
        self.db_store = db_store

    def run_end_of_session_compaction(self, user_id: str, history: list):
        profile = self.db_store.fetch_user_profile(user_id)
        for turn in history:
            content = turn["content"].lower()
            if "like" in content or "prefer" in content:
                preference = turn["content"].split("prefer")[-1].strip(" .")
                if preference not in profile["interests"]:
                    profile["interests"].append(preference)
            if "learn" in content or "study" in content:
                topic = turn["content"].split("study")[-1].strip(" .")
                if topic not in profile["past_topics"]:
                    profile["past_topics"].append(topic)
        profile["summary"] = f"User is studying {', '.join(profile['past_topics'])}. Prefers {', '.join(profile['interests'])}."
        self.db_store.update_user_profile(user_id, profile)

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: Contrast Short-term memory and Long-term memory in AgentCore architectures.
# A1: - Short-term memory preserves the immediate conversational chat history turns. 
#       It lives inside the active hypervisor RAM during the session execution loop.
#     - Long-term memory persists user profile summaries, facts, and rules *across* 
#       sessions. It is backed by a permanent DynamoDB table and loaded when a new 
#       MicroVM is spun up for a returning user.
#
# Q2: Explain the "Memory Compaction" pattern and its benefits.
# A2: Feeding 10 consecutive sessions of raw chat logs directly into an LLM 
#     causes prompt blowup (high costs and latency). The Memory Compaction pattern 
#     runs a post-session cron/worker that uses a cheap model to extract key 
#     entities/learnings (e.g. "User prefers Hinglish explanations") and updates 
#     the structured user profile, discarding the raw chat turns.
#
# Q3: How do you design DynamoDB schemas to handle Agent long-term profiles?
# A3: A standard design has the Partition Key (PK) as `USER#<ActorID>` and the 
#     Sort Key (SK) as `PROFILE#METADATA`. Key attributes include interests (StringSet), 
#     summarized_context (String), and last_updated_epoch (Number) to implement 
#     optimistic locking, preventing concurrent session writes from overwriting data.
# =====================================================================
