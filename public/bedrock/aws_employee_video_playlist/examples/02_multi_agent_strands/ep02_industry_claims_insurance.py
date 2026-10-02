import logging
from typing import Dict, Any

# =====================================================================
# INDUSTRY STUDY: Insurance Claims Processing Multi-Agent System
# File: ep02_industry_claims_insurance.py (Multi-Agent Strands Pattern)
# =====================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Mock database of user insurance policies
# (पॉलिसी डेटाबेस का सिमुलेशन)
POLICIES_DB = {
    "policy_deepti": {"status": "Active", "type": "Comprehensive Auto", "coverage_limit": 50000.0, "deductible": 500.0},
    "policy_nishu": {"status": "Suspended", "type": "Third Party Liability", "coverage_limit": 10000.0, "deductible": 1000.0}
}

# 1. Sub-Agent for Policy Verification
# (पॉलिसी सत्यापन करने वाला एजेंट)
class PolicyVerificationAgent:
    def verify_coverage(self, policy_id: str, claim_amount: float) -> Dict[str, Any]:
        logging.info(f"[PolicyAgent] Checking coverage criteria for {policy_id}...")
        policy = POLICIES_DB.get(policy_id)
        if not policy:
            return {"verified": False, "reason": "Policy ID not found."}
        if policy["status"] != "Active":
            return {"verified": False, "reason": f"Policy status is {policy['status']}."}
        if claim_amount > policy["coverage_limit"]:
            return {
                "verified": True,
                "approved_amount": policy["coverage_limit"],
                "notes": f"Claim capped at coverage limit: {policy['coverage_limit']}."
            }
        return {
            "verified": True,
            "approved_amount": claim_amount - policy["deductible"],
            "notes": f"Claim approved minus deductible of {policy['deductible']}."
        }

# 2. Sub-Agent for Fraud Risk Assessment
# (धोखाधड़ी और रिस्क एनालिसिस एजेंट)
class FraudRiskAssessmentAgent:
    def calculate_fraud_score(self, policy_id: str, claim_details: str) -> Dict[str, Any]:
        logging.info(f"[FraudAgent] Running cognitive check on claims history...")
        score = 0.1 # Base risk score
        details_lower = claim_details.lower()
        
        # Risk factors check
        if "suspicious" in details_lower or "midnight" in details_lower:
            score += 0.4
        if "no police report" in details_lower:
            score += 0.3
            
        risk_level = "LOW"
        if score >= 0.7:
            risk_level = "HIGH"
        elif score >= 0.4:
            risk_level = "MEDIUM"
            
        return {
            "fraud_score": round(score, 2),
            "risk_level": risk_level,
            "requires_manual_audit": risk_level in ["MEDIUM", "HIGH"]
        }

# 3. Claims Supervisor Orchestrator
# (क्लेम प्रोसेसिंग को नियंत्रित करने वाला सुपरवाइज़र)
class ClaimsOrchestrationSupervisor:
    def __init__(self):
        self.policy_agent = PolicyVerificationAgent()
        self.fraud_agent = FraudRiskAssessmentAgent()

    def process_claim_request(self, policy_id: str, claim_amount: float, details: str) -> Dict[str, Any]:
        logging.info(f"[ClaimsSupervisor] Processing claim request for policy '{policy_id}'...")
        
        # Step 1: Verify Policy Coverage
        coverage_res = self.policy_agent.verify_coverage(policy_id, claim_amount)
        if not coverage_res["verified"]:
            return {
                "status": "DENIED",
                "reason": coverage_res["reason"],
                "payout": 0.0
            }
            
        # Step 2: Calculate Fraud Risks
        fraud_res = self.fraud_agent.calculate_fraud_score(policy_id, details)
        
        # Step 3: Determine Final Action
        approved_amt = coverage_res["approved_amount"]
        if fraud_res["requires_manual_audit"]:
            return {
                "status": "PENDING_AUDIT",
                "reason": f"Fraud risk is {fraud_res['risk_level']}. Claims details require verification.",
                "fraud_score": fraud_res["fraud_score"],
                "payout": 0.0
            }
            
        return {
            "status": "APPROVED",
            "payout": approved_amt,
            "notes": coverage_res["notes"],
            "fraud_score": fraud_res["fraud_score"]
        }

# Local execution demonstration
if __name__ == "__main__":
    supervisor = ClaimsOrchestrationSupervisor()
    
    print("\n--- Test Case 1: Active Policy, Normal Claim ---")
    res1 = supervisor.process_claim_request("policy_deepti", 1500.0, "Car bumper scratched in parking lot.")
    print(res1)
    
    print("\n--- Test Case 2: Active Policy, Suspicious Claim ---")
    res2 = supervisor.process_claim_request("policy_deepti", 8000.0, "Midnight crash, no police report, high speed.")
    print(res2)
