# Episode 07 Example: Session Memory & Long-term Summarization

This directory demonstrates how Amazon Bedrock AgentCore handles cognitive memory state: distinguishing temporary **Short-term Conversation Turns** from persistent **Long-term Profile Summaries**.

## 🛠️ Concepts Illustrated:
1. **Short-Term Session Memory**: Conversation lists stored inside the active MicroVM container during a single API session run.
2. **Long-Term Memory Compaction**: A background compaction process that extracts user preferences (e.g. favorite topics, language preferences) and saves them in a DynamoDB table.
3. **Session-to-Session Persistence**: Loading the user profile from the database at the start of a new session to preserve context without having to resend old raw transcript logs.

## 💻 How to Run:
Run the script to see how memory accumulates across two simulated days:
```bash
python 07_dynamo_longterm.py
```
