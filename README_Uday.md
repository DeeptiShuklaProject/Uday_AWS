# 📚 AWS Lambda Masterclass — Uday's AWS Services Notes

A comprehensive, interactive, 37-module AWS services course built as a static web application. No dependencies required — just a simple HTTP server.

---

## 🚀 Quick Start

### Option 1: Using `npx` (Recommended — Zero Install)

```bash
cd C:\Users\nishu\workspace\wscs_bedrock\Uday_AWS_Services_notes
npx -y http-server ./aws-lambda-masterclass -p 5500 -o
```

Then open: **http://localhost:5500**

### Option 2: Using Python (If Python is installed)

```bash
cd C:\Users\nishu\workspace\wscs_bedrock\Uday_AWS_Services_notes\aws-lambda-masterclass
python -m http.server 5500
```

Then open: **http://localhost:5500**

### Option 3: Using VS Code Live Server

1. Open the `aws-lambda-masterclass` folder in VS Code
2. Install the **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**

### Option 4: Direct File (Limited)

> ⚠️ Some features (module loading, fetch) may not work with `file://` protocol. Use an HTTP server for full functionality.

Double-click `aws-lambda-masterclass/index.html` to open directly in a browser.

---

## 📁 Project Structure

```
Uday_AWS_Services_notes/
├── aws-lambda-masterclass/          ← The web application
│   ├── index.html                   ← Course home page (entry point)
│   ├── css/
│   │   ├── design-system.css        ← Design tokens & variables
│   │   ├── components.css           ← UI component styles
│   │   ├── layout.css               ← Page layout styles
│   │   └── animations.css           ← Animations & transitions
│   ├── js/
│   │   ├── app.js                   ← Main application logic
│   │   ├── data/
│   │   │   ├── courses.js           ← Course registry (all 37 modules)
│   │   │   ├── module-01-iam.js     ← Module 01 data (AWS IAM)
│   │   │   ├── module-02-s3.js      ← Module 02 data (Amazon S3)
│   │   │   ├── ...                  ← (modules 03–36)
│   │   │   └── module-37-bedrock.js ← Module 37 data (Amazon Bedrock)
│   │   └── engine/
│   │       ├── lesson-engine.js     ← Renders module sections
│   │       ├── quiz-engine.js       ← Interactive quizzes
│   │       ├── code-editor-engine.js← Code editor with syntax highlighting
│   │       ├── terminal-engine.js   ← Simulated CLI terminal
│   │       ├── diagram-engine.js    ← Architecture diagrams
│   │       ├── challenge-engine.js  ← Coding challenges
│   │       ├── command-block.js     ← CLI command blocks
│   │       ├── progress-engine.js   ← Progress tracking
│   │       ├── console-simulator.js ← AWS Console simulator
│   │       └── lab-engine.js        ← Lab exercises
│   └── modules/
│       ├── module-01.html           ← Module 01 page (AWS IAM)
│       ├── module-02.html           ← Module 02 page (Amazon S3)
│       ├── ...                      ← (modules 03–36)
│       └── module-37.html           ← Module 37 page (Amazon Bedrock)
│
├── Phase_01_Core_AWS/               ← Source markdown notes
├── Phase_02_Modern_Application.../  ← Source markdown notes
├── Phase_03_Containers_and_DevOps/  ← Source markdown notes
├── Phase_04_Security_and_Operations/← Source markdown notes
├── Phase_05_Architect_Level/        ← Source markdown notes
├── Phase_06_Additional_and_.../     ← Source markdown notes
├── README_Uday.md                   ← This file
└── *.pdf                            ← AWS documentation PDFs
```

---

## 📋 Course Modules (37 Total)

### Phase 1 — Core AWS (Modules 1–7)
| # | Service | Topics |
|---|---------|--------|
| 01 | AWS IAM | Users, Roles, Policies, MFA, Access Keys |
| 02 | Amazon S3 | Buckets, Objects, Versioning, Lifecycle, Encryption |
| 03 | Amazon EC2 | Instances, AMIs, Security Groups, Key Pairs |
| 04 | Amazon VPC | Subnets, Route Tables, NAT, Internet Gateway |
| 05 | Amazon CloudWatch | Metrics, Alarms, Logs, Dashboards |
| 06 | Amazon RDS | MySQL, PostgreSQL, Multi-AZ, Read Replicas |
| 07 | Amazon Route 53 | DNS, Hosted Zones, Routing Policies |

### Phase 2 — Modern Application Development (Modules 8–15)
| # | Service | Topics |
|---|---------|--------|
| 08 | AWS Lambda | Functions, Layers, Event Sources, Cold Starts |
| 09 | Amazon API Gateway | REST/HTTP APIs, Lambda Proxy, Auth, Throttling |
| 10 | Amazon DynamoDB | Tables, GSI/LSI, Streams, DAX Caching |
| 11 | Amazon Cognito | User Pools, Identity Pools, JWT, OAuth 2.0 |
| 12 | Amazon SQS | Standard/FIFO, Dead-Letter Queues, Visibility |
| 13 | Amazon SNS | Topics, Subscriptions, Fan-out, Filtering |
| 14 | Amazon EventBridge | Event Buses, Rules, Patterns, Scheduling |
| 15 | Amazon ECR | Container Registries, Image Scanning, Lifecycle |

### Phase 3 — Containers & DevOps (Modules 16–21)
| # | Service | Topics |
|---|---------|--------|
| 16 | Amazon ECS | Task Definitions, Services, Clusters |
| 17 | AWS Fargate | Serverless Containers, Networking |
| 18 | Elastic Load Balancing | ALB, NLB, Target Groups, Health Checks |
| 19 | AWS CodeBuild | buildspec.yml, Docker Builds, CI/CD |
| 20 | AWS CodePipeline | Pipeline Stages, Manual Approvals |
| 21 | AWS CloudFormation | IaC, Templates, Change Sets, Drift Detection |

### Phase 4 — Security & Operations (Modules 22–28)
| # | Service | Topics |
|---|---------|--------|
| 22 | AWS KMS | CMKs, Envelope Encryption, Key Rotation |
| 23 | AWS STS | AssumeRole, Temporary Credentials, Federation |
| 24 | AWS Secrets Manager | Secret Rotation, Lambda Integration |
| 25 | AWS SSM | Parameter Store, Session Manager, Run Command |
| 26 | AWS CloudTrail | Trails, Event Types, Log Validation, Forensics |
| 27 | AWS Config | Config Rules, Conformance Packs, Remediation |
| 28 | AWS Backup | Backup Plans, Vaults, Vault Lock, Cross-Region |

### Phase 5 — Architect Level (Modules 29–34)
| # | Service | Topics |
|---|---------|--------|
| 29 | Amazon CloudFront | CDN, OAC, Cache Behaviors, Lambda@Edge |
| 30 | AWS WAF & Shield | Web ACLs, Managed Rules, DDoS Protection |
| 31 | AWS Organizations | OUs, SCPs, Control Tower, Landing Zones |
| 32 | AWS PrivateLink | Gateway/Interface Endpoints, Private DNS |
| 33 | Amazon ElastiCache | Redis, Memcached, Caching Strategies |
| 34 | Amazon OpenSearch | Full-Text Search, Dashboards, Log Analytics |

### Phase 6 — Additional & Emerging (Modules 35–37)
| # | Service | Topics |
|---|---------|--------|
| 35 | AWS Step Functions | State Machines, ASL, Error Handling |
| 36 | AWS IAM Identity Center | SSO, Permission Sets, Identity Sources |
| 37 | Amazon Bedrock & GenAI | Foundation Models, RAG, Agents, Guardrails |

---

## 🎯 Each Module Includes

- **Why This Service?** — Comparison table + key warnings
- **Architecture Diagram** — Interactive visual of service flow
- **Core Concepts** — Tables, code blocks, and explanations
- **Boto3 Python Code** — Real code with line-by-line explanations
- **AWS CLI Commands** — Commands with expected output
- **Simulated Terminal** — Practice CLI commands interactively
- **Troubleshooting** — Common errors with root cause + fix
- **Quiz** — Certification-style multiple choice questions
- **Coding Challenge** — Starter code with hints and requirements
- **Quick Reference Sidebar** — Key facts at a glance

---

## ⚙️ Technical Details

- **No dependencies** — Pure HTML, CSS, JavaScript (no npm, no build step)
- **No backend** — Everything runs in the browser
- **Data-driven** — All content is in JS data files, not hardcoded in HTML
- **Responsive** — Works on desktop, tablet, and mobile
- **Offline-capable** — Once loaded, works without internet

---

## 🛑 Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

---

## 🔗 Links

- **Course Home:** http://localhost:5500
- **Module 01 (IAM):** http://localhost:5500/modules/module-01.html
- **Module 37 (Bedrock):** http://localhost:5500/modules/module-37.html
