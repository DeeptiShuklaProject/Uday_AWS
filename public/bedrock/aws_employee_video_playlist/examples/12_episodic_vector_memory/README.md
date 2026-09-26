# Episode 12 Example: Episodic Vector Memory & Retrieval

This directory demonstrates how AI Agents handle very long chat conversations using **Episodic Memory** (Vector Semantic Searches) to optimize context boundaries.

## 🛠️ Concepts Illustrated:
1. **Mock Vector Embeddings**: Simulating text representations converted to float coordinate arrays based on semantic keywords.
2. **Cosine Similarity Calculation**: Mathematically computing angle scores between user questions and memory indices.
3. **Context Window Pruning**: Extracting only the top `k` most similar history blocks, avoiding context overflow issues.

## 💻 How to Run:
Run the script to see semantic retrieval in action:
```bash
python 12_semantic_memory.py
```
