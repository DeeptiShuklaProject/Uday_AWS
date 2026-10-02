import unittest
from ep09_otel_instrumentation import MockTracer, run_agent_workflow

class TestEpisode09OTel(unittest.TestCase):

    def test_otel_span_records_attributes(self):
        tracer = MockTracer("test-service")
        span = tracer.start_span("test-span")
        span.set_attribute("model", "anthropic.claude-v3")
        span.set_attribute("input_tokens", 100)
        span.end()
        
        self.assertEqual(span.attributes["model"], "anthropic.claude-v3")
        self.assertEqual(span.attributes["input_tokens"], 100)

    def test_agent_workflow_execution(self):
        try:
            run_agent_workflow("Search details", "session-1234")
            execution_ok = True
        except Exception:
            execution_ok = False
        self.assertTrue(execution_ok)

if __name__ == "__main__":
    unittest.main()
