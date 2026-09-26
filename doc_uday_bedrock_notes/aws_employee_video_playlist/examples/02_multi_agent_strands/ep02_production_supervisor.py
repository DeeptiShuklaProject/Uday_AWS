import time
import logging
from typing import Dict, Any

# =====================================================================
# EPISODE 02: Build Your First Agentic AI App Step-by-Step
# File: ep02_production_supervisor.py (Production Orchestration)
# =====================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class TokenLimiterException(Exception):
    pass

class ProductionSubAgent:
    def __init__(self, name: str, token_budget: int):
        self.name = name
        self.token_budget = token_budget
        self.tokens_used = 0

    def check_and_deduct_budget(self, estimated_tokens: int):
        if self.tokens_used + estimated_tokens > self.token_budget:
            raise TokenLimiterException(f"[{self.name}] Token budget exceeded! Budget left: {self.token_budget - self.tokens_used}")
        self.tokens_used += estimated_tokens

    def execute_task(self, prompt: str) -> str:
        raise NotImplementedError

class ProdCalendarAgent(ProductionSubAgent):
    def execute_task(self, prompt: str) -> str:
        self.check_and_deduct_budget(estimated_tokens=50)
        logging.info(f"{self.name} checking agenda calendar events...")
        return f"[{self.name}] Calendar meeting successfully verified."

class ProdSearchAgent(ProductionSubAgent):
    def execute_task(self, prompt: str) -> str:
        self.check_and_deduct_budget(estimated_tokens=150)
        logging.info(f"{self.name} executing web query API...")
        if "fail" in prompt.lower():
            raise ConnectionRefusedError("Web search server timeout.")
        return f"[{self.name}] Search results: AWS Bedrock is highly scalable."

class ProductionSupervisor:
    def __init__(self, token_budget: int = 500):
        self.token_budget = token_budget
        self.tokens_used = 0
        self.calendar_agent = ProdCalendarAgent("CalendarAgent", token_budget=200)
        self.search_agent = ProdSearchAgent("SearchAgent", token_budget=300)

    def route_and_execute(self, prompt: str) -> Dict[str, Any]:
        logging.info(f"[Supervisor] Routing query: '{prompt}'")
        prompt_lower = prompt.lower()
        
        if "meeting" in prompt_lower or "calendar" in prompt_lower:
            agent = self.calendar_agent
        elif "search" in prompt_lower or "news" in prompt_lower:
            agent = self.search_agent
        else:
            return {
                "status": "error",
                "message": "Routing failed. No specialized sub-agent matches this query."
            }

        try:
            response = agent.execute_task(prompt)
            self.tokens_used += agent.tokens_used
            return {
                "status": "success",
                "executor": agent.name,
                "response": response,
                "cumulative_tokens": self.tokens_used
            }
        except TokenLimiterException as e:
            logging.error(f"Routing recovery triggered: {str(e)}")
            return {
                "status": "partial_success",
                "message": f"Resource budget exhausted on primary agent. Falling back to default response.",
                "response": "[Fallback] Default message: Service busy due to token thresholds."
            }
        except ConnectionRefusedError as e:
            logging.warning(f"Connection lost on {agent.name}. Re-routing to secondary mock search...")
            return {
                "status": "fallback_success",
                "executor": "BackupSearchAgent",
                "response": "[Backup Search] Bedrock AgentCore local cache results loaded successfully."
            }

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: What is the benefit of the Supervisor Agent pattern over a flat single agent?
# A1: A flat agent tries to hold all tool descriptions in a single LLM context window. 
#     As tools grow, prompt space runs out, and LLM attention degrades (hallucinations). 
#     The Supervisor pattern decouples tasks: the Supervisor acts as a lightweight router 
#     delegating to sub-agents (e.g. CalendarAgent, SearchAgent) which only load 
#     the exact prompt parameters and tools needed for their specific domain, 
#     dramatically increasing routing accuracy.
#
# Q2: Explain Model Context Protocol (MCP) in the context of multi-agent setups.
# A2: Without MCP, every tool requires a custom python connection wrapper. 
#     MCP provides a standardized JSON-RPC over SSE/Stdio interface. 
#     Any agent framework (like Strands or LangChain) can consume an MCP server's 
#     available tools and invoke actions dynamically without writing custom adapter code.
#
# Q3: How do token budget caps protect against LLM loop execution crashes?
# A3: Agent loops can get stuck in recursive execution cycles (e.g. Agent A asks Agent B, 
#     who asks Agent A back). By tracking cumulative token usage at the sub-agent 
#     and supervisor levels, we raise budget boundaries (TokenLimiterException) 
#     before running up thousands of dollars of API billing costs.
# =====================================================================
