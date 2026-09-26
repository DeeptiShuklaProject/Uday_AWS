# Episode 11 Example: Security Policies & Guardrails

This directory demonstrates security filters and authorization boundaries implemented via **Amazon Bedrock Guardrails** and **AWS IAM policies**.

## 🛠️ Concepts Illustrated:
1. **Prompt Injection Prevention**: Catching and blocking attempts to hijack agent parameters (e.g. *"ignore previous instructions"*).
2. **PII Data Redaction**: Employing regular expressions to spot sensitive data (such as emails or credit card values) before passing payloads to downstream tools.
3. **IAM Resource Barriers**: Restricting agent access to defined S3 storage paths, blocking access to unauthorized directories (e.g. payroll buckets).

## 💻 How to Run:
Run the script to test inputs against security filters:
```bash
python 11_guardrail_policy.py
```
