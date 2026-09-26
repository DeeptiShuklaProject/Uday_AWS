# Chapter_12_identity

## 🎯 Learning Objectives
In this chapter, you will learn how to:
- Authenticate users using Amazon Cognito user pools.
- Verify JSON Web Token (JWT) signatures.
- Propagate user identity (Actor ID) context to downstream services.
- Implement row-level security checks in database queries.

### Importance of This Chapter
Production applications must verify user identities and restrict data access. Utilizing identity propagation ensures users can only access their authorized records.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** Authentication
>
> **Simple Explanation:** Authentication is the process of verifying who a user is (e.g. by checking their username, password, or security token).
>
> **Why do we need it?** To confirm that a user is who they claim to be before granting access to resources.
>
> **Where is it used?** In log-in screens or API endpoints where credentials are input and verified.

---

> **📦 Technical Term Explained**
>
> **Term:** Authorization
>
> **Simple Explanation:** Authorization is the process of verifying what an authenticated user has permission to do or access.
>
> **Why do we need it?** To restrict access to sensitive resources and prevent unauthorized actions.
>
> **Where is it used?** In access control policies (like IAM) or row-level filters inside database queries.

---

> **📦 Technical Term Explained**
>
> **Term:** Cognito (Amazon Cognito)
>
> **Simple Explanation:** Amazon Cognito is a fully managed user identity and access control service that handles sign-ups, sign-ins, and access tokens for web and mobile apps.
>
> **Why do we need it?** It removes the need to build custom authentication services, secure passwords, or manage session databases.
>
> **Where is it used?** In the user management layer of client apps and APIs.

---

## 🧠 Access Control Layers and Authentication Flow

AgentCore secures deployments across two layers:
1. **Infrastructure Access (IAM):** Restricts the agent container's access to AWS resources.
2. **User Authentication (IDP):** Authenticates users via Cognito or Okta and generates access tokens.

```
┌──────────────┐   1. User Logs In      ┌────────────────┐
│  Client App  ├───────────────────────>│  Cognito IDP   │
└──────┬───────┘                        └──────┬─────────┘
       │                                       │
       │ 2. Return JWT                         │
       ▼                                       │
┌──────────────┐   3. POST /invoke             │
│ Agent Runtime│◄──────────────────────────────┘
│  (MicroVM)   │  (Verify token signature against IDP)
└──────┬───────┘
       │
       │ 4. Inject Actor ID
       ▼
┌──────────────┐
│ Lambda Tool  │ (Execute query with row-level filters)
└──────────────┘
```

---

## 📄 Actor ID Propagation and Row-Level Security

When a user invokes the agent, the runtime validates the JWT token, extracts their user ID, and propagates it as the `Actor ID` to downstream tools.

Below is an example of a Lambda tool that checks this context:

```python
# File: src/lambda_tool.py
# Folder Location: lambda-tools/src/lambda_tool.py

import json
import boto3

def lambda_handler(event, context):
    # 1. Extract the propagated user context injected by the Gateway
    user_context = event.get("userContext", {})
    actor_id = user_context.get("actorId") # Cognito Sub ID
    
    # 2. Extract input arguments
    arguments = event.get("arguments", {})
    order_id = arguments.get("order_id")
    
    if not actor_id:
        return {
            "statusCode": 401,
            "body": json.dumps({"error": "Unauthorized: Actor ID context is missing."})
        }
        
    # 3. Query DynamoDB using the user context as a query key
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("CustomerOrders")
    
    # Verify user identity exists in the database
    response = table.get_item(Key={"OrderId": order_id})
    order = response.get("Item", {})
    
    # Verify the order belongs to the authenticated user
    if order.get("CustomerId") != actor_id:
        return {
            "statusCode": 403,
            "body": json.dumps({"error": "Access Denied: You do not own this order record."})
        }
        
    return {
        "statusCode": 200,
        "body": json.dumps(order)
    }
```

---

## 📊 Visual Reference

Let's look at how identity is configured in the Gateway dashboard:

![Figure 12-1: Identity Providers and Access Tokens](images/agent_section_6.png)
*Caption: Identity Provider and Token Mappings in the Gateway Console.*
- **What to Observe:** The OAuth trust mappings and client scopes.
- **Why it Matters:** Restricts API access to authenticated users, protecting downstream databases and model execution costs.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Running tools locally without passing a mock `userContext` payload.
  - **Resolution:** Modify your test files to mock standard user context objects when testing tools locally.
- **Mistake:** Access tokens are expired, causing requests to fail.
  - **Resolution:** Verify your client app handles Cognito refresh token exchanges to renew expired access tokens.

---

## 📝 Practical Exercise
Modify the Lambda tool code to log the extracted `actor_id` to standard output. Verify that the script compiles without errors.

---

## 🔄 Chapter Recap
- We studied the IAM and Cognito access control layers.
- We analyzed JWT token verification.
- We implemented Actor ID propagation in a Lambda tool.
- We are ready to learn about state management and Memory.
