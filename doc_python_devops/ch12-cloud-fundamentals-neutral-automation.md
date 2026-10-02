<!-- TODO: Rewrite and humanize content from 06-cloud-automation\module-20-cloud-fundamentals.md, 06-cloud-automation\module-24-cloud-neutral-automation.md -->

# Module 20 — Cloud Computing Fundamentals

## 1. Chapter Introduction
Welcome to Part VI. Up until now, you have been automating individual Linux servers and parsing local files. In modern DevOps, there are no physical servers you can touch. Instead, you request servers from a cloud provider using an API call, and they appear in minutes. In this module, we lay the foundation—understanding what cloud computing actually is, the terminology used across AWS, Azure, and GCP, and how Python connects to all of them.

## 2. What You Will Learn
- What cloud computing is and the three service models (IaaS, PaaS, SaaS).
- The shared responsibility model.
- Core cloud services and their names across AWS, Azure, and GCP.
- How Python SDKs communicate with cloud providers.
- Authentication patterns for cloud automation.

## 3. Why This Topic Matters in DevOps
A DevOps engineer who cannot automate cloud infrastructure is limited to managing a handful of on-premises servers. Cloud automation lets you provision 100 servers in 5 minutes, scale applications based on traffic, and tear down development environments every night to save costs. Python is the primary language for all three major clouds.

## 4. Concept Explained in Simple Language
### What is Cloud Computing?
Instead of buying and maintaining your own servers, you rent them from a cloud provider. The provider owns the hardware, the data centers, the power supply, and the cooling systems. You simply say, "I need a server with 8 GB of RAM in Mumbai," and within minutes, it exists.

### The Three Service Models

| Model | What You Manage | What Provider Manages | Example |
|---|---|---|---|
| **IaaS** (Infrastructure) | OS, apps, data | Hardware, networking, virtualization | EC2, Azure VMs, GCE |
| **PaaS** (Platform) | Just your code | Everything else | Elastic Beanstalk, App Service, App Engine |
| **SaaS** (Software) | Nothing — just use it | Everything | Gmail, Salesforce, Slack |

## 5. Real-World Analogy
- **On-Premises** is like owning a house: you maintain the roof, plumbing, and electricity yourself.
- **IaaS** is like renting an unfurnished apartment: the landlord handles the building, but you furnish and maintain the interior.
- **PaaS** is like a co-working space: just bring your laptop and work. Everything else is managed.
- **SaaS** is like a coffee shop with Wi-Fi: you walk in, use the service, and leave.

## 6. Cloud Service Comparison Table

| Concept | AWS | Azure | GCP |
|---|---|---|---|
| Virtual Machine | EC2 | Virtual Machine | Compute Engine |
| Object Storage | S3 | Blob Storage | Cloud Storage |
| Managed Database | RDS | Azure SQL | Cloud SQL |
| Serverless Functions | Lambda | Azure Functions | Cloud Functions |
| Container Orchestration | EKS | AKS | GKE |
| DNS | Route 53 | Azure DNS | Cloud DNS |
| Monitoring | CloudWatch | Azure Monitor | Cloud Monitoring |
| Secret Management | Secrets Manager | Key Vault | Secret Manager |
| IAM | IAM | Azure AD / Entra ID | IAM |
| CLI Tool | `aws` | `az` | `gcloud` |
| Python SDK | `boto3` | `azure-*` packages | `google-cloud-*` packages |

## 7. How Python Talks to the Cloud
Every cloud provider exposes a REST API. When you run `aws ec2 describe-instances`, the AWS CLI constructs an HTTPS request, signs it with your credentials, sends it to Amazon's API, and displays the JSON response.

Python SDKs do the same thing, but give you programmatic control:

```python
# Concept (not provider-specific yet)
# 1. Import the SDK
# 2. Create a client (with credentials)
# 3. Call an API method
# 4. Process the JSON response

# AWS example (conceptual)
import boto3
client = boto3.client("ec2", region_name="us-east-1")
response = client.describe_instances()

# Azure example (conceptual)
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
credential = DefaultAzureCredential()
client = ComputeManagementClient(credential, subscription_id)

# GCP example (conceptual)
from google.cloud import compute_v1
client = compute_v1.InstancesClient()
```

## 8. Authentication Patterns
Every cloud provider requires authentication. Never hardcode credentials.

| Method | Security Level | Use Case |
|---|---|---|
| Environment variables | ⚠️ Medium | Local development |
| Config files (`~/.aws/credentials`) | ⚠️ Medium | Developer workstations |
| IAM Roles / Managed Identity | ✅ High | EC2, Azure VMs, GCE |
| Service Accounts | ✅ High | CI/CD pipelines |
| Temporary tokens (STS/OAuth) | ✅ Highest | Cross-account access |

## 9. Production Example: Cloud-Agnostic Configuration
```python
import os
import sys

def get_cloud_config():
    """Load cloud configuration from environment variables."""
    provider = os.environ.get("CLOUD_PROVIDER", "").lower()

    if provider not in ("aws", "azure", "gcp"):
        print(f"❌ Unknown CLOUD_PROVIDER: '{provider}'")
        print("   Set CLOUD_PROVIDER to 'aws', 'azure', or 'gcp'")
        sys.exit(1)

    config = {
        "provider": provider,
        "region": os.environ.get("CLOUD_REGION", "us-east-1"),
    }

    print(f"✅ Cloud config loaded: {config['provider']} / {config['region']}")
    return config
```

## 10. Senior Engineer's Perspective
**Junior Engineer:** "I've been using the AWS console to launch servers. Can't I just keep doing that?"
**Senior Engineer:** "The console is fine for learning, but in production, it creates three problems: (1) No audit trail—who launched that server and why? (2) No repeatability—can you recreate the exact same setup if the region goes down? (3) No scalability—you cannot click-create 200 servers. Python automation with proper IAM roles solves all three. Infrastructure must be code."

## 11. Interview Questions
**Beginner:**
Q: What are the three major cloud service models?
A: IaaS (you manage the OS and up), PaaS (you manage only the code), and SaaS (you manage nothing—just use the service).

**Intermediate:**
Q: Why should a DevOps engineer use Python SDKs instead of cloud CLIs in automation scripts?
A: Python SDKs provide structured responses (Python objects/dicts), native error handling with try/except, retry logic, and the ability to integrate with other Python tools. CLI output requires parsing text/JSON strings and is harder to test programmatically.

**Advanced:**
Q: How do you securely authenticate a Python script running inside a CI/CD pipeline to access cloud resources?
A: Use IAM Roles (AWS), Managed Identity (Azure), or Workload Identity (GCP). The pipeline runner assumes a role with minimal permissions. Never pass long-lived access keys as environment variables in CI/CD—use short-lived, auto-rotating credentials.

## 12. Chapter Summary
Cloud computing replaces physical servers with API-driven infrastructure. AWS, Azure, and GCP all provide Python SDKs that let you create, manage, and destroy cloud resources programmatically. The core concepts (VMs, storage, databases) are the same across providers—only the names and API structures differ. Always use IAM roles for authentication, never hardcode credentials, and treat infrastructure as code.

## 13. Quick Revision Notes
- **IaaS** = You manage OS. **PaaS** = You manage code. **SaaS** = You manage nothing.
- AWS SDK = `boto3`, Azure SDK = `azure-*`, GCP SDK = `google-cloud-*`
- Never hardcode cloud credentials — use IAM roles or managed identity
- Cloud APIs return JSON — parsing skills from Module 14 apply directly
- All three providers follow the same pattern: create client → call method → process response


---

# Module 24 — Building Cloud-Neutral Automation

## 1. Chapter Introduction
You have now learned to automate AWS, Azure, and GCP individually. But what if your company uses two or three of them? In this module, we will learn the design pattern of building cloud-neutral automation—a single Python tool that can manage resources across any cloud provider by abstracting the differences behind a common interface.

## 2. What You Will Learn
- The strategy pattern for cloud-neutral design.
- How to build a common interface for multi-cloud operations.
- How to switch between providers using configuration.
- Real-world multi-cloud inventory example.

## 3. DevOps Example: Multi-Cloud VM Lister
```python
import os

def list_vms_aws(region):
    import boto3
    ec2 = boto3.client("ec2", region_name=region)
    response = ec2.describe_instances()
    vms = []
    for res in response["Reservations"]:
        for inst in res["Instances"]:
            vms.append({
                "id": inst["InstanceId"],
                "name": next((t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"), "unnamed"),
                "state": inst["State"]["Name"],
                "provider": "aws"
            })
    return vms

def list_vms_azure(subscription_id):
    from azure.identity import DefaultAzureCredential
    from azure.mgmt.compute import ComputeManagementClient
    credential = DefaultAzureCredential()
    compute = ComputeManagementClient(credential, subscription_id)
    return [{"id": vm.vm_id, "name": vm.name, "state": "running", "provider": "azure"}
            for vm in compute.virtual_machines.list_all()]

def list_vms_gcp(project_id, zone):
    from google.cloud import compute_v1
    client = compute_v1.InstancesClient()
    return [{"id": str(inst.id), "name": inst.name, "state": inst.status.lower(), "provider": "gcp"}
            for inst in client.list(project=project_id, zone=zone)]

# Cloud-neutral dispatcher
PROVIDERS = {"aws": list_vms_aws, "azure": list_vms_azure, "gcp": list_vms_gcp}

def list_all_vms(provider, **kwargs):
    if provider not in PROVIDERS:
        raise ValueError(f"Unsupported provider: {provider}")
    return PROVIDERS[provider](**kwargs)
```

## 4. Production Example: Cloud-Neutral Abstraction Class
```python
from abc import ABC, abstractmethod

class CloudProvider(ABC):
    """Abstract base class for cloud providers."""

    @abstractmethod
    def list_instances(self):
        pass

    @abstractmethod
    def stop_instance(self, instance_id):
        pass

    @abstractmethod
    def get_provider_name(self):
        pass

class AWSProvider(CloudProvider):
    def __init__(self, region="us-east-1"):
        import boto3
        self.ec2 = boto3.client("ec2", region_name=region)

    def list_instances(self):
        # Implementation here
        pass

    def stop_instance(self, instance_id):
        self.ec2.stop_instances(InstanceIds=[instance_id])

    def get_provider_name(self):
        return "AWS"

# Similar classes for AzureProvider and GCPProvider
# Then use a factory pattern to instantiate the correct one
```

## 5. Senior Engineer's Perspective
**Junior Engineer:** "Why not just write separate scripts for each cloud?"
**Senior Engineer:** "Because when management asks 'How many servers are we running across all clouds?', you need a single command that gives a unified answer. Cloud-neutral design also means your team learns one tool instead of three, and switching providers doesn't require rewriting everything."

## 6. Interview Questions
**Advanced:** Q: How would you design a Python tool that manages resources across AWS, Azure, and GCP? A: Use the Strategy pattern with an abstract base class defining the interface (list, start, stop, delete). Each cloud provider implements the interface. A factory function instantiates the correct provider based on configuration. This gives you a unified CLI that works across all clouds.

## 7. Quick Revision Notes
- Use abstract base classes (`ABC`) to define a common interface
- Each cloud provider implements the same methods
- Use a factory or dispatcher pattern to select the provider at runtime
- Configuration drives provider selection, not hardcoded logic
- The goal: one tool, multiple clouds, consistent behavior


---

