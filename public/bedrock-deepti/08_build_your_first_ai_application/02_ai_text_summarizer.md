# 02. Building an AI Text Summarizer

<VideoSection title="Building an AI Document Summarizer App with Boto3: Building an AI Text Summarizer" youtubeId="OvTH-7ESoRA" duration="12:10" motto="Official AWS Bedrock Video Tutorial tailored to AI Summarizer Project with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to AI Summarizer Project in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of AI Summarizer Project.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for AI Summarizer Project.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "AI Summarizer Project Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## SUMMARIZER SYSTEM PROMPT PATTERN
To build an executive summarizer, instruct Bedrock via system instructions:

```python
system_prompt = "You are an executive assistant. Summarize input documents into 3 bullet points with bold key takeaways."
```

## BOTO3 IMPLEMENTATION

```python
def summarize_text(long_article):
    bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
    response = bedrock.converse(
        modelId='us.anthropic.claude-3-haiku-20240307-v1:0',
        system=[{'text': 'Summarize input text into 3 executive bullet points.'}],
        messages=[{'role': 'user', 'content': [{'text': long_article}]}]
    )
    return response['output']['message']['content'][0]['text']
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
