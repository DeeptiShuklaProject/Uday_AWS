// Policy: allow end users to create insurance applications
// only when the requested coverage amount is under $5,000,000.
// (recreated from the generated Cedar shown in the episode)
permit(
    principal,
    action == AgentCore::Action::"ApplicationTool___create_application",
    resource == AgentCore::Gateway::"arn:aws:bedrock-agentcore:us-east-1:123456789012:gateway/insurance-underwriting-sgqtcpm3ls"
) when {
    context.input.coverage_amount < 5000000
};
