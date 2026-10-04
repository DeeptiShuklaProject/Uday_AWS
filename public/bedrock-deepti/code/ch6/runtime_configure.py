from bedrock_agentcore_starter_toolkit import Runtime

agentcore_runtime = Runtime()

response = agentcore_runtime.configure(
    entrypoint="github_agent.py",
    auto_create_execution_role=True,
    requirements_file="requirements.txt",
    region=region,
    agent_name="strands_agent_github_sep16_v6",
    authorizer_configuration={
        "customJWTAuthorizer": {
            "discoveryUrl": discovery_url,
            "allowedClients": [client_id],
        }
    },
)
print(response)

launch_result = agentcore_runtime.launch()

# Configuring BedrockAgentCore agent: strands_agent_github_sep16_v6
# Generated Dockerfile …
# Setting 'strands_agent_github_sep16_v6' as default agent
# Bedrock AgentCore configured.
# Saved configuration to .bedrock_agentcore.yaml
#
# agents:
#   strands_agent_github_sep16_v6:
#     bedrock_agentcore:
#       entrypoint: github_agent.py
#       protocol: PUBLIC
#       ecr_auto_create: true
