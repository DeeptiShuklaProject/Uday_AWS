import time
import json

# =====================================================================
# INDUSTRY STUDY: Billing and Request Metrics Telemetry Dashboard
# File: ep09_industry_billing_telemetry.py (Production Observability)
# =====================================================================

class MetricCounter:
    def __init__(self, name: str):
        self.name = name
        self.tenant_counts = {}

    def increment(self, tenant_id: str, value: int = 1):
        if tenant_id not in self.tenant_counts:
            self.tenant_counts[tenant_id] = 0
        self.tenant_counts[tenant_id] += value

    def get_count_for_tenant(self, tenant_id: str) -> int:
        return self.tenant_counts.get(tenant_id, 0)

class ObservabilityMetricsEngine:
    def __init__(self):
        # Create standard metric counters
        self.token_counter = MetricCounter("bedrock_tokens_consumed_total")
        self.cost_counter = MetricCounter("bedrock_api_cost_usd")
        self.error_counter = MetricCounter("bedrock_agent_failures_total")

    def record_agent_transaction(self, tenant_id: str, status: str, prompt_tokens: int, completion_tokens: int):
        # Calculate token cost based on Anthropic pricing models:
        # $3.00 per million input, $15.00 per million output tokens
        input_cost = (prompt_tokens / 1_000_000.0) * 3.00
        output_cost = (completion_tokens / 1_000_000.0) * 15.00
        total_cost = input_cost + output_cost
        
        self.token_counter.increment(tenant_id, prompt_tokens + completion_tokens)
        self.cost_counter.tenant_counts[tenant_id] = self.cost_counter.tenant_counts.get(tenant_id, 0.0) + total_cost
        
        if status == "error":
            self.error_counter.increment(tenant_id, 1)

    def print_tenant_billing_report(self, tenant_id: str):
        print(f"\n=============================================")
        print(f"💰 OBSERVABILITY REPORT FOR TENANT: {tenant_id}")
        print(f"=============================================")
        print(f"Total Tokens Transacted: {self.token_counter.get_count_for_tenant(tenant_id)}")
        print(f"Cumulative API Spend: ${self.cost_counter.tenant_counts.get(tenant_id, 0.0):.6f} USD")
        print(f"Failed Agent Invocations: {self.error_counter.get_count_for_tenant(tenant_id)}")
        print(f"=============================================\n")

if __name__ == "__main__":
    engine = ObservabilityMetricsEngine()
    
    # Simulate active tenant sessions
    engine.record_agent_transaction("car_dealer_east", "success", 1200, 400)
    engine.record_agent_transaction("insurance_claims_corp", "success", 4500, 1500)
    engine.record_agent_transaction("car_dealer_east", "error", 800, 0)
    
    # Print billing dashboards
    engine.print_tenant_billing_report("car_dealer_east")
    engine.print_tenant_billing_report("insurance_claims_corp")
