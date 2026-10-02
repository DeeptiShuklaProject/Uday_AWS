<!-- TODO: Rewrite and humanize content from 08-cicd\module-27-cicd-fundamentals.md -->

# Module 27 — CI/CD Fundamentals

## 1. Chapter Introduction
You have written Python scripts that automate cloud infrastructure, parse configuration files, and manage Git repositories. But who runs these scripts? In production, nobody runs scripts manually. Instead, a CI/CD system automatically triggers your scripts whenever code is pushed, a pull request is merged, or a schedule fires. In this module, we will understand the fundamentals of CI/CD and how Python scripts integrate into automated pipelines.

## 2. What You Will Learn
- The complete CI/CD pipeline lifecycle.
- The difference between CI, Continuous Delivery, and Continuous Deployment.
- How Python scripts are triggered in pipelines.
- Pipeline stages, artifacts, and environments.
- Pipeline-as-Code concepts.

## 3. Why This Topic Matters in DevOps
CI/CD is the heart of DevOps. Without it, deployments are manual, error-prone, and terrifying. With CI/CD, every code change is automatically built, tested, scanned, and deployed. Your Python automation scripts are the building blocks that make this possible.

## 4. CI/CD Pipeline Stages
```
Code Push → Build → Unit Tests → Lint/Format → Security Scan → Deploy to Staging → Integration Tests → Deploy to Production → Monitor
```

## 5. DevOps Example: Python Script as a Pipeline Step
```python
#!/usr/bin/env python3
"""validate_config.py — Run as a CI/CD pipeline step."""
import json
import sys

def validate(filepath):
    try:
        with open(filepath) as f:
            config = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"❌ VALIDATION FAILED: {e}")
        sys.exit(1)  # Non-zero exit code = pipeline fails

    required = ["environment", "version", "replicas"]
    for key in required:
        if key not in config:
            print(f"❌ Missing required key: {key}")
            sys.exit(1)

    print("✅ Configuration is valid")
    sys.exit(0)  # Zero exit code = pipeline continues

if __name__ == "__main__":
    validate("deploy_config.json")
```

## 6. Senior Engineer's Perspective
**Junior Engineer:** "I deploy by SSH-ing into the server and running my script."
**Senior Engineer:** "That means deployments depend on you being available, awake, and making zero typos. A CI/CD pipeline runs the same way every time—no human error, full audit trail, automatic rollback if tests fail. Your SSH approach is a bus factor of one."

## 7. Quick Revision Notes
- **CI** = Automatically build and test every commit
- **CD (Delivery)** = Code is always deployable; human approves release
- **CD (Deployment)** = Code auto-deploys to production if all tests pass
- Python scripts must use `sys.exit(0)` for success, `sys.exit(1)` for failure
- Pipeline-as-Code: define your pipeline in a file (`Jenkinsfile`, `.github/workflows/*.yml`)
- Every pipeline step should be idempotent and testable


---

