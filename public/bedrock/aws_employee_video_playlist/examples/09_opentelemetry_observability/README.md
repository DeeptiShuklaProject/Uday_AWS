# Episode 09 Example: AgentCore Observability & OpenTelemetry

This directory demonstrates how to instrument telemetry collection to monitor LLM token costs, API latencies, and tool selection metrics.

## 🛠️ Concepts Illustrated:
1. **Root Trace Spans**: Wrapping the entire agent call structure to record end-to-end user latencies.
2. **Child Spans**: Isolating specific tool executions (e.g. Perplexity API web search) to identify performance bottlenecks.
3. **Cost Tracing**: Attaching custom token metadata (`input_tokens`, `output_tokens`) to calculate monetary API cost metrics in real time.

## 💻 How to Run:
Run the script to output simulated OpenTelemetry traces:
```bash
python 09_otel_instrumentation.py
```
