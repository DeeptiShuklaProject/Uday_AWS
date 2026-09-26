import unittest
from ep10_correctness_eval import FAQAgent, AgentEvaluator

class TestEpisode10Evaluations(unittest.TestCase):

    def setUp(self):
        self.agent = FAQAgent()
        self.evaluator = AgentEvaluator(self.agent)

    def test_evaluation_runs_and_scores_accuracy(self):
        test_suite = [
            {
                "prompt": "Tell me about Bedrock pricing",
                "expected_keywords": ["serverless", "tokens"],
                "max_latency": 2.0
            }
        ]
        report = self.evaluator.run_tests(test_suite)
        self.assertEqual(report["total_test_cases"], 1)
        self.assertEqual(report["passed_cases"], 1)
        self.assertEqual(report["accuracy_percent"], 100.0)

    def test_evaluation_reports_failure_on_missing_keyword(self):
        test_suite = [
            {
                "prompt": "Explain OTel",
                "expected_keywords": ["incorrect_keyword"],
                "max_latency": 2.0
            }
        ]
        report = self.evaluator.run_tests(test_suite)
        self.assertEqual(report["accuracy_percent"], 0.0)
        self.assertIn("incorrect_keyword", report["report"][0]["missing_keywords"])

if __name__ == "__main__":
    unittest.main()
