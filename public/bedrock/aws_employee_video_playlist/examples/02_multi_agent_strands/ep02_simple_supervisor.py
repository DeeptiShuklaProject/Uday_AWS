# =====================================================================
# EPISODE 02: Build Your First Agentic AI App Step-by-Step
# File: ep02_simple_supervisor.py (Basic Multi-agent Coordinator)
# =====================================================================

class SimpleSubAgent:
    def __init__(self, name: str):
        self.name = name
    def run(self, task: str) -> str:
        return f"[{self.name}] Resolved: {task}"

class SimpleSupervisor:
    def __init__(self):
        self.calendar = SimpleSubAgent("CalendarAgent")
        self.search = SimpleSubAgent("SearchAgent")

    def route(self, prompt: str) -> str:
        if "time" in prompt.lower() or "meeting" in prompt.lower():
            return self.calendar.run(prompt)
        return self.search.run(prompt)
