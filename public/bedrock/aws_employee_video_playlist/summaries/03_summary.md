# Episode 03 Summary: Runtime Deep Dive

* **Original Video**: [AWS Show & Tell - Episode 3](https://www.youtube.com/watch?v=wizEw5a4gvM)
* **Local Transcript**: [03_runtime_deep_dive.txt](../transcripts/03_runtime_deep_dive.txt)

## 📝 Key Takeaways & Core Concepts
* Explains the lower-level mechanics of **AgentCore Runtime** container lifecycle management and security.
* Breaks down **Session Isolation**: every user session is mapped directly to an isolated microVM. This hard security boundary prevents any possibility of data/memory leaks between concurrent users.
* Discusses state persistence: in-memory state and local files are preserved in the microVM as long as the session stays active (up to 8 hours).
* Details timeouts and limits: 15-minute synchronous request timeout, 60-minute streaming limit, and 500 default concurrent sessions limit. Shows how Dockerfiles are auto-generated and compiled via AWS CodeBuild.
