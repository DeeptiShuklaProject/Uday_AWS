# 01. Multi-Turn Conversation Architecture

<VideoSection title="Multi-Turn Chatbot Architecture & Message Roles: Multi-Turn Conversation Architecture" youtubeId="8O5kX73OkIY" duration="12:30" motto="Official AWS Bedrock Video Tutorial tailored to Multi-Turn Chatbots with clickable timestamped transcripts." whatItDoes="Integrates topic-matched AWS Bedrock video lessons with synchronized transcripts and instant-jump topic bookmarks." clickInstructions="Click the video play button to start watching, or click any timestamp in the interactive transcript to jump directly to that topic." transcript=[{"time": "00:00", "text": "Introduction to Multi-Turn Chatbots in Amazon Bedrock.", "timestamp": 0}, {"time": "03:15", "text": "Deep-dive technical walkthrough of Multi-Turn Chatbots.", "timestamp": 195}, {"time": "07:30", "text": "Production best practices and hands-on architecture for Multi-Turn Chatbots.", "timestamp": 450}] bookmarks=[{"title": "Introduction", "time": "00:00", "timestamp": 0}, {"title": "Multi-Turn Chatbots Deep-Dive", "time": "03:15", "timestamp": 195}, {"title": "Production Practices", "time": "07:30", "timestamp": 450}] kbId="doc_aws_bedrock_production" />

## HOW CHATBOTS REMEMBER STATE
Stateless REST APIs forget previous turns unless you explicitly send conversation history in every API request.

```
Turn 1: User: "My name is Alice." ──► Bedrock: "Nice to meet you, Alice!"
Turn 2: User: "What is my name?" ──► Send History: [Turn 1 User, Turn 1 Assistant, Turn 2 User] ──► Bedrock: "Your name is Alice."
```

## BOTO3 MESSAGES ARRAY STRUCTURE

```python
messages_history = [
    {"role": "user", "content": [{"text": "My name is Alice."}]},
    {"role": "assistant", "content": [{"text": "Nice to meet you, Alice!"}]},
    {"role": "user", "content": [{"text": "What is my name?"}]}
]

response = bedrock.converse(
    modelId='us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    messages=messages_history
)
```

## VISUAL ARCHITECTURE DIAGRAM

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant App as Chat App Controller
    participant Memory as DynamoDB Session Store
    participant Bedrock as Bedrock Converse API

    User->>App: "What is my account balance?"
    App->>Memory: Get Session History (User & Assistant Messages)
    Memory-->>App: Return History Array
    App->>App: Append New User Message to History Array
    App->>Bedrock: converse(messages=History Array)
    Bedrock-->>App: "Your balance is $450."
    App->>Memory: Save Updated History Array
    App-->>User: "Your balance is $450."
```
