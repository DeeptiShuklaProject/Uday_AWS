import unittest
from ep06_browser_code_sandbox import MockBrowserTool, SafeCodeInterpreter

class TestEpisode06Tools(unittest.TestCase):

    def setUp(self):
        self.browser = MockBrowserTool()
        self.interpreter = SafeCodeInterpreter()

    def test_browser_scrapes_successfully(self):
        res = self.browser.open_url_and_scrape("https://example.com")
        self.assertEqual(res["status"], 200)
        self.assertEqual(res["page_title"], "Amazon Bedrock AgentCore Documentation")
        self.assertIn("screenshot_path", res)

    def test_code_sandbox_runs_math(self):
        script = "result = 10 * 5"
        res = self.interpreter.execute_code(script)
        self.assertEqual(res["exit_code"], 0)
        self.assertIn("50", res["stdout"])

    def test_code_sandbox_blocks_unsafe_imports(self):
        script = "import os\nos.listdir('.') "
        res = self.interpreter.execute_code(script)
        self.assertEqual(res["exit_code"], 1)
        self.assertIn("Security/Execution Syntax Error", res["error"])

if __name__ == "__main__":
    unittest.main()
