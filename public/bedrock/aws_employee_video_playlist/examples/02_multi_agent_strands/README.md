# Episode 02 Example: Strands Multi-Agent Orchestration & MCP

This directory demonstrates how to assemble a multi-agent system using the **AWS Strands SDK** framework principles, incorporating specialized sub-agents and Model Context Protocol (MCP) tool integration.

## 🛠️ Concepts Illustrated:
1. **Supervisor Pattern**: A central routing agent parses the incoming request and delegates tasks to specific sub-agents.
2. **Sub-Agents Separation**:
   - **CalendarAgent**: Connects to time utilities.
   - **SearchAgent**: Simulates an internet-enabled agent fetching external search content (representing Perplexity MCP servers).
   - **CodeAgent**: Automates writing scripts and executing them in an isolated evaluation environment.
3. **Model Context Protocol (MCP)**: Unifying interfaces so sub-agents can fetch data dynamically using standard JSON schemas.

## 💻 How to Run:
Run the script to test the routing logic locally:
```bash
python 02_supervisor_agent.py
```
