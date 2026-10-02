import os
import sys
import logging
import json
import time
from typing import Dict, Any

# =====================================================================
# EPISODE 01: Building Your First Production-Ready AI Agent
# File: ep01_production_agent.py (Production Architecture)
# =====================================================================

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
        }
        if hasattr(record, "session_id"):
            log_record["session_id"] = record.session_id
        return json.dumps(log_record)

logger = logging.getLogger("ProductionAgent")
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

try:
    from bedrock_agent_core import BedrockAgentCoreApp
except ImportError:
    class BedrockAgentCoreApp:
        def __init__(self):
            self.handler = None
        def invoke(self, func):
            self.handler = func
            return func

app = BedrockAgentCoreApp()

class ConfigValidator:
    @staticmethod
    def validate_env() -> Dict[str, str]:
        required_vars = ["AWS_REGION", "BEDROCK_MODEL_ID"]
        missing = [var for var in required_vars if not os.environ.get(var)]
        if missing:
            os.environ["AWS_REGION"] = "us-east-1"
            os.environ["BEDROCK_MODEL_ID"] = "anthropic.claude-3-sonnet"
        return {
            "region": os.environ["AWS_REGION"],
            "model_id": os.environ["BEDROCK_MODEL_ID"]
        }

class ProductionAgent:
    def __init__(self, config: Dict[str, str]):
        self.config = config

    def execute_with_retry(self, prompt: str, session_id: str, retries: int = 3) -> str:
        extra_log = {"session_id": session_id}
        for attempt in range(1, retries + 1):
            try:
                logger.info(f"Attempt {attempt}/{retries}: Invoking Bedrock Model {self.config['model_id']}", extra=extra_log)
                if "fail" in prompt.lower() and attempt < 2:
                    raise ConnectionError("Simulated network drop. Retrying...")
                return f"[Production Response] Successfully processed prompt: '{prompt}' on model {self.config['model_id']}"
            except (ConnectionError, TimeoutError) as e:
                logger.warning(f"Temporary dependency error: {str(e)}", extra=extra_log)
                if attempt == retries:
                    raise e
                time.sleep(0.5 * attempt)
            except Exception as e:
                logger.error(f"Unrecoverable execution crash: {str(e)}", extra=extra_log)
                raise e

@app.invoke
def invoke_handler(payload: Dict[str, Any], context: Any) -> Dict[str, Any]:
    session_id = getattr(context, "session_id", "session-unknown")
    extra_log = {"session_id": session_id}
    
    if not payload or "prompt" not in payload:
        logger.error("Invalid request payload. 'prompt' field missing.", extra=extra_log)
        return {
            "statusCode": 400,
            "error": "Bad Request",
            "message": "Required parameter 'prompt' is missing."
        }
        
    try:
        config = ConfigValidator.validate_env()
        agent = ProductionAgent(config)
        result = agent.execute_with_retry(payload["prompt"], session_id)
        return {
            "statusCode": 200,
            "response": result
        }
    except Exception as e:
        logger.critical(f"Critical execution failure inside VM container: {str(e)}", extra=extra_log)
        return {
            "statusCode": 500,
            "error": "Internal Server Error",
            "message": str(e)
        }

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: What makes Bedrock AgentCore different from standard AWS Lambda setups?
# A1: Standard Lambdas are stateless and subject to cold starts with 15-minute 
#     execution bounds. AgentCore utilizes Firecracker MicroVMs to provide 
#     hardware-level virtualization. This ensures that agent memory states, 
#     local files (e.g. temporary scraped files), and execution threads 
#     persist across sequential user inputs within the same session.
#
# Q2: How does Firecracker session isolation prevent cross-tenant security issues?
# A2: Each session triggers its own dedicated, isolated Firecracker MicroVM. 
#     Memory space and CPU contexts are completely decoupled at the hypervisor level. 
#     One user's agent execution cannot read or touch the memory of another 
#     active user session, preventing token or history leakage.
#
# Q3: Explain why Structured JSON Logging is mandatory in production agents.
# A3: Traditional text lines (e.g., print statements) get broken into separate 
#     lines in CloudWatch, making trace association impossible. JSON logging 
#     includes attributes like 'session_id' and 'level' in every line, allowing 
#     observability tools (e.g., Datadog, CloudWatch Insights) to query all logs 
#     belonging to a specific chat turn in a fraction of a second.
# =====================================================================
