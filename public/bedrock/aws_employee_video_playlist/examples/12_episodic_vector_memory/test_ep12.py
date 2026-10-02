import unittest
from ep12_semantic_memory import get_mock_embedding, cosine_similarity, EpisodicMemoryStore

class TestEpisode12EpisodicMemory(unittest.TestCase):

    def setUp(self):
        self.store = EpisodicMemoryStore()
        self.store.save_episode("Day 1: We set up security guidelines, microVM limits.")
        self.store.save_episode("Day 2: We analyzed pricing plans, billing thresholds.")

    def test_mock_embedding_dimensionality(self):
        embedding = get_mock_embedding("Security and isolation limits")
        self.assertEqual(len(embedding), 3)
        self.assertTrue(all(isinstance(x, float) for x in embedding))

    def test_cosine_similarity_identical_vectors(self):
        v1 = [1.0, 0.0, 0.0]
        score = cosine_similarity(v1, v1)
        self.assertAlmostEqual(score, 1.0)

    def test_semantic_search_accuracy(self):
        results = self.store.search_similar_episodes("How much does Bedrock cost?", top_k=1)
        self.assertEqual(len(results), 1)
        score, content = results[0]
        self.assertTrue(score > 0.5)
        self.assertIn("Day 2: We analyzed pricing", content)

if __name__ == "__main__":
    unittest.main()
