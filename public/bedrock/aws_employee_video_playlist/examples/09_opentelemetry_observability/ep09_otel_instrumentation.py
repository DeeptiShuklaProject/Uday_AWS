import time
import json

# =====================================================================
# EPISODE 09: AgentCore Observability
# File: ep09_otel_instrumentation.py (Telemetry Instrumentation)
# =====================================================================

class MockTracer:
    def __init__(self, service_name: str):
        self.service_name = service_name

    def start_span(self, name: str) -> 'MockSpan':
        return MockSpan(name)

class MockSpan:
    def __init__(self, name: str):
        self.name = name
        self.start_time = time.time()
        self.attributes = {}
        self.events = []

    def set_attribute(self, key: str, value):
        self.attributes[key] = value

    def add_event(self, name: str, payload: dict = None):
        self.events.append({
            "name": name,
            "timestamp": time.time(),
            "payload": payload or {}
        })

    def end(self):
        duration = time.time() - self.start_time
        # In actual setups, this payload is sent to an OTLP Collector collector endpoint.
        pass

tracer = MockTracer("bedrock-agent-core")

def run_agent_workflow(user_prompt: str, session_id: str):
    root_span = tracer.start_span("agent_execution_loop")
    root_span.set_attribute("session_id", session_id)
    root_span.set_attribute("model", "anthropic.claude-3-sonnet")
    try:
        root_span.add_event("routing_started", {"prompt": user_prompt})
        time.sleep(0.01)
        
        tool_span = tracer.start_span("tool:perplexity_search")
        tool_span.set_attribute("tool_name", "web_search")
        time.sleep(0.01)
        tool_span.add_event("search_api_call", {"target_url": "https://api.perplexity.ai"})
        tool_span.set_attribute("search_status", "success")
        tool_span.end()
        
        root_span.set_attribute("input_tokens", 450)
        root_span.set_attribute("output_tokens", 120)
        root_span.set_attribute("total_cost_usd", (450 * 0.003 + 120 * 0.015) / 1000)
        root_span.add_event("generation_completed")
    except Exception as e:
        root_span.set_attribute("error", True)
        root_span.set_attribute("error_message", str(e))
    finally:
        root_span.end()

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: How do you trace asynchronous LLM spans using OpenTelemetry?
# A1: In LLM pipelines, actions run asynchronously (e.g. streaming tokens or parallel tool calls). 
#     We use OTel Context propagation to pass the Span context across threads. 
#     By creating a parent span (e.g. `agent_execution_loop`) and registering child spans 
#     (e.g. `tool:perplexity_search`) using contextual tokens, OTel tracing backends 
#     can link the entire timeline of operations together into a clean visual trace tree.
#
# Q2: Explain the significance of collecting prompt token metrics.
# A2: Production LLMs charge by token consumption. Tracing prompt token counts (`input_tokens`) 
#     and completion token counts (`output_tokens`) as custom span attributes allows 
#     organizations to track API expenditures per session, identify queries that waste 
#     context space, and compute real-time cost indicators before receiving monthly bills.
#
# Q3: What is the benefit of OTLP over standard HTTP logs for telemetry data?
# A3: OpenTelemetry Protocol (OTLP) exports traces, metrics, and logs in a standardized 
#     binary protobuf format over gRPC or HTTP/2. This is extremely high-performance, 
#     as it bundles metrics in background batches, minimizing network overhead and avoiding 
#     slowing down the active agent execution loops.
# =====================================================================
