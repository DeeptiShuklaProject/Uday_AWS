import json

import boto3

iam_client = boto3.client("iam")

policies_to_add = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "GetResourceTokens",
            "Effect": "Allow",
            "Action": [
                "bedrock-agentcore:GetResourceApiKey",
                "bedrock-agentcore:GetResourceOauth2Token",
            ],
            "Resource": "*",
        },
        {
            "Sid": "SecretsManager",
            "Effect": "Allow",
            "Action": ["secretsmanager:GetSecretValue"],
            "Resource": "arn:aws:secretsmanager:*:*:secret:bedrock-agentcore-*",
        },
    ],
}

iam_client.put_role_policy(
    PolicyDocument=json.dumps(policies_to_add),
    PolicyName="outbound_policies",
    RoleName=runtime_role.split("/")[-1],
)
print("✅ Identity + Secrets Manager permissions attached")
