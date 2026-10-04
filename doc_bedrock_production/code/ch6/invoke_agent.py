bearer_token = reauthenticate_user(cognito_config.get("client_id"))
print("Inbound bearer access token:", bearer_token[:40] + "…")

response = agentcore_runtime.invoke(
    {"prompt": "what are my private repositories?"},
    bearer_token=bearer_token,
)
for event in response:
    print(event)

# First call — the outbound 3LO flow kicks in:
#   Begin agent execution
#   Authentication required for GitHub access. Starting authorization flow...
#   Authorization URL: https://bedrock-agentcore.us-east-1.amazonaws.com/
#     identities/oauth2/authorize?request_uri=urn:ietf:params:oauth:request_uri:…
#
# After the user approves GitHub access in the browser, invoke again:
#   Authentication successful! Retrying GitHub repos...
#   📋 Here are your private GitHub repositories:
#     1. llm-rag-hackathon (Jupyter Notebook) — 1 star
#     2. tf-aws-vpc++ (HCL) — Terraform Workshop for a test VPC + EC2
#     3. eks-blueprints-for-proton — Amazon EKS Blueprints for Proton
