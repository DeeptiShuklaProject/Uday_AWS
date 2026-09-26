<!-- TODO: Rewrite and humanize content from 08-cicd\module-28-python-jenkins.md, 08-cicd\module-29-python-github-actions.md -->

# Module 28 — Python + Jenkins

## 1. Chapter Introduction
Jenkins is the oldest and most widely deployed CI/CD server in the world. While newer tools like GitHub Actions are gaining popularity, Jenkins remains dominant in enterprise environments. In this module, we will learn how to integrate Python scripts into Jenkins pipelines, trigger Jenkins jobs programmatically via its API, and build Python-powered Jenkins automation.

## 2. What You Will Learn
- How Jenkins pipelines work (Declarative and Scripted).
- How to run Python scripts as Jenkins pipeline stages.
- How to use the Jenkins REST API with Python.
- How to trigger and monitor Jenkins jobs programmatically.

## 3. DevOps Example: Jenkinsfile Running Python
```groovy
pipeline {
    agent any
    stages {
        stage('Validate Config') {
            steps {
                sh 'python3 scripts/validate_config.py'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'python3 -m pytest tests/ --junitxml=results.xml'
            }
        }
        stage('Deploy') {
            steps {
                sh 'python3 scripts/deploy.py --env production'
            }
        }
    }
}
```

## 4. Production Example: Trigger Jenkins Job via API
```python
import requests
import os

JENKINS_URL = os.environ.get("JENKINS_URL", "http://jenkins.internal:8080")
JENKINS_USER = os.environ.get("JENKINS_USER")
JENKINS_TOKEN = os.environ.get("JENKINS_TOKEN")

def trigger_job(job_name, parameters=None):
    url = f"{JENKINS_URL}/job/{job_name}/buildWithParameters"
    response = requests.post(url, params=parameters or {},
                            auth=(JENKINS_USER, JENKINS_TOKEN))
    if response.status_code == 201:
        print(f"✅ Job '{job_name}' triggered successfully")
    else:
        print(f"❌ Failed to trigger '{job_name}': {response.status_code}")

trigger_job("deploy-web-app", {"ENVIRONMENT": "staging", "VERSION": "2.5.1"})
```

## 5. Quick Revision Notes
- Jenkins uses `Jenkinsfile` (Groovy-based) for pipeline-as-code
- Python scripts run via `sh 'python3 script.py'` in pipeline stages
- Jenkins API: `POST /job/{name}/build` or `/buildWithParameters`
- Auth: Username + API Token (never password)
- Use `--junitxml` with pytest for Jenkins test result integration


---

# Module 29 — Python + GitHub Actions

## 1. Chapter Introduction
Welcome to Part V. Up to this point, you have been running Python scripts manually on your laptop or a single server. In modern DevOps, this is known as "ClickOps" and it is heavily discouraged. Modern infrastructure is deployed through Continuous Integration and Continuous Deployment (CI/CD) pipelines. In this module, we will learn how Python scripts live inside Git repositories and are automatically triggered by tools like GitHub Actions, GitLab CI, or Jenkins.

## 2. What You Will Learn
- The definition of CI/CD and the "Pipeline" concept.
- How Python scripts fit into the CI/CD lifecycle.
- The anatomy of a GitHub Actions YAML file.
- How to inject environment variables (secrets) into pipeline runners.
- The absolute reliance on Exit Codes (0 vs 1).

## 3. Why This Topic Matters in DevOps
If you write a brilliant script to update a database schema, but you have to run it manually from your laptop, you are the single point of failure. If you go on vacation, the database doesn't get updated. CI/CD removes the human bottleneck. By placing your Python automation into a pipeline, the script runs automatically every time code is merged into the `main` branch. Understanding how to integrate Python into CI/CD is what elevates a "scripter" to a DevOps Engineer.

## 4. Concept Explained in Simple Language
### What is CI/CD?
Imagine an assembly line in a car factory.
- **Continuous Integration (CI):** Every time a worker adds a new part to the car (Code Commit), the assembly line automatically runs tests to make sure the part isn't broken.
- **Continuous Deployment (CD):** If the car passes all the tests, the assembly line automatically drives the car out of the factory and delivers it to the customer (Production Server).

### The "Runner"
A Pipeline doesn't run in the cloud magically. It runs on a "Runner." A runner is simply a temporary, blank-slate Linux server that spins up for 2 minutes, runs your Python script, and then destroys itself.

## 5. Real-World Analogy
Think of a CI/CD pipeline like an automated recipe machine.
Your GitHub repository is the cookbook. The YAML file is the index card telling the machine which recipe to cook today. The Runner is the kitchen. 
1. The kitchen spins up.
2. It downloads the cookbook (Git Checkout).
3. It installs the ingredients (`pip install`).
4. It bakes the cake (`python run_deployment.py`).
5. It throws away the kitchen when done.

## 6. Basic Example: The Flow of a Pipeline
Pipelines are configured using YAML (`.yml`) files. You do not write Python in the YAML file. You write YAML to *call* your Python file.

**Step 1:** You write `deploy.py` and commit it to GitHub.
**Step 2:** You write a pipeline file (e.g., `.github/workflows/deploy.yml`).
**Step 3:** The pipeline file executes the following logical steps:
```bash
# 1. Get the code
git checkout 

# 2. Setup Python
install python 3.10

# 3. Install dependencies
pip install requests boto3

# 4. Run the script!
python deploy.py
```

## 7. Step-by-Step Example: A GitHub Actions YAML
Here is what a real, production-ready GitHub Actions pipeline looks like. It triggers automatically whenever someone pushes code to the `main` branch.

```yaml
name: Python Production Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest # This is the "Runner" (A fresh Linux server)

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install requests

      - name: Execute Deployment Script
        run: python scripts/deploy_app.py
```

## 8. DevOps Example: Passing Secrets to the Runner
Remember Module 13? Your `deploy_app.py` script needs an API token to work. Because the Runner is a brand new, empty Linux server, it does not have your `.env` file. You must inject the secret from the GitHub UI into the Runner's environment variables via the YAML file.

```yaml
      - name: Execute Deployment Script
        env:
          # This pulls the secret from GitHub settings and puts it in os.environ!
          CLOUD_API_TOKEN: ${{ secrets.MY_PRODUCTION_TOKEN }}
        run: python scripts/deploy_app.py
```
*Now, when `deploy_app.py` runs `os.environ["CLOUD_API_TOKEN"]`, it will successfully find the secret!*

## 9. Cloud Example: Infrastructure as Code (IaC)
Python is heavily used in CI/CD to wrap Infrastructure as Code tools like Terraform or AWS CloudFormation. 

For example, a pipeline might run a Python script called `generate_config.py` which dynamically generates a JSON file based on the current time and branch name. The pipeline then passes that generated JSON file into a Terraform command to deploy the actual cloud resources. Python acts as the highly intelligent "glue" between the raw code and the rigid deployment tools.

## 10. Production Example: The Almighty Exit Code
We learned about Exit Codes in Module 10 (`sys.exit(1)`). In CI/CD, exit codes are everything.

If `scripts/deploy_app.py` crashes due to a `try/except` block, but you forget to call `sys.exit(1)`, the Python script will return an exit code of `0`. 
The GitHub Actions Runner will see `0`, print **"SUCCESS"** in big green letters, and proceed to the next step of the pipeline. **You have just created a false positive, which is the most dangerous event in CI/CD.**

Always, always fail loudly.
```python
import sys
try:
    deploy_database()
except Exception as e:
    print(f"Deployment Failed: {e}")
    sys.exit(1) # This turns the GitHub Action RED and stops the pipeline.
```

## 11. Common Mistakes
- **Assuming the Runner has your files:** The Runner is completely blank. If your Python script relies on a random CSV file located on your laptop's desktop, the pipeline will crash with `FileNotFoundError`. The file must be committed to the Git repository.
- **Hardcoding paths:** Using `C:\Users\Admin\Documents\script.py` in your code. The Runner is Ubuntu Linux. It has no `C:\` drive. Always use relative paths (`./script.py`) and `pathlib` (Module 11).
- **Ignoring `requirements.txt`:** If you `import requests` in your script, but forget to tell the pipeline to `pip install requests` first, the pipeline will instantly crash.

## 12. Troubleshooting
**Error:** `ModuleNotFoundError: No module named 'boto3'` in the CI/CD logs.
**Fix:** You tested the script locally where `boto3` was already installed on your laptop. The Runner is a fresh server. You must add `pip install boto3` (or `pip install -r requirements.txt`) to the pipeline YAML before the `run: python script.py` step.

## 13. Security Considerations
When a pipeline runs, it prints everything it does to a public (or company-wide) log file. If your Python script has a bug and prints a traceback (Module 9), or if you accidentally `print(os.environ)` (Module 13), that secret is now permanently etched into the CI/CD logs. GitHub attempts to mask known secrets with `***`, but it isn't perfect. Keep your pipeline scripts quiet and only print safe, necessary information.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "My script works on my laptop, but fails in the pipeline. I'm going to SSH into the Jenkins runner to fix it."
**Senior Engineer:** "No. CI/CD Runners are ephemeral (temporary). If you SSH in and fix the server manually, the next time the pipeline runs, it spins up a *brand new* server and fails all over again. If it works on your laptop but fails in the pipeline, it means you have an environmental dependency—a missing library, a missing file, or a missing environment variable. Fix the YAML file or the Git repository, never the runner itself."

## 15. Hands-on Exercise
**Beginner Exercise:**
Even without a GitHub account, you can simulate a pipeline locally.
1. Create a folder named `pipeline_test`.
2. Inside, create `deploy.py` containing: 
   ```python
   import sys, os
   if not os.environ.get("SECRET_KEY"):
       print("Failed: No key found.")
       sys.exit(1)
   print("Deployment successful!")
   ```
3. Open a terminal. Simulate the pipeline failing (don't set the key):
   `python deploy.py`
4. Now simulate the pipeline injecting the secret and succeeding (Linux/macOS):
   `SECRET_KEY=123 python deploy.py`

*Expected Outcome:* The first run prints "Failed". The second run prints "Deployment successful!".

## 16. Interview Questions
**Beginner:**
Q: What is a CI/CD Runner?
A: A Runner is a temporary, blank-slate virtual machine (usually Linux) that is spun up specifically to execute the instructions defined in a pipeline YAML file. It downloads the code, runs the tests/scripts, and is then destroyed.

**Intermediate:**
Q: Why is `sys.exit(1)` absolutely critical when writing Python scripts for CI/CD pipelines?
A: CI/CD tools determine the success or failure of a step entirely based on the operating system exit code. If a Python script catches an exception and prints an error but finishes naturally (exit code 0), the pipeline will assume the step was successful and continue, potentially deploying broken code.

**Advanced / Production Scenario:**
Q: Your Python script requires an AWS Access Key. It is highly insecure to commit this key to Git. How do you ensure the Python script can access this key during a GitHub Actions pipeline run?
A: I would store the AWS Access Key in GitHub's "Secrets" manager. Then, in the GitHub Actions YAML file, I would map that specific secret to an environment variable in the step executing the Python script. The script would then read it securely using `os.environ["AWS_ACCESS_KEY"]`.

## 17. Chapter Summary
The goal of DevOps is automation, and CI/CD pipelines are the engines of that automation. By understanding how temporary Runners execute your code, how to inject secrets securely via YAML, and the absolute necessity of rigorous exit codes, you ensure your Python scripts are ready for enterprise-scale automated deployment.

## 18. Quick Revision Notes
- **CI/CD:** Continuous Integration / Continuous Deployment.
- **Runners are blank slates.** They have no files and no libraries installed.
- Always include a `pip install -r requirements.txt` step in the pipeline.
- Pass secrets to the runner via YAML, catch them with `os.environ`.
- **Exit Code 0 = Pipeline Green (Success).**
- **Exit Code 1 = Pipeline Red (Failure).**
- Never SSH into a runner to fix it; fix the code or the pipeline configuration.


---

