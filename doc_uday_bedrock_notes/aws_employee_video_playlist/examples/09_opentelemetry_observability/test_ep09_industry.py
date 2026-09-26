import unittest
from ep09_industry_billing_telemetry import ObservabilityMetricsEngine

class TestBillingTelemetry(unittest.TestCase):

    def setUp(self):
        self.engine = ObservabilityMetricsEngine()

    def test_metrics_success_billing(self):
        self.engine.record_agent_transaction("tenant_01", "success", 1000000, 1000000)
        
        # 1 million input = $3.00, 1 million output = $15.00 => $18.00 total
        cost = self.engine.cost_counter.tenant_counts["tenant_01"]
        self.assertAlmostEqual(cost, 18.00)
        self.assertEqual(self.engine.token_counter.get_count_for_tenant("tenant_01"), 2000000)

    def test_metrics_registers_errors(self):
        self.engine.record_agent_transaction("tenant_02", "error", 500, 0)
        self.assertEqual(self.engine.error_counter.get_count_for_tenant("tenant_02"), 1)

if __name__ == "__main__":
    unittest.main()
