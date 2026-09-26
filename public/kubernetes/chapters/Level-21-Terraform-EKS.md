# Level 21 — Terraform for AWS EKS Infrastructure

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate → Advanced |
| **Theory Duration** | 8 hours |
| **Practical Duration** | 10 hours |
| **Prerequisites** | Level 20 — CI/CD Pipelines |
| **Lab Required** | Yes — AWS account + Terraform installed |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Required for Senior DevOps/Platform roles |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) — Industry standard for IaC |
| **Certification Alignment** | HashiCorp Terraform Associate, AWS DevOps Engineer |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain Infrastructure as Code (IaC) principles and why Terraform is used.
2. Write Terraform HCL to provision VPC, subnets, and networking for EKS.
3. Provision an EKS cluster with managed node groups using Terraform.
4. Manage Terraform state with S3 backend and DynamoDB locking.
5. Use Terraform modules for reusable EKS infrastructure.
6. Plan, apply, and destroy infrastructure safely.

---

## 1. Why Infrastructure as Code?

| Manual (ClickOps) | Infrastructure as Code (Terraform) |
| :--- | :--- |
| Click through AWS Console | Write HCL code (declarative) |
| No record of what was done | Full version history in Git |
| Not reproducible | Same code = same infrastructure every time |
| Error-prone (forget a step) | Automated, consistent |
| No review process | PR review for infra changes |
| Hard to replicate across environments | Apply same code to dev/staging/prod |

---

## 2. Terraform Fundamentals

### 2.1 Core Workflow

```
terraform init     → Download providers and modules
terraform plan     → Preview changes (dry run)
terraform apply    → Execute changes
terraform destroy  → Delete all managed resources
```

### 2.2 State Management

```hcl
# backend.tf — Store state in S3 with DynamoDB locking
terraform {
  required_version = ">= 1.5"
  
  backend "s3" {
    bucket         = "my-terraform-state-bucket"
    key            = "eks/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"      # Prevents concurrent modifications
  }
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

---

## 3. VPC for EKS (Terraform)

```hcl
# vpc.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = false           # One NAT per AZ for HA
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Required tags for EKS
  public_subnet_tags = {
    "kubernetes.io/role/elb"                    = 1
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"           = 1
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }

  tags = {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
  }
}
```

---

## 4. EKS Cluster (Terraform)

```hcl
# eks.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Control Plane access
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  # EKS Add-ons
  cluster_addons = {
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni    = { most_recent = true }
    aws-ebs-csi-driver = {
      most_recent              = true
      service_account_role_arn = module.ebs_csi_irsa.iam_role_arn
    }
  }

  # Managed Node Groups
  eks_managed_node_groups = {
    general = {
      instance_types = ["m5.xlarge"]
      min_size       = 2
      max_size       = 10
      desired_size   = 3

      labels = {
        role = "general"
      }

      tags = {
        "k8s.io/cluster-autoscaler/enabled"               = "true"
        "k8s.io/cluster-autoscaler/${var.cluster_name}"    = "owned"
      }
    }

    spot = {
      instance_types = ["m5.large", "m5.xlarge", "m6i.large", "c5.xlarge"]
      capacity_type  = "SPOT"
      min_size       = 0
      max_size       = 10
      desired_size   = 2

      labels = {
        role      = "spot"
        lifecycle = "spot"
      }

      taints = [{
        key    = "lifecycle"
        value  = "spot"
        effect = "NO_SCHEDULE"
      }]
    }
  }

  # Access management
  enable_cluster_creator_admin_permissions = true

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

---

## 5. Variables and Outputs

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "myproject"
}

variable "environment" {
  description = "Environment (dev/staging/production)"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "production-cluster"
}
```

```hcl
# outputs.tf
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}

output "vpc_id" {
  value = module.vpc.vpc_id
}
```

---

## 6. Terraform Project Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf             # Module calls with dev values
│   │   ├── variables.tf
│   │   ├── terraform.tfvars    # Dev-specific values
│   │   └── backend.tf          # Dev state file location
│   ├── staging/
│   │   └── ...
│   └── production/
│       └── ...
│
├── modules/                     # Reusable modules
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── eks/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── addons/
│       ├── main.tf
│       └── variables.tf
│
└── README.md
```

---

## 7. Common Terraform Commands

```bash
# Initialize (download providers, configure backend)
terraform init

# Preview changes
terraform plan -out=plan.tfplan

# Apply changes (with plan file for safety)
terraform apply plan.tfplan

# Apply with auto-approve (CI/CD pipelines only)
terraform apply -auto-approve

# Destroy all resources
terraform destroy

# Show current state
terraform state list
terraform state show module.eks.aws_eks_cluster.this[0]

# Import existing resource into state
terraform import aws_eks_cluster.main production-cluster

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Show outputs
terraform output
```

---

## 8. Interview Questions

### Q1: Why use Terraform instead of eksctl or CloudFormation?

**Expected Answer:**
Terraform is cloud-agnostic (works across AWS, GCP, Azure), has a rich module ecosystem, supports HCL (human-readable declarative language), provides `plan` for previewing changes before applying, manages state to track resource relationships, and supports modular, reusable infrastructure. eksctl is EKS-specific and doesn't manage non-EKS resources. CloudFormation is AWS-only and uses verbose JSON/YAML. Terraform integrates better into CI/CD pipelines and GitOps workflows.

---

### Q2: How do you manage Terraform state safely in a team?

**Expected Answer:**
1. Store state in a remote backend (S3 bucket with versioning and encryption).
2. Use DynamoDB for state locking to prevent concurrent modifications.
3. Never commit state files to Git (contains sensitive data).
4. Use separate state files per environment (dev/staging/prod).
5. Enable state encryption at rest (S3 server-side encryption).
6. Restrict access to the state bucket via IAM policies.

---

## 9. Best Practices

1. **Always run `terraform plan` before `apply`** — review changes.
2. **Use remote state** (S3 + DynamoDB) for team collaboration.
3. **Use modules** for reusable components (VPC, EKS, add-ons).
4. **Pin provider and module versions** to prevent breaking changes.
5. **Separate environments** with different state files.
6. **Use `.tfvars` files** for environment-specific values.
7. **Run Terraform in CI/CD** — PR triggers `plan`, merge triggers `apply`.
8. **Tag all resources** with `ManagedBy = terraform`, `Environment`, `Project`.

---

## 10. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **IaC** | Infrastructure defined in code; version controlled; reproducible |
| **Terraform** | Cloud-agnostic IaC tool with plan → apply workflow |
| **State** | S3 backend + DynamoDB locking for team safety |
| **Modules** | Reusable components (terraform-aws-modules/eks) |
| **EKS via Terraform** | VPC → EKS cluster → Node Groups → Add-ons |
| **Workflow** | PR review → `plan` → approve → `apply` |

---

## 11. Practice Assignment

1. Write Terraform to create a VPC with 3 public and 3 private subnets.
2. Add an EKS cluster module with 2 managed node groups (general + spot).
3. Configure S3 backend with DynamoDB locking.
4. Run `terraform plan` and review the output. Then `apply`.
5. Add the EBS CSI driver add-on with IRSA.
6. Create a separate `dev` environment using the same modules with different variables.
