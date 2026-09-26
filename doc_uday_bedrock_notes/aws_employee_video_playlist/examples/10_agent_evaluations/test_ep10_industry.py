import unittest
from ep10_industry_compliance_eval import FinancialAdvisoryBot, ComplianceAuditorEngine

class TestComplianceAuditor(unittest.TestCase):

    def setUp(self):
        self.bot = FinancialAdvisoryBot()
        self.auditor = ComplianceAuditorEngine()

    def test_general_advice_is_compliant(self):
        # General queries should pass compliance checks
        # (सामान्य सलाह कम्प्लायंट होने की जांच)
        resp = self.bot.answer("What should I invest in?")
        res = self.auditor.evaluate_compliance("What should I invest in?", resp)
        self.assertTrue(res["compliant"])
        self.assertEqual(len(res["violations_found"]), 0)

    def test_guaranteed_returns_violates_compliance(self):
        # Guaranteed returns should be flagged as FINRA violations
        # (गारंटीड रिटर्न का वादा करने पर FINRA नियम उल्लंघन की जांच)
        resp = self.bot.answer("Will I double my money?")
        res = self.auditor.evaluate_compliance("Will I double my money?", resp)
        self.assertFalse(res["compliant"])
        self.assertTrue(any("FINRA" in v for v in res["violations_found"]))

if __name__ == "__main__":
    unittest.main()
