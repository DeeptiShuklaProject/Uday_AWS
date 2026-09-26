# Episode 07 Summary: Memory Deep Dive

* **Original Video**: [AWS Show & Tell - Episode 7](https://www.youtube.com/watch?v=-N4v6-kJgwA)
* **Local Transcript**: [07_memory_deep_dive.txt](../transcripts/07_memory_deep_dive.txt)

## 📝 Key Takeaways & Core Concepts
* Explains the distinction between short-term session state and automated long-term persistent personalization.
* **Short-Term Memory**: Keeps track of conversational turns and state within a single session run.
* **Long-Term Memory**: Automatically summarizes conversations, extracts user preferences, and persists user profile summaries across multiple sessions over time.
* Details the integration with DynamoDB behind the scenes for saving and retrieving memory objects.
