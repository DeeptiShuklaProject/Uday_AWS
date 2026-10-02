import re

# =====================================================================
# EPISODE 11: Control Agent-to-Tool Interactions
# File: ep11_guardrail_policy.py (Guardrails Security Filters)
# =====================================================================

class BedrockGuardrailFilter:
    def __init__(self):
        self.blocked_topics = ["hack", "bypass instructions", "ignore previous instructions", "jailbreak"]
        self.card_regex = re.compile(r'\b(?:\d[ -]*?){13,16}\b')
        self.email_regex = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')

    def analyze_input(self, text: str) -> dict:
        text_lower = text.lower()
        for term in self.blocked_topics:
            if term in text_lower:
                return {
                    "is_blocked": True,
                    "reason": f"PROMPT_INJECTION_DETECTED: Blocked term '{term}' found."
                }
        if self.card_regex.search(text):
            return {
                "is_blocked": True,
                "reason": "PII_LEAK_DETECTED: Credit Card number pattern found."
            }
        if self.email_regex.search(text):
            return {
                "is_blocked": True,
                "reason": "PII_LEAK_DETECTED: Email address pattern found."
            }
        return {"is_blocked": False, "reason": "Passed Guardrail checks."}

class IAMPolicyValidator:
    def __init__(self):
        self.allowed_s3_buckets = ["s3://public-resources"]

    def authorize_s3_read(self, bucket_uri: str) -> bool:
        for allowed in self.allowed_s3_buckets:
            if bucket_uri.startswith(allowed):
                return True
        return False

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: How do you configure Bedrock Guardrails to prevent prompt injections?
# A1: Amazon Bedrock Guardrails allow developers to configure:
#     - Content filters (adjusting strength thresholds for hate, insult, sexual, violence).
#     - Denied topics (defining natural language queries to block, e.g. "investment advice").
#     - Word filters (blocking profanity or custom system prompt instructions).
#     Every user message is evaluated against these policies before hitting the LLM model.
#
# Q2: Describe how to protect Personally Identifiable Information (PII) using Guardrails.
# A2: Guardrails support native PII detection for standard data structures (e.g. SSN, 
#     names, phone numbers, addresses). You can configure the guardrail to either block 
#     the query completely or automatically mask/redact the sensitive string with tokens 
#     (e.g. `[EMAIL]`) before sending the text payload downstream, protecting user privacy.
#
# Q3: What IAM policy best practices should be used with AgentCore execution roles?
# A3: Apply the Principle of Least Privilege:
#     - Avoid `Resource: "*"` wildcard statements.
#     - Restrict S3 actions (`s3:GetObject`, `s3:PutObject`) to specific bucket prefixes.
#     - Restrict Lambda invocation permissions (`lambda:InvokeFunction`) to target MCP servers only.
#     - Restrict KMS decryption actions to only the keys used for encrypting session states.
# =====================================================================
