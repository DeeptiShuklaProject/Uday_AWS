# 01. IAM Roles, Workload Identity & Least Privilege

<VideoSection title="IAM Least Privilege Policies for Bedrock API Operations: IAM Roles, Workload Identity & Least Privilege" youtubeId="jU0cndZziO0" duration="11:20" motto="Official AWS Bedrock Video Tutorial tailored to IAM Least Privilege with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to IAM Least Privilege in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of IAM Least Privilege.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for IAM Least Privilege.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "IAM Least Privilege Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## PRODUCTION SECURITY BEST PRACTICES
1. **Never use static IAM Access Keys in production**. Use **IAM Roles for EC2 / ECS / EKS / AWS Lambda** or **IAM Identity Center**.
2. Restrict `bedrock:InvokeModel` to specific target model ARNs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
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
