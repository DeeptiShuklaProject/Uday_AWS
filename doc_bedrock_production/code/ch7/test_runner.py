from nova_act import NovaAct
import os
import json
from datetime import datetime
from bedrock_agentcore.tools.browser_client import browser_session, BrowserClient
from boto3.session import Session

# Constants for schemas
BOOL_SCHEMA = {"type": "boolean"}
STRING_SCHEMA = {"type": "string"}


class NovaActQA:
    def __init__(self, starting_page=None, api_key=None):
        # Initialize browser client
        boto_session = Session()
        region = boto_session.region_name
        browser_client = BrowserClient(region)
        browser_client.start(identifier="browser_use_tool_demo-saa0IukbM2")
        ws_url, headers = browser_client.generate_ws_headers()

        # Initialize Nova Act instance
        self.nova = NovaAct(
            starting_page=starting_page or "https://don1s5671hvet.cloudfront.net/",
            cdp_endpoint_url=ws_url,
            # (NovaAct constructor continues below — portion between
            # the two screenshots is not readable)
        )

        self.nova.start()
        self.test_results = []
        self.current_test = None
        self.browser_client = browser_client

    def AssertTrue(self, prompt):
        result = self.nova.act(prompt, schema=BOOL_SCHEMA)
        actual = result.parsed_response if result.matches_schema else False
        status = 'PASS' if actual else 'FAIL'
        print(f"{status} {prompt[:40]}... {actual}")

        if self.current_test:
            self.test_results.append({
                "step": self.current_test.get("step", "Unknown"),
                "action": self.current_test.get("action", prompt[:40]),
                "expected": self.current_test.get("expectedResult", "True"),
                "actual": str(actual),
                "status": status
            })

        return actual
