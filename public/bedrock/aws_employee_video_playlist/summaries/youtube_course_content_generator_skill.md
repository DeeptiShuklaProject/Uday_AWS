# Skill: YouTube Course Content Generator

This document (Skill File) defines the architectural pipeline and instructions for generating production-grade, testable, and documented code repositories from a list of YouTube video courses and specified tech stacks.

---

## 📋 Input Parameter Schema

To trigger the generation, provide inputs in the following format:

```yaml
Tech_Stack:
  - Python
  - AWS
  - React (Optional)
Videos:
  - Episode_01:
      Title: "Introduction to Bedrock Agent Runtimes"
      URL: "https://www.youtube.com/watch?v=example1"
      Tech: "Python"
  - Episode_02:
      Title: "Building multi-agent strands"
      URL: "https://www.youtube.com/watch?v=example2"
      Tech: "Python, AWS"
```

---

## ⚙️ Generator Execution Pipeline

When executing this skill, the generator (or AI assistant) must follow these 5 steps sequentially:

### Step 1: Content & Transcript Extraction
* Fetch the video transcripts, chapters, or description metadata from the provided YouTube links.
* If direct transcripts are unavailable, parse the video titles and topics to extract key API modules, frameworks, and architecture patterns.

### Step 2: Workspace Scaffolding
* Create a parent folder named `examples/`.
* For each video episode `XX`, create a subdirectory prefixed with the episode number:
  - `examples/01_topic_name/`
  - `examples/02_topic_name/`

### Step 3: Dual-Tier Code Generation
For each subdirectory, generate:
1. **Simple Script (`epXX_simple_*.py` or `.tsx`):** A minimal runnable script showing basic API initialization.
2. **Production-Grade Script (`epXX_production_*.py` or `.tsx`):** Enterprise-grade script implementing:
   - Structured JSON logging.
   - Fault tolerance (retries/exponential backoff).
   - Cross-platform resource constraints.
3. **Industry Use-Case Script (`epXX_industry_*.py` or `.tsx`):** A real-world mock system representing target domains (e.g., Telecom data repair, E-commerce support, Insurance underwriting).

### Step 4: Verification Suite
* Create a matching unit test script (`test_epXX.py`) in each folder.
* Use framework-appropriate assertions (e.g. `unittest` or `pytest` for Python, `jest` or `vitest` for React) to validate both standard execution paths and exception handlers.

### Step 5: Master Index & Bootstrapper Compiler
* Generate a root `README.md` containing active links to each episode.
* Compile a single `bootstrap_workspace.py` script containing a dictionary map of all file paths and contents, allowing users to restore the workspace instantly.

---

## 💡 Example Walkthrough (React & AWS)

### Input:
```yaml
Tech_Stack: React, AWS Lambda
Videos:
  - Episode_01: "Building serverless dashboards" (https://youtube.com/watch?v=abc)
```

### Generated Files:
* `examples/01_serverless_dashboards/ep01_dashboard.tsx` (Production React page with Tailwind & API polling)
* `examples/01_serverless_dashboards/ep01_lambda_api.py` (AWS Lambda handler in Python returning data)
* `examples/01_serverless_dashboards/test_ep01.tsx` (React Testing Library unit tests)
* `examples/01_serverless_dashboards/README.md` (Explaining how the React-to-Lambda integration works)
