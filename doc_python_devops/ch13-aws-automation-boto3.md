<!-- TODO: Rewrite and humanize content from 06-cloud-automation\aws\module-21-python-aws.md -->

# Module 21 — Python + AWS (Boto3)

## 1. Chapter Introduction
AWS is the largest cloud provider in the world, and Boto3 is its official Python SDK. In this module, we will learn how to use Boto3 to programmatically manage AWS resources—listing EC2 instances, managing S3 buckets, and building automation that replaces hours of console clicking with a single Python script.

## 2. What You Will Learn
- How to install and configure Boto3.
- How to list, start, and stop EC2 instances.
- How to upload and download files from S3.
- How to use AWS IAM roles for secure authentication.
- How Boto3 clients and resources differ.

## 3. Why This Topic Matters in DevOps
If your organization runs on AWS, you will write Boto3 scripts weekly. Cost optimization scripts that find unused resources, compliance scripts that audit security groups, deployment scripts that update ECS services—Boto3 is the foundation of AWS DevOps automation.

## 4. Basic Example: Listing EC2 Instances
```python
import boto3

# Create an EC2 client
ec2 = boto3.client("ec2", region_name="us-east-1")

# Describe all instances
response = ec2.describe_instances()

for reservation in response["Reservations"]:
    for instance in reservation["Instances"]:
        instance_id = instance["InstanceId"]
        state = instance["State"]["Name"]
        instance_type = instance["InstanceType"]
        print(f"{instance_id} | {instance_type} | {state}")
```

## 5. DevOps Example: S3 File Operations
```python
import boto3

s3 = boto3.client("s3")

# Upload a backup file
s3.upload_file("backup.tar.gz", "my-backups-bucket", "daily/backup.tar.gz")
print("✅ Backup uploaded to S3")

# List objects in a bucket
response = s3.list_objects_v2(Bucket="my-backups-bucket", Prefix="daily/")
for obj in response.get("Contents", []):
    print(f"  {obj['Key']} — {obj['Size']} bytes")
```

## 6. Production Example: Stop Non-Production Instances at Night
```python
import boto3
import sys

def stop_non_prod_instances(region="us-east-1"):
    """Stop all EC2 instances tagged with Environment=development."""
    ec2 = boto3.client("ec2", region_name=region)

    # Find running instances tagged as non-production
    response = ec2.describe_instances(Filters=[
        {"Name": "tag:Environment", "Values": ["development", "staging"]},
        {"Name": "instance-state-name", "Values": ["running"]}
    ])

    instance_ids = []
    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:
            instance_ids.append(instance["InstanceId"])

    if not instance_ids:
        print("ℹ️ No non-production instances running.")
        return

    # Stop the instances
    ec2.stop_instances(InstanceIds=instance_ids)
    print(f"✅ Stopped {len(instance_ids)} instances: {instance_ids}")

stop_non_prod_instances()
```

## 7. Common Mistakes
- **Hardcoding `aws_access_key_id`:** Never put keys in code. Use `~/.aws/credentials`, environment variables, or IAM roles.
- **Forgetting pagination:** `describe_instances()` returns only the first page. For large fleets, use paginators.
- **Wrong region:** Boto3 defaults to `us-east-1`. Always specify the region explicitly.

## 8. Senior Engineer's Perspective
**Junior Engineer:** "My script stops all development servers. Done!"
**Senior Engineer:** "What if someone tagged a production server as 'development' by accident? Add a dry-run mode that lists what would be stopped before actually stopping anything. Always validate before acting on infrastructure."

## 9. Interview Questions
**Beginner:** Q: What is Boto3? A: Boto3 is the official AWS SDK for Python, used to create, configure, and manage AWS services programmatically.

**Advanced:** Q: You need to process 10,000 S3 objects. `list_objects_v2` only returns 1,000 at a time. How do you handle this? A: Use Boto3 paginators: `paginator = s3.get_paginator('list_objects_v2')` and iterate through each page.

## 10. Quick Revision Notes
- Install: `pip install boto3`
- Client (low-level): `boto3.client("ec2")`
- Resource (high-level): `boto3.resource("s3")`
- Auth order: env vars → `~/.aws/credentials` → IAM role
- Always specify `region_name` explicitly
- Use paginators for large result sets


---

