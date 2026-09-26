# Chapter_16_observability

## 🎯 Learning Objectives
In this chapter, you will learn how to:
- Trace execution workflows using OpenTelemetry (OTel) spans.
- Instrument agent execution loops in Python.
- Record model token usage and calculate invocation costs.
- Export traces and spans to AWS CloudWatch.

### Importance of This Chapter
AI agents execute logic dynamically, making standard linear logs difficult to debug. Implementing OpenTelemetry tracing provides a timeline of model calls and tool executions, helping developers identify errors and bottlenecks.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** CloudWatch (Amazon CloudWatch)
>
> **Simple Explanation:** Amazon CloudWatch is a monitoring and management service that collects and visualizes logs, metrics, and trace data from AWS resources and applications.
>
> **Why do we need it?** It acts as a central repository for application logs and system resource metrics, enabling real-time monitoring and debugging.
>
> **Where is it used?** In all deployed cloud systems to monitor resource metrics and view errors.

---

> **📦 Technical Term Explained**
>
> **Term:** Token
>
> **Simple Explanation:** A token is a basic unit of text (roughly 4 characters or 0.75 words) that a Large Language Model uses to process and generate language.
>
> **Why do we need it?** LLMs do not read whole words; they process text as numeric tokens. Model usage costs are calculated per thousand or million tokens.
>
> **Where is it used?** In prompt inputs and generated model outputs.

---

> **📦 Technical Term Explained**
>
> **Term:** Tracing
>
> **Simple Explanation:** Tracing is the process of tracking the path of a request through an application, measuring the time spent in each function or service call.
>
> **Why do we need it?** It maps request timelines across services, helping developers find bottlenecks and trace errors in distributed systems.
>
> **Where is it used?** In performance dashboards and monitoring tools.

---

## 🧠 Telemetry Concepts and Span Context Propagation

When an agent executes requests, activities are grouped into **Spans**:
- **Root Span:** Encompasses the entire duration of the request.
- **Child Spans:** Represent sub-operations (e.g. database lookups, tool calls, model calls).

Using OpenTelemetry, these spans are linked together using a shared context, allowing you to trace the execution flow across threads and services.

---

## 📝 OpenTelemetry Tracer Implementation

```python
# File: src/observability.py
# Folder Location: agentcore-samples/src/observability.py

import time
import logging
from typing import Dict, Any

# =====================================================================
# 1. Mock OpenTelemetry Tracer Implementation
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

    def set_attribute(self, key: str, value: Any):
        self.attributes[key] = value

    def add_event(self, name: str, payload: dict = None):
        self.events.append({
            "name": name,
            "timestamp": time.time(),
            "payload": payload or {}
        })

    def end(self):
        duration = time.time() - self.start_time
        # In production, send this span payload to the OTLP Collector endpoint
        print(f"[Span Ended] Name: {self.name} | Duration: {duration:.4f}s | Attributes: {self.attributes}")

# Instantiate global tracer
tracer = MockTracer("bedrock-agent-core")

# =====================================================================
# 2. Instrumented Execution Loop
# =====================================================================
def run_agent_workflow_traced(user_prompt: str, session_id: str):
    root_span = tracer.start_span("agent_execution_loop")
    root_span.set_attribute("session_id", session_id)
    root_span.set_attribute("model", "anthropic.claude-3-5-sonnet")
    
    try:
        root_span.add_event("routing_started", {"prompt": user_prompt})
        
        # Start Child Span for Web Search Tool
        tool_span = tracer.start_span("tool:web_search")
        tool_span.set_attribute("tool_name", "web_search")
        time.sleep(0.05) # Simulate latency
        tool_span.add_event("search_api_call", {"target_url": "https://api.search.com"})
        tool_span.end()
        
        # Log input and output token counts to monitor usage costs
        input_tokens = 340
        output_tokens = 110
        root_span.set_attribute("input_tokens", input_tokens)
        root_span.set_attribute("output_tokens", output_tokens)
        root_span.set_attribute("total_cost_usd", (input_tokens * 0.003 + output_tokens * 0.015) / 1000)
        root_span.add_event("generation_completed")
        
    except Exception as e:
        root_span.set_attribute("error", True)
        root_span.set_attribute("error_message", str(e))
        raise e
    finally:
        root_span.end()
```

### Line-by-Line Code Explanation

- **`class MockSpan`:** Simulates an OpenTelemetry span. In a production environment, this class is replaced with the standard `opentelemetry.trace` library.
- **`set_attribute(...)`:** Attaches custom metadata to the span (e.g. `session_id`, `input_tokens`, `total_cost_usd`).
- **`add_event(...)`:** Adds a timestamped event log to the span timeline.
- **`end()`:** Calculates the span's duration and sends the trace payload to the collector.

---

## 📊 Visual Reference

Let's look at the traces exported to the CloudWatch dashboard:

![Figure 16-1: CloudWatch ServiceLens Traces](images/agent_section_7.png)
*Caption: Timeline analysis of spans in AWS CloudWatch.*
- **What to Observe:** The trace timeline showing the latency of the model call and tool execution steps.
- **Why it Matters:** Allows developers to identify bottlenecks and trace execution errors.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Unregistered child spans that render as disconnected traces in the dashboard.
  - **Resolution:** Verify that child spans inherit the active parent context.
- **Mistake:** Neglecting to record token metrics from model responses.
  - **Resolution:** Always read token usage objects from model metadata and log them to monitor costs.

---

## 📝 Practical Exercise
Add a child span named `tool:database_lookup` inside `run_agent_workflow_traced`. Simulate a database lookup latency of `0.02` seconds and verify that the span prints the duration on completion.

---

## 🔄 Chapter Recap
- We studied OpenTelemetry trace concepts and span hierarchies.
- We implemented an instrumented execution loop.
- We recorded token and cost metrics to track resource usage.
- We are ready to review the complete request lifecycle.
