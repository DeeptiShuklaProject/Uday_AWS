# 03. Vector Store Integrations for Knowledge Bases

<VideoSection title="Integrating OpenSearch Serverless, Pinecone & Aurora Vector: Vector Store Integrations for Knowledge Bases" youtubeId="bAwmZVJeO5s" duration="13:40" motto="Official AWS Bedrock Video Tutorial tailored to Vector Store Integration with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to Vector Store Integration in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of Vector Store Integration.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for Vector Store Integration.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "Vector Store Integration Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## MANAGED VECTOR STORES SUPPORTED BY BEDROCK

1. **Amazon OpenSearch Serverless** (Default & Recommended):
   - Serverless vector collection automatically created and managed by Bedrock.
2. **Pinecone**:
   - Cloud-native vector database linked via API key.
3. **Amazon Aurora PostgreSQL**:
   - Relational database with `pgvector` extension for ACID-compliant enterprise RAG.
4. **MongoDB Atlas Vector Search**

```
Knowledge Base ──► Select Vector Store ──► Managed OpenSearch Serverless / Pinecone / Aurora
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
