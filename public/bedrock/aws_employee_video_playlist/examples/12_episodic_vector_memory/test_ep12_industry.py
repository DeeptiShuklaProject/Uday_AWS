import unittest
from ep12_industry_policy_search import PolicySearchEngine

class TestPolicySearch(unittest.TestCase):

    def setUp(self):
        self.engine = PolicySearchEngine()

    def test_search_exclusions_success(self):
        res = self.engine.search_policy_guidelines("tire wear breakdown exclusions", top_k=1)
        self.assertEqual(len(res), 1)
        score, text = res[0]
        self.assertTrue(score > 0.5)
        self.assertIn("Wear and tear", text)

    def test_search_deductible_success(self):
        res = self.engine.search_policy_guidelines("deductible out of pocket fees", top_k=1)
        self.assertEqual(len(res), 1)
        score, text = res[0]
        self.assertTrue(score > 0.5)
        self.assertIn("deductible is the amount", text)

if __name__ == "__main__":
    unittest.main()
