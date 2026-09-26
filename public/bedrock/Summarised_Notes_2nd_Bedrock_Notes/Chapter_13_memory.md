# Chapter_13_memory

## 🎯 Learning Objectives
In this chapter, you will learn:
- The difference between short-term (RAM) and long-term (DynamoDB) agent memory.
- How to implement a session memory manager class in Python.
- How to set up DynamoDB tables for user profiles.
- How to implement a Memory Compaction loop to extract user facts.

### Importance of This Chapter
AI models are stateless; they do not remember past requests. Passing raw conversation history consumes the model's context window, increasing costs and latency. Memory Compaction extracts key user facts (e.g. preferences, learning goals) and discards the raw chat history, keeping context sizes small.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** Memory
>
> **Simple Explanation:** Memory is the mechanism an AI agent uses to store, recall, and update conversational history and user preferences over time.
>
> **Why do we need it?** To allow the agent to remember context, personalize responses, and reference past interactions.
>
> **Where is it used?** In chat interfaces to track active dialogue or user settings.

---

> **📦 Technical Term Explained**
>
> **Term:** Session Memory
>
> **Simple Explanation:** Session Memory is short-term memory that stores conversation turns within a single, active interaction session.
>
> **Why do we need it?** It allows the model to respond to follow-up questions (e.g., "What did I say earlier?") during a single chat.
>
> **Where is it used?** Stored in temporary RAM or cache memory during execution.

---

> **📦 Technical Term Explained**
>
> **Term:** Long-term Memory
>
> **Simple Explanation:** Long-term Memory is persistent memory that saves user preferences, profile facts, or historical contexts across multiple sessions and system restarts.
>
> **Why do we need it?** To remember user details (like names, roles, or preferences) over weeks or months.
>
> **Where is it used?** Saved in databases like Amazon DynamoDB.

---

> **📦 Technical Term Explained**
>
> **Term:** Embedding
>
> **Simple Explanation:** An embedding is a vector representation of text that captures its semantic meaning, allowing computer programs to compare and evaluate text similarity.
>
> **Why do we need it?** To compare input prompts against database records to retrieve semantically matching content.
>
> **Where is it used?** In vector databases and retrieval search engines.

---

> **📦 Technical Term Explained**
>
> **Term:** Vector Database
>
> **Simple Explanation:** A Vector Database is a database designed to index and search high-dimensional vector embeddings quickly.
>
> **Why do we need it?** Standard SQL queries look for exact string matches; vector databases look for semantic meaning and context.
>
> **Where is it used?** In RAG pipelines to find matching documents.

---

> **📦 Technical Term Explained**
>
> **Term:** Retrieval
>
> **Simple Explanation:** Retrieval is the process of querying a database or index to fetch documents or facts matching a user's prompt.
>
> **Why do we need it?** To supply the model with specific context or facts that were not included in its original training.
>
> **Where is it used?** In knowledge bases and search systems.

---

> **📦 Technical Term Explained**
>
> **Term:** Knowledge Base
>
> **Simple Explanation:** A Knowledge Base is a curated repository of documents, PDFs, or articles that are indexed and made searchable for AI models.
>
> **Why do we need it?** It acts as an external library that your agent can read to answer questions about company policies or product manuals.
>
> **Where is it used?** In enterprise search portals and Q&A agents.

---

> **📦 Technical Term Explained**
>
> **Term:** RAG (Retrieval-Augmented Generation)
>
> **Simple Explanation:** RAG is an architectural pattern where an agent retrieves relevant facts from a database and appends them to the user's prompt before sending it to the model.
>
> **Why do we need it?** It prevents the model from hallucinating by supplying it with verified data.
>
> **Where is it used?** In search applications and Q&A chatbots.

---

## 🧠 Memory Architecture and Storage Schemas

AgentCore structures agent memory across two tiers:
1. **Short-Term Memory (Session State):** Preserves immediate conversational chat history turns inside the active microVM RAM during the session execution loop.
2. **Long-Term Memory (Persistent Profile):** Persists user profile summaries and facts across sessions. It is backed by a DynamoDB table and loaded when a new MicroVM is initialized.

```
┌────────────────────────────────────────────────────────┐
│                      MEMORY MANAGER                    │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
┌───────────▼───────────┐        ┌───────────▼───────────┐
│   Short-Term (RAM)    │        │  Long-Term (DynamoDB) │
├───────────────────────┤        ├───────────────────────┤
│ - Dict array of turns │        │ - User metadata       │
│ - Cleared on timeout  │        │ - Facts & preferences │
│                       │        │ - Persistent storage  │
└───────────────────────┘        └───────────────────────┘
```

### DynamoDB Schema Recommendation
- **Partition Key (PK):** `USER#<ActorID>`
- **Sort Key (SK):** `PROFILE#METADATA`
- **Attributes:** `Interests` (StringSet), `Summary` (String), `LastUpdated` (Number).

---

## 📝 Memory Manager Implementation

```python
# File: src/memory_manager.py
# Folder Location: agentcore-samples/src/memory_manager.py

import json
from typing import List, Dict, Any

class SessionMemory:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.turns: List[Dict[str, str]] = []

    def add_message(self, role: str, content: str):
        self.turns.append({"role": role, "content": content})

    def get_conversation_history(self) -> List[Dict[str, str]]:
        return self.turns

class LongTermMemoryStore:
    def __init__(self):
        self.db: Dict[str, Dict[str, Any]] = {}

    def fetch_user_profile(self, user_id: str) -> Dict[str, Any]:
        return self.db.get(user_id, {
            "user_id": user_id,
            "interests": [],
            "past_topics": [],
            "summary": "New user. No historical context."
        })

    def update_user_profile(self, user_id: str, new_profile: Dict[str, Any]):
        self.db[user_id] = new_profile

class MemoryManager:
    def __init__(self, db_store: LongTermMemoryStore):
        self.db_store = db_store

    def run_end_of_session_compaction(self, user_id: str, history: List[Dict[str, str]]):
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
```

### Line-by-Line Code Explanation

- **`class SessionMemory`:** Tracks user and assistant messages for the active session.
- **`class LongTermMemoryStore`:** Simulates a persistent database store. In a production environment, this class would execute DynamoDB `GetItem` and `PutItem` requests.
- **`run_end_of_session_compaction(...)`:** Scans conversation history for preference keywords (e.g. "like", "prefer") and learning topics, updates the user's long-term profile, and updates the profile summary.

---

## 📊 Visual Reference

Let's look at memory persistence in action:

![Figure 13-1: Long-Term Memory verification](images/agent_section_18.png)
*Caption: Recalling user facts in a new terminal session.*
- **What to Observe:** The agent greets the user and references their learning goals from a prior session.
- **Why it Matters:** Verifies that the long-term memory store successfully loaded the user's profile context during initialization.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Parallel session updates overwriting DynamoDB profile data.
  - **Resolution:** Implement optimistic locking using an incremental `version` attribute in your schema.
- **Mistake:** Appending raw conversation history from past sessions directly to the prompt context.
  - **Resolution:** Always use compacted profile data or episodic retrieval to keep prompt sizes small.

---

## 📝 Practical Exercise
Add support for detecting a user's location (e.g., "I live in New York") in the `run_end_of_session_compaction` function, saving the location claim to the user's long-term profile.

---

## 🔄 Chapter Recap
- We implemented short-term session memory.
- We built a long-term memory store with compaction logic.
- We analyzed memory persistence and DynamoDB storage patterns.
- We are ready to learn how to integrate custom Tools.
