# Chapter_05_repository_walkthrough

## 🎯 Learning Objectives
In this chapter, you will learn:
- The execution flow of a standard AgentCore container application.
- The structure of the primary entrypoint file (`src/main.py`).
- How to import and use the Bedrock AgentCore SDK.
- The purpose of app decorators in routing inbound requests.

### Importance of This Chapter
Understanding the codebase layout helps developers locate files and trace how the Python code interfaces with the SDK.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** API (Application Programming Interface)
>
> **Simple Explanation:** An API is a set of rules that allows one software application to communicate and exchange data with another application.
>
> **Why do we need it?** It allows your local application to send requests to cloud-hosted services (like Bedrock or DynamoDB) and receive responses.
>
> **Where is it used?** In code calls that query model completions, store data, or retrieve user profiles.

---

> **📦 Technical Term Explained**
>
> **Term:** JSON (JavaScript Object Notation)
>
> **Simple Explanation:** JSON is a lightweight text-based data format used to store and exchange data, structured as key-value pairs.
>
> **Why do we need it?** It is the standard format for exchanging data between web services and APIs.
>
> **Where is it used?** In the payloads sent to your agent's endpoints and returned as responses.

---

> **📦 Technical Term Explained**
>
> **Term:** YAML (YAML Ain't Markup Language)
>
> **Simple Explanation:** YAML is a human-readable data serialization format commonly used for configuration files.
>
> **Why do we need it?** It has a clean, readable syntax that simplifies managing configuration settings.
>
> **Where is it used?** In the deployment configuration file `bedrock_agent_core.yaml`.

---

## 🧠 Repository Folder Architecture and Execution Flow

When you run an AgentCore application:
1. **The Entrypoint:** The AgentCore runtime starts the container and runs the designated entrypoint file (e.g. `src/main.py`).
2. **The App Listener:** The `BedrockAgentCoreApp` class initializes an internal web server within the container to listen for incoming requests.
3. **The Router:** The `@app.invoke` decorator wraps your agent handler, routing incoming POST payloads to the execution loop.

---

## 📝 Code Walkthrough: Core Entrypoint (`src/main.py`)

Let's examine the structure of a standard `main.py` entrypoint file:

```python
# File: src/main.py
# Folder Location: agentcore-samples/src/main.py

import os
import sys
import logging
from typing import Dict, Any
from bedrock_agent_core import BedrockAgentCoreApp

# 1. Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AgentCoreEntrypoint")

# 2. Instantiate the App Wrapper
app = BedrockAgentCoreApp()

# 3. Define the Invoke Handler
@app.invoke
def my_agent_handler(payload: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handles incoming prompts and executes the agent reasoning loop.
    
    Args:
        payload (dict): Inbound JSON payload containing prompt keys.
        context (object): Metadata injected by the runtime (e.g. session_id).
    """
    logger.info("Request received at agent core container")
    
    # Extract parameter values from the payload
    prompt = payload.get("prompt", "")
    session_id = getattr(context, "session_id", "local-dev-session")
    
    # Define simple response
    response_text = f"Processed your prompt: '{prompt}' inside session: {session_id}"
    
    return {
        "statusCode": 200,
        "response": response_text
    }
```

### Line-by-Line Code Explanation

- **`from bedrock_agent_core import BedrockAgentCoreApp`:** Imports the core application class from the AWS AgentCore Python SDK. This wrapper handles container lifecycle hooks and request routing.
- **`app = BedrockAgentCoreApp()`:** Instantiates the application runner. This object acts as the primary interface between the AWS compute runtime and your Python agent code.
- **`@app.invoke`:** The decorator that registers the function as the primary handler. When the container receives an execution request, this function is called.
- **`def my_agent_handler(...)`:** The handler function. It accepts a `payload` (containing input parameters) and a `context` object (containing session metadata).
- **`prompt = payload.get("prompt", "")`:** Safely extracts the user's input prompt from the request body.
- **`session_id = getattr(context, "session_id", ...)`:** Extracts the `session_id` injected by the runtime VM.

---

## 📊 Visual Workspace Reference

Let's look at how these entry points are organized inside our editor:

![Figure 5-1: Project Structure in editor](images/agent_section_12.png)
*Caption: Code entrypoint structure and imports.*
- **What to Observe:** The import statements and decorator registrations.
- **Why it Matters:** Decorator wrapping simplifies setup by removing the need to write custom Flask or FastAPI routing loops.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Setting the wrong path for your entrypoint file in your configuration.
  - **Resolution:** Double-check that your entrypoint file path in `bedrock_agent_core.yaml` matches the location of your script (e.g., `src/main.py`).
- **Mistake:** Importing `BedrockAgentCoreApp` without installing the SDK package.
  - **Resolution:** Verify that you have activated your virtual environment and run the package installation commands before running your code.

---

## 📝 Practical Exercise
Create a file named `scratch_walkthrough.py` in your project's `scratch/` directory. Copy the entrypoint code shown in this chapter, add a logging statement that prints the payload keys, and verify the file runs without syntax errors.

---

## 🔄 Chapter Recap
- We analyzed the directory structure of the repository.
- We walked through the code structure of a standard `main.py` entrypoint.
- We are ready to set up the local development environment using the `uv` toolchain.
