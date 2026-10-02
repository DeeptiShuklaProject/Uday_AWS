# 02. Latency Optimization & Prompt Caching

<VideoSection title="Bedrock Token Pricing, Provisioned Throughput & Cost Optimization: Latency Optimization & Prompt Caching" youtubeId="T_5K1_2zL" duration="09:50" motto="Official AWS Bedrock Generative AI Video Lesson with timestamped transcripts and topic bookmarks." whatItDoes="Integrates official AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Understanding On-Demand input/output token pricing.", "timestamp": 0}, {"time": "03:15", "text": "Configuring Provisioned Throughput Units (PTU) for reserved capacity.", "timestamp": 195}, {"time": "06:40", "text": "Prompt compression & model tiering cost optimization strategies.", "timestamp": 400}] bookmarks=[{"title": "Token Pricing", "time": "00:00", "timestamp": 0}, {"title": "Provisioned Throughput (PTU)", "time": "03:15", "timestamp": 195}, {"title": "Cost Optimization", "time": "06:40", "timestamp": 400}] kbId="doc_aws_bedrock_production" />

## STRATEGIES TO REDUCE LATENCY
1. **Streaming Responses (`converse_stream`)**: Return response chunks to the user in real-time as they are generated, eliminating perceived waiting time.
2. **Prompt Caching**: Cache repetitive static context (e.g. 50-page system documentation) so Bedrock does not re-process unchanged tokens on every request.
3. **Model Selection**: Route latency-critical tasks to Claude 3 Haiku or Nova Micro.

## VISUAL ARCHITECTURE DIAGRAM

```mermaid
flowchart TD
    Traffic["Application Prompt Traffic"] --> Router["Smart Cost & Latency Router"]
    
    Router -->|Simple Queries / Summarization| SmallModel["Low Cost Tier (Claude 3 Haiku / Llama 3 8B)
~$0.00025 / 1k Tokens"]
    Router -->|Complex Reasoning / Architecture| BigModel["High Intelligence Tier (Claude 3.5 Sonnet)
~$0.003 / 1k Tokens"]
    Router -->|Predictable High Throughput| PTU["Provisioned Throughput Units (PTU)
Dedicated Reserved Capacity"]

    SmallModel --> TotalCost["Aggregated Cost & Performance Dashboard"]
    BigModel --> TotalCost
    PTU --> TotalCost
```
