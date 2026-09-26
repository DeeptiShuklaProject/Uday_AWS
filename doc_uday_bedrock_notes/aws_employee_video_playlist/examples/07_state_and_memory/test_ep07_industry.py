import unittest
from ep07_industry_leads_nurturing import LeadStateStore, LeadMemoryManager

class TestLeadNurturingMemory(unittest.TestCase):

    def setUp(self):
        self.store = LeadStateStore()
        self.manager = LeadMemoryManager(self.store)

    def test_nurture_lead_budget_and_vehicle_interest(self):
        mock_chat = [
            {"role": "user", "content": "I want an electric vehicle or SUV."},
            {"role": "user", "content": "My max budget is 52000"},
            {"role": "user", "content": "Schedule drive for Model Y please"}
        ]
        
        self.manager.parse_chat_session_for_lead_metadata("deepti@example.com", mock_chat)
        
        profile = self.store.get_lead_profile("deepti@example.com")
        self.assertEqual(profile["budget_max"], 52000.0)
        self.assertIn("electric", profile["interested_vehicle_types"])
        self.assertIn("suv", profile["interested_vehicle_types"])
        self.assertIn("Model Y", profile["requested_test_drives"])

if __name__ == "__main__":
    unittest.main()
