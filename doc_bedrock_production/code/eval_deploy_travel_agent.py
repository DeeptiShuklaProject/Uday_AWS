# Deploy the baseline travel agent to AgentCore Runtime
# (recreated from the on-screen notebook — 1_create_and_invoke_travel_agent.ipynb)
from bedrock_agentcore_starter_toolkit import Runtime

agentcore_runtime = Runtime()

# Configure — entrypoint + IAM role + dependency manifest.
# The generated Dockerfile wraps the start command in
#   CMD ["opentelemetry-instrument", "python", "travel_agent.py"]
# so every invocation emits OTel traces — that is what the
# evaluators read later.
agentcore_runtime.configure(
    entrypoint="travel_agent.py",
    execution_role=EXECUTION_ROLE_ARN,
    requirements_file="requirements.txt",
    agent_name="demo_travel_agent_evaluation",
)

# Launch — CodeBuild -> ECR -> AgentCore Runtime.
# Deploying (not just running locally) is deliberate: evaluation
# covers latency and cost too, so the agent must be tested
# where it will actually run in production.
agentcore_runtime.launch()
