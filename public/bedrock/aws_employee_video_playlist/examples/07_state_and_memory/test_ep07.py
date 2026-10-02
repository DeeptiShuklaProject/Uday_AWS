import unittest
from ep07_dynamo_longterm import SessionMemory, LongTermMemoryStore, MemoryManager

class TestEpisode07Memory(unittest.TestCase):

    def setUp(self):
        self.db = LongTermMemoryStore()
        self.manager = MemoryManager(self.db)

    def test_short_term_memory_appending(self):
        session = SessionMemory("test_session_id")
        session.add_message("user", "Hello World")
        session.add_message("assistant", "Hi there")
        history = session.get_conversation_history()
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]["role"], "user")
        self.assertEqual(history[1]["content"], "Hi there")

    def test_long_term_memory_compaction(self):
        user_id = "auth0|test_user"
        session = SessionMemory("test_session")
        session.add_message("user", "I prefer python code.")
        session.add_message("user", "I want to study AWS Bedrock.")
        
        self.manager.run_end_of_session_compaction(user_id, session.get_conversation_history())
        
        profile = self.db.fetch_user_profile(user_id)
        self.assertIn("python code", profile["interests"])
        self.assertIn("AWS Bedrock", profile["past_topics"])
        self.assertIn("User is studying AWS Bedrock", profile["summary"])

if __name__ == "__main__":
    unittest.main()
