# Episode 08 Practice Questions: Moving AI Agents from Prototype to Production

Test your understanding of the episode's concepts below. Click on the dropdowns to reveal the answers.

---

### Question 1: CodeBuild Pipeline
**Q**: How does `agentcore launch` automate CI/CD behind the scenes?
**Answer (Click to expand)**:
<details>
<summary>View Answer</summary>
It archives the source directory, uploads it to S3, and calls AWS CodeBuild to compile the Docker image and push it to ECR.
</details>

