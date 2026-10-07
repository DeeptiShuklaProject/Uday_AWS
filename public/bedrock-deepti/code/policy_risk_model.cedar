// Policy: only callers whose JWT carries department_name=finance
// may invoke the risk model tool.
// (recreated from the generated Cedar shown in the episode)
permit(
    principal,
    action == AgentCore::Action::"RiskModelTool___invoke_risk_model",
    resource == AgentCore::Gateway::"arn:aws:bedrock-agentcore:us-east-1:123456789012:gateway/insurance-underwriting-sgqtcpm3ls"
) when {
    principal.hasTag("department_name") &&
    principal.getTag("department_name") == "finance"
};
