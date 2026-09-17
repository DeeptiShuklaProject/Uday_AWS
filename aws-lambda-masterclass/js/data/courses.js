/**
 * ============================================================
 * AWS LAMBDA MASTERCLASS — COURSE REGISTRY
 * Central registry of modules, lessons, and metadata
 * ============================================================
 * 
 * 100% DATA-DRIVEN — adding a new module requires only
 * adding an entry here and creating a data file.
 */
const COURSE_REGISTRY = {
  id: 'aws-lambda-masterclass',
  title: 'AWS Lambda Masterclass',
  subtitle: 'From Zero to Production-Ready Serverless Architect',
  description: 'Master AWS Lambda through interactive labs, simulated consoles, real-world scenarios, and hands-on challenges.',
  
  modules: [
    {
      id: 'module-01',
      number: '01',
      title: 'AWS IAM — Identity & Access Management',
      description: 'Security foundation: Users, Groups, Roles, Policies, MFA, least-privilege, and cross-account access.',
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
    {
      id: 'module-02',
      number: '02',
      title: 'Amazon S3 — Simple Storage Service',
      description: 'Object storage: buckets, storage classes, versioning, lifecycle policies, pre-signed URLs, and event notifications.',
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
      id: 'module-03',
      number: '03',
      title: 'Amazon EC2 — Elastic Compute Cloud',
      description: 'Virtual servers: instance types, AMIs, Security Groups, EBS, Auto Scaling, and purchasing options.',
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
      id: 'module-04',
      number: '04',
      title: 'Amazon VPC — Virtual Private Cloud',
      description: 'Cloud networking: subnets, route tables, NAT, NACLs vs Security Groups, VPC Endpoints, and peering.',
      icon: '🏗️',
      difficulty: 'intermediate',
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
      id: 'module-05',
      number: '05',
      title: 'Amazon CloudWatch — Monitoring & Observability',
      description: 'Metrics, alarms, Logs, Logs Insights, dashboards, custom metrics, and EMF.',
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
      id: 'module-06',
      number: '06',
      title: 'Amazon RDS — Relational Database Service',
      description: 'Managed databases: Multi-AZ, Read Replicas, Aurora, RDS Proxy, backups, and Lambda integration.',
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
    {
      id: 'module-07',
      number: '07',
      title: 'Amazon Route 53 — DNS & Traffic Management',
      description: 'DNS service: hosted zones, record types, routing policies, health checks, and failover.',
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
      id: 'module-08',
      number: '08',
      title: 'AWS Lambda — Serverless Compute Engine',
      description: 'Lambda fundamentals, execution lifecycle, handler, event/context objects, cold starts, runtimes, and your first function.',
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
      number: '09',
      title: 'Amazon API Gateway',
      description: 'REST APIs, HTTP APIs, Lambda proxy integration, authorization, throttling, and CORS.',
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
      number: '10',
      title: 'Amazon DynamoDB',
      description: 'NoSQL data modeling, CRUD operations, Streams, GSI/LSI, and Lambda integration.',
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
      number: '11',
      title: 'Amazon Cognito',
      description: 'User authentication, OAuth 2.0, user pools, identity pools, and Lambda triggers.',
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
    {
      id: 'module-12',
      number: '12',
      title: 'Amazon SQS',
      description: 'Message queuing, producer/consumer, visibility timeout, DLQ, and Lambda event source mapping.',
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
      number: '13',
      title: 'Amazon SNS',
      description: 'Pub/sub messaging, fan-out patterns, message filtering, and Lambda subscriptions.',
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
      number: '14',
      title: 'Amazon EventBridge',
      description: 'Event-driven architecture, event buses, rules, patterns, scheduler, and Lambda targets.',
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
      id: 'module-15',
      number: '15',
      title: 'Amazon ECR — Elastic Container Registry',
      description: 'Container registry: immutable tags, vulnerability scanning, lifecycle policies, and cross-account access.',
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
      number: '16',
      title: 'Amazon ECS — Elastic Container Service',
      description: 'Container orchestration: clusters, task definitions, services, ALB integration, and launch types.',
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
      number: '17',
      title: 'AWS Fargate',
      description: 'Serverless containers: awsvpc networking, capacity providers, task sizing, and Spot pricing.',
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
    {
      id: 'module-18',
      number: '18',
      title: 'Elastic Load Balancing (ELB)',
      description: 'Application traffic routing: ALB vs NLB, target groups, listeners, rules, and health checks.',
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
      id: 'module-19',
      number: '19',
      title: 'AWS CodeBuild',
      description: 'Continuous integration: buildspec.yml, environments, artifacts, caching, and ECR integration.',
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
      number: '20',
      title: 'AWS CodePipeline',
      description: 'Continuous delivery: stages, actions, artifacts, transitions, manual approvals, and ECS deployments.',
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
      number: '21',
      title: 'AWS CloudFormation',
      description: 'Infrastructure as Code: templates, stacks, parameters, change sets, drift detection, and SAM.',
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
    {
      id: 'module-22',
      number: '22',
      title: 'AWS KMS',
      description: 'Key Management Service, encryption at rest, customer managed keys.',
      icon: '🔐',
      difficulty: 'intermediate',
      duration: '75 min',
      color: '#f59e0b',
      colorBg: '#fef3c7',
      href: 'modules/module-22.html',
      dataFile: 'module-22-kms',
      tags: ['Security', 'Encryption'],
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
      id: 'module-23',
      number: '23',
      title: 'AWS STS',
      description: 'Security Token Service, assuming roles, temporary credentials.',
      icon: '🎫',
      difficulty: 'intermediate',
      duration: '65 min',
      color: '#f59e0b',
      colorBg: '#fef3c7',
      href: 'modules/module-23.html',
      dataFile: 'module-23-sts',
      tags: ['Security', 'Identity'],
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
      id: 'module-24',
      number: '24',
      title: 'AWS Secrets Manager',
      description: 'Securely store and rotate database credentials and API keys.',
      icon: '🔑',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#f59e0b',
      colorBg: '#fef3c7',
      href: 'modules/module-24.html',
      dataFile: 'module-24-secrets-manager',
      tags: ['Security', 'Automation'],
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
      id: 'module-25',
      number: '25',
      title: 'AWS Systems Manager',
      description: 'Parameter Store, Session Manager, and Run Command.',
      icon: '🛠️',
      difficulty: 'intermediate',
      duration: '70 min',
      color: '#0ea5e9',
      colorBg: '#e0f2fe',
      href: 'modules/module-25.html',
      dataFile: 'module-25-ssm',
      tags: ['Operations', 'Management'],
      lessons: [
        { id: 'why-ssm', title: 'Why Systems Manager?', sections: [] },
        { id: 'architecture', title: 'SSM Architecture', sections: [] },
        { id: 'lambda-code', title: 'SSM Boto3 Operations', sections: [] },
        { id: 'cli-commands', title: 'SSM CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common SSM Issues', sections: [] },
        { id: 'quiz-ssm', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-26',
      number: '26',
      title: 'AWS CloudTrail',
      description: 'Track user activity and API usage across your AWS infrastructure.',
      icon: '📋',
      difficulty: 'intermediate',
      duration: '70 min',
      color: '#0ea5e9',
      colorBg: '#e0f2fe',
      href: 'modules/module-26.html',
      dataFile: 'module-26-cloudtrail',
      tags: ['Operations', 'Auditing'],
      lessons: [
        { id: 'why-cloudtrail', title: 'Why CloudTrail?', sections: [] },
        { id: 'architecture', title: 'CloudTrail Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'cli-commands', title: 'CloudTrail CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common Issues', sections: [] },
        { id: 'quiz-ct', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-27',
      number: '27',
      title: 'AWS Config',
      description: 'Assess, audit, and evaluate resource configurations.',
      icon: '📊',
      difficulty: 'intermediate',
      duration: '65 min',
      color: '#0ea5e9',
      colorBg: '#e0f2fe',
      href: 'modules/module-27.html',
      dataFile: 'module-27-config',
      tags: ['Operations', 'Compliance'],
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
      number: '28',
      title: 'AWS Backup',
      description: 'Centralized backup management for AWS resources.',
      icon: '💾',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#0ea5e9',
      colorBg: '#e0f2fe',
      href: 'modules/module-28.html',
      dataFile: 'module-28-backup',
      tags: ['Operations', 'Data Protection'],
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
      id: 'module-29',
      number: '29',
      title: 'Amazon CloudFront',
      description: 'Global Content Delivery Network, caching, edge locations.',
      icon: '🌍',
      difficulty: 'intermediate',
      duration: '75 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-29.html',
      dataFile: 'module-29-cloudfront',
      tags: ['Networking', 'CDN'],
      lessons: [
        { id: 'why-cloudfront', title: 'Why CloudFront?', sections: [] },
        { id: 'architecture', title: 'CloudFront Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'cli-commands', title: 'CloudFront CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common CloudFront Issues', sections: [] },
        { id: 'quiz-cloudfront', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-30',
      number: '30',
      title: 'AWS WAF & Shield',
      description: 'Web Application Firewall and DDoS protection.',
      icon: '🛡️',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-30.html',
      dataFile: 'module-30-waf-shield',
      tags: ['Security', 'Edge'],
      lessons: [
        { id: 'why-waf', title: 'Why WAF & Shield?', sections: [] },
        { id: 'architecture', title: 'WAF Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'cli-commands', title: 'WAF CLI Commands', sections: [] },
        { id: 'troubleshooting', title: 'Common WAF Issues', sections: [] },
        { id: 'quiz-waf', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-31',
      number: '31',
      title: 'AWS Organizations',
      description: 'Centrally manage and govern your AWS environment.',
      icon: '🏢',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-31.html',
      dataFile: 'module-31-orgs',
      tags: ['Management', 'Governance'],
      lessons: [
        { id: 'why-orgs', title: 'Why AWS Organizations?', sections: [] },
        { id: 'architecture', title: 'Organizations Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'troubleshooting', title: 'Common Organization Issues', sections: [] },
        { id: 'quiz-orgs', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-32',
      number: '32',
      title: 'AWS PrivateLink',
      description: 'Securely access services over the AWS network.',
      icon: '🔒',
      difficulty: 'advanced',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-32.html',
      dataFile: 'module-32-privatelink',
      tags: ['Networking', 'Security'],
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
      title: 'Amazon ElastiCache',
      description: 'In-memory caching with Redis and Memcached.',
      icon: '⚡',
      difficulty: 'intermediate',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-33.html',
      dataFile: 'module-33-elasticache',
      tags: ['Database', 'Caching'],
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
      title: 'Amazon OpenSearch',
      description: 'Search, analyze, and visualize data in real-time.',
      icon: '🔍',
      difficulty: 'advanced',
      duration: '60 min',
      color: '#10b981',
      colorBg: '#d1fae5',
      href: 'modules/module-34.html',
      dataFile: 'module-34-opensearch',
      tags: ['Analytics', 'Search'],
      lessons: [
        { id: 'why-opensearch', title: 'Why Amazon OpenSearch?', sections: [] },
        { id: 'architecture', title: 'Log Analytics Pipeline', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'quiz-opensearch', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-35',
      number: '35',
      title: 'AWS Step Functions',
      description: 'Visual workflow service to orchestrate AWS services.',
      icon: '🛤️',
      difficulty: 'advanced',
      duration: '60 min',
      color: '#ec4899',
      colorBg: '#fce7f3',
      href: 'modules/module-35.html',
      dataFile: 'module-35-step-functions',
      tags: ['Serverless', 'Orchestration'],
      lessons: [
        { id: 'why-step-functions', title: 'Why Step Functions?', sections: [] },
        { id: 'architecture', title: 'Workflow Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'quiz-step-functions', title: 'Knowledge Check', sections: [] }
      ]
    },
    {
      id: 'module-36',
      number: '36',
      title: 'AWS IAM Identity Center',
      description: 'Centralized workforce access management.',
      icon: '👔',
      difficulty: 'intermediate',
      duration: '50 min',
      color: '#ec4899',
      colorBg: '#fce7f3',
      href: 'modules/module-36.html',
      dataFile: 'module-36-identity-center',
      tags: ['Security', 'Identity'],
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
      title: 'Amazon Bedrock',
      description: 'Build and scale Generative AI applications with foundational models.',
      icon: '🧠',
      difficulty: 'advanced',
      duration: '75 min',
      color: '#ec4899',
      colorBg: '#fce7f3',
      href: 'modules/module-37.html',
      dataFile: 'module-37-bedrock',
      tags: ['Machine Learning', 'GenAI'],
      lessons: [
        { id: 'why-bedrock', title: 'Why Amazon Bedrock?', sections: [] },
        { id: 'architecture', title: 'RAG Architecture', sections: [] },
        { id: 'concepts', title: 'Core Concepts', sections: [] },
        { id: 'quiz-bedrock', title: 'Knowledge Check', sections: [] }
      ]
    }
  ],

  achievements: [
    { id: 'iam-guardian', title: 'IAM Guardian', description: 'Master IAM policies and least-privilege security', icon: '🔐', moduleId: 'module-01' },
    { id: 's3-architect', title: 'S3 Architect', description: 'Master object storage and lifecycle management', icon: '🪣', moduleId: 'module-02' },
    { id: 'ec2-operator', title: 'EC2 Operator', description: 'Launch and manage virtual servers like a pro', icon: '🖥️', moduleId: 'module-03' },
    { id: 'network-engineer', title: 'Network Engineer', description: 'Design production VPC architectures', icon: '🏗️', moduleId: 'module-04' },
    { id: 'observability-pro', title: 'Observability Pro', description: 'Monitor and alert on AWS workloads', icon: '📊', moduleId: 'module-05' },
    { id: 'database-admin', title: 'Database Admin', description: 'Deploy HA relational databases', icon: '🗃️', moduleId: 'module-06' },
    { id: 'dns-expert', title: 'DNS Expert', description: 'Configure DNS routing and failover', icon: '🌐', moduleId: 'module-07' },
    { id: 'lambda-beginner', title: 'Lambda Beginner', description: 'Complete Module 08 fundamentals', icon: '🌱', moduleId: 'module-08' },
    { id: 'api-builder', title: 'API Builder', description: 'Build your first REST API with API Gateway', icon: '🌐', moduleId: 'module-09' },
    { id: 'data-architect', title: 'Data Architect', description: 'Master DynamoDB data modeling', icon: '🏗️', moduleId: 'module-10' },
    { id: 'auth-guardian', title: 'Auth Guardian', description: 'Implement authentication with Cognito', icon: '🛡️', moduleId: 'module-11' },
    { id: 'queue-master', title: 'Queue Master', description: 'Master SQS message processing', icon: '📬', moduleId: 'module-12' },
    { id: 'pub-sub-pro', title: 'Pub/Sub Pro', description: 'Implement fan-out patterns with SNS', icon: '📡', moduleId: 'module-13' },
    { id: 'event-driven-engineer', title: 'Event-Driven Engineer', description: 'Build event-driven architectures with EventBridge', icon: '⚡', moduleId: 'module-14' },
    { id: 'container-registry', title: 'Registry Admin', description: 'Manage container images in ECR', icon: '📦', moduleId: 'module-15' },
    { id: 'container-orchestrator', title: 'Orchestrator', description: 'Deploy services on ECS', icon: '🚀', moduleId: 'module-16' },
    { id: 'serverless-containers', title: 'Fargate Master', description: 'Run serverless containers on Fargate', icon: '☁️', moduleId: 'module-17' },
    { id: 'load-balancer', title: 'Traffic Cop', description: 'Configure ELB routing and health checks', icon: '⚖️', moduleId: 'module-18' },
    { id: 'builder', title: 'Builder', description: 'Automate container builds with CodeBuild', icon: '🏗️', moduleId: 'module-19' },
    { id: 'pipeline-pro', title: 'Pipeline Pro', description: 'Automate deployments with CodePipeline', icon: '🔄', moduleId: 'module-20' },
    { id: 'iac-master', title: 'IaC Master', description: 'Model infrastructure with CloudFormation', icon: '⚙️', moduleId: 'module-21' },
    { id: 'kms-master', title: 'AWS KMS Master', description: 'Complete AWS KMS', icon: '🏆', moduleId: 'module-22' },
    { id: 'sts-master', title: 'AWS STS Master', description: 'Complete AWS STS', icon: '🏆', moduleId: 'module-23' },
    { id: 'secrets-manager-master', title: 'AWS Secrets Manager Master', description: 'Complete AWS Secrets Manager', icon: '🏆', moduleId: 'module-24' },
    { id: 'ssm-master', title: 'AWS Systems Manager Master', description: 'Complete AWS Systems Manager', icon: '🏆', moduleId: 'module-25' },
    { id: 'cloudtrail-master', title: 'AWS CloudTrail Master', description: 'Complete AWS CloudTrail', icon: '🏆', moduleId: 'module-26' },
    { id: 'config-master', title: 'AWS Config Master', description: 'Complete AWS Config', icon: '🏆', moduleId: 'module-27' },
    { id: 'backup-master', title: 'AWS Backup Master', description: 'Complete AWS Backup', icon: '🏆', moduleId: 'module-28' },
    { id: 'cloudfront-master', title: 'Amazon CloudFront Master', description: 'Complete Amazon CloudFront', icon: '🏆', moduleId: 'module-29' },
    { id: 'waf-shield-master', title: 'AWS WAF & Shield Master', description: 'Complete AWS WAF & Shield', icon: '🏆', moduleId: 'module-30' },
    { id: 'orgs-master', title: 'AWS Organizations Master', description: 'Complete AWS Organizations', icon: '🏆', moduleId: 'module-31' },
    { id: 'privatelink-master', title: 'AWS PrivateLink Master', description: 'Complete AWS PrivateLink', icon: '🏆', moduleId: 'module-32' },
    { id: 'elasticache-master', title: 'Amazon ElastiCache Master', description: 'Complete Amazon ElastiCache', icon: '🏆', moduleId: 'module-33' },
    { id: 'opensearch-master', title: 'Amazon OpenSearch Master', description: 'Complete Amazon OpenSearch', icon: '🏆', moduleId: 'module-34' },
    { id: 'step-functions-master', title: 'AWS Step Functions Master', description: 'Complete AWS Step Functions', icon: '🏆', moduleId: 'module-35' },
    { id: 'identity-center-master', title: 'AWS IAM Identity Center Master', description: 'Complete AWS IAM Identity Center', icon: '🏆', moduleId: 'module-36' },
    { id: 'bedrock-master', title: 'Amazon Bedrock Master', description: 'Complete Amazon Bedrock', icon: '🏆', moduleId: 'module-37' },
    { id: 'serverless-architect', title: 'Serverless Architect', description: 'Complete all modules', icon: '🏆', moduleId: null },
    { id: 'debugger', title: 'Serverless Debugger', description: 'Solve 10 troubleshooting scenarios', icon: '🔍', moduleId: null },
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
