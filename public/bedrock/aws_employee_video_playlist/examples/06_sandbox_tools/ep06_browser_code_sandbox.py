import sys

# =====================================================================
# EPISODE 06: Browser Tool & Code Interpreter Tool
# File: ep06_browser_code_sandbox.py (Native Sandboxing Simulators)
# =====================================================================

class MockBrowserTool:
    def open_url_and_scrape(self, url: str) -> dict:
        print(f"[BROWSER] Launching isolated Chromium headless instance...")
        print(f"[BROWSER] Navigating to URL: {url}")
        html_title = "Amazon Bedrock AgentCore Documentation"
        simulated_paragraphs = [
            "AWS Bedrock AgentCore is now General Available (GA).",
            "This service lets you run AI agents in secure microVM sandboxes."
        ]
        return {
            "status": 200,
            "url": url,
            "page_title": html_title,
            "extracted_text": " ".join(simulated_paragraphs),
            "screenshot_path": "/tmp/screenshots/page_snap_01.png"
        }

class SafeCodeInterpreter:
    def execute_code(self, code_str: str) -> dict:
        print(f"[SANDBOX] Preparing isolated Python environment...")
        local_scope = {}
        global_scope = {"__builtins__": {}}
        try:
            exec(code_str, global_scope, local_scope)
            result_val = local_scope.get("result", "Execution completed without returning a 'result' variable.")
            return {
                "exit_code": 0,
                "stdout": f"Calculation completed. output = {result_val}",
                "error": None
            }
        except Exception as e:
            return {
                "exit_code": 1,
                "stdout": "",
                "error": f"Security/Execution Syntax Error: {str(e)}"
            }

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: How does Amazon Bedrock implement the Code Interpreter tool securely?
# A1: The Code Interpreter tool allows LLMs to write and execute python code 
#     dynamically to perform tasks like graphing or sorting. To prevent malicious 
#     scripts from taking over the host CPU, AgentCore spins up a secondary, 
#     heavily restricted micro-sandbox (gVisor or Firecracker vm) with:
#     - No internet outbound networking (prevents exfiltrating data to hacker servers).
#     - Read-only root filesystem permissions.
#     - Memory/disk quotas (e.g. 50MB maximum file outputs).
#
# Q2: Explain how the Browser Tool interacts with modern SPAs (Single Page Apps).
# A2: Simple curl/urllib scrapers only read static HTML and fail to execute Javascript, 
#     meaning they miss content rendered dynamically by React or Angular. 
#     The native Browser Tool runs a real headless Chromium engine, allowing the agent 
#     to click page elements, wait for AJAX network calls to settle, and scrape 
#     the fully rendered DOM tree.
#
# Q3: What is the architectural design pattern for cleaning up headless browser sessions?
# A3: Headless browsers consume significant RAM and CPU. If not recycled, orphaned 
#     Chromium processes will crash the microVM. In production, AgentCore automatically 
#     implements a teardown class wrapper that terminates the Puppeteer/Playwright process 
#     in a 'finally' block immediately after scraping, freeing system assets.
# =====================================================================
