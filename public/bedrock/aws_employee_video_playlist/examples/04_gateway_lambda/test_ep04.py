import unittest
import json
from ep04_lambda_mcp_server import lambda_handler

class TestEpisode04Lambda(unittest.TestCase):

    def test_tools_list_method(self):
        event = {"method": "tools/list"}
        response = lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        self.assertIn("tools", response["body"])
        tools = response["body"]["tools"]
        self.assertEqual(len(tools), 1)
        self.assertEqual(tools[0]["name"], "get_user_profile")

    def test_tools_call_get_profile_success(self):
        event = {
            "method": "tools/call",
            "params": {
                "name": "get_user_profile",
                "arguments": {"user_id": "user_101"}
            }
        }
        response = lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        content = response["body"]["content"]
        parsed_body = json.loads(content[0]["text"])
        self.assertEqual(parsed_body["status"], "success")
        self.assertEqual(parsed_body["data"]["name"], "Deepti Shukla")

    def test_tools_call_invalid_user(self):
        event = {
            "method": "tools/call",
            "params": {
                "name": "get_user_profile",
                "arguments": {"user_id": "invalid_id"}
            }
        }
        response = lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        content = response["body"]["content"]
        parsed_body = json.loads(content[0]["text"])
        self.assertEqual(parsed_body["status"], "error")

    def test_invalid_method(self):
        event = {"method": "invalid/method"}
        response = lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 400)

if __name__ == "__main__":
    unittest.main()
