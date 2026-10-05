# CloudTrail Security Analysis Demo — assembled from the episode's Jupyter notebook
# Each block below corresponds to one notebook cell shown on screen.

# ── Cell 1: Setting up the Environment ─────────────────────────────
from bedrock_agentcore.tools.code_interpreter_client import CodeInterpreter
from strands import Agent, tool
from strands.models import BedrockModel

import json
import boto3
import pandas as pd
from typing import Dict, Any, List
import asyncio
from datetime import datetime, timedelta

print("✅ Libraries loaded")

# Initialize the Code Interpreter within a supported AWS region.
code_client = CodeInterpreter('us-west-2')
code_client.start(session_timeout_seconds=900)
print("🚀 Code Interpreter session started")

# ── Cell 2: Configuration ──────────────────────────────────────────
config = {
    'aws_region': 'us-west-2',                       # AWS region for S3 service
    's3_bucket': 'cloudtrail-awslogs-9-22-2025',     # S3 bucket with CloudTrail logs
    's3_prefix': 'sample-logs/',                     # S3 prefix for CloudTrail logs
    's3_max_files': 500                              # Maximum S3 files to process
}
print("📋 Configuration loaded:")
print(f"  S3 Bucket: {config['s3_bucket']}")
print(f"  AWS Region: {config['aws_region']}")
print(f"  S3 Prefix: {config['s3_prefix']}")

# Initialize AWS client for S3 data retrieval
s3_client = boto3.client('s3', region_name=config['aws_region'])

# ── Cell 3: Retrieve CloudTrail logs from S3 (helper) ──────────────
def get_cloudtrail_from_s3(bucket_name, prefix, max_files):
    # ... body partially visible on screen: lists objects under the prefix,
    # fetches each object, gzip-decompresses, json.loads, and collects
    # the "Records" arrays into a list of events.
    pass

# ── Cell 4: Retrieve CloudTrail Data ───────────────────────────────
print("🔍 Retrieving CloudTrail data from S3 bucket...")
print(f"📦 S3 Bucket: {config['s3_bucket']}")
print(f"📂 S3 Prefix: {config['s3_prefix']}")
print(f"📊 Maximum files to process: {config['s3_max_files']}")

# Skip CloudTrail API and go directly to S3
print("⚡ Skipping CloudTrail API, using S3 bucket directly...")
cloudtrail_events = get_cloudtrail_from_s3(
    config['s3_bucket'],
    config['s3_prefix'],
    config['s3_max_files']
)

if not cloudtrail_events:
    print("❌ No CloudTrail events retrieved.")
    print("Please ensure:")
    print("  1. CloudTrail is enabled in your AWS account")
    print("  2. You have proper IAM permissions to access CloudTrail")
    print("  3. Configure S3 bucket settings in the Config section")
    print("  4. Events exist in the specified time range")
else:
    print(f"📊 Ready to analyze {len(cloudtrail_events)} real CloudTrail events")

# Output on screen: "📊 Retrieved 42 CloudTrail events from S3 /
# 📊 Ready to analyze 42 real CloudTrail events"

# ── Cell 5: Preparing Files for the Sandbox ────────────────────────
if 'cloudtrail_events' in locals() and cloudtrail_events:
    files_to_create = [
        {
            "path": "cloudtrail_logs.txt",
            "text": json.dumps(cloudtrail_events)
        }
    ]
    print(f"📦 Prepared {len(files_to_create)} files for sandbox environment")
else:
    print("❌ Cannot prepare files - no CloudTrail events available")

# ── Cell 6: Helper for tool invocation ─────────────────────────────
def call_tool(tool_name: str, arguments: Dict[str, Any]) -> str:
    """Helper function to invoke sandbox tools"""
    response = code_client.invoke(tool_name, arguments)
    for event in response["stream"]:
        return json.dumps(event["result"])

# ── Cell 7: Write CloudTrail Data to the Sandbox ───────────────────
if 'cloudtrail_events' in locals() and cloudtrail_events:
    # Write files to sandbox
    writing_files = call_tool("writeFiles", {"content": files_to_create})
    print("📝 Writing CloudTrail logs result:")
    print(writing_files)

    # Verify files were created
    listing_files = call_tool("listFiles", {"path": ""})
    print("\n📝 Files in sandbox:")
    print(listing_files)
else:
    print("❌ Cannot write files - no CloudTrail events available")

# Output on screen: {"content": [{"type": "text",
#   "text": "Successfully wrote all 1 files"}], "isError": false}

# ── Cell 8.1: System Prompt ────────────────────────────────────────
SYSTEM_PROMPT = """You are a security analyst. Quickly analyze logs for basic security patterns.

Focus on:
1. Event counts by service
2. Any error patterns
3. Root account usage

Use Python to create fast, simple analysis. Keep code minimal and efficient. Start by analyzing the file format"""

print("📝 System prompt defined")

# ── Cell 8.2: Code Execution Tool ──────────────────────────────────
@tool
def execute_python(code: str, description: str = "") -> str:
    """Execute Python code in the sandbox for CloudTrail security analysis"""

    if description:
        code = f"# {description}\n{code}"

    # Print generated code to be executed
    print(f"\n🔍 Generated Code for: {description}")
    print(f"```python\n{code}\n```")

    # Call the invoke method and execute the generated code
    response = code_client.invoke("executeCode", {
        "code": code,
        "language": "python",
        "clearContext": False
    })
    for event in response["stream"]:
        return json.dumps(event["result"])

print("🔧 Code execution tool defined")

# ── Cell 8.3: Agent Configuration ──────────────────────────────────
if 'cloudtrail_events' in locals() and cloudtrail_events:
    model_id = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
    model = BedrockModel(model_id=model_id)

    # Configure the strands agent
    agent = Agent(
        model=model,
        tools=[execute_python],
        system_prompt=SYSTEM_PROMPT,
        callback_handler=None
    )
    print("🤖 Security Agent configured")
    print(f"🤖 Model: {model_id}")
    print(f"🛠️ Tools: execute_python")
else:
    print("❌ Cannot configure agent - no CloudTrail events available")

# ── Cell 9.1/9.2: Query + run (partially visible) ──────────────────
async def run_cloudtrail_security_analysis():
    """Run the comprehensive security analysis using the strands-based agent"""

    query = """Analyze CloudTrail logs in 'cloudtrail_logs.txt' and create a comprehensive security report:

ANALYSIS TASKS:
1. Count events by service and action
2. Identify any failed operations or errors
3. Look for root account usage
5. Find any critical issues
6. Generate threat summary

DELIVERABLES:
- ..."""   # remainder of the query is below the fold in the screenshot
    # ... streaming invocation loop not fully visible on screen

# ── Cell 11: Retrieve the generated report ─────────────────────────
# Verify files were created
listing_files = call_tool("listFiles", {"path": ""})
print("\n📁 Files in sandbox:")
print(listing_files)

file_response = call_tool("readFiles", {"paths": ["cloudtrail_security_report.md"]})
file_data = json.loads(file_response)

with open("cloudtrail_security_report.md", "w") as f:
    f.write(file_data["content"][0]["resource"]["text"])
print("✅ Security report retrieved and saved locally as: cloudtrail_security_report.md")

# ── Cell 12: Clean Up ──────────────────────────────────────────────
def cleanup():
    """Clean up resources"""
    try:
        code_client.stop()
        print("\n✅ Code Interpreter session stopped successfully!")
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")

# Run cleanup
cleanup()
