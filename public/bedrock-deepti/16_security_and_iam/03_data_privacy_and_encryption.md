# 03. Data Privacy & KMS Encryption at Rest / in Transit

<VideoSection title="Data Privacy & KMS Encryption at Rest / in Transit" youtubeId="B_7N8_9xM" duration="23:10" motto="Master AWS Bedrock Generative AI concepts visually through step-by-step video lessons and timestamped transcripts." whatItDoes="Integrates interactive video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Lesson introduction and architecture overview.", "timestamp": 0}, {"time": "04:15", "text": "Deep-dive into core mechanisms.", "timestamp": 255}, {"time": "08:30", "text": "Hands-on configuration and best practices.", "timestamp": 510}] bookmarks=[{"title": "Overview", "time": "00:00", "timestamp": 0}, {"title": "Core Deep-Dive", "time": "04:15", "timestamp": 255}, {"title": "Best Practices", "time": "08:30", "timestamp": 510}] kbId="doc_aws_bedrock_production" />

## DATA PROTECTION GUARANTEES
- **In Transit**: Encrypted via TLS 1.3 over HTTPS.
- **At Rest**: Custom KMS Key encryption for S3 buckets, OpenSearch collections, and Bedrock model customization artifacts.
- **Privacy Contract**: AWS does NOT store or log user prompt/response body content unless CloudWatch logs are explicitly configured by you.

## VISUAL ARCHITECTURE DIAGRAM

```mermaid
flowchart TD
    subgraph VPC_Boundary ["Private AWS VPC"]
        AppServer["App Instance / ECS Container"]
        VPCEndpoint["AWS PrivateLink VPC Endpoint (vpce-bedrock)"]
        AppServer -->|Private Traffic (No Internet)| VPCEndpoint
    end

    subgraph Security_Layer ["Security & Compliance Controls"]
        KMS["AWS KMS (Customer Managed Key Encryption at Rest)"]
        SecretsMgr["AWS Secrets Manager (API Keys & Credentials)"]
        CloudTrail["AWS CloudTrail (API Audit Logging)"]
    end

    VPCEndpoint --> BedrockService["Amazon Bedrock Isolated Service Endpoint"]
    BedrockService --- Security_Layer
```
