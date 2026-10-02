import unittest
from ep02_production_supervisor import ProductionSupervisor, TokenLimiterException

class TestEpisode02Supervisor(unittest.TestCase):

    def setUp(self):
        self.supervisor = ProductionSupervisor()

    def test_routing_to_calendar(self):
        res = self.supervisor.route_and_execute("Schedule a meeting tomorrow")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["executor"], "CalendarAgent")

    def test_routing_to_search(self):
        res = self.supervisor.route_and_execute("Search news updates")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["executor"], "SearchAgent")

    def test_fallback_routing_on_unsupported_query(self):
        res = self.supervisor.route_and_execute("Play some music")
        self.assertEqual(res["status"], "error")
        self.assertIn("Routing failed", res["message"])

    def test_connection_failover_recovery(self):
        res = self.supervisor.route_and_execute("Search news fail")
        self.assertEqual(res["status"], "fallback_success")
        self.assertEqual(res["executor"], "BackupSearchAgent")

    def test_token_limit_handling(self):
        agent = self.supervisor.calendar_agent
        agent.execute_task("Schedule 1")
        agent.execute_task("Schedule 2")
        agent.execute_task("Schedule 3")
        agent.execute_task("Schedule 4")
        
        with self.assertRaises(TokenLimiterException):
            agent.execute_task("Schedule 5")

if __name__ == "__main__":
    unittest.main()
