import math
from typing import List, Tuple

# =====================================================================
# INDUSTRY STUDY: Insurance Policy and Exclusion Vector Memory Search
# File: ep12_industry_policy_search.py (Semantic Guideline Retrieval)
# =====================================================================

# In production, policies are stored in a Vector DB (e.g. Pinecone, OpenSearch).
# We represent policy clauses and compute mock embeddings based on target keywords.

POLICY_CLAUSES = [
    {
        "id": "clause_01",
        "category": "Auto Collision",
        "text": "Comprehensive collision coverage pays for damage to your vehicle from non-collision events including theft, fire, or vandalism."
    },
    {
        "id": "clause_02",
        "category": "Exclusions",
        "text": "Wear and tear, mechanical breakdown, road damage to tires, or electrical failures are excluded from auto liability coverages."
    },
    {
        "id": "clause_03",
        "category": "Deductibles",
        "text": "The deductible is the amount you agree to pay out of pocket before your insurance coverage steps in to pay for claims."
    }
]

def generate_policy_embedding(text: str) -> List[float]:
    text_lower = text.lower()
    vec = [0.0, 0.0, 0.0]
    
    # Dimension 0: Damage / Theft / Fire (Collision aspects)
    if any(k in text_lower for k in ["damage", "theft", "fire", "vandalism", "collision"]):
        vec[0] += 1.0
    # Dimension 1: Exclusions / Breakdown / Failures
    if any(k in text_lower for k in ["exclude", "exclusion", "breakdown", "tires", "failure", "wear"]):
        vec[1] += 1.0
    # Dimension 2: Deductible / Out of pocket / Pricing
    if any(k in text_lower for k in ["deductible", "out of pocket", "pay", "fee"]):
        vec[2] += 1.0
        
    magnitude = math.sqrt(sum(x**2 for x in vec))
    if magnitude == 0:
        return [0.0, 0.0, 0.0]
    return [x / magnitude for x in vec]

def calculate_cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot_product = sum(x * y for x, y in zip(v1, v2))
    mag1 = math.sqrt(sum(x**2 for x in v1))
    mag2 = math.sqrt(sum(x**2 for x in v2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)

class PolicySearchEngine:
    def __init__(self):
        self.vectors = []
        for clause in POLICY_CLAUSES:
            self.vectors.append({
                "id": clause["id"],
                "text": clause["text"],
                "vector": generate_policy_embedding(clause["text"])
            })

    def search_policy_guidelines(self, query: str, top_k: int = 1) -> List[Tuple[float, str]]:
        query_vector = generate_policy_embedding(query)
        matches = []
        
        for item in self.vectors:
            score = calculate_cosine_similarity(query_vector, item["vector"])
            matches.append((score, item["text"]))
            
        matches.sort(key=lambda x: x[0], reverse=True)
        return matches[:top_k]

if __name__ == "__main__":
    engine = PolicySearchEngine()
    
    print("\n[RUN 1: Query about tire/engine breakdown exclusions]")
    results1 = engine.search_policy_guidelines("Are flat tires or engine failures covered?", top_k=1)
    for score, text in results1:
        print(f"Match Score: {score:.4f} | Clause Text: {text}")
        
    print("\n[RUN 2: Query about deductibles payments]")
    results2 = engine.search_policy_guidelines("How much deductible fees do I pay out of pocket?", top_k=1)
    for score, text in results2:
        print(f"Match Score: {score:.4f} | Clause Text: {text}")
