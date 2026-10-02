# 04. Tangible Milestone #6: Security Vulnerability Challenge

<VideoSection title="Security Audit Challenge: Auditing & Fixing AWS Vulnerabilities: Tangible Milestone #6: Security Vulnerability Challenge" youtubeId="lIId8IDP6TU" duration="09:50" motto="Official AWS Bedrock Video Tutorial tailored to Security Audit Challenge with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to Security Audit Challenge in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of Security Audit Challenge.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for Security Audit Challenge.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "Security Audit Challenge Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## AUDIT CHALLENGE: FIND THE SECURITY MISTAKE
Inspect the IAM policy and Python code snippets in the interactive security audit widget below to identify and fix security flaws:

```widget:SecurityChallenge
{
  "challengeTitle": "AWS IAM Bedrock Access Policy Security Challenge",
  "auditResult": "CRITICAL VULNERABILITY DETECTED",
  "vulnerablePolicy": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": "*",
        "Resource": "*"
      }
    ]
  },
  "remediatedPolicy": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ],
        "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
        "Condition": {
          "StringEquals": {
            "aws:PrincipalTag/Environment": "Production"
          }
        }
      }
    ]
  }
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
