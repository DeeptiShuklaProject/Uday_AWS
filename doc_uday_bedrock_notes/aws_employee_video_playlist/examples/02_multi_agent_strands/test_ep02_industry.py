import unittest
from ep02_industry_claims_insurance import ClaimsOrchestrationSupervisor

class TestClaimsOrchestrator(unittest.TestCase):

    def setUp(self):
        self.supervisor = ClaimsOrchestrationSupervisor()

    def test_approved_claim(self):
        res = self.supervisor.process_claim_request("policy_deepti", 1500.0, "Car fender bender.")
        self.assertEqual(res["status"], "APPROVED")
        self.assertEqual(res["payout"], 1000.0) # 1500 - 500 deductible

    def test_denied_claim_suspended_policy(self):
        res = self.supervisor.process_claim_request("policy_nishu", 2000.0, "Minor scratch.")
        self.assertEqual(res["status"], "DENIED")
        self.assertIn("Suspended", res["reason"])

    def test_claim_pending_audit_due_to_fraud_score(self):
        res = self.supervisor.process_claim_request("policy_deepti", 3000.0, "Midnight accident, no police report, suspect hit and run.")
        self.assertEqual(res["status"], "PENDING_AUDIT")
        self.assertTrue(res["fraud_score"] >= 0.7)

if __name__ == "__main__":
    unittest.main()
