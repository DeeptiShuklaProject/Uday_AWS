import unittest
from ep02_industry_ecomm_amazon import AmazonSupportSupervisor

class TestECommerceBot(unittest.TestCase):

    def setUp(self):
        self.supervisor = AmazonSupportSupervisor()

    def test_catalog_search(self):
        res = self.supervisor.handle_customer_request("Nishu Saxena", "Kindle")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["count"], 1)
        self.assertEqual(res["results"][0]["asin"], "B081FDY251")

    def test_refund_success(self):
        # Nishu owns order_501 which is Delivered and refund eligible
        res = self.supervisor.handle_customer_request("Nishu Saxena", "refund my order", order_id="order_501")
        self.assertEqual(res["status"], "refund_initiated")
        self.assertEqual(res["refund_amount"], 999.00)

    def test_refund_denied_shipped_only(self):
        # Deepti owns order_502 which is Shipped but not refund eligible yet
        res = self.supervisor.handle_customer_request("Deepti Shukla", "refund my order", order_id="order_502")
        self.assertEqual(res["status"], "denied")
        self.assertIn("ineligible", res["message"])

    def test_order_security_access_denied(self):
        # Nishu tries to access Deepti's order_502
        res = self.supervisor.handle_customer_request("Nishu Saxena", "check status", order_id="order_502")
        self.assertEqual(res["status"], "unauthorized")
        self.assertIn("Access Denied", res["message"])

    def test_clarification_missing_order_id(self):
        res = self.supervisor.handle_customer_request("Nishu Saxena", "check my status")
        self.assertEqual(res["status"], "clarification_needed")

if __name__ == "__main__":
    unittest.main()
