<!-- TODO: Rewrite and humanize content from 17-serverless\module-52-python-serverless.md, 17-serverless\module-53-event-driven-devops.md -->

# Module 52 — Python + Serverless

## 1. Chapter Introduction
Serverless computing lets you run code without provisioning or managing servers. You write a function, upload it, and the cloud provider runs it automatically when triggered—by an API call, a file upload, a database change, or a scheduled timer. In this module, we will learn how to write, deploy, and manage serverless functions using Python across AWS Lambda, Azure Functions, and Google Cloud Functions.

## 2. What You Will Learn
- What serverless computing is and when to use it.
- How to write AWS Lambda functions in Python.
- How to write Azure Functions in Python.
- How to write Google Cloud Functions in Python.
- Serverless best practices for DevOps automation.

## 3. Why This Topic Matters in DevOps
Serverless is the ultimate DevOps automation platform. Need a script that runs every night to clean up unused cloud resources? Lambda. Need a function that processes every new file uploaded to S3? Lambda trigger. Need an API endpoint that validates deployment configurations? API Gateway + Lambda. No servers to manage, patch, or scale.

## 4. Concept Explained in Simple Language
### Serverless vs Traditional

| Feature | Traditional (EC2/VM) | Serverless (Lambda) |
|---|---|---|
| Server management | You manage OS, patches, scaling | Cloud provider manages everything |
| Billing | Pay for uptime (24/7) | Pay per execution (milliseconds) |
| Scaling | Manual or auto-scaling groups | Automatic, instant |
| Cold starts | None (always running) | 100ms–3s on first invocation |
| Max runtime | Unlimited | 15 minutes (Lambda), 10 minutes (Azure) |
| Best for | Long-running services | Short, event-driven tasks |

## 5. AWS Lambda Example
```python
# lambda_function.py — AWS Lambda handler
import json
import boto3

def lambda_handler(event, context):
    """
    AWS Lambda function to stop idle development EC2 instances.
    Triggered by CloudWatch Events (scheduled daily at 8 PM).
    """
    ec2 = boto3.client("ec2")

    # Find running dev instances
    response = ec2.describe_instances(Filters=[
        {"Name": "tag:Environment", "Values": ["development"]},
        {"Name": "instance-state-name", "Values": ["running"]}
    ])

    instance_ids = []
    for res in response["Reservations"]:
        for inst in res["Instances"]:
            instance_ids.append(inst["InstanceId"])

    if not instance_ids:
        return {"statusCode": 200, "body": json.dumps("No dev instances to stop")}

    ec2.stop_instances(InstanceIds=instance_ids)

    return {
        "statusCode": 200,
        "body": json.dumps(f"Stopped {len(instance_ids)} instances: {instance_ids}")
    }
```

## 6. Azure Functions Example
```python
# function_app.py — Azure Functions handler
import azure.functions as func
import json
import logging

app = func.FunctionApp()

@app.timer_trigger(schedule="0 0 20 * * *", arg_name="timer")
def stop_dev_vms(timer: func.TimerRequest) -> None:
    """Azure Function triggered daily at 8 PM to stop dev VMs."""
    logging.info("Timer trigger: stopping development VMs")
    # Azure VM stop logic here
    logging.info("Development VMs stopped successfully")

@app.route(route="health")
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """HTTP-triggered health check endpoint."""
    return func.HttpResponse(
        json.dumps({"status": "healthy"}),
        mimetype="application/json",
        status_code=200
    )
```

## 7. Google Cloud Functions Example
```python
# main.py — Google Cloud Function
import json

def stop_dev_instances(event, context):
    """
    Cloud Function triggered by Cloud Scheduler.
    Stops all development Compute Engine instances.
    """
    from google.cloud import compute_v1

    client = compute_v1.InstancesClient()
    project = "my-project"
    zone = "us-central1-a"

    stopped = []
    for instance in client.list(project=project, zone=zone):
        labels = instance.labels or {}
        if labels.get("env") == "development" and instance.status == "RUNNING":
            client.stop(project=project, zone=zone, instance=instance.name)
            stopped.append(instance.name)

    return json.dumps({"stopped": stopped})
```

## 8. Production Example: Deploying Lambda with Python
```python
import boto3
import zipfile
import os

def deploy_lambda(function_name, code_dir, handler="lambda_function.lambda_handler"):
    """Package and deploy a Python Lambda function."""
    zip_path = "/tmp/lambda_package.zip"

    # Create ZIP package
    with zipfile.ZipFile(zip_path, "w") as z:
        for root, dirs, files in os.walk(code_dir):
            for file in files:
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, code_dir)
                z.write(filepath, arcname)

    # Deploy to AWS Lambda
    client = boto3.client("lambda")
    with open(zip_path, "rb") as f:
        client.update_function_code(
            FunctionName=function_name,
            ZipFile=f.read()
        )

    print(f"✅ Lambda function '{function_name}' deployed successfully")
```

## 9. Common Mistakes
- **Exceeding timeout limits:** Lambda max is 15 minutes. Design functions to complete within the limit.
- **Large deployment packages:** Keep packages under 50 MB (250 MB unzipped for Lambda). Use Lambda Layers for shared dependencies.
- **Not handling cold starts:** The first invocation after inactivity is slower. Use provisioned concurrency for latency-sensitive functions.
- **Hardcoding secrets:** Use the cloud provider's secret manager, not environment variables in the function configuration.

## 10. Senior Engineer's Perspective
**Junior Engineer:** "I have a Python script that runs on a cron job on an EC2 instance. Should I move it to Lambda?"
**Senior Engineer:** "Ask three questions: (1) Does it run for less than 15 minutes? (2) Does it need less than 10 GB of memory? (3) Is it triggered by an event or schedule? If yes to all three, Lambda will be cheaper, more reliable, and zero-maintenance. If it runs for 2 hours or needs persistent state, keep it on EC2."

## 11. Interview Questions
**Beginner:**
Q: What is serverless computing?
A: Serverless computing lets you run code without provisioning or managing servers. The cloud provider automatically handles infrastructure, scaling, and availability. You only pay for the actual compute time consumed.

**Intermediate:**
Q: Compare AWS Lambda, Azure Functions, and Google Cloud Functions.
A: All three run event-driven functions without server management. Lambda supports up to 15 min runtime, 10 GB memory, and has the largest ecosystem. Azure Functions integrates best with Microsoft services and supports Durable Functions for orchestration. GCP Cloud Functions integrates with Google services and supports both HTTP and event triggers.

**Advanced:**
Q: Your Lambda function makes 3 API calls that each take 5 seconds. How do you optimize cold start and execution time?
A: (1) Use provisioned concurrency to eliminate cold starts. (2) Make the 3 API calls concurrently using `concurrent.futures.ThreadPoolExecutor` to reduce total time from 15s to ~5s. (3) Minimize the deployment package size. (4) Initialize SDK clients outside the handler function so they are reused across warm invocations.

## 12. Chapter Summary
Serverless computing eliminates server management for short, event-driven tasks. AWS Lambda, Azure Functions, and Google Cloud Functions all support Python. Serverless is ideal for DevOps automation: scheduled cleanup scripts, webhook processors, deployment validators, and health check endpoints. Design functions to be stateless, fast, and idempotent.

## 13. Quick Revision Notes
- **AWS Lambda:** `lambda_handler(event, context)`, max 15 min, deploy as ZIP
- **Azure Functions:** `@app.timer_trigger()` / `@app.route()`, deploy via `func` CLI
- **GCP Cloud Functions:** `function_name(event, context)`, deploy via `gcloud`
- Keep functions short, stateless, and idempotent
- Initialize SDK clients outside the handler for reuse
- Use environment variables for configuration, secret managers for credentials
- Pay per invocation — no cost when idle


---

# Module 53 — Event-Driven DevOps

## 1. Chapter Introduction
The most powerful DevOps automation does not wait for humans to trigger it. It reacts to events automatically: a new container image is pushed → deploy to staging. A server health check fails → restart the service. A cost threshold is breached → send a Slack alert. In this module, we will learn how to build event-driven automation using webhooks, message queues, and cloud event services.

## 2. What You Will Learn
- The event-driven architecture pattern.
- How to build webhook receivers in Python.
- How to use cloud event services (EventBridge, Event Grid, Pub/Sub).
- How to process events from SQS, Azure Queue, and GCP Pub/Sub.
- How to design reliable event processing pipelines.

## 3. Why This Topic Matters in DevOps
Manual triggers create bottlenecks. If a deployment requires someone to click a button, it waits until that person is available. Event-driven automation removes the human bottleneck: events flow, functions trigger, and infrastructure responds—24/7, without human intervention.

## 4. DevOps Example: GitHub Webhook Receiver
```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import os

app = Flask(__name__)
WEBHOOK_SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET", "")

def verify_signature(payload, signature):
    """Verify GitHub webhook signature."""
    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

@app.route("/webhook", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-Hub-Signature-256", "")
    if not verify_signature(request.data, signature):
        return jsonify({"error": "Invalid signature"}), 401

    event = request.headers.get("X-GitHub-Event")
    payload = request.json

    if event == "push" and payload.get("ref") == "refs/heads/main":
        print(f"🚀 Push to main by {payload['pusher']['name']}")
        # Trigger deployment here
        return jsonify({"status": "deployment triggered"}), 200

    if event == "pull_request" and payload.get("action") == "opened":
        print(f"📝 PR opened: {payload['pull_request']['title']}")
        # Trigger CI checks here
        return jsonify({"status": "CI triggered"}), 200

    return jsonify({"status": "event ignored"}), 200

if __name__ == "__main__":
    app.run(port=5000)
```

## 5. Cloud Event Services Comparison

| Feature | AWS EventBridge | Azure Event Grid | GCP Pub/Sub |
|---|---|---|---|
| Pattern | Event bus with rules | Event subscriptions | Publish/Subscribe |
| Filtering | Rule-based matching | Advanced filtering | Attribute filtering |
| Targets | Lambda, SQS, SNS, etc. | Functions, Queues, etc. | Cloud Functions, etc. |
| Python SDK | `boto3` EventBridge | `azure-eventgrid` | `google-cloud-pubsub` |

## 6. Production Example: SQS Event Processor
```python
import boto3
import json
import time

def process_events(queue_url, handler_func, region="us-east-1"):
    """Continuously process events from an SQS queue."""
    sqs = boto3.client("sqs", region_name=region)

    print(f"📡 Listening for events on {queue_url}...")
    while True:
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=20  # Long polling
        )

        for message in response.get("Messages", []):
            try:
                event = json.loads(message["Body"])
                handler_func(event)
                sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=message["ReceiptHandle"])
            except Exception as e:
                print(f"❌ Failed to process message: {e}")
                # Message will become visible again after visibility timeout

def handle_deployment_event(event):
    """Handle a deployment event."""
    print(f"🚀 Deploying {event['service']} version {event['version']} to {event['environment']}")

# process_events("https://sqs.us-east-1.amazonaws.com/123456/deploy-queue", handle_deployment_event)
```

## 7. Senior Engineer's Perspective
**Junior Engineer:** "I run my cleanup script manually every morning."
**Senior Engineer:** "That means if you're sick or on vacation, it doesn't run. Set up a CloudWatch Event rule to trigger your Lambda function every day at 6 AM. Event-driven means the automation runs regardless of who is available. Infrastructure should be self-maintaining."

## 8. Interview Questions
**Advanced:**
Q: How do you ensure reliable event processing when the handler function can fail?
A: Use a dead-letter queue (DLQ) for failed messages, implement idempotent handlers (processing the same event twice produces the same result), set appropriate visibility timeouts, and monitor the DLQ for persistent failures. Use exponential backoff for retries.

## 9. Quick Revision Notes
- **Webhooks:** HTTP POST callbacks triggered by external events (GitHub, Slack, etc.)
- **Message Queues:** SQS, Azure Queue, GCP Pub/Sub — reliable async communication
- **Event Buses:** EventBridge, Event Grid — route events to multiple targets
- Verify webhook signatures to prevent spoofing
- Use long polling (`WaitTimeSeconds=20`) for efficient queue consumption
- Always use dead-letter queues for failed messages
- Handlers must be idempotent — processing same event twice = same result


---

