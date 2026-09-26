<!-- TODO: Rewrite and humanize content from 09-terraform-ansible\module-30-python-terraform.md, 09-terraform-ansible\module-31-python-ansible.md -->

# Module 30 — Python + Terraform

## 1. Chapter Introduction
Terraform is the industry-standard tool for Infrastructure as Code. It uses HCL (HashiCorp Configuration Language) to define infrastructure declaratively. While Terraform itself is not written in Python, a DevOps engineer needs Python to automate *around* Terraform—parsing state files, generating dynamic configurations, validating plans, and integrating Terraform into larger automation workflows.

## 2. What You Will Learn
- How Terraform works at a conceptual level.
- How to parse Terraform state files with Python.
- How to generate Terraform configurations dynamically.
- How to run Terraform commands from Python using `subprocess`.
- How to use the `python-terraform` wrapper library.

## 3. DevOps Example: Running Terraform from Python
```python
import subprocess
import sys
import json

def terraform_plan(working_dir):
    """Run terraform plan and capture the output."""
    result = subprocess.run(
        ["terraform", "plan", "-json", "-no-color"],
        cwd=working_dir, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"❌ Terraform plan failed:\n{result.stderr}")
        sys.exit(1)

    print("✅ Terraform plan succeeded")
    return result.stdout

def terraform_apply(working_dir, auto_approve=False):
    """Run terraform apply."""
    cmd = ["terraform", "apply", "-json", "-no-color"]
    if auto_approve:
        cmd.append("-auto-approve")

    result = subprocess.run(cmd, cwd=working_dir, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Terraform apply failed:\n{result.stderr}")
        sys.exit(1)

    print("✅ Terraform apply succeeded")
```

## 4. Production Example: Parse Terraform State
```python
import json

def get_resources_from_state(state_file):
    """Extract resource inventory from Terraform state."""
    with open(state_file) as f:
        state = json.load(f)

    resources = []
    for resource in state.get("resources", []):
        for instance in resource.get("instances", []):
            resources.append({
                "type": resource["type"],
                "name": resource["name"],
                "provider": resource["provider"],
                "attributes": instance.get("attributes", {})
            })

    return resources
```

## 5. Senior Engineer's Perspective
**Junior Engineer:** "Why not just use Python to create cloud resources directly with Boto3?"
**Senior Engineer:** "Boto3 creates resources imperatively—you tell it *how* to create each thing. Terraform is declarative—you describe *what* you want, and Terraform figures out the steps. Terraform also tracks state, handles dependencies, and can destroy everything cleanly. Python's role is to automate around Terraform, not replace it."

## 6. Quick Revision Notes
- Terraform uses HCL for infrastructure definitions, not Python
- Python automates *around* Terraform: plan validation, state parsing, dynamic config generation
- Use `subprocess.run(["terraform", "plan"])` to run Terraform from Python
- Terraform state is a JSON file — parse it with `json.load()`
- Never modify Terraform state manually — use `terraform import` or `terraform state mv`
- `python-terraform` library wraps Terraform CLI for convenience


---

# Module 31 — Python + Ansible

## 1. Chapter Introduction
Ansible is a powerful configuration management tool written entirely in Python. It uses YAML playbooks to define the desired state of servers—installing packages, configuring services, deploying applications. In this module, we will learn how Python and Ansible work together, how to run Ansible programmatically, and how to write custom Ansible modules in Python.

## 2. What You Will Learn
- How Ansible works and its architecture (control node, managed nodes, inventory, playbooks).
- How to run Ansible playbooks from Python.
- How to use Ansible's Python API.
- How to write a custom Ansible module in Python.
- Dynamic inventory scripts with Python.

## 3. DevOps Example: Running Ansible from Python
```python
import subprocess
import sys

def run_playbook(playbook_path, inventory_path, extra_vars=None):
    """Run an Ansible playbook from Python."""
    cmd = ["ansible-playbook", playbook_path, "-i", inventory_path]

    if extra_vars:
        for key, value in extra_vars.items():
            cmd.extend(["-e", f"{key}={value}"])

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ Playbook failed:\n{result.stderr}")
        sys.exit(1)

    print(f"✅ Playbook completed:\n{result.stdout}")

run_playbook("deploy.yml", "inventory/production", {"version": "2.5.1"})
```

## 4. Production Example: Dynamic Inventory Script
```python
#!/usr/bin/env python3
"""dynamic_inventory.py — Generate Ansible inventory from a cloud API."""
import json
import boto3

def get_inventory():
    ec2 = boto3.client("ec2", region_name="us-east-1")
    response = ec2.describe_instances(
        Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
    )

    inventory = {"web_servers": {"hosts": []}, "db_servers": {"hosts": []}}

    for res in response["Reservations"]:
        for inst in res["Instances"]:
            ip = inst.get("PrivateIpAddress", "")
            tags = {t["Key"]: t["Value"] for t in inst.get("Tags", [])}
            role = tags.get("Role", "unknown")

            if role == "web":
                inventory["web_servers"]["hosts"].append(ip)
            elif role == "db":
                inventory["db_servers"]["hosts"].append(ip)

    return inventory

if __name__ == "__main__":
    print(json.dumps(get_inventory(), indent=2))
```

## 5. Quick Revision Notes
- Ansible is written in Python — deep integration is natural
- Run playbooks: `subprocess.run(["ansible-playbook", ...])`
- Dynamic inventory: Python script that outputs JSON with host groups
- Custom modules: Python scripts placed in `library/` directory
- Ansible uses YAML for playbooks, Jinja2 for templates — both parseable by Python
- Idempotency is Ansible's core principle — running a playbook twice should produce the same result


---

