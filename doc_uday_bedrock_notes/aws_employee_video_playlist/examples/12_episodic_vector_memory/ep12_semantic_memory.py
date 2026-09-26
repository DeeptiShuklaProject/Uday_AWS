import math

# =====================================================================
# EPISODE 12: Episodic Memory and Patterns
# File: ep12_semantic_memory.py (Vector Similarity Retrieval)
# =====================================================================

def get_mock_embedding(text: str) -> list:
    text_lower = text.lower()
    vec = [0.0, 0.0, 0.0]
    if "security" in text_lower or "isolation" in text_lower or "firecracker" in text_lower:
        vec[0] += 1.0
    if "cost" in text_lower or "price" in text_lower or "billing" in text_lower:
        vec[1] += 1.0
    if "agent" in text_lower or "mcp" in text_lower or "strands" in text_lower:
        vec[2] += 1.0
    magnitude = math.sqrt(sum(x**2 for x in vec))
    if magnitude == 0:
        return [0.0, 0.0, 0.0]
    return [x / magnitude for x in vec]

def cosine_similarity(v1: list, v2: list) -> float:
    dot_product = sum(x * y for x, y in zip(v1, v2))
    mag1 = math.sqrt(sum(x**2 for x in v1))
    mag2 = math.sqrt(sum(x**2 for x in v2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)

class EpisodicMemoryStore:
    def __init__(self):
        self.episodes = []

    def save_episode(self, episode_text: str):
        vector = get_mock_embedding(episode_text)
        self.episodes.append({
            "content": episode_text,
            "vector": vector
        })

    def search_similar_episodes(self, query: str, top_k: int = 1) -> list:
        query_vector = get_mock_embedding(query)
        scored_episodes = []
        for ep in self.episodes:
            score = cosine_similarity(query_vector, ep["vector"])
            scored_episodes.append((score, ep["content"]))
        scored_episodes.sort(key=lambda x: x[0], reverse=True)
        return scored_episodes[:top_k]

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: What is "Episodic Memory" in the context of LLM agents?
# A1: Episodic memory mimics human memory by storing past conversation segments 
#     ("episodes") as dense vector representations. When a user asks a question, 
#     instead of loading the entire log history, we perform a vector similarity 
#     search (e.g. using Amazon OpenSearch or pgvector) to fetch and inject only the 
#     most semantically relevant past episodes, keeping prompt size minimal.
#
# Q2: Explain Cosine Similarity and how it is used for semantic search.
# A2: Text phrases are converted to high-dimensional embedding vectors. Cosine 
#     similarity measures the cosine of the angle between two vectors:
#     - A score near 1.0 means the directions are identical (semantically very similar).
#     - A score of 0.0 means the directions are orthogonal (completely unrelated).
#     This math allows us to search memory by *meaning* rather than exact keyword matches.
#
# Q3: How do you handle context window optimization for long-running agents?
# A3: 1. Semantic Truncation: Retrieve only the top-k episodic matches from vector storage.
#     2. Message Rolling: Keep only the last 3-5 immediate turns in full detail.
#     3. Profile Summaries: Read the compacted user profile loaded from DynamoDB.
#     Combining these three elements ensures the agent remains context-rich while 
#     staying well below prompt limit walls.
# =====================================================================
