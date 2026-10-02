import logging
from typing import Dict, Any

# =====================================================================
# INDUSTRY STUDY: Role-Based Access Control (RBAC) in Finance
# File: ep05_industry_role_access.py (Enterprise Security Middleware)
# =====================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class AccessDeniedException(Exception):
    pass

class FinancialAdvisorTool:
    def __init__(self):
        # Database containing customer account wealth balances
        self.accounts_db = {
            "acc_deepti": {"owner": "Deepti Shukla", "net_worth": 500000.0, "assigned_advisor": "advisor_nishu"},
            "acc_arsh": {"owner": "Arsh Saxena", "net_worth": 120000.0, "assigned_advisor": "advisor_nishu"}
        }

    def fetch_client_portfolio(self, account_id: str, actor_role: str, actor_id: str) -> Dict[str, Any]:
        logging.info(f"[SecurityAudit] Access request by actor '{actor_id}' with role '{actor_role}' for '{account_id}'")
        
        # Policy Engine Rules
        # 1. ComplianceAuditors can view everything for legal reporting
        if actor_role == "ComplianceAuditor":
            return {"status": "authorized", "data": self.accounts_db.get(account_id)}
            
        # 2. FinancialAdvisors can only view portfolios assigned to them
        if actor_role == "FinancialAdvisor":
            account = self.accounts_db.get(account_id)
            if account and account["assigned_advisor"] == actor_id:
                return {"status": "authorized", "data": account}
            raise AccessDeniedException(f"Access Denied. Advisor {actor_id} is not assigned to account {account_id}.")
            
        # 3. Regular Clients can only read their own portfolios
        if actor_role == "Client":
            # Map client actor_id to account_id (e.g. client_deepti -> acc_deepti)
            owner_map = {"client_deepti": "acc_deepti"}
            if owner_map.get(actor_id) == account_id:
                return {"status": "authorized", "data": self.accounts_db.get(account_id)}
            raise AccessDeniedException(f"Access Denied. Client {actor_id} cannot read account {account_id}.")
            
        raise AccessDeniedException("Unknown actor role classification.")

if __name__ == "__main__":
    tool = FinancialAdvisorTool()
    
    print("\n--- Run 1: Advisor accesses assigned client (Authorized) ---")
    try:
        res = tool.fetch_client_portfolio("acc_deepti", actor_role="FinancialAdvisor", actor_id="advisor_nishu")
        print(res)
    except AccessDeniedException as e:
        print(e)
        
    print("\n--- Run 2: Advisor accesses unassigned client (Denied) ---")
    try:
        res = tool.fetch_client_portfolio("acc_deepti", actor_role="FinancialAdvisor", actor_id="advisor_other")
        print(res)
    except AccessDeniedException as e:
        print(e)
        
    print("\n--- Run 3: Client accesses other client portfolio (Denied) ---")
    try:
        res = tool.fetch_client_portfolio("acc_arsh", actor_role="Client", actor_id="client_deepti")
        print(res)
    except AccessDeniedException as e:
        print(e)
        
    print("\n--- Run 4: Compliance Auditor accesses client (Authorized) ---")
    try:
        res = tool.fetch_client_portfolio("acc_arsh", actor_role="ComplianceAuditor", actor_id="auditor_compliance_01")
        print(res)
    except AccessDeniedException as e:
        print(e)
