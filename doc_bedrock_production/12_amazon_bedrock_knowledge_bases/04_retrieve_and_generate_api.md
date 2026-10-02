# 04. Executing RetrieveAndGenerate API

<VideoSection title="Querying Knowledge Bases with RetrieveAndGenerate API: Executing RetrieveAndGenerate API" youtubeId="078tYSD7K8E" duration="10:50" motto="Official AWS Bedrock Video Tutorial tailored to RetrieveAndGenerate API with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to RetrieveAndGenerate API in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of RetrieveAndGenerate API.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for RetrieveAndGenerate API.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "RetrieveAndGenerate API Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## THE RETRIEVE_AND_GENERATE API
Invoke Knowledge Bases using a single Boto3 API call with `bedrock-agent-runtime`:

```python
import boto3

def query_knowledge_base(user_prompt, kb_id):
    agent_runtime = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    response = agent_runtime.retrieve_and_generate(
        input={'text': user_prompt},
        retrieveAndGenerateConfiguration={
            'type': 'KNOWLEDGE_BASE',
            'knowledgeBaseConfiguration': {
                'knowledgeBaseId': kb_id,
                'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-3-5-sonnet-20241022-v2:0'
            }
        }
    )
    
    output_text = response['output']['text']
    citations = response.get('citations', [])
    
    print(f"=== ANSWER ===\n{output_text}\n")
    print(f"=== CITATIONS ({len(citations)}) ===")
    for c in citations:
        print(f"- Reference: {c['retrievedReferences'][0]['location']['s3Location']['uri']}")
        
    return output_text
```

## VISUAL ARCHITECTURE DIAGRAM

```mermaid
flowchart TD
    S3["Amazon S3 Bucket (Source Data)"] -->|Start Ingestion Job| Sync["Bedrock Knowledge Base Sync Engine"]
    Sync --> Chunking["Chunking & Parsing Strategy"]
    Chunking --> TitanEmbed["Titan Embeddings Model"]
    TitanEmbed --> VectorStore["Vector Store (OpenSearch Serverless / Aurora Vector / Pinecone)"]

    UserApp["Application Client"] -->|RetrieveAndGenerate API| KBEndpoint["Bedrock KB Managed Endpoint"]
    KBEndpoint --> VectorStore
    KBEndpoint --> BedrockFM["Foundation Model (Claude 3)"]
    BedrockFM -->>|Grounded Output with Citations| UserApp
```
