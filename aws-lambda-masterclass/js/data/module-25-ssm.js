/**
 * ============================================================
 * MODULE 25 — AWS Systems Manager (SSM)
 * Parameter Store, Session Manager, Run Command
 * ============================================================
 */
const MODULE_25_DATA = {
  id: 'ssm-fundamentals',
  moduleId: 'module-25',
  title: 'AWS Systems Manager (SSM)',
  description: 'Operational hub for AWS. Covers Parameter Store (config management), Session Manager (SSH-less access), Run Command, Patch Manager, and Inventory.',
  difficulty: 'intermediate',
  duration: '70 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 03: Amazon EC2'],
  objectives: [
    'Store and retrieve config values with Parameter Store',
    'Access EC2 instances securely with Session Manager (no SSH keys)',
    'Run commands across fleets with Run Command',
    'Understand SSM Agent and managed instances',
    'Organize parameters with hierarchical paths'
  ],

  sections: [
    {
      id: 'why-ssm',
      type: 'why',
      title: 'Why Systems Manager?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🛠️</span>
            <div class="alert-content">
              <div class="alert-title">The Operations Swiss Army Knife</div>
              <div class="alert-text">SSM is a massive service with 15+ capabilities. The three most important are: <strong>Parameter Store</strong> (config management), <strong>Session Manager</strong> (replace SSH/bastion hosts), and <strong>Run Command</strong> (remote command execution across fleets).</div>
            </div>
          </div>
          <h4>SSM Parameter Store Tiers</h4>
          <table>
            <thead><tr><th>Feature</th><th>Standard</th><th>Advanced</th></tr></thead>
            <tbody>
              <tr><td><strong>Max Parameters</strong></td><td>10,000</td><td>100,000</td></tr>
              <tr><td><strong>Max Value Size</strong></td><td>4 KB</td><td>8 KB</td></tr>
              <tr><td><strong>Parameter Policies</strong></td><td>No</td><td>Yes (expiration, notifications)</td></tr>
              <tr><td><strong>Cost</strong></td><td>Free</td><td>$0.05/parameter/month</td></tr>
              <tr><td><strong>Throughput</strong></td><td>40 TPS (default)</td><td>1,000 TPS (higher quota)</td></tr>
            </tbody>
          </table>
          <h4>Parameter Types</h4>
          <ul>
            <li><strong>String</strong>: Plain text (e.g., <code>/app/config/region</code> → <code>us-east-1</code>)</li>
            <li><strong>StringList</strong>: Comma-separated values (e.g., <code>us-east-1,us-west-2,eu-west-1</code>)</li>
            <li><strong>SecureString</strong>: Encrypted with KMS. For passwords, keys, tokens that don't need rotation.</li>
          </ul>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'SSM Architecture',
      content: {
        title: 'Systems Manager — Unified Operations',
        width: 750,
        height: 280,
        nodes: [
          { id: 'lambda', label: 'Lambda / App', icon: '⚡', x: 10, y: 60, type: 'client', description: 'Applications retrieve configuration from Parameter Store at runtime. Cache values to reduce API calls.' },
          { id: 'params', label: 'Parameter Store', icon: '📋', x: 220, y: 60, type: 'storage', description: 'Hierarchical key-value store. /prod/app/db-host, /prod/app/db-port. SecureString encrypted with KMS.', eventPayload: { Name: '/prod/app/db-host', Type: 'SecureString', Value: 'prod-db.example.com' } },
          { id: 'admin', label: 'Admin / DevOps', icon: '👨‍💻', x: 10, y: 200, type: 'client', description: 'Admin connects to EC2 using Session Manager — no SSH keys, no bastion host, no open port 22.' },
          { id: 'session', label: 'Session Manager', icon: '🖥️', x: 220, y: 200, type: 'compute', description: 'Browser-based or CLI shell access to EC2 instances. All sessions logged to CloudWatch or S3. Requires SSM Agent.' },
          { id: 'agent', label: 'SSM Agent (EC2)', icon: '🤖', x: 430, y: 130, type: 'compute', description: 'Pre-installed on Amazon Linux 2, Windows. The agent communicates with SSM via HTTPS (outbound 443). Instance needs AmazonSSMManagedInstanceCore IAM role.' },
          { id: 'run', label: 'Run Command', icon: '⚡', x: 640, y: 60, type: 'compute', description: 'Execute shell scripts across thousands of instances. Rate-controlled with error thresholds. Results logged.' },
          { id: 'patch', label: 'Patch Manager', icon: '🔧', x: 640, y: 200, type: 'security', description: 'Automated OS and application patching with maintenance windows, baselines, and compliance reporting.' }
        ],
        edges: [
          { from: 'lambda', to: 'params', label: 'GetParameter', animated: true },
          { from: 'admin', to: 'session', label: 'Start session' },
          { from: 'session', to: 'agent', label: 'Connect' },
          { from: 'agent', to: 'run', label: 'Execute' },
          { from: 'agent', to: 'patch', label: 'Apply patches' }
        ]
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'SSM Boto3 Operations',
      content: {
        title: 'Parameter Store Operations',
        languages: [
          {
            id: 'python-ssm',
            label: 'Parameter Store CRUD',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ssm = boto3.client('ssm')

def put_parameter(name, value, param_type='String', overwrite=True):
    """Store a configuration parameter."""
    ssm.put_parameter(
        Name=name,
        Value=value,
        Type=param_type,         # String | StringList | SecureString
        Overwrite=overwrite,
        Tags=[{'Key': 'Environment', 'Value': 'production'}]
    )
    logger.info("Parameter stored: %s (Type: %s)", name, param_type)


def get_parameter(name, decrypt=True):
    """Retrieve a single parameter."""
    response = ssm.get_parameter(
        Name=name,
        WithDecryption=decrypt  # Required for SecureString
    )
    value = response['Parameter']['Value']
    logger.info("Retrieved %s = %s", name, value[:20] + '...' if len(value) > 20 else value)
    return value


def get_parameters_by_path(path_prefix):
    """Retrieve all parameters under a path hierarchy."""
    paginator = ssm.get_paginator('get_parameters_by_path')
    params = {}
    for page in paginator.paginate(
        Path=path_prefix,
        Recursive=True,
        WithDecryption=True
    ):
        for p in page['Parameters']:
            params[p['Name']] = p['Value']
    logger.info("Retrieved %d parameters under %s", len(params), path_prefix)
    return params


# Example: Store app configuration hierarchy
# put_parameter('/prod/app/db-host', 'prod-db.example.com')
# put_parameter('/prod/app/db-port', '5432')
# put_parameter('/prod/app/db-password', 'SuperSecret!', 'SecureString')
# config = get_parameters_by_path('/prod/app/')`,
            explanations: [
              { line: '12-18', text: 'put_parameter stores config. Use hierarchical paths (/env/app/key) for organization. Type "SecureString" encrypts with KMS. Tags cannot be updated with Overwrite — use AddTagsToResource separately.' },
              { line: '24-28', text: 'get_parameter retrieves a single value. WithDecryption=True is required for SecureString types. For String types, it has no effect but is safe to always include.' },
              { line: '34-43', text: 'get_parameters_by_path fetches ALL parameters under a path prefix. Critical for loading all config at startup: get_parameters_by_path("/prod/my-app/"). Recursive=True includes nested paths.' }
            ]
          }
        ],
        defaultLang: 'python-ssm',
        expectedOutput: 'Parameter stored: /prod/app/db-host (Type: String)\nRetrieved /prod/app/db-host = prod-db.example...\nRetrieved 3 parameters under /prod/app/'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'SSM CLI Commands',
      content: [
        {
          command: 'aws ssm put-parameter --name "/prod/app/api-key" --value "sk-live-abc123" --type SecureString --overwrite',
          category: 'aws-cli',
          expectedOutput: '{\n  "Version": 2,\n  "Tier": "Standard"\n}',
          explanation: 'Stores an encrypted parameter. Version increments on each update. Use --key-id to specify a custom KMS key (default: aws/ssm).'
        },
        {
          command: 'aws ssm start-session --target i-0123456789abcdef0',
          category: 'aws-cli',
          expectedOutput: 'Starting session with SessionId: user-0a1b2c3d4e5f67890\nsh-4.2$',
          explanation: 'Opens a shell on EC2 without SSH. Requires: (1) SSM Agent on instance, (2) instance role with AmazonSSMManagedInstanceCore, (3) user IAM permission for ssm:StartSession. All keystrokes logged.',
          interviewQ: 'How does Session Manager provide access to EC2 instances without opening port 22?'
        }
      ]
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common SSM Issues',
      content: {
        items: [
          { title: 'EC2 instance not showing in Session Manager', error: 'Instance i-0123456789abcdef0 is not connected', cause: 'SSM Agent is not installed, not running, or the instance cannot reach the SSM service endpoint (no internet gateway or VPC endpoint).', fix: '(1) Verify SSM Agent: sudo systemctl status amazon-ssm-agent. (2) Check instance role has AmazonSSMManagedInstanceCore. (3) Ensure outbound HTTPS (443) to ssm.region.amazonaws.com (or create VPC endpoints: ssm, ssmmessages, ec2messages).' },
          { title: 'ParameterNotFound when using path', error: 'ParameterNotFound: /prod/app/db-host', cause: 'Parameter name is case-sensitive and path must match exactly. Also check the region — parameters are regional.', fix: 'Verify the exact parameter name: aws ssm describe-parameters --filters Key=Name,Values=/prod/app. Check you are in the correct region.' },
          { title: 'ThrottlingException on GetParameter', error: 'ThrottlingException: Rate exceeded for GetParameter', cause: 'Standard tier allows 40 TPS by default. Lambda functions with high concurrency can easily exceed this.', fix: 'Use the SSM Parameter Store caching extension for Lambda (layer). Or fetch all parameters at once with get_parameters_by_path and cache them. Request quota increase if needed.' }
        ]
      }
    },

        {
      id: 'terminal-generic',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'AWS Systems Manager (SSM) CLI Lab',
        mode: 'simulated',
        initialText: 'AWS Systems Manager (SSM) CLI Lab. Try exploring the AWS CLI commands for this service.',
        commands: {
          'aws help': {
            text: 'See AWS CLI documentation for AWS Systems Manager (SSM) commands.',
            type: 'output'
          }
        }
      }
    },
{
      id: 'quiz-ssm',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'SSM Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your security team wants to eliminate SSH key management and bastion hosts. Which SSM feature replaces traditional SSH?',
            options: [
              { id: 'a', text: 'Parameter Store' },
              { id: 'b', text: 'Session Manager' },
              { id: 'c', text: 'Run Command' },
              { id: 'd', text: 'Patch Manager' }
            ],
            correctId: 'b',
            explanation: 'Session Manager provides secure, auditable shell access to EC2 instances without SSH keys, bastion hosts, or open inbound ports. All sessions are logged to CloudWatch/S3. It uses the SSM Agent (outbound HTTPS) so no inbound ports need to be open.',
            difficulty: 'beginner'
          },
          {
            id: 'q2',
            question: 'You need to store 50 configuration parameters for your application. Some are database passwords. What is the most cost-effective approach?',
            options: [
              { id: 'a', text: 'Store all in Secrets Manager' },
              { id: 'b', text: 'Store passwords as SecureString in Parameter Store (Standard), configs as String' },
              { id: 'c', text: 'Store all in environment variables' },
              { id: 'd', text: 'Store all in S3' }
            ],
            correctId: 'b',
            explanation: 'Parameter Store Standard tier is free for up to 10,000 parameters. Use SecureString (encrypted with KMS) for passwords and String for non-sensitive config. Secrets Manager costs $0.40/secret/month — use it only when you need automatic rotation.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

        {
      id: 'challenge-generic',
      type: 'challenge',
      title: 'Challenge: AWS Systems Manager (SSM) Security Pipeline',
      content: {
        title: 'Build a AWS Systems Manager (SSM) Security Gate',
        description: 'Write a Lambda function that interacts with AWS Systems Manager (SSM) and validates its security configuration.',
        difficulty: 'intermediate',
        requirements: [
          'Accept input related to AWS Systems Manager (SSM)',
          'Call the appropriate boto3 method',
          'Validate the configuration',
          'Return PASS/FAIL status'
        ],
        starterCode: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

client = boto3.client('sts') # Change this to the correct service

def lambda_handler(event, context):
    # TODO: Implement validation
    pass`,
        language: 'python',
        hints: [
          'Check the boto3 documentation for AWS Systems Manager (SSM)',
          'Ensure IAM permissions are correct'
        ],
        testCases: [
          { description: 'Validates configuration', keywords: ['boto3'], expectedOutput: 'PASS' }
        ]
      }
    },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 13: AWS STS', url: 'module-23.html' }, next: { title: 'Chapter 15: AWS Lambda', url: 'module-08.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_25_DATA; } else { window.MODULE_25_DATA = MODULE_25_DATA; }
