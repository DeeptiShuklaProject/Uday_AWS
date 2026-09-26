import unittest
import json
from ep04_industry_dealership_inventory import lambda_handler

class TestDealershipLambda(unittest.TestCase):

    def test_list_tools(self):
        event = {"method": "tools/list"}
        res = lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        tools = res["body"]["tools"]
        self.assertEqual(len(tools), 2)
        names = [t["name"] for t in tools]
        self.assertIn("search_inventory", names)
        self.assertIn("reserve_vehicle", names)

    def test_search_by_make(self):
        event = {
            "method": "tools/call",
            "params": {
                "name": "search_inventory",
                "arguments": {"make": "Tesla"}
            }
        }
        res = lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        content = json.loads(res["body"]["content"][0]["text"])
        self.assertEqual(content["status"], "success")
        self.assertEqual(len(content["results"]), 1)
        self.assertEqual(content["results"][0]["model"], "Model Y")

    def test_reserve_vehicle_success(self):
        # Reserve available rav4
        event = {
            "method": "tools/call",
            "params": {
                "name": "reserve_vehicle",
                "arguments": {"vin": "VIN_11223"}
            }
        }
        res = lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        content = json.loads(res["body"]["content"][0]["text"])
        self.assertEqual(content["status"], "success")
        self.assertIn("reserved successfully", content["message"])

if __name__ == "__main__":
    unittest.main()
