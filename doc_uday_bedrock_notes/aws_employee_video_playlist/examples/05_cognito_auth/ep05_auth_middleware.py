import time
import base64
import json

# =====================================================================
# EPISODE 05: Secure Your Agent Workflows
# File: ep05_auth_middleware.py (Cognito Security Implementation)
# =====================================================================

def generate_mock_jwt(username: str, client_id: str) -> str:
    header = {"alg": "RS256", "typ": "JWT", "kid": "key_1"}
    payload = {
        "sub": f"auth0|{username}",
        "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abcdef123",
        "client_id": client_id,
        "username": username,
        "exp": int(time.time()) + 3600,
        "scope": "openid profile email"
    }
    b64_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().strip("=")
    b64_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().strip("=")
    signature = "mock_signature_data_abcde"
    return f"{b64_header}.{b64_payload}.{signature}"

class IdentityMiddleware:
    def verify_token(self, token: str) -> dict:
        try:
            parts = token.split(".")
            if len(parts) != 3:
                raise ValueError("Invalid JWT token format.")
            payload_segment = parts[1]
            padding = len(payload_segment) % 4
            if padding:
                payload_segment += "=" * (4 - padding)
            decoded_bytes = base64.urlsafe_b64decode(payload_segment)
            payload_data = json.loads(decoded_bytes.decode())
            if payload_data.get("exp", 0) < time.time():
                raise ValueError("Token has expired.")
            return {
                "authenticated": True,
                "actor_id": payload_data.get("sub"),
                "username": payload_data.get("username")
            }
        except Exception as e:
            return {
                "authenticated": False,
                "error": str(e)
            }

class SecureBankTool:
    def __init__(self):
        self.accounts = {
            "auth0|deepti_shukla": {"account_num": "9876-Premium", "balance": "$1,450.00"},
            "auth0|nishu_saxena": {"account_num": "4321-Basic", "balance": "$45.00"}
        }

    def check_balance(self, target_user: str, actor_id: str) -> str:
        if target_user != actor_id:
            return f"[SECURITY ERROR] Access Denied. Authenticated Actor ({actor_id}) is not authorized to access records of ({target_user})."
        account = self.accounts.get(target_user)
        if not account:
            return f"[ERROR] Account details not found."
        return f"[SUCCESS] Account: {account['account_num']} | Balance: {account['balance']}"

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: What is "Identity Propagation" and why does it matter for AI Agents?
# A1: When a user chats with an agent, they log in via an Identity Provider (Cognito). 
#     The frontend receives a JWT. Instead of having the agent access databases using 
#     a single master admin API key, Identity Propagation forwards the user's specific 
#     JWT context down to all downstream Lambda tool calls. This allows the backend to 
#     know exactly *who* requested the balance check, preventing privilege escalation.
#
# Q2: Define "Actor IDs" in AWS Bedrock AgentCore security models.
# A2: An Actor ID is the validated subject identity claim (`sub`) parsed from Cognito 
#     OpenID Connect (OIDC) headers. It serves as the unique identifier for security policies, 
#     allowing Row-Level Security checks inside databases like DynamoDB or Aurora.
#
# Q3: How do you prevent token expiration issues during long agent reasoning loops?
# A3: If an agent loop takes several minutes (e.g. running multiple web lookups), the 
#     initial token could expire mid-flight. In production, the AgentCore Gateway handles 
#     automatic token refreshing using OAuth2 Refresh Tokens, or maintains a secure session 
#     token cache tied directly to the Firecracker VM metadata context.
# =====================================================================
