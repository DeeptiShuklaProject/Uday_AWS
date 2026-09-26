import unittest
from ep01_persona_training_schema import BedrockPersonaEngine

class TestPersonaEngine(unittest.TestCase):

    def setUp(self):
        self.engine = BedrockPersonaEngine("test_tenant")

    def test_save_and_retrieve_car_dealer_persona(self):
        # Verify schema record saves correct persona details and standard columns
        turns = [{"role": "user", "content": "Hello sales"}]
        record = self.engine.save_session_state(
            session_id="session_01",
            actor_id="user_nishu",
            persona="CAR_DEALER",
            chat_turns=turns
        )
        self.assertEqual(record["session_id"], "session_01")
        self.assertEqual(record["actor_id"], "user_nishu")
        self.assertEqual(record["persona_type"], "CAR_DEALER")
        self.assertIn("Nishu Auto Dealership", record["instruction"])

    def test_compile_prompt_structure(self):
        # Verify compiled prompt output includes standard system prompt headers
        turns = [{"role": "user", "content": "I want a car"}]
        self.engine.save_session_state(
            session_id="session_02",
            actor_id="user_nishu",
            persona="CAR_DEALER",
            chat_turns=turns
        )
        compiled = self.engine.compile_bedrock_prompt("session_02", "user_nishu", "Do you sell Tesla?")
        self.assertIn("System Instruction:", compiled)
        self.assertIn("User: I want a car", compiled)
        self.assertIn("User: Do you sell Tesla?", compiled)

if __name__ == "__main__":
    unittest.main()
