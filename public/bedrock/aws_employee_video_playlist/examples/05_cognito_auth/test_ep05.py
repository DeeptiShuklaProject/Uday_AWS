import unittest
from ep05_auth_middleware import IdentityMiddleware, SecureBankTool, generate_mock_jwt

class TestEpisode05Auth(unittest.TestCase):

    def setUp(self):
        self.middleware = IdentityMiddleware()
        self.bank_tool = SecureBankTool()

    def test_valid_token_decoding(self):
        token = generate_mock_jwt("deepti_shukla", "client_123")
        res = self.middleware.verify_token(token)
        self.assertTrue(res["authenticated"])
        self.assertEqual(res["username"], "deepti_shukla")
        self.assertEqual(res["actor_id"], "auth0|deepti_shukla")

    def test_invalid_token_format(self):
        res = self.middleware.verify_token("invalid_token_segment")
        self.assertFalse(res["authenticated"])
        self.assertIn("Invalid JWT token", res["error"])

    def test_authorized_bank_access(self):
        token = generate_mock_jwt("deepti_shukla", "client_123")
        auth_ctx = self.middleware.verify_token(token)
        balance_res = self.bank_tool.check_balance(
            target_user="auth0|deepti_shukla",
            actor_id=auth_ctx["actor_id"]
        )
        self.assertIn("[SUCCESS]", balance_res)
        self.assertIn("$1,450.00", balance_res)

    def test_unauthorized_bank_access_blocked(self):
        token_nishu = generate_mock_jwt("nishu_saxena", "client_123")
        auth_ctx_nishu = self.middleware.verify_token(token_nishu)
        balance_res = self.bank_tool.check_balance(
            target_user="auth0|deepti_shukla",
            actor_id=auth_ctx_nishu["actor_id"]
        )
        self.assertIn("[SECURITY ERROR] Access Denied", balance_res)

if __name__ == "__main__":
    unittest.main()
