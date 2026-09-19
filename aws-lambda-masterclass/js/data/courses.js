/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — COURSE REGISTRY
 * Central registry of chapters, lessons, and metadata
 * ============================================================
 * 
 * 100% DATA-DRIVEN — adding a new chapter requires only
 * adding an entry here and creating a data file.
 * 
 * CHAPTER ORDER follows a production-story progression:
 * Build it → Network it → Store it → Secure it → Scale it →
 * DNS it → CDN it → Monitor it → Database it → Serverless it →
 * Containerize it → Automate it → Protect it → Operate it → Extend it
 */
const COURSE_REGISTRY = {
  id: 'aws-production-masterclass',
  title: 'AWS Production Masterclass',
  subtitle: 'From Zero to Production-Ready AWS Architect',
  description: 'Build, deploy, secure, scale, and operate a real AWS production environment — one chapter at a time. 37 chapters. One continuous project.',

  modules: [
    // ─────────────────────────────────────────────────────────
    // STAGE 1 — FOUNDATION: Build the Network & Launch the App
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-04',
      number: '01',
      title: 'Amazon VPC — Build Your Network Foundation',
      description: 'Cloud networking: subnets, route tables, NAT, NACLs vs Security Groups, VPC Endpoints, and peering.',
      productionStory: 'Before launching anything, we need a network. VPC is your private data center in the cloud.',
      icon: '🏗️',
      difficulty: 'beginner',
      duration: '1.5 hours',
      color: '#6366f1',
      colorBg: '#eef2ff',
      href: 'modules/module-04.html',
      dataFile: 'module-04-vpc',
      tags: ['VPC', 'Networking', 'Subnets'],
      lessons: [
        { id: 'vpc-overview', title: 'VPC Fundamentals', sections: [] },
        { id: 'subnets-routing', title: 'Subnets & Routing', sections: [] },
        { id: 'security-endpoints', title: 'Security & Endpoints', sections: [] }
      ]
    },
    {
      id: 'module-03',
      number: '02',
      title: 'Amazon EC2 — Launch Your First Server',
      description: 'Virtual servers: instance types, AMIs, Security Groups, EBS, Auto Scaling, and purchasing options.',
      productionStory: 'The network is ready. Now deploy a web application on a virtual server.',
      icon: '🖥️',
      difficulty: 'beginner',
      duration: '1.5 hours',
      color: '#f97316',
      colorBg: '#fff7ed',
      href: 'modules/module-03.html',
      dataFile: 'module-03-ec2',
      tags: ['EC2', 'Compute', 'Instances'],
      lessons: [
        { id: 'ec2-overview', title: 'EC2 Fundamentals', sections: [] },
        { id: 'instance-types', title: 'Instance Types & Pricing', sections: [] },
        { id: 'security-groups', title: 'Security & Storage', sections: [] }
      ]
    },
    {
      id: 'module-02',
      number: '03',
      title: 'Amazon S3 — Store Files & Static Assets',
      description: 'Object storage: buckets, storage classes, versioning, lifecycle policies, pre-signed URLs, and event notifications.',
      productionStory: 'Where do we store images, CSS, user uploads? S3 is the answer.',
      icon: '🪣',
      difficulty: 'beginner',
      duration: '1.5 hours',
      color: '#22c55e',
      colorBg: '#f0fdf4',
      href: 'modules/module-02.html',
      dataFile: 'module-02-s3',
      tags: ['S3', 'Storage', 'Objects'],
      lessons: [
        { id: 's3-overview', title: 'S3 Fundamentals', sections: [] },
        { id: 'storage-classes', title: 'Storage Classes', sections: [] },
        { id: 's3-security', title: 'Security & Events', sections: [] }
      ]
    },
    {
      id: 'module-01',
      number: '04',
      title: 'AWS IAM — Secure Access & Permissions',
      description: 'Security foundation: Users, Groups, Roles, Policies, MFA, least-privilege, and cross-account access.',
      productionStory: 'Who can access what? Least privilege is the #1 security practice on AWS.',
      icon: '🔐',
      difficulty: 'beginner',
      duration: '1.5 hours',
      color: '#ef4444',
      colorBg: '#fef2f2',
      href: 'modules/module-01.html',
      dataFile: 'module-01-iam',
      tags: ['IAM', 'Security', 'Policies'],
      lessons: [
        { id: 'iam-overview', title: 'IAM Fundamentals', sections: [] },
        { id: 'policies', title: 'Policies & Permissions', sections: [] },
        { id: 'roles', title: 'Roles & Cross-Account', sections: [] }
      ]
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 2 — SCALE & DELIVER: Load Balance, DNS, CDN
    // ──────────────────────────────────────────────────────────
    {
      id: 'module-18',
      number: '05',
      title: 'Elastic Load Balancing — Distribute Traffic',
      description: 'Application traffic routing: ALB vs NLB, target groups, listeners, rules, and health checks.',
      productionStory: 'One server is not enough. Distribute traffic across multiple EC2 instances.',
      icon: '⚖️',
      difficulty: 'intermediate',
      duration: '1.5 hours',
      color: '#10b981',
      colorBg: '#ecfdf5',
      href: 'modules/module-18.html',
      dataFile: 'module-18-elb',
      tags: ['ELB', 'Load Balancing', 'ALB'],
      lessons: [
        { id: 'elb-overview', title: 'ELB Fundamentals', sections: [] },
        { id: 'alb-routing', title: 'ALB Advanced Routing', sections: [] },
        { id: 'target-groups', title: 'Target Groups & Health', sections: [] }
      ]
    },
    {
      id: 'module-07',
      number: '06',
      title: 'Amazon Route 53 — DNS & Domain Names',
      description: 'DNS service: hosted zones, record types, routing policies, health checks, and failover.',
      productionStory: 'Users need a domain name, not an IP address. Route 53 maps names to resources.',
      icon: '🌐',
      difficulty: 'intermediate',
      duration: '1.5 hours',
      color: '#0ea5e9',
      colorBg: '#f0f9ff',
      href: 'modules/module-07.html',
      dataFile: 'module-07-route53',
      tags: ['Route 53', 'DNS', 'Routing'],
      lessons: [
        { id: 'r53-overview', title: 'Route 53 Fundamentals', sections: [] },
        { id: 'routing-policies', title: 'Routing Policies', sections: [] },
        { id: 'health-failover', title: 'Health Checks & Failover', sections: [] }
      ]
    },
    {
      id: 'module-29',
      number: '07',
      title: 'Amazon CloudFront — CDN & Edge Delivery',
      description: 'Global Content Delivery Network, caching, edge locations, OAC, and Lambda@Edge.',
      productionStory: 'Serve content globally from 400+ edge locations with sub-second latency.',
      icon: '🌍',
      difficulty: 'intermediate',
      duration: '75 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-29.html',
      dataFile: 'module-29-cloudfront',
      tags: ['CloudFront', 'CDN', 'Edge'],
      lessons: [
        { id: 'why-cloudfront', title: 'Why CloudFront?', sections: [] },
        { id: 'architecture', title: 'CloudFront Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'cli-commands', title: 'CloudFront CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common CloudFront Issues', sections: [] },
        { id: 'quiz-cloudfront', title: 'Knowledge Check', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 3 — OBSERVE & AUDIT: Know What's Happening
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-05',
      number: '08',
      title: 'Amazon CloudWatch — Monitor Everything',
      description: 'Metrics, alarms, Logs, Logs Insights, dashboards, custom metrics, and EMF.',
      productionStory: 'The app is live. How do we know it is healthy? CloudWatch answers this.',
      icon: '📊',
      difficulty: 'intermediate',
      duration: '1.5 hours',
      color: '#06b6d4',
      colorBg: '#ecfeff',
      href: 'modules/module-05.html',
      dataFile: 'module-05-cloudwatch',
      tags: ['CloudWatch', 'Monitoring', 'Logs'],
      lessons: [
        { id: 'cw-overview', title: 'CloudWatch Fundamentals', sections: [] },
        { id: 'alarms', title: 'Alarms & Notifications', sections: [] },
        { id: 'logs-insights', title: 'Logs & Insights', sections: [] }
      ]
    },
    {
      id: 'module-26',
      number: '09',
      title: 'AWS CloudTrail — Audit API Activity',
      description: 'Track user activity and API usage across your AWS infrastructure.',
      productionStory: 'Who changed what and when? CloudTrail provides the audit trail.',
      icon: '📋',
      difficulty: 'intermediate',
      duration: '70 min',
      color: '#0ea5e9',
      colorBg: '#e0f2fe',
      href: 'modules/module-26.html',
      dataFile: 'module-26-cloudtrail',
      tags: ['CloudTrail', 'Auditing', 'Security'],
      lessons: [
        { id: 'why-cloudtrail', title: 'Why CloudTrail?', sections: [] },
        { id: 'architecture', title: 'CloudTrail Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'cli-commands', title: 'CloudTrail CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common Issues', sections: [] },
        { id: 'quiz-ct', title: 'Knowledge Check', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 4 — DATA: Add Databases
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-06',
      number: '10',
      title: 'Amazon RDS — Relational Databases',
      description: 'Managed databases: Multi-AZ, Read Replicas, Aurora, RDS Proxy, backups, and Lambda integration.',
      productionStory: 'Every real application needs a database. RDS gives you managed MySQL, PostgreSQL, Aurora.',
      icon: '🗃️',
      difficulty: 'intermediate',
      duration: '1.5 hours',
      color: '#a855f7',
      colorBg: '#faf5ff',
      href: 'modules/module-06.html',
      dataFile: 'module-06-rds',
      tags: ['RDS', 'Database', 'Aurora'],
      lessons: [
        { id: 'rds-overview', title: 'RDS Fundamentals', sections: [] },
        { id: 'ha-replicas', title: 'HA & Replicas', sections: [] },
        { id: 'lambda-rds', title: 'Lambda + RDS Proxy', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 5 — HARDEN: Encryption, Secrets, Operations
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-22',
      number: '11',
      title: 'AWS KMS — Encryption & Key Management',
      description: 'Key Management Service, encryption at rest, customer managed keys, envelope encryption.',
      productionStory: 'Encrypt everything — data at rest and in transit. KMS manages your keys.',
      icon: '🔐',
      difficulty: 'intermediate',
      duration: '75 min',
      color: '#f59e0b',
      colorBg: '#fef3c7',
      href: 'modules/module-22.html',
      dataFile: 'module-22-kms',
      tags: ['Security', 'Encryption', 'KMS'],
      lessons: [
        { id: 'why-kms', title: 'Why KMS?', sections: [] },
        { id: 'architecture', title: 'KMS Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'lambda-code', title: 'KMS Boto3 Operations', sections: [] },
        { id: 'cli-commands', title: 'KMS CLI Commands', sections: [] },
        { id: 'terminal-lab', title: 'Interactive Terminal', sections: [] },
        { id: 'troubleshooting', title: 'Common KMS Issues', sections: [] },
        { id: 'quiz-kms', title: 'Knowledge Check', sections: [] },
        { id: 'challenge-kms', title: 'Challenge: Key Auditor', sections: [] }
      ]
    },
    {
      id: 'module-24',
      number: '12',
      title: 'AWS Secrets Manager — Manage Credentials',
      description: 'Securely store and rotate database credentials, API keys, and secrets.',
      productionStory: 'Never hardcode passwords. Secrets Manager stores and rotates them automatically.',
      icon: '🔑',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#f59e0b',
      colorBg: '#fef3c7',
      href: 'modules/module-24.html',
      dataFile: 'module-24-secrets-manager',
      tags: ['Security', 'Secrets', 'Automation'],
      lessons: [
        { id: 'why-secrets', title: 'Why Secrets Manager?', sections: [] },
        { id: 'architecture', title: 'Secrets Manager Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'lambda-code', title: 'Secrets Manager Boto3', sections: [] },
        { id: 'cli-commands', title: 'Secrets Manager CLI', sections: [] },
        { id: 'troubleshooting', title: 'Common Issues', sections: [] },
        { id: 'quiz-secrets', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-23',
      number: '13',
      title: 'AWS STS — Temporary Credentials & Roles',
      description: 'Security Token Service, assuming roles, temporary credentials, cross-account access.',
      productionStory: 'Cross-account access without sharing passwords. Temporary tokens, not permanent keys.',
      icon: '🎫',
      difficulty: 'intermediate',
      duration: '65 min',
      color: '#f59e0b',
      colorBg: '#fef3c7',
      href: 'modules/module-23.html',
      dataFile: 'module-23-sts',
      tags: ['Security', 'Identity', 'STS'],
      lessons: [
        { id: 'why-sts', title: 'Why STS?', sections: [] },
        { id: 'architecture', title: 'Cross-Account AssumeRole', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'lambda-code', title: 'STS Boto3 Operations', sections: [] },
        { id: 'cli-commands', title: 'STS CLI Commands', sections: [] },
        { id: 'terminal-lab', title: 'Interactive Terminal', sections: [] },
        { id: 'troubleshooting', title: 'Common STS Issues', sections: [] },
        { id: 'quiz-sts', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-25',
      number: '14',
      title: 'AWS Systems Manager — Operations Hub',
      description: 'Parameter Store, Session Manager, Run Command — manage servers without SSH.',
      productionStory: 'Manage EC2 instances at scale. No SSH keys. Centralized configuration.',
      icon: '🛠️',
      difficulty: 'intermediate',
      duration: '70 min',
      color: '#0ea5e9',
      colorBg: '#e0f2fe',
      href: 'modules/module-25.html',
      dataFile: 'module-25-ssm',
      tags: ['Operations', 'Management', 'SSM'],
      lessons: [
        { id: 'why-ssm', title: 'Why Systems Manager?', sections: [] },
        { id: 'architecture', title: 'SSM Architecture', sections: [] },
        { id: 'lambda-code', title: 'SSM Boto3 Operations', sections: [] },
        { id: 'cli-commands', title: 'SSM CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common SSM Issues', sections: [] },
        { id: 'quiz-ssm', title: 'Knowledge Check', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 6 — SERVERLESS: Lambda, API Gateway, DynamoDB
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-08',
      number: '15',
      title: 'AWS Lambda — Serverless Compute',
      description: 'Lambda fundamentals, execution lifecycle, handler, event/context objects, cold starts, runtimes, and your first function.',
      productionStory: 'Run code without managing servers. Pay only for what you use.',
      icon: '⚡',
      difficulty: 'beginner',
      duration: '3 hours',
      color: 'var(--color-primary-500)',
      colorBg: 'var(--color-primary-50)',
      href: 'modules/module-08.html',
      dataFile: 'module-08-lambda',
      tags: ['Lambda', 'Serverless', 'Compute'],
      lessons: [
        { id: 'what-is-lambda', title: 'What is AWS Lambda?', sections: ['overview', 'why-matters', 'architecture', 'concepts', 'quiz-fundamentals'] },
        { id: 'execution-lifecycle', title: 'Execution Lifecycle', sections: ['lifecycle-phases', 'cold-warm', 'handler-deep', 'context-event', 'quiz-lifecycle'] },
        { id: 'first-function', title: 'Create Your First Function', sections: ['console-lab', 'code-editor', 'test-invoke', 'inspect-logs', 'quiz-first'] },
        { id: 'runtimes', title: 'Runtimes & Languages', sections: ['runtime-overview', 'multi-lang', 'dependencies', 'quiz-runtimes'] },
        { id: 'configuration', title: 'Configuration Deep Dive', sections: ['memory-cpu', 'timeout', 'env-vars', 'layers', 'quiz-config'] }
      ]
    },
    {
      id: 'module-09',
      number: '16',
      title: 'Amazon API Gateway — Build REST APIs',
      description: 'REST APIs, HTTP APIs, Lambda proxy integration, authorization, throttling, and CORS.',
      productionStory: 'Expose Lambda functions as REST APIs. Handle auth, throttling, CORS.',
      icon: '🌐',
      difficulty: 'intermediate',
      duration: '2.5 hours',
      color: 'var(--color-accent-500)',
      colorBg: 'var(--color-accent-50)',
      href: 'modules/module-09.html',
      dataFile: 'module-09-api-gw',
      tags: ['API Gateway', 'REST', 'HTTP'],
      lessons: [
        { id: 'api-overview', title: 'API Gateway Overview', sections: [] },
        { id: 'rest-api-lab', title: 'Build a REST API', sections: [] },
        { id: 'crud-project', title: 'CRUD API Project', sections: [] }
      ]
    },
    {
      id: 'module-10',
      number: '17',
      title: 'Amazon DynamoDB — NoSQL Database',
      description: 'NoSQL data modeling, CRUD operations, Streams, GSI/LSI, and Lambda integration.',
      productionStory: 'Serverless database for serverless apps. Single-digit millisecond latency at any scale.',
      icon: '🗄️',
      difficulty: 'intermediate',
      duration: '3 hours',
      color: '#3b82f6',
      colorBg: '#eff6ff',
      href: 'modules/module-10.html',
      dataFile: 'module-10-dynamodb',
      tags: ['DynamoDB', 'NoSQL', 'Database'],
      lessons: [
        { id: 'dynamo-overview', title: 'DynamoDB Fundamentals', sections: [] },
        { id: 'data-modeling', title: 'Data Modeling', sections: [] },
        { id: 'lambda-integration', title: 'Lambda + DynamoDB', sections: [] }
      ]
    },
    {
      id: 'module-11',
      number: '18',
      title: 'Amazon Cognito — User Authentication',
      description: 'User authentication, OAuth 2.0, user pools, identity pools, and Lambda triggers.',
      productionStory: 'Users need to sign up and log in. Cognito handles auth so you do not have to.',
      icon: '🔐',
      difficulty: 'intermediate',
      duration: '2 hours',
      color: '#8b5cf6',
      colorBg: '#f5f3ff',
      href: 'modules/module-11.html',
      dataFile: 'module-11-cognito',
      tags: ['Cognito', 'Auth', 'Security'],
      lessons: [
        { id: 'cognito-overview', title: 'Cognito Overview', sections: [] },
        { id: 'user-pools', title: 'User Pools', sections: [] },
        { id: 'lambda-triggers', title: 'Lambda Triggers', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 7 — MESSAGING & EVENTS: Decouple Services
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-12',
      number: '19',
      title: 'Amazon SQS — Message Queues',
      description: 'Message queuing, producer/consumer, visibility timeout, DLQ, and Lambda event source mapping.',
      productionStory: 'Decouple services. Handle async work. Never lose a message.',
      icon: '📨',
      difficulty: 'intermediate',
      duration: '2.5 hours',
      color: '#ec4899',
      colorBg: '#fdf2f8',
      href: 'modules/module-12.html',
      dataFile: 'module-12-sqs',
      tags: ['SQS', 'Queues', 'Messaging'],
      lessons: [
        { id: 'sqs-overview', title: 'SQS Fundamentals', sections: [] },
        { id: 'lambda-sqs', title: 'Lambda + SQS', sections: [] },
        { id: 'failure-scenarios', title: 'Failure Scenarios', sections: [] }
      ]
    },
    {
      id: 'module-13',
      number: '20',
      title: 'Amazon SNS — Notifications & Fan-Out',
      description: 'Pub/sub messaging, fan-out patterns, message filtering, and Lambda subscriptions.',
      productionStory: 'Send notifications. Fan out one event to multiple consumers.',
      icon: '📢',
      difficulty: 'intermediate',
      duration: '2 hours',
      color: '#14b8a6',
      colorBg: '#f0fdfa',
      href: 'modules/module-13.html',
      dataFile: 'module-13-sns',
      tags: ['SNS', 'Pub/Sub', 'Notifications'],
      lessons: [
        { id: 'sns-overview', title: 'SNS Fundamentals', sections: [] },
        { id: 'fanout-pattern', title: 'Fan-Out Pattern', sections: [] },
        { id: 'lambda-sns', title: 'Lambda + SNS', sections: [] }
      ]
    },
    {
      id: 'module-14',
      number: '21',
      title: 'Amazon EventBridge — Event-Driven Architecture',
      description: 'Event-driven architecture, event buses, rules, patterns, scheduler, and Lambda targets.',
      productionStory: 'React to events across AWS services. Build loosely-coupled event-driven systems.',
      icon: '🔔',
      difficulty: 'advanced',
      duration: '2.5 hours',
      color: '#f59e0b',
      colorBg: '#fffbeb',
      href: 'modules/module-14.html',
      dataFile: 'module-14-eventbridge',
      tags: ['EventBridge', 'Events', 'Routing'],
      lessons: [
        { id: 'eb-overview', title: 'EventBridge Fundamentals', sections: [] },
        { id: 'event-patterns', title: 'Event Patterns', sections: [] },
        { id: 'lambda-eventbridge', title: 'Lambda + EventBridge', sections: [] }
      ]
    },
    {
      id: 'module-35',
      number: '22',
      title: 'AWS Step Functions — Workflow Orchestration',
      description: 'Visual workflow service: state machines, ASL, error handling, retries, parallel execution.',
      productionStory: 'Coordinate multi-step serverless workflows. Visual editor. Built-in retries.',
      icon: '🛤️',
      difficulty: 'advanced',
      duration: '60 min',
      color: '#ec4899',
      colorBg: '#fce7f3',
      href: 'modules/module-35.html',
      dataFile: 'module-35-step-functions',
      tags: ['Step Functions', 'Orchestration', 'Serverless'],
      lessons: [
        { id: 'why-step-functions', title: 'Why Step Functions?', sections: [] },
        { id: 'architecture', title: 'Workflow Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'quiz-step-functions', title: 'Knowledge Check', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 8 — CONTAINERS: Build, Store, Run
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-15',
      number: '23',
      title: 'Amazon ECR — Container Registry',
      description: 'Container registry: immutable tags, vulnerability scanning, lifecycle policies, and cross-account access.',
      productionStory: 'Store Docker images securely. Scan for vulnerabilities automatically.',
      icon: '📦',
      difficulty: 'intermediate',
      duration: '1.5 hours',
      color: '#f43f5e',
      colorBg: '#fff1f2',
      href: 'modules/module-15.html',
      dataFile: 'module-15-ecr',
      tags: ['ECR', 'Containers', 'Registry'],
      lessons: [
        { id: 'ecr-overview', title: 'ECR Fundamentals', sections: [] },
        { id: 'scanning', title: 'Image Scanning', sections: [] },
        { id: 'lifecycle', title: 'Lifecycle Policies', sections: [] }
      ]
    },
    {
      id: 'module-16',
      number: '24',
      title: 'Amazon ECS — Container Orchestration',
      description: 'Container orchestration: clusters, task definitions, services, ALB integration, and launch types.',
      productionStory: 'Run containerized applications at scale. Auto-heal. Auto-scale.',
      icon: '🚀',
      difficulty: 'intermediate',
      duration: '1.5 hours',
      color: '#3b82f6',
      colorBg: '#eff6ff',
      href: 'modules/module-16.html',
      dataFile: 'module-16-ecs',
      tags: ['ECS', 'Orchestration', 'Compute'],
      lessons: [
        { id: 'ecs-overview', title: 'ECS Fundamentals', sections: [] },
        { id: 'task-definitions', title: 'Task Definitions', sections: [] },
        { id: 'services', title: 'Services & Load Balancing', sections: [] }
      ]
    },
    {
      id: 'module-17',
      number: '25',
      title: 'AWS Fargate — Serverless Containers',
      description: 'Serverless containers: awsvpc networking, capacity providers, task sizing, and Spot pricing.',
      productionStory: 'Containers without managing servers. Focus on the app, not the infrastructure.',
      icon: '☁️',
      difficulty: 'intermediate',
      duration: '1 hour',
      color: '#8b5cf6',
      colorBg: '#f5f3ff',
      href: 'modules/module-17.html',
      dataFile: 'module-17-fargate',
      tags: ['Fargate', 'Serverless', 'Containers'],
      lessons: [
        { id: 'fargate-overview', title: 'Fargate Fundamentals', sections: [] },
        { id: 'networking', title: 'Fargate Networking', sections: [] },
        { id: 'capacity-providers', title: 'Capacity Providers', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 9 — CI/CD & IaC: Automate Everything
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-19',
      number: '26',
      title: 'AWS CodeBuild — CI Build Automation',
      description: 'Continuous integration: buildspec.yml, environments, artifacts, caching, and ECR integration.',
      productionStory: 'Automate builds. Test on every commit. Build Docker images.',
      icon: '🏗️',
      difficulty: 'intermediate',
      duration: '1 hour',
      color: '#f59e0b',
      colorBg: '#fffbeb',
      href: 'modules/module-19.html',
      dataFile: 'module-19-codebuild',
      tags: ['CodeBuild', 'CI', 'DevOps'],
      lessons: [
        { id: 'codebuild-overview', title: 'CodeBuild Fundamentals', sections: [] },
        { id: 'buildspec', title: 'Mastering buildspec.yml', sections: [] },
        { id: 'ecr-integration', title: 'Building Docker Images', sections: [] }
      ]
    },
    {
      id: 'module-20',
      number: '27',
      title: 'AWS CodePipeline — CD Pipeline',
      description: 'Continuous delivery: stages, actions, artifacts, transitions, manual approvals, and ECS deployments.',
      productionStory: 'Automate deployments end-to-end. From git push to production.',
      icon: '🔄',
      difficulty: 'intermediate',
      duration: '1.5 hours',
      color: '#0ea5e9',
      colorBg: '#f0f9ff',
      href: 'modules/module-20.html',
      dataFile: 'module-20-codepipeline',
      tags: ['CodePipeline', 'CD', 'Pipelines'],
      lessons: [
        { id: 'codepipeline-overview', title: 'CodePipeline Fundamentals', sections: [] },
        { id: 'stages-actions', title: 'Stages & Actions', sections: [] },
        { id: 'ecs-deployment', title: 'Deploying to ECS', sections: [] }
      ]
    },
    {
      id: 'module-21',
      number: '28',
      title: 'AWS CloudFormation — Infrastructure as Code',
      description: 'Infrastructure as Code: templates, stacks, parameters, change sets, drift detection, and SAM.',
      productionStory: 'Define your entire infrastructure in code. Reproducible. Version-controlled.',
      icon: '⚙️',
      difficulty: 'advanced',
      duration: '2 hours',
      color: '#6366f1',
      colorBg: '#eef2ff',
      href: 'modules/module-21.html',
      dataFile: 'module-21-cloudformation',
      tags: ['CloudFormation', 'IaC', 'SAM'],
      lessons: [
        { id: 'cfn-overview', title: 'CloudFormation Fundamentals', sections: [] },
        { id: 'template-anatomy', title: 'Template Anatomy', sections: [] },
        { id: 'stack-management', title: 'Stack Management', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 10 — PROTECT & COMPLY: Security, Compliance, DR
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-27',
      number: '29',
      title: 'AWS Config — Resource Compliance',
      description: 'Assess, audit, and evaluate resource configurations for compliance.',
      productionStory: 'Is every resource configured correctly? Config checks continuously.',
      icon: '📊',
      difficulty: 'intermediate',
      duration: '65 min',
      color: '#0ea5e9',
      colorBg: '#e0f2fe',
      href: 'modules/module-27.html',
      dataFile: 'module-27-config',
      tags: ['Config', 'Compliance', 'Operations'],
      lessons: [
        { id: 'why-config', title: 'Why AWS Config?', sections: [] },
        { id: 'architecture', title: 'Config Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'cli-commands', title: 'Config CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common Issues', sections: [] },
        { id: 'quiz-config', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-28',
      number: '30',
      title: 'AWS Backup — Data Protection & DR',
      description: 'Centralized backup management, vaults, recovery points, Vault Lock, cross-region copy.',
      productionStory: 'Backup everything. Recover from disaster. Meet compliance requirements.',
      icon: '💾',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#0ea5e9',
      colorBg: '#e0f2fe',
      href: 'modules/module-28.html',
      dataFile: 'module-28-backup',
      tags: ['Backup', 'DR', 'Data Protection'],
      lessons: [
        { id: 'why-backup', title: 'Why AWS Backup?', sections: [] },
        { id: 'architecture', title: 'Backup Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'cli-commands', title: 'Backup CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common Issues', sections: [] },
        { id: 'quiz-backup', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-30',
      number: '31',
      title: 'AWS WAF & Shield — Web App Security',
      description: 'Web Application Firewall, DDoS protection, managed rules, rate limiting.',
      productionStory: 'Protect your web application from SQL injection, XSS, and DDoS attacks.',
      icon: '🛡️',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-30.html',
      dataFile: 'module-30-waf-shield',
      tags: ['WAF', 'Shield', 'Security'],
      lessons: [
        { id: 'why-waf', title: 'Why WAF & Shield?', sections: [] },
        { id: 'architecture', title: 'WAF Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'cli-commands', title: 'WAF CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common WAF Issues', sections: [] },
        { id: 'quiz-waf', title: 'Knowledge Check', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 11 — OPTIMIZE: Caching, Search, Private Access
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-32',
      number: '32',
      title: 'AWS PrivateLink — Private Connectivity',
      description: 'Securely access services over the AWS network without the internet.',
      productionStory: 'Access AWS services without exposing traffic to the internet.',
      icon: '🔒',
      difficulty: 'advanced',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-32.html',
      dataFile: 'module-32-privatelink',
      tags: ['PrivateLink', 'Networking', 'Security'],
      lessons: [
        { id: 'why-privatelink', title: 'Why PrivateLink?', sections: [] },
        { id: 'architecture', title: 'PrivateLink Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'troubleshooting', title: 'Common Issues', sections: [] },
        { id: 'quiz-privatelink', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-33',
      number: '33',
      title: 'Amazon ElastiCache — In-Memory Caching',
      description: 'In-memory caching with Redis and Memcached. Sub-millisecond latency.',
      productionStory: 'Speed up the app. Cache hot data. Reduce database load by 90%.',
      icon: '⚡',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-33.html',
      dataFile: 'module-33-elasticache',
      tags: ['ElastiCache', 'Caching', 'Redis'],
      lessons: [
        { id: 'why-elasticache', title: 'Why ElastiCache?', sections: [] },
        { id: 'architecture', title: 'Caching Strategies', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'quiz-elasticache', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-34',
      number: '34',
      title: 'Amazon OpenSearch — Search & Log Analytics',
      description: 'Search, analyze, and visualize data in real-time with dashboards.',
      productionStory: 'Search logs at scale. Analyze patterns. Visualize with dashboards.',
      icon: '🔍',
      difficulty: 'advanced',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-34.html',
      dataFile: 'module-34-opensearch',
      tags: ['OpenSearch', 'Analytics', 'Search'],
      lessons: [
        { id: 'why-opensearch', title: 'Why Amazon OpenSearch?', sections: [] },
        { id: 'architecture', title: 'Log Analytics Pipeline', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'quiz-opensearch', title: 'Knowledge Check', sections: [] }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // STAGE 12 — ENTERPRISE & EMERGING: Governance & AI
    // ─────────────────────────────────────────────────────────
    {
      id: 'module-31',
      number: '35',
      title: 'AWS Organizations — Multi-Account Governance',
      description: 'Centrally manage and govern multiple AWS accounts with SCPs and Control Tower.',
      productionStory: 'Scale from one account to many. Enterprise governance and billing.',
      icon: '🏢',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-31.html',
      dataFile: 'module-31-orgs',
      tags: ['Organizations', 'Governance', 'Management'],
      lessons: [
        { id: 'why-orgs', title: 'Why AWS Organizations?', sections: [] },
        { id: 'architecture', title: 'Organizations Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'troubleshooting', title: 'Common Organization Issues', sections: [] },
        { id: 'quiz-orgs', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-36',
      number: '36',
      title: 'AWS IAM Identity Center — SSO & Workforce',
      description: 'Centralized workforce access management, SSO, permission sets.',
      productionStory: 'One login for all AWS accounts. Single sign-on for your entire team.',
      icon: '👔',
      difficulty: 'intermediate',
      duration: '50 min',
      color: '#ec4899',
      colorBg: '#fce7f3',
      href: 'modules/module-36.html',
      dataFile: 'module-36-identity-center',
      tags: ['Identity Center', 'SSO', 'Security'],
      lessons: [
        { id: 'why-identity-center', title: 'Why Identity Center?', sections: [] },
        { id: 'architecture', title: 'Identity Center Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'quiz-identity-center', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-37',
      number: '37',
      title: 'Amazon Bedrock & GenAI — AI-Powered Apps',
      description: 'Build and scale Generative AI applications with foundation models, RAG, and agents.',
      productionStory: 'Add generative AI to your production app. Claude, Titan, Llama — one API.',
      icon: '🧠',
      difficulty: 'advanced',
      duration: '75 min',
      color: '#ec4899',
      colorBg: '#fce7f3',
      href: 'modules/module-37.html',
      dataFile: 'module-37-bedrock',
      tags: ['Bedrock', 'GenAI', 'Machine Learning'],
      lessons: [
        { id: 'why-bedrock', title: 'Why Amazon Bedrock?', sections: [] },
        { id: 'architecture', title: 'RAG Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'quiz-bedrock', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-38',
      number: '38',
      title: 'AWS Glue & ETL — Serverless Data Integration',
      description: 'Master serverless data integration, ETL pipelines, Data Catalog, and Crawlers.',
      productionStory: 'Transform and move petabytes of data without managing Spark clusters.',
      icon: '🔄',
      difficulty: 'advanced',
      duration: '90 min',
      color: '#059669',
      colorBg: '#ecfdf5',
      href: 'modules/module-38.html',
      dataFile: 'module-38-glue',
      tags: ['Glue', 'ETL', 'Analytics', 'Data'],
      lessons: [
        { id: 'glue-overview', title: 'AWS Glue Architecture', sections: [] },
        { id: 'glue-etl', title: 'ETL Pipelines & Crawlers', sections: [] },
        { id: 'glue-lab', title: 'Hands-on Glue Lab', sections: [] },
        { id: 'quiz-glue', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-39',
      number: '39',
      title: 'Amazon Athena — Serverless Interactive Queries',
      description: 'Query data directly in S3 using standard SQL with zero infrastructure setup.',
      productionStory: 'Analyze terabytes of log data in seconds using standard SQL on S3.',
      icon: '🔍',
      difficulty: 'intermediate',
      duration: '75 min',
      color: '#0284c7',
      colorBg: '#f0f9ff',
      href: 'modules/module-39.html',
      dataFile: 'module-39-athena',
      tags: ['Athena', 'SQL', 'Data Lake', 'Analytics'],
      lessons: [
        { id: 'athena-overview', title: 'Amazon Athena Architecture', sections: [] },
        { id: 'athena-queries', title: 'Partitioning & Performance', sections: [] },
        { id: 'athena-lab', title: 'Hands-on Athena Lab', sections: [] },
        { id: 'quiz-athena', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-40',
      number: '40',
      title: 'Amazon EFS — Elastic File System',
      description: 'Serverless elastic file storage for EC2, ECS, and Lambda shared across AZs.',
      productionStory: 'Shared POSIX file system accessible concurrently from thousands of instances.',
      icon: '📁',
      difficulty: 'intermediate',
      duration: '80 min',
      color: '#d97706',
      colorBg: '#fffbeb',
      href: 'modules/module-40.html',
      dataFile: 'module-40-efs',
      tags: ['EFS', 'Storage', 'NFS', 'POSIX'],
      lessons: [
        { id: 'efs-overview', title: 'EFS Architecture & Storage Classes', sections: [] },
        { id: 'efs-performance', title: 'Throughput & Mount Targets', sections: [] },
        { id: 'efs-lab', title: 'Hands-on EFS Lab', sections: [] },
        { id: 'quiz-efs', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-41',
      number: '41',
      title: 'AWS X-Ray — Distributed Tracing & Observability',
      description: 'Trace requests across microservices, analyze latency bottlenecks, and debug errors.',
      productionStory: 'Visualize microservice call graphs and pinpoint latency spikes in real time.',
      icon: '📉',
      difficulty: 'intermediate',
      duration: '70 min',
      color: '#7c3aed',
      colorBg: '#f5f3ff',
      href: 'modules/module-41.html',
      dataFile: 'module-41-xray',
      tags: ['X-Ray', 'Tracing', 'Observability', 'DevOps'],
      lessons: [
        { id: 'xray-overview', title: 'X-Ray Tracing Architecture', sections: [] },
        { id: 'xray-instrumentation', title: 'Service Map & Sampling', sections: [] },
        { id: 'xray-lab', title: 'Hands-on X-Ray Lab', sections: [] },
        { id: 'quiz-xray', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-42',
      number: '42',
      title: 'AWS CodeDeploy — Deployment Automation',
      description: 'Automate code deployments to EC2, ECS, and AWS Lambda with zero downtime.',
      productionStory: 'Safe zero-downtime deployments with automatic rollbacks on alarm triggers.',
      icon: '🚀',
      difficulty: 'intermediate',
      duration: '85 min',
      color: '#db2777',
      colorBg: '#fdf2f8',
      href: 'modules/module-42.html',
      dataFile: 'module-42-codedeploy',
      tags: ['CodeDeploy', 'CI/CD', 'Deployments', 'DevOps'],
      lessons: [
        { id: 'codedeploy-overview', title: 'Deployment Strategies (Blue/Green, Canary)', sections: [] },
        { id: 'appspec', title: 'AppSpec File & Lifecycle Hooks', sections: [] },
        { id: 'codedeploy-lab', title: 'Hands-on CodeDeploy Lab', sections: [] },
        { id: 'quiz-codedeploy', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-43',
      number: '43',
      title: 'Amazon GuardDuty — Intelligent Threat Detection',
      description: 'Continuous security monitoring using ML to detect compromised accounts and resources.',
      productionStory: 'AI-driven threat detection analyzing CloudTrail, VPC Flow Logs, and DNS logs.',
      icon: '🛡️',
      difficulty: 'intermediate',
      duration: '65 min',
      color: '#dc2626',
      colorBg: '#fef2f2',
      href: 'modules/module-43.html',
      dataFile: 'module-43-guardduty',
      tags: ['GuardDuty', 'Security', 'Threat Detection', 'AI'],
      lessons: [
        { id: 'guardduty-overview', title: 'GuardDuty Threat Architecture', sections: [] },
        { id: 'guardduty-findings', title: 'Findings & Remediation', sections: [] },
        { id: 'guardduty-lab', title: 'Hands-on GuardDuty Lab', sections: [] },
        { id: 'quiz-guardduty', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-44',
      number: '44',
      title: 'Amazon Inspector — Automated Vulnerability Assessment',
      description: 'Automated vulnerability scanning for EC2 instances, ECR container images, and Lambda functions.',
      productionStory: 'Continually scan container images and OS packages for CVE vulnerabilities.',
      icon: '🔍',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#4f46e5',
      colorBg: '#eef2ff',
      href: 'modules/module-44.html',
      dataFile: 'module-44-inspector',
      tags: ['Inspector', 'Vulnerabilities', 'Security', 'CVE'],
      lessons: [
        { id: 'inspector-overview', title: 'Inspector Scanning Architecture', sections: [] },
        { id: 'inspector-findings', title: 'Risk Scores & Remediation', sections: [] },
        { id: 'inspector-lab', title: 'Hands-on Inspector Lab', sections: [] },
        { id: 'quiz-inspector', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-45',
      number: '45',
      title: 'AWS Security Hub — Centralized Security Posture',
      description: 'Centralized security state management and automated compliance checks across accounts.',
      productionStory: 'Single pane of glass for multi-account security compliance standards.',
      icon: '🏛️',
      difficulty: 'advanced',
      duration: '75 min',
      color: '#0891b2',
      colorBg: '#ecfeff',
      href: 'modules/module-45.html',
      dataFile: 'module-45-securityhub',
      tags: ['Security Hub', 'Compliance', 'Security', 'CIS'],
      lessons: [
        { id: 'securityhub-overview', title: 'Security Hub & ASFF Architecture', sections: [] },
        { id: 'securityhub-standards', title: 'Compliance Standards (CIS, PCI-DSS)', sections: [] },
        { id: 'securityhub-lab', title: 'Hands-on Security Hub Lab', sections: [] },
        { id: 'quiz-securityhub', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-46',
      number: '46',
      title: 'AWS Resource Access Manager (RAM) — Resource Sharing',
      description: 'Share AWS resources across AWS accounts or within your AWS Organization securely.',
      productionStory: 'Share Subnets, Transit Gateways, and Route53 rules without duplicate deployment.',
      icon: '🤝',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#65a30d',
      colorBg: '#f7fee7',
      href: 'modules/module-46.html',
      dataFile: 'module-46-ram',
      tags: ['RAM', 'Multi-Account', 'Governance', 'Sharing'],
      lessons: [
        { id: 'ram-overview', title: 'RAM Architecture & Principles', sections: [] },
        { id: 'ram-shares', title: 'Resource Shares & Permissions', sections: [] },
        { id: 'ram-lab', title: 'Hands-on RAM Lab', sections: [] },
        { id: 'quiz-ram', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-47',
      number: '47',
      title: 'AWS Cost Explorer & Budgets — Cost Optimization',
      description: 'Analyze AWS spending, set budget alerts, and enforce cost allocation tags.',
      productionStory: 'Prevent cloud bill surprises with anomaly detection and automated budget actions.',
      icon: '💰',
      difficulty: 'beginner',
      duration: '70 min',
      color: '#16a34a',
      colorBg: '#f0fdf4',
      href: 'modules/module-47.html',
      dataFile: 'module-47-cost',
      tags: ['Cost Explorer', 'Budgets', 'FinOps', 'Billing'],
      lessons: [
        { id: 'cost-overview', title: 'Cost Explorer & Cost Allocation Tags', sections: [] },
        { id: 'budgets', title: 'AWS Budgets & Anomaly Detection', sections: [] },
        { id: 'cost-lab', title: 'Hands-on Cost Optimization Lab', sections: [] },
        { id: 'quiz-cost', title: 'Knowledge Check', sections: [] }
      ]
    }
  ],

  achievements: [
    { id: 'network-engineer', title: 'Network Engineer', description: 'Design production VPC architectures', icon: '🏗️', moduleId: 'module-04' },
    { id: 'ec2-operator', title: 'EC2 Operator', description: 'Launch and manage virtual servers like a pro', icon: '🖥️', moduleId: 'module-03' },
    { id: 's3-architect', title: 'S3 Architect', description: 'Master object storage and lifecycle management', icon: '🪣', moduleId: 'module-02' },
    { id: 'iam-guardian', title: 'IAM Guardian', description: 'Master IAM policies and least-privilege security', icon: '🔐', moduleId: 'module-01' },
    { id: 'load-balancer', title: 'Traffic Cop', description: 'Configure ELB routing and health checks', icon: '⚖️', moduleId: 'module-18' },
    { id: 'dns-expert', title: 'DNS Expert', description: 'Configure DNS routing and failover', icon: '🌐', moduleId: 'module-07' },
    { id: 'cloudfront-master', title: 'CDN Master', description: 'Deliver content globally with CloudFront', icon: '🌍', moduleId: 'module-29' },
    { id: 'observability-pro', title: 'Observability Pro', description: 'Monitor and alert on AWS workloads', icon: '📊', moduleId: 'module-05' },
    { id: 'cloudtrail-master', title: 'Audit Expert', description: 'Track and audit API activity', icon: '📋', moduleId: 'module-26' },
    { id: 'database-admin', title: 'Database Admin', description: 'Deploy HA relational databases', icon: '🗃️', moduleId: 'module-06' },
    { id: 'kms-master', title: 'Encryption Master', description: 'Secure data with KMS', icon: '🔐', moduleId: 'module-22' },
    { id: 'secrets-manager-master', title: 'Secrets Keeper', description: 'Manage credentials securely', icon: '🔑', moduleId: 'module-24' },
    { id: 'sts-master', title: 'Token Expert', description: 'Master temporary credentials', icon: '🎫', moduleId: 'module-23' },
    { id: 'ssm-master', title: 'Ops Master', description: 'Manage servers at scale', icon: '🛠️', moduleId: 'module-25' },
    { id: 'lambda-beginner', title: 'Serverless Developer', description: 'Build your first Lambda function', icon: '⚡', moduleId: 'module-08' },
    { id: 'api-builder', title: 'API Builder', description: 'Build REST APIs with API Gateway', icon: '🌐', moduleId: 'module-09' },
    { id: 'data-architect', title: 'Data Architect', description: 'Master DynamoDB data modeling', icon: '🗄️', moduleId: 'module-10' },
    { id: 'auth-guardian', title: 'Auth Guardian', description: 'Implement authentication with Cognito', icon: '🛡️', moduleId: 'module-11' },
    { id: 'queue-master', title: 'Queue Master', description: 'Master SQS message processing', icon: '📨', moduleId: 'module-12' },
    { id: 'pub-sub-pro', title: 'Pub/Sub Pro', description: 'Implement fan-out with SNS', icon: '📢', moduleId: 'module-13' },
    { id: 'event-driven-engineer', title: 'Event-Driven Engineer', description: 'Build event-driven architectures', icon: '🔔', moduleId: 'module-14' },
    { id: 'step-functions-master', title: 'Workflow Orchestrator', description: 'Coordinate serverless workflows', icon: '🛤️', moduleId: 'module-35' },
    { id: 'container-registry', title: 'Registry Admin', description: 'Manage container images in ECR', icon: '📦', moduleId: 'module-15' },
    { id: 'container-orchestrator', title: 'Orchestrator', description: 'Deploy services on ECS', icon: '🚀', moduleId: 'module-16' },
    { id: 'serverless-containers', title: 'Fargate Master', description: 'Run serverless containers', icon: '☁️', moduleId: 'module-17' },
    { id: 'builder', title: 'Builder', description: 'Automate builds with CodeBuild', icon: '🏗️', moduleId: 'module-19' },
    { id: 'pipeline-pro', title: 'Pipeline Pro', description: 'Automate deployments with CodePipeline', icon: '🔄', moduleId: 'module-20' },
    { id: 'iac-master', title: 'IaC Master', description: 'Model infrastructure with CloudFormation', icon: '⚙️', moduleId: 'module-21' },
    { id: 'config-master', title: 'Compliance Pro', description: 'Enforce resource compliance', icon: '📊', moduleId: 'module-27' },
    { id: 'backup-master', title: 'DR Champion', description: 'Protect data with AWS Backup', icon: '💾', moduleId: 'module-28' },
    { id: 'waf-shield-master', title: 'Security Shield', description: 'Protect against web attacks', icon: '🛡️', moduleId: 'module-30' },
    { id: 'privatelink-master', title: 'PrivateLink Expert', description: 'Secure private connectivity', icon: '🔒', moduleId: 'module-32' },
    { id: 'elasticache-master', title: 'Cache Expert', description: 'Speed up apps with caching', icon: '⚡', moduleId: 'module-33' },
    { id: 'opensearch-master', title: 'Search Expert', description: 'Search and analyze at scale', icon: '🔍', moduleId: 'module-34' },
    { id: 'orgs-master', title: 'Governance Pro', description: 'Manage multi-account governance', icon: '🏢', moduleId: 'module-31' },
    { id: 'identity-center-master', title: 'SSO Master', description: 'Centralize workforce access', icon: '👔', moduleId: 'module-36' },
    { id: 'bedrock-master', title: 'AI Engineer', description: 'Build GenAI applications', icon: '🧠', moduleId: 'module-37' },
    { id: 'glue-master', title: 'Data Engineer', description: 'Build serverless ETL pipelines', icon: '🔄', moduleId: 'module-38' },
    { id: 'athena-master', title: 'SQL Analytics Expert', description: 'Query S3 data lakes with SQL', icon: '🔍', moduleId: 'module-39' },
    { id: 'efs-master', title: 'Shared Storage Master', description: 'Configure multi-AZ EFS storage', icon: '📁', moduleId: 'module-40' },
    { id: 'xray-master', title: 'Tracing Master', description: 'Instrument microservices with X-Ray', icon: '📉', moduleId: 'module-41' },
    { id: 'codedeploy-master', title: 'Deployment Master', description: 'Automate blue/green deployments', icon: '🚀', moduleId: 'module-42' },
    { id: 'guardduty-master', title: 'Threat Hunter', description: 'Detect security threats with ML', icon: '🛡️', moduleId: 'module-43' },
    { id: 'inspector-master', title: 'Vulnerability Auditor', description: 'Scan workloads for CVEs', icon: '🔍', moduleId: 'module-44' },
    { id: 'securityhub-master', title: 'Security Ops Master', description: 'Manage compliance standards', icon: '🏛️', moduleId: 'module-45' },
    { id: 'ram-master', title: 'Resource Sharer', description: 'Share resources across accounts', icon: '🤝', moduleId: 'module-46' },
    { id: 'cost-master', title: 'FinOps Master', description: 'Optimize AWS costs and budgets', icon: '💰', moduleId: 'module-47' },
    { id: 'serverless-architect', title: 'Production Architect', description: 'Complete all 47 chapters', icon: '🏆', moduleId: null },
    { id: 'debugger', title: 'Production Debugger', description: 'Solve 10 troubleshooting scenarios', icon: '🔍', moduleId: null },
    { id: 'quiz-master', title: 'Quiz Master', description: 'Score 90%+ on all quizzes', icon: '🧠', moduleId: null }
  ],

  masteryLevels: [
    { id: 'beginner', label: 'Beginner', minProgress: 0, icon: '🌱' },
    { id: 'intermediate', label: 'Intermediate', minProgress: 30, icon: '📈' },
    { id: 'advanced', label: 'Advanced', minProgress: 60, icon: '🚀' },
    { id: 'production-ready', label: 'Production Ready', minProgress: 85, icon: '🏆' }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = COURSE_REGISTRY;
} else {
  window.COURSE_REGISTRY = COURSE_REGISTRY;
}
