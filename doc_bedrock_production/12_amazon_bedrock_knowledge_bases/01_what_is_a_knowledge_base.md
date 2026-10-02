# 01. What is an Amazon Bedrock Knowledge Base?

<VideoSection title="Amazon Bedrock Knowledge Bases Architecture & Overview: What is an Amazon Bedrock Knowledge Base?" youtubeId="8O5kX73OkIY" duration="11:20" motto="Official AWS Bedrock Video Tutorial tailored to Bedrock Knowledge Bases with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to Bedrock Knowledge Bases in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of Bedrock Knowledge Bases.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for Bedrock Knowledge Bases.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "Bedrock Knowledge Bases Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## WHAT IS A BEDROCK KNOWLEDGE BASE?
**Knowledge Bases for Amazon Bedrock** is a fully managed AWS service that automates the entire end-to-end RAG pipeline (document ingestion, chunking, vector embedding generation, vector store indexing, similarity search, and context injection) with zero custom code!

```
S3 Bucket Data Source ──► Ingestion Job (Auto Chunk & Embed) ──► OpenSearch Vector Store ──► RetrieveAndGenerate API
```

## KEY ADVANTAGES
- **Automated Sync**: Trigger ingestion jobs when new PDFs or Markdown files are uploaded to S3.
- **Built-in Citation Tracking**: Automatically appends exact document source citations and page numbers to model answers.

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
