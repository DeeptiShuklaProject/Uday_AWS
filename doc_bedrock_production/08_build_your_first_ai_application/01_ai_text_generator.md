# 01. Building an AI Text Generator

<VideoSection title="Building a Python AI Text Generation Microservice: Building an AI Text Generator" youtubeId="t2_Q2BRzeEE" duration="10:25" motto="Official AWS Bedrock Video Tutorial tailored to AI Text Generator Project with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to AI Text Generator Project in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of AI Text Generator Project.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for AI Text Generator Project.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "AI Text Generator Project Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## ARCHITECTURE
```
Frontend (HTML/JS) ──► FastAPI / Node Backend ──► Bedrock Converse API ──► Response Text
```

## BACKEND FASTAPI ENDPOINT EXAMPLE (PYTHON)

```python
from fastapi import FastAPI
import boto3

app = FastAPI()
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

@app.post("/api/generate")
def generate_text(prompt: str):
    response = bedrock.converse(
        modelId='us.anthropic.claude-3-haiku-20240307-v1:0',
        messages=[{'role': 'user', 'content': [{'text': prompt}]}],
        inferenceConfig={'temperature': 0.7, 'maxTokens': 400}
    )
    return {"text": response['output']['message']['content'][0]['text']}
```

```widget:InteractiveExample
instruction="Test the AI Generator backend code logic:"
initialCode="import boto3\n\nbedrock = boto3.client('bedrock-runtime', region_name='us-east-1')\nprint('[BACKEND LOGIC]: Processing text generation request... OK.')"
language="python"
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
