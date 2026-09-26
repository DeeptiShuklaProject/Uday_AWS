# Episode 02 Summary: Build Your First Agentic AI App Step-by-Step

* **Original Video**: [AWS Show & Tell - Episode 2](https://www.youtube.com/watch?v=aijS9fWB854)
* **Local Transcript**: [02_build_your_first_agentic_ai_app_step_by_step.txt](../transcripts/02_build_your_first_agentic_ai_app_step_by_step.txt)

## 📝 Key Takeaways & Core Concepts
* Walks through the development of a multi-agent **Personal Assistant** using the open-source **AWS Strands SDK** and the Model Context Protocol (MCP).
* Discusses architectural patterns for multi-agent systems, including swarms, hierarchical supervisor-agent setups, graphs, and structured workflows.
* Explains the **Model Context Protocol (MCP)** standard for unifying tool definitions and data sources.
* Shows the step-by-step assembly of three sub-agents:
  * **Calendar Assistant**: Leverages a built-in current time tool to manage scheduling.
  * **Search Assistant**: Connects to the internet via a local Perplexity MCP server.
  * **Code Assistant**: Generates, executes, and debugs code using out-of-the-box sandbox tools.
