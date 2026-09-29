# 02. Secrets Manager & Environment Variables

<VideoSection title="Managing Credentials with AWS Secrets Manager & Env Variables: Secrets Manager & Environment Variables" youtubeId="S73thl0AyFU" duration="10:35" motto="Official AWS Bedrock Video Tutorial tailored to Secrets Manager Security with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to Secrets Manager Security in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of Secrets Manager Security.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for Secrets Manager Security.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "Secrets Manager Security Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## MANAGING API KEYS & ENVIRONMENT VARS
Store database passwords or third-party vector store keys in **AWS Secrets Manager**:

```python
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='us-east-1')
    res = client.get_secret_value(SecretId=secret_name)
    return json.loads(res['SecretString'])
```

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
