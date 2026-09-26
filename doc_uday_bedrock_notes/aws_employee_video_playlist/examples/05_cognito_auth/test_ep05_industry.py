import unittest
from ep05_industry_role_access import FinancialAdvisorTool, AccessDeniedException

class TestRoleBasedAccess(unittest.TestCase):

    def setUp(self):
        self.tool = FinancialAdvisorTool()

    def test_advisor_access_success(self):
        res = self.tool.fetch_client_portfolio("acc_deepti", actor_role="FinancialAdvisor", actor_id="advisor_nishu")
        self.assertEqual(res["status"], "authorized")
        self.assertEqual(res["data"]["owner"], "Deepti Shukla")

    def test_advisor_access_denied(self):
        with self.assertRaises(AccessDeniedException):
            self.tool.fetch_client_portfolio("acc_deepti", actor_role="FinancialAdvisor", actor_id="advisor_other")

    def test_client_access_self_success(self):
        res = self.tool.fetch_client_portfolio("acc_deepti", actor_role="Client", actor_id="client_deepti")
        self.assertEqual(res["status"], "authorized")

    def test_client_access_other_denied(self):
        with self.assertRaises(AccessDeniedException):
            self.tool.fetch_client_portfolio("acc_arsh", actor_role="Client", actor_id="client_deepti")

    def test_compliance_auditor_access_any(self):
        res = self.tool.fetch_client_portfolio("acc_arsh", actor_role="ComplianceAuditor", actor_id="auditor_01")
        self.assertEqual(res["status"], "authorized")

if __name__ == "__main__":
    unittest.main()
