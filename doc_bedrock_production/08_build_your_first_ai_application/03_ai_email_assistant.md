# 03. Tangible Milestone #2: AI Email Assistant App

<VideoSection title="Building an Automated AI Email Assistant Application: Tangible Milestone #2: AI Email Assistant App" youtubeId="ZEKiIwWv9nM" duration="11:45" motto="Official AWS Bedrock Video Tutorial tailored to AI Email Assistant Project with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to AI Email Assistant Project in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of AI Email Assistant Project.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for AI Email Assistant Project.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "AI Email Assistant Project Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## APPLICATION REQUIREMENTS
1. User inputs: Email Topic, Target Tone (Formal / Friendly / Urgent), Key Points.
2. Backend crafts structured prompt and invokes Bedrock.
3. Formatted email output rendered on UI.

```python
def generate_email(topic, tone, key_points):
    prompt = f"Write a {tone} email about {topic}.\nKey Points:\n" + "\n".join(f"- {p}" for p in key_points)
    bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
    res = bedrock.converse(
        modelId='us.anthropic.claude-3-haiku-20240307-v1:0',
        messages=[{'role': 'user', 'content': [{'text': prompt}]}]
    )
    return res['output']['message']['content'][0]['text']
```

## VISUAL ARCHITECTURE DIAGRAM

```mermaid
flowchart TD
    ClientUI["User Web UI / CLI"] -->|HTTP POST Request| API["FastAPI / Backend Server"]
    API -->|Sanitize Input| Controller["App Service Controller"]
    Controller -->|Invoke Model| Boto3["Boto3 Bedrock Runtime Client"]
    Boto3 -->|API Call| Bedrock["Amazon Bedrock (Claude 3 / Titan)"]
    Bedrock -->>|Return Generated Output| Boto3
    Boto3 -->>|Formatted Response| Controller
    Controller -->>|JSON Payload| ClientUI
```
