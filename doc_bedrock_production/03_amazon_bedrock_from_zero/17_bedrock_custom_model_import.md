# 17. Importing Proprietary & Custom Models into Amazon Bedrock

<VideoSection title="Amazon Bedrock Custom Model Import to Use Proprietary Models" youtubeId="qlhezoMhI4I" duration="00:38" motto="Official AWS Bedrock Video Tutorial tailored to Amazon Bedrock Custom Model Import to Use Proprietary Models with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to Amazon Bedrock Custom Model Import to Use Proprietary Models in Amazon Bedrock.", "timestamp": 0}, {"time": "01:15", "text": "Technical deep-dive and operational breakdown of Amazon Bedrock Custom Model Import to Use Proprietary Models.", "timestamp": 75}, {"time": "02:30", "text": "Production implementation and enterprise best practices for Amazon Bedrock Custom Model Import to Use Proprietary Models.", "timestamp": 150}] bookmarks=[{"title": "Introduction & Key Concepts", "time": "00:00", "timestamp": 0}, {"title": "Technical Walkthrough", "time": "01:15", "timestamp": 75}, {"title": "Production Best Practices", "time": "02:30", "timestamp": 150}] kbId="doc_aws_bedrock_production" />

## TOPIC OVERVIEW
Overview of Amazon Bedrock Custom Model Import for hosting custom fine-tuned weights serverlessly.

## KEY ARCHITECTURAL & OPERATIONAL CONCEPTS
- **Bring Your Own Model (BYOM)**:  Import custom model artifacts trained on SageMaker or local clusters.
- **Serverless Integration**:  Leverage Bedrock Guardrails, Knowledge Bases, and Agents with custom models.
- **Unified Management**:  Use standard Bedrock API endpoints to invoke custom imported models.

> [!NOTE]
> All model integrations and workflows in Amazon Bedrock strictly observe AWS security boundaries, KMS key encryption, and zero data retention policies!

## VISUAL WORKFLOW & ARCHITECTURE DIAGRAM

```mermaid
flowchart LR
    CustomWeights["Custom Weights (HuggingFace / SageMaker)"] --> BedrockImport["Custom Model Import"] --> ServerlessRuntime["Managed Bedrock Endpoint"]
```

## ENTERPRISE BEST PRACTICES
1. **Decoupled Architecture**: Use the standard Boto3 Converse API to avoid binding client code to a specific model provider.
2. **Safety First**: Attach Bedrock Guardrails to all model invocation requests to prevent PII leaks and prompt injection attacks.
3. **Observability**: Enable CloudWatch model invocation logging for compliance tracking and cost monitoring.
