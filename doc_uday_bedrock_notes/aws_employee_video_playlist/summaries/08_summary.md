# Episode 08 Summary: Moving AI Agents from Prototype to Production

* **Original Video**: [AWS Show & Tell - Episode 8](https://www.youtube.com/watch?v=WyGK8UcAxKo)
* **Local Transcript**: [08_moving_ai_agents_from_prototype_to_production.txt](../transcripts/08_moving_ai_agents_from_prototype_to_production.txt)

## 📝 Key Takeaways & Core Concepts
* Focuses on the production deployment lifecycle, CI/CD, and scaling.
* Shows how the AgentCore SDK zips the project files, uploads them to S3, and triggers AWS CodeBuild to compile and push Docker images to ECR.
* Discusses auto-scaling of the serverless runtime and monitoring the deployment via trailing CloudWatch log streams.
