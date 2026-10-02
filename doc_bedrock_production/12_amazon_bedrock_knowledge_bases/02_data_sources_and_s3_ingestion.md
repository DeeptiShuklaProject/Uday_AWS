# 02. Data Sources & S3 Ingestion Sync

<VideoSection title="Configuring S3 Data Sources & Ingestion Sync Jobs: Data Sources & S3 Ingestion Sync" youtubeId="HeW-D6KpDwY" duration="12:15" motto="Official AWS Bedrock Video Tutorial tailored to S3 Data Ingestion with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to S3 Data Ingestion in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of S3 Data Ingestion.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for S3 Data Ingestion.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "S3 Data Ingestion Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## SUPPORTED DATA SOURCES
1. **Amazon S3**: Upload PDFs, DOCX, TXT, CSV, HTML, Markdown documents.
2. **Confluence & SharePoint**: Enterprise connectors.
3. **Web Crawler**: Index public HTTPS web URLs automatically.

## INGESTION JOB WORKFLOW
When you upload files to S3, call `start_ingestion_job`:

```python
bedrock_agent = boto3.client('bedrock-agent', region_name='us-east-1')

response = bedrock_agent.start_ingestion_job(
    knowledgeBaseId='KB12345678',
    dataSourceId='DS88219921'
)
print(f"Ingestion Job Status: {response['ingestionJob']['status']}")
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
