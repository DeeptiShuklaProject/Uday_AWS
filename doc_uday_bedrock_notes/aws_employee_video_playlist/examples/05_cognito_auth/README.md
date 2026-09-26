# Episode 05 Example: Security Workflows & Actor ID Propagation

This directory demonstrates how to handle authentication validation and context isolation using **AgentCore Identity** principles.

## 🛠️ Concepts Illustrated:
1. **OIDC Token Decode**: Simulates verifying JWT credentials (like those supplied by Amazon Cognito User Pools).
2. **Actor ID Extraction**: Reading the unique user identifier (`sub` claim) from the token.
3. **Downstream Policy Enforcement**: Preventing unauthorized data exposure by validating that the requesting ID matches the database ownership record before return (Row-Level Security).

## 💻 How to Run:
Run the script to see how the middleware blocks unauthorized account access:
```bash
python 05_auth_middleware.py
```
