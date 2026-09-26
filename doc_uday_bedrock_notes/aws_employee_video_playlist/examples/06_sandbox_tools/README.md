# Episode 06 Example: Browser Tool & Code Interpreter Sandbox

This directory demonstrates the internal mechanisms of AgentCore's native tools: **Browser Tool** (Chromium automation) and **Code Interpreter** (sandboxed Python execution).

## 🛠️ Concepts Illustrated:
1. **Containerized Headless Browser**: Launching Chromium, scraping site documents, and capturing state verification screenshots.
2. **Execution Sandboxing**: Isolating dynamic user script evaluation so the agent can execute code logic safely.
3. **Security Safeguards**: Restricting system libraries (e.g. blocking file writes or subprocess calls) to prevent host compromise.

## 💻 How to Run:
Run the script to test the tools simulation:
```bash
python 06_browser_code_sandbox.py
```
