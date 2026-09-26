# Chapter_03_aws_configuration

## 🎯 Learning Objectives
In this chapter, you will learn how to:
- Request model access in the Amazon Bedrock Console.
- Create an IAM policy with permissions for Bedrock, DynamoDB, and CloudWatch.
- Configure an IAM execution role and set up trust relationships.
- Verify AWS configurations using the console and CLI.

### Importance of This Chapter
By default, Amazon Bedrock foundation models are restricted. You must request model access through the AWS Console before your agent can execute model calls. Additionally, your agent needs an IAM execution role to read/write from AWS resources.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** IAM Policy
>
> **Simple Explanation:** An IAM Policy is a JSON document that defines permissions, specifying what actions are allowed or denied on which AWS resources.
>
> **Why do we need it?** To enforce least privilege, ensuring your agent container can only access the specific resources it needs.
>
> **Where is it used?** Created in the IAM Console and attached to users, groups, or roles.

---

> **📦 Technical Term Explained**
>
> **Term:** IAM Role
>
> **Simple Explanation:** An IAM Role is an identity with permission policies that determine what the identity can and cannot do in AWS, designed to be assumed by trusted entities (like services or users).
>
> **Why do we need it?** It allows AWS services (like AgentCore) to securely assume permissions to access other resources without using permanent access keys.
>
> **Where is it used?** Configured in the IAM Console and associated with resources (like virtual machines or container runtimes).

---

> **📦 Technical Term Explained**
>
> **Term:** STS (Security Token Service)
>
> **Simple Explanation:** AWS STS is a web service that enables you to request temporary, limited-privilege credentials for IAM users or federated users.
>
> **Why do we need it?** It generates short-lived credentials when roles are assumed, reducing the risk of credential theft.
>
> **Where is it used?** Automatically used by AWS SDKs when invoking `AssumeRole` calls.

---

> **📦 Technical Term Explained**
>
> **Term:** Model Access
>
> **Simple Explanation:** Model Access is a setting in the Amazon Bedrock console where users must agree to terms of service to request and activate access to specific foundation models.
>
> **Why do we need it?** Access is disabled by default for billing and compliance reasons.
>
> **Where is it used?** Requested once in the Bedrock Console for each region.

---

## 🛠️ Step-by-Step AWS Console Configuration

Follow these steps to configure your AWS account.

### Step 1: Request Amazon Bedrock Model Access
1. Open the [AWS Management Console](https://console.aws.amazon.com/) in your browser.
2. Search for and navigate to **Amazon Bedrock**.
3. In the left navigation pane, scroll to the bottom and select **Model access**.
4. Click the **Manage model access** button in the top right.
5. Select the checkboxes for the models you plan to use:
   - **Anthropic Claude 3.5 Sonnet**
   - **Anthropic Claude 3 Haiku**
6. Click **Request model access** (or **Save changes**). The status should update to **Access granted** within a few minutes.

---

### Step 2: Create the IAM Agent Execution Policy
The agent container requires permission to perform model inference, read deployment packages from S3, write history logs to DynamoDB, and push traces to CloudWatch.

1. Navigate to the **IAM Console** -> **Policies** -> **Create policy**.
2. Select the **JSON** tab and paste the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInference",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DynamoDBMemory",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/*agentcore*"
    },
    {
      "Sid": "CloudWatchLogging",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

3. Click **Next: Tags**, then **Next: Review**.
4. Name the policy `AgentCoreExecutionPolicy` and click **Create policy**.

---

### Step 3: Create the IAM Trust Role
Now, create the role that your agent will assume at runtime.

1. Navigate to the **IAM Console** -> **Roles** -> **Create role**.
2. Choose **Custom trust policy** under trusted entity type, and paste the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "agentcore.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

3. Click **Next**.
4. In the permissions search, find and select `AgentCoreExecutionPolicy`.
5. Click **Next**. Name the role `AgentCoreExecutionRole` and click **Create role**.
6. Note the **Role ARN** (e.g. `arn:aws:iam::123456789012:role/AgentCoreExecutionRole`) for use in Chapter 7.

---

## 📊 Visual Reference and Screenshots

Let's look at the configuration in the AWS console.

![Figure 3-1: Trust Relationships configuration in IAM Role](images/agent_section_16.png)
*Caption: Trust relationship policy configuration in the IAM Console.*
- **What to Observe:** The trust relationship statement designating the `agentcore.amazonaws.com` service principal.
- **Why it Matters:** Allows the AgentCore runtime service to assume this role when executing your agent container.

![Figure 3-2: Model Access Table in Amazon Bedrock Console](images/agent_section_13.png)
*Caption: Requesting model access in the Bedrock Console.*
- **What to Observe:** The access table showing granted statuses for Claude models.
- **Why it Matters:** Invocations will fail with authorization errors if model access is not requested.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** A common error is entering `lambda.amazonaws.com` instead of `agentcore.amazonaws.com` in the trust policy, preventing AgentCore from assuming the role.
  - **Resolution:** Navigate to the trust relationships tab of your role, click Edit, and verify the principal service matches `agentcore.amazonaws.com`.
- **Mistake:** Access denied errors on model calls.
  - **Resolution:** Check that your model access request status displays as "Access granted" and matches the region configured in your CLI credentials.

---

## 📝 Practical Exercise
Navigate to the Bedrock Console, request access for the Claude 3.5 Sonnet model, and verify that the status updates to "Access granted". Take a screenshot of your active access table and save it in your project's `images/` directory.

---

## 🔄 Chapter Recap
- We requested model access for Claude models in the Bedrock Console.
- We created the `AgentCoreExecutionPolicy` and trusted role `AgentCoreExecutionRole`.
- The AWS account is configured, and we can prepare the application repository.
