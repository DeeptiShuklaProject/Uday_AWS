import unittest
from unittest.mock import patch
import os

# Now import using the correct letter-prefixed module name
from ep01_production_agent import invoke_handler, ConfigValidator

class TestEpisode01Agent(unittest.TestCase):
    
    def setUp(self):
        class MockContext:
            def __init__(self):
                self.session_id = "test-session-123"
        self.context = MockContext()

    def test_missing_prompt_payload(self):
        payload = {}
        response = invoke_handler(payload, self.context)
        self.assertEqual(response["statusCode"], 400)
        self.assertEqual(response["error"], "Bad Request")

    @patch.dict(os.environ, {"AWS_REGION": "us-west-2", "BEDROCK_MODEL_ID": "meta.llama3"})
    def test_config_validator_reads_env(self):
        config = ConfigValidator.validate_env()
        self.assertEqual(config["region"], "us-west-2")
        self.assertEqual(config["model_id"], "meta.llama3")

    def test_successful_invocation(self):
        payload = {"prompt": "Hello Production"}
        response = invoke_handler(payload, self.context)
        self.assertEqual(response["statusCode"], 200)
        self.assertIn("Successfully processed prompt", response["response"])

    def test_failover_retry_mechanism(self):
        payload = {"prompt": "Trigger fail-retry"}
        response = invoke_handler(payload, self.context)
        self.assertEqual(response["statusCode"], 200)
        self.assertIn("Successfully processed prompt", response["response"])

if __name__ == "__main__":
    unittest.main()
