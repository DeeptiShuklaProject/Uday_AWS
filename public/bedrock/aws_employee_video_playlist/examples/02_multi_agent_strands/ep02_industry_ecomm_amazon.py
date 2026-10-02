import logging
from typing import Dict, Any

# =====================================================================
# INDUSTRY STUDY: Amazon-Style E-Commerce Customer Support Multi-Agent
# File: ep02_industry_ecomm_amazon.py (E-Commerce Orchestration)
# =====================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Simulated Amazon E-commerce Databases
PRODUCT_CATALOG = [
    {"asin": "B08N5WRWNW", "title": "Apple MacBook Air M1", "price": 999.00, "stock": 14},
    {"asin": "B09G9FPHP6", "title": "Apple iPad Mini", "price": 499.00, "stock": 0},
    {"asin": "B081FDY251", "title": "Kindle Paperwhite", "price": 139.99, "stock": 45}
]

ORDERS_DB = {
    "order_501": {"asin": "B08N5WRWNW", "customer": "Nishu Saxena", "status": "Delivered", "refund_eligible": True},
    "order_502": {"asin": "B09G9FPHP6", "customer": "Deepti Shukla", "status": "Shipped", "refund_eligible": False}
}

# 1. Product Discovery Sub-Agent
# (सामान ढूंढने वाला एजेंट)
class ProductSearchAgent:
    def search_catalog(self, query: str) -> Dict[str, Any]:
        logging.info(f"[SearchAgent] Scanning Amazon-style ASIN inventory database for '{query}'...")
        query_lower = query.lower()
        matches = []
        for item in PRODUCT_CATALOG:
            if query_lower in item["title"].lower() or query_lower in item["asin"].lower():
                matches.append(item)
        return {
            "status": "success",
            "results": matches,
            "count": len(matches)
        }

# 2. Order Management Sub-Agent
# (ऑर्डर और रिफंड स्टेटस देखने वाला एजेंट)
class OrderManagementAgent:
    def check_order_status(self, order_id: str, actor_id: str) -> Dict[str, Any]:
        logging.info(f"[OrderAgent] Checking order history for {order_id}...")
        order = ORDERS_DB.get(order_id)
        if not order:
            return {"status": "error", "message": f"Order {order_id} not found."}
        # Security validation check
        if order["customer"] not in actor_id:
            return {"status": "unauthorized", "message": "Access Denied. You do not own this order."}
        return {
            "status": "success",
            "order_id": order_id,
            "delivery_status": order["status"],
            "refund_eligible": order["refund_eligible"]
        }

    def process_refund_request(self, order_id: str, actor_id: str) -> Dict[str, Any]:
        logging.info(f"[OrderAgent] Evaluating refund eligibility for {order_id}...")
        status_res = self.check_order_status(order_id, actor_id)
        if status_res["status"] != "success":
            return status_res
            
        if not status_res["refund_eligible"]:
            return {
                "status": "denied",
                "message": f"Order {order_id} is shipped but not delivered yet, making it ineligible for instant refund."
            }
            
        # Success scenario: Refund processing
        return {
            "status": "refund_initiated",
            "order_id": order_id,
            "refund_amount": 999.00,
            "message": "Refund successfully credited back to original payment method."
        }

# 3. Amazon Customer Support Supervisor
# (ई-कॉमर्स सुपरवाइज़र जो सही एजेंट को रिक्वेस्ट भेजता है)
class AmazonSupportSupervisor:
    def __init__(self):
        self.search_agent = ProductSearchAgent()
        self.order_agent = OrderManagementAgent()

    def handle_customer_request(self, customer_name: str, query: str, order_id: str = None) -> Dict[str, Any]:
        logging.info(f"[AmazonSupervisor] Incoming inquiry from user '{customer_name}': '{query}'")
        query_lower = query.lower()
        actor_id = f"auth0|{customer_name}"
        
        # Route logic
        if "order" in query_lower or "refund" in query_lower or "status" in query_lower:
            if not order_id:
                return {
                    "status": "clarification_needed",
                    "message": "Please provide your Order ID (e.g. order_501) to assist with order/refund lookups."
                }
            if "refund" in query_lower:
                return self.order_agent.process_refund_request(order_id, actor_id)
            return self.order_agent.check_order_status(order_id, actor_id)
            
        # Fallback to search
        return self.search_agent.search_catalog(query)

if __name__ == "__main__":
    supervisor = AmazonSupportSupervisor()
    
    # 1. Product Search Run
    print("\n--- E-Commerce Search Run ---")
    res1 = supervisor.handle_customer_request("Nishu Saxena", "MacBook")
    print(res1)
    
    # 2. Refund Verification Run
    print("\n--- E-Commerce Refund Success Run ---")
    res2 = supervisor.handle_customer_request("Nishu Saxena", "Request refund please", order_id="order_501")
    print(res2)
    
    # 3. Unauthorized Order Access Run
    print("\n--- E-Commerce Security Denied Run ---")
    res3 = supervisor.handle_customer_request("Nishu Saxena", "Check status of order", order_id="order_502")
    print(res3)
