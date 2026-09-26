# Episode 05 Summary: Secure Your Agent Workflows

* **Original Video**: [AWS Show & Tell - Episode 5](https://www.youtube.com/watch?v=wv2doVDF7KQ)
* **Local Transcript**: [05_secure_your_agent_workflows.txt](../transcripts/05_secure_your_agent_workflows.txt)

## 📝 Key Takeaways & Core Concepts
* Explains user identity propagation and authentication using **AgentCore Identity**.
* Shows how to configure **Amazon Cognito** as the identity provider (IDP) and authenticate requests via JWT bearer tokens passed in headers.
* Discusses **Actor ID propagation**: passing the authenticated user's context downstream so that tools and databases can enforce granular row-level security (e.g., verifying that a user can only access their own records).
