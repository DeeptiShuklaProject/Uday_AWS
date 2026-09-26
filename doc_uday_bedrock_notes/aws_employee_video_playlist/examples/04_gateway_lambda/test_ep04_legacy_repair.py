import unittest
from ep04_industry_telecom_legacy_repair import LegacyDatabaseAgent, ORACLE_INVENTORY_DB

class TestTelecomLegacyRepair(unittest.TestCase):

    def setUp(self):
        self.agent = LegacyDatabaseAgent()
        # Reset DEV_002 and DEV_003 state
        ORACLE_INVENTORY_DB["DEV_002"] = {"serial_no": "MISSING", "mac_address": "00:0A:95:9F:8E:7D", "model": "Arris SB6183", "status": "Error", "source_supplier": "Arris"}
        ORACLE_INVENTORY_DB["DEV_003"] = {"serial_no": "MOT-5050", "mac_address": "INVALID_MAC_ADDR", "model": "Motorola Surfboard", "status": "Active", "source_supplier": "Motorola"}

    def test_scan_finds_corrupt_records(self):
        corrupt = self.agent.fetch_corrupt_records()
        self.assertEqual(len(corrupt), 2)
        dev_ids = [d["device_id"] for d in corrupt]
        self.assertIn("DEV_002", dev_ids)
        self.assertIn("DEV_003", dev_ids)

    def test_repair_missing_serial_succeeds(self):
        res = self.agent.resolve_data_gap("DEV_002", suggested_serial="ARR-112233")
        self.assertEqual(res["status"], "repaired")
        self.assertEqual(res["repaired_record"]["serial_no"], "ARR-112233")

    def test_repair_invalid_mac_fails_on_bad_format(self):
        res = self.agent.resolve_data_gap("DEV_003", suggested_mac="NOT_A_MAC")
        self.assertEqual(res["status"], "failed")

    def test_repair_invalid_mac_succeeds_on_good_format(self):
        res = self.agent.resolve_data_gap("DEV_003", suggested_mac="00:11:22:33:44:FF")
        self.assertEqual(res["status"], "repaired")
        self.assertEqual(res["repaired_record"]["mac_address"], "00:11:22:33:44:FF")

if __name__ == "__main__":
    unittest.main()
