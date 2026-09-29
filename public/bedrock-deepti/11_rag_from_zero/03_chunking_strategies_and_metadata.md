# 03. Metadata Filtering & Advanced Chunking

<VideoSection title="Document Chunking Strategies (Fixed, Hierarchical, Semantic): Metadata Filtering & Advanced Chunking" youtubeId="OvTH-7ESoRA" duration="11:50" motto="Official AWS Bedrock Video Tutorial tailored to Document Chunking with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to Document Chunking in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of Document Chunking.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for Document Chunking.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "Document Chunking Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## WHY METADATA FILTERING MATTERS
Attach key-value metadata to document chunks during ingestion:

```json
{
  "chunk_id": "c-9912",
  "source_file": "HR_Policy_2026.pdf",
  "department": "Engineering",
  "security_clearance": "Level-2"
}
```

When querying vector store, filter by metadata first (`department == 'Engineering'`), ensuring users only retrieve information they have security clearance to access!

## VISUAL ARCHITECTURE DIAGRAM

```mermaid
flowchart TD
    subgraph Ingestion_Pipeline ["1. Document Ingestion Pipeline"]
        RawDocs["Company PDFs / Markdown Docs"] --> Chunking["Document Chunking (1000 Tokens, 20% Overlap)"]
        Chunking --> Embedder["Titan Text Embeddings V2"]
        Embedder --> Index["Vector Database (OpenSearch Serverless)"]
    end

    subgraph Query_Pipeline ["2. Retrieval-Augmented Generation (RAG) Query Pipeline"]
        UserQ["User Question"] --> QEmbed["Embed Question Vector"]
        QEmbed --> SimilaritySearch["Vector Search (Cosine Distance)"]
        Index --> SimilaritySearch
        SimilaritySearch --> ContextChunks["Top 3 Matching Document Chunks"]
        ContextChunks --> AugmentedPrompt["Augmented Prompt = System Instruction + Chunks + Question"]
        AugmentedPrompt --> BedrockLLM["Bedrock Converse API (Claude 3)"]
        BedrockLLM --> GroundedAnswer["Accurate Grounded Response"]
    end
```
