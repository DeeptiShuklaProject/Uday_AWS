# Chapter_04_clone_repository

## 🎯 Learning Objectives
In this chapter, you will learn how to:
- Clone the official AWS Bedrock AgentCore samples repository.
- Verify the local directory structure.
- Understand the roles of the core directories and files.

### Importance of This Chapter
Analyzing the directory layout before modifying code helps developers understand where configuration files, source code, and scripts are stored.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** Repository
>
> **Simple Explanation:** A repository (or repo) is a digital storage space—often on a platform like GitHub—where all the code, assets, settings, and revision history of a project are stored.
>
> **Why do we need it?** It allows multiple developers to collaborate on the same codebase, track version history, and manage code updates.
>
> **Where is it used?** Managed locally on your machine and hosted remotely on platforms like GitHub or AWS CodeCommit.

---

## 🛠️ Step-by-Step Implementation

### Step 1: Clone the Repository
1. Open your terminal or command prompt.
2. Navigate to your desired parent workspace folder.
3. Execute the clone command:
   ```bash
   git clone https://github.com/awslabs/agentcore-samples.git
   ```
- **Why this command is required:** Downloads the codebase from GitHub to your machine.
- **Expected Output:**
  ```text
  Cloning into 'agentcore-samples'...
  remote: Enumerating objects: 142, done.
  remote: Counting objects: 100% (142/142), done.
  ...
  Resolving deltas: 100% (68/68), done.
  ```

---

### Step 2: Navigate into the Project
1. In your terminal, change your working directory to the cloned folder:
   ```bash
   cd agentcore-samples
   ```

---

### Step 3: Verify Folder Structure
1. To list the files and verify the clone completed successfully:
   - **Windows:**
     ```cmd
     dir
     ```
   - **macOS / Linux:**
     ```bash
     ls -la
     ```
- **Expected Output:** You should see directories like `src/`, `examples/`, and files like `pyproject.toml` and `README.md`.

---

## 📁 Repository Directory Structure

The repository contains these primary directories and files:

```
agentcore-samples/
│
├── README.md (Setup instructions)
├── pyproject.toml (Python package configuration and dependencies)
├── uv.lock (Resolved dependencies and versions lockfile)
│
├── .github/ (CI/CD GitHub Actions workflows)
│
├── src/ (Agent core source code and helper classes)
│   ├── main.py (Main application entry point)
│   └── utils.py (Utility helper modules)
│
└── examples/ (Step-by-step video series examples)
    ├── 01_runtime_basics/ (Episode 1: Basic compute runtime scripts)
    ├── 02_multi_agent_strands/ (Episode 2: Hierarchical supervisor agents)
    ├── 03_custom_runtime_docker/ (Episode 3: Custom Docker runtime configurations)
    ├── 04_gateway_lambda/ (Episode 4: Lambda tool target configurations)
    ├── 05_cognito_auth/ (Episode 5: Cognito identity authentication)
    ├── 06_sandbox_tools/ (Episode 6: Code interpreter and browser sandboxes)
    ├── 07_state_and_memory/ (Episode 7: DynamoDB long-term memory extraction)
    ├── 08_production_deploy/ (Episode 8: ECR Docker packaging scripts)
    ├── 09_opentelemetry_observability/ (Episode 9: OpenTelemetry instrumentation)
    ├── 10_agent_evaluations/ (Episode 10: Model testing and accuracy metrics)
    ├── 11_security_policies/ (Episode 11: Cedar access control policies)
    └── 12_episodic_vector_memory/ (Episode 12: Semantic episodic vector retrieval)
```

---

## 📊 Visual Reference

Let's look at the directory structure as rendered in our editor:

![Figure 4-1: Visual Directory structure inside VS Code](images/agent_section_14.png)
*Caption: Directory tree structure of the cloned repository in VS Code.*
- **What to Observe:** The organization of directories under `examples/` and files like `pyproject.toml`.
- **Why it Matters:** Provides a standardized structure for deploying and scaling multiple agent configurations.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Git clone command fails with a connection timeout.
  - **Resolution:** Verify your internet connection and check if Git is allowed through your firewall. If you are behind an enterprise proxy, configure Git's HTTP proxy settings.
- **Mistake:** Navigating into a non-existent directory.
  - **Resolution:** Ensure you spell the folder name correctly: `cd agentcore-samples`.

---

## 📝 Practical Exercise
Clone the repository, navigate into the directory, and run the directory listing command to verify the structure matches the layout shown in this chapter.

---

## 🔄 Chapter Recap
- We cloned the `awslabs/agentcore-samples` repository.
- We analyzed the directory layout and folder structure.
- We are ready to walk through the files and review their functions.
