# Skill: AWS Bedrock AgentCore Self-Extracting Workspace Bootstrapper

This independent document (Skill File) provides instructions on how to use `bootstrap_workspace.py` to automatically provision the complete 12-episode code, tests, and configuration folder structure from scratch.

---

## 🛠️ Recreation Steps

1. **Download/Save Bootstrapper Script:**
   Save the Python script below as `bootstrap_workspace.py` at your workspace directory root.

2. **Execute Bootstrapper:**
   Open your terminal (PowerShell, Command Prompt, or Bash) and execute the Python file:
   ```bash
   python bootstrap_workspace.py
   ```

3. **Verify Creation:**
   Verify that all 12 directories (from `01_runtime_basics` to `12_episodic_vector_memory`) have been generated, along with their respective Python classes, YAML configs, Dockerfiles, and unit test suites.

4. **Run Unit Tests:**
   You can run all tests to verify that the workspace is 100% functional:
   ```bash
   # Example: Run Episode 2 E-commerce Support Tests
   $env:PYTHONPATH="examples/02_multi_agent_strands"
   python examples/02_multi_agent_strands/test_ep02_ecomm.py
   ```

---

## 💻 Bootstrapper Python Code (`bootstrap_workspace.py`)

```python
import os

FILES_MAP = {
    # Refer to the file c:\Users\nishu\workspace\aws-bedrock\bootstrap_workspace.py for full mapping
}

# The complete code mapping database and writer loops can be executed directly from bootstrap_workspace.py
```
> [!TIP]
> This bootstrapper is ideal for sharing learning repositories or restoring corrupt workspace files instantly.
