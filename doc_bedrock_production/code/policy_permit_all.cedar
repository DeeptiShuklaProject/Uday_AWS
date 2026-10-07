// Policy: "Allow all users to call all tools" — the deliberately
// dangerous example. The console flags this as ALLOW ALL / overly
// permissive because it grants every action to every principal.
// (recreated from the generated Cedar shown in the episode)
permit(
    principal,
    action in [
        AgentCore::Action::"ApplicationTool___create_application",
        AgentCore::Action::"ApprovalTool___approve_application",
        AgentCore::Action::"RiskModelTool___invoke_risk_model",
        AgentCore::Action::"Gateway___listTools",
        AgentCore::Action::"Gateway___invokeTool",
        AgentCore::Action::"Gateway___searchTools"
    ],
    resource
);
