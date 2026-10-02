import json

# =====================================================================
# INDUSTRY STUDY: Dealership Sales Lead Tracking and Session Profiling
# File: ep07_industry_leads_nurturing.py (Long-Term Memory State Model)
# =====================================================================

class LeadStateStore:
    def __init__(self):
        self.leads_db = {}

    def get_lead_profile(self, customer_email: str) -> dict:
        return self.leads_db.get(customer_email, {
            "email": customer_email,
            "budget_max": 0.0,
            "interested_vehicle_types": [],
            "requested_test_drives": [],
            "notes": "Fresh lead profile created."
        })

    def save_lead_profile(self, customer_email: str, profile: dict):
        self.leads_db[customer_email] = profile

class LeadMemoryManager:
    def __init__(self, store: LeadStateStore):
        self.store = store

    def parse_chat_session_for_lead_metadata(self, customer_email: str, chat_history: list):
        profile = self.store.get_lead_profile(customer_email)
        
        for turn in chat_history:
            content = turn["content"]
            content_lower = content.lower()
            
            # Extract budget constraints
            if "budget" in content_lower or "spend" in content_lower:
                # Try to extract numbers safely
                digits = [int(s) for s in content.split() if s.isdigit()]
                if digits:
                    profile["budget_max"] = float(max(digits))
            
            # Extract vehicles of interest
            for vehicle_type in ["suv", "sedan", "truck", "electric", "ev"]:
                if vehicle_type in content_lower and vehicle_type not in profile["interested_vehicle_types"]:
                    profile["interested_vehicle_types"].append(vehicle_type)
            
            # Extract test drive requests
            if "test drive" in content_lower or "schedule drive" in content_lower:
                # Find matching model names in the same turn
                for model in ["Model Y", "RAV4", "F-150"]:
                    if model.lower() in content_lower and model not in profile["requested_test_drives"]:
                        profile["requested_test_drives"].append(model)
                        
        profile["notes"] = f"Interested in {', '.join(profile['interested_vehicle_types'])} models. Budget: ${profile['budget_max']:.2f}."
        self.store.save_lead_profile(customer_email, profile)

if __name__ == "__main__":
    store = LeadStateStore()
    manager = LeadMemoryManager(store)
    
    # Mocking chat history turns
    mock_chat = [
        {"role": "user", "content": "I am looking for a new electric SUV."},
        {"role": "user", "content": "My budget is around 45000 dollars."},
        {"role": "user", "content": "I would love to schedule a test drive for Model Y next week."}
    ]
    
    manager.parse_chat_session_for_lead_metadata("nishu@example.com", mock_chat)
    print("Compiled Sales Lead Profile:")
    print(json.dumps(store.get_lead_profile("nishu@example.com"), indent=2))
