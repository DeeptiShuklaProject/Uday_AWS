<!-- TODO: Rewrite and humanize content from 06-cloud-automation\azure\module-22-python-azure.md, 06-cloud-automation\gcp\module-23-python-gcp.md -->

# Module 22 — Python + Microsoft Azure

## 1. Chapter Introduction
Microsoft Azure is the second-largest cloud provider and dominates in enterprises already using Microsoft technologies. Azure's Python SDK follows a modular design—each service has its own package. In this module, we will learn how to authenticate with Azure, list virtual machines, manage storage, and build automation using the Azure SDK for Python.

## 2. What You Will Learn
- How Azure authentication works (Azure Identity library).
- How to list and manage Azure Virtual Machines.
- How to work with Azure Blob Storage.
- How to use Azure Resource Groups for organization.

## 3. Why This Topic Matters in DevOps
Many enterprises run hybrid environments with both Azure and AWS. A DevOps engineer who only knows Boto3 is limited to half the infrastructure. Azure's Python SDK lets you automate VM lifecycle, manage storage, query costs, and integrate with Azure DevOps pipelines.

## 4. Basic Example: Listing Azure Virtual Machines
```python
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient

# Authenticate using default credentials (env vars, managed identity, or CLI)
credential = DefaultAzureCredential()
subscription_id = "your-subscription-id"

# Create compute client
compute_client = ComputeManagementClient(credential, subscription_id)

# List all VMs across all resource groups
for vm in compute_client.virtual_machines.list_all():
    print(f"{vm.name} | {vm.location} | {vm.hardware_profile.vm_size}")
```

## 5. DevOps Example: Azure Blob Storage Operations
```python
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient

credential = DefaultAzureCredential()
blob_service = BlobServiceClient(
    account_url="https://mystorageaccount.blob.core.windows.net",
    credential=credential
)

# Upload a file
container_client = blob_service.get_container_client("backups")
with open("backup.tar.gz", "rb") as data:
    container_client.upload_blob("daily/backup.tar.gz", data, overwrite=True)
    print("✅ Backup uploaded to Azure Blob Storage")

# List blobs
for blob in container_client.list_blobs(name_starts_with="daily/"):
    print(f"  {blob.name} — {blob.size} bytes")
```

## 6. Production Example: Stop Dev VMs with Tagging
```python
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.resource import ResourceManagementClient

def stop_dev_vms(subscription_id, resource_group):
    """Stop all VMs tagged with environment=development."""
    credential = DefaultAzureCredential()
    compute = ComputeManagementClient(credential, subscription_id)

    for vm in compute.virtual_machines.list(resource_group):
        tags = vm.tags or {}
        if tags.get("environment") == "development":
            print(f"⏹️ Stopping {vm.name}...")
            compute.virtual_machines.begin_deallocate(resource_group, vm.name)
            print(f"✅ {vm.name} stop initiated")
```

## 7. Common Mistakes
- **Forgetting `DefaultAzureCredential` fallback chain:** It checks environment variables → managed identity → Azure CLI in order. Ensure at least one is configured.
- **Not installing the right packages:** Azure SDK is modular: `azure-identity`, `azure-mgmt-compute`, `azure-storage-blob` are separate pip packages.

## 8. Interview Questions
**Beginner:** Q: How does Azure authentication differ from AWS? A: Azure uses `DefaultAzureCredential` which supports multiple auth methods (managed identity, env vars, CLI). AWS uses a credentials chain with `~/.aws/credentials` and IAM roles.

**Advanced:** Q: Compare Azure Resource Groups to AWS concepts. A: Azure Resource Groups have no direct AWS equivalent. They provide logical grouping and lifecycle management—deleting a resource group deletes everything inside it. In AWS, you'd use tags and separate accounts for similar organization.

## 9. Quick Revision Notes
- Install: `pip install azure-identity azure-mgmt-compute azure-storage-blob`
- Auth: `DefaultAzureCredential()` — works locally and in production
- VMs: `ComputeManagementClient` → `virtual_machines.list_all()`
- Blob Storage: `BlobServiceClient` → `get_container_client()`
- Azure SDK is modular — each service is a separate pip package


---

# Module 23 — Python + Google Cloud Platform

## 1. Chapter Introduction
Google Cloud Platform (GCP) is the third major cloud provider, known for its strength in data analytics, Kubernetes (which Google created), and machine learning. GCP's Python libraries follow Google's own API design patterns. In this module, we will learn how to authenticate with GCP, manage Compute Engine instances, and work with Cloud Storage.

## 2. What You Will Learn
- How GCP authentication works (Service Accounts and Application Default Credentials).
- How to list and manage Compute Engine instances.
- How to upload and download files from Cloud Storage.
- GCP-specific patterns and terminology.

## 3. Basic Example: Listing Compute Engine Instances
```python
from google.cloud import compute_v1

def list_instances(project_id, zone):
    """List all Compute Engine instances in a zone."""
    client = compute_v1.InstancesClient()
    instances = client.list(project=project_id, zone=zone)

    for instance in instances:
        print(f"{instance.name} | {instance.machine_type.split('/')[-1]} | {instance.status}")

# list_instances("my-project-id", "us-central1-a")
```

## 4. DevOps Example: Cloud Storage Operations
```python
from google.cloud import storage

def upload_backup(bucket_name, source_file, destination_blob):
    """Upload a file to Google Cloud Storage."""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(destination_blob)
    blob.upload_from_filename(source_file)
    print(f"✅ Uploaded {source_file} to gs://{bucket_name}/{destination_blob}")

def list_backups(bucket_name, prefix="daily/"):
    """List all backup files in a GCS bucket."""
    client = storage.Client()
    blobs = client.list_blobs(bucket_name, prefix=prefix)
    for blob in blobs:
        print(f"  {blob.name} — {blob.size} bytes")
```

## 5. Production Example: Stop Dev Instances
```python
from google.cloud import compute_v1

def stop_dev_instances(project_id, zone):
    """Stop Compute Engine instances labeled with env=development."""
    client = compute_v1.InstancesClient()

    for instance in client.list(project=project_id, zone=zone):
        labels = instance.labels or {}
        if labels.get("env") == "development" and instance.status == "RUNNING":
            print(f"⏹️ Stopping {instance.name}...")
            client.stop(project=project_id, zone=zone, instance=instance.name)
            print(f"✅ {instance.name} stop initiated")
```

## 6. Common Mistakes
- **Forgetting to set `GOOGLE_APPLICATION_CREDENTIALS`:** Point this env var to your service account JSON key file for local development.
- **Zone vs Region confusion:** GCP resources like VMs are zone-specific (`us-central1-a`), not just region-specific.
- **Project ID vs Project Number:** API calls require the project ID (string), not the project number.

## 7. Interview Questions
**Beginner:** Q: How does GCP authentication work for Python scripts? A: GCP uses Application Default Credentials (ADC). Locally, set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key file. On GCE/GKE, the attached service account is used automatically.

**Advanced:** Q: Compare GCP's resource hierarchy to AWS. A: GCP uses Organization → Folder → Project → Resources. AWS uses Organization → Account → Resources. GCP Projects are roughly equivalent to AWS Accounts as the billing/IAM boundary.

## 8. Quick Revision Notes
- Install: `pip install google-cloud-compute google-cloud-storage`
- Auth: Set `GOOGLE_APPLICATION_CREDENTIALS` env var or use ADC
- Compute: `compute_v1.InstancesClient()` → `list(project, zone)`
- Storage: `storage.Client()` → `bucket()` → `blob()`
- GCP uses labels (not tags) for resource metadata
- Resources are zone-scoped, region-scoped, or global


---

