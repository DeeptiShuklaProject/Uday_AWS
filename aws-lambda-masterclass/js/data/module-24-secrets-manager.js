/**
 * ============================================================
 * MODULE 24 — AWS Secrets Manager
 * Secret storage, rotation, cross-account sharing
 * ============================================================
 */
const MODULE_24_DATA = {
  id: 'secrets-manager-fundamentals',
  moduleId: 'module-24',
  title: 'AWS Secrets Manager',
  description: 'Securely store and automatically rotate database credentials, API keys, and tokens. Covers secret versioning, rotation Lambda functions, and cross-account sharing.',
  difficulty: 'intermediate',
  duration: '60 min',
  prerequisites: ['Module 22: AWS KMS', 'Module 01: AWS IAM'],
  objectives: [
    'Store and retrieve secrets programmatically',
    'Configure automatic rotation with Lambda functions',
    'Understand secret versioning (AWSCURRENT, AWSPREVIOUS)',
    'Share secrets across accounts using resource policies',
    'Integrate Secrets Manager with RDS and Lambda'
  ],

  sections: [
    {
      id: 'why-secrets',
      type: 'why',
      title: 'Why Secrets Manager?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔑</span>
            <div class="alert-content">
              <div class="alert-title">Stop Hardcoding Credentials</div>
              <div class="alert-text">Secrets Manager replaces hardcoded credentials in your code with an API call to retrieve the secret programmatically. It encrypts secrets at rest using KMS, audits access via CloudTrail, and can automatically rotate RDS, Redshift, and DocumentDB credentials.</div>
            </div>
          </div>
          <h4>Secrets Manager vs SSM Parameter Store</h4>
          <table>
            <thead><tr><th>Feature</th><th>Secrets Manager</th><th>SSM Parameter Store</th></tr></thead>
            <tbody>
              <tr><td><strong>Auto Rotation</strong></td><td>Built-in (Lambda-based)</td><td>No built-in rotation</td></tr>
              <tr><td><strong>Cross-Account</strong></td><td>Resource-based policies</td><td>No cross-account sharing</td></tr>
              <tr><td><strong>Cost</strong></td><td>$0.40/secret/month + $0.05/10K API calls</td><td>Free (Standard) / $0.05/advanced param/month</td></tr>
              <tr><td><strong>Max Size</strong></td><td>64 KB</td><td>8 KB (Standard) / 8 KB (Advanced)</td></tr>
              <tr><td><strong>Best For</strong></td><td>DB creds, API keys that need rotation</td><td>Config values, feature flags, non-rotating secrets</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Cache Secrets — Don't Call the API on Every Request</div>
              <div class="alert-text">Each GetSecretValue call costs money and adds latency. Use the AWS Secrets Manager Caching Library (Python, Java, .NET) to cache secrets in memory with configurable TTL. Lambda functions should cache secrets outside the handler.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Secrets Manager Architecture',
      content: {
        title: 'Automatic Secret Rotation Flow',
        width: 750,
        height: 260,
        nodes: [
          { id: 'app', label: 'Lambda / App', icon: '💻', x: 10, y: 120, type: 'client', description: 'Application calls GetSecretValue to retrieve the current DB password. Uses caching library to minimize API calls.' },
          { id: 'sm', label: 'Secrets Manager', icon: '🔑', x: 220, y: 120, type: 'security', description: 'Stores encrypted secrets. Manages versioning: AWSCURRENT (active), AWSPENDING (during rotation), AWSPREVIOUS (last version).', eventPayload: { SecretId: 'prod/db/credentials', VersionStage: 'AWSCURRENT' } },
          { id: 'kms', label: 'KMS', icon: '🔐', x: 220, y: 20, type: 'security', description: 'Encrypts the secret at rest using a CMK. Decryption requires both Secrets Manager permission AND KMS decrypt permission.' },
          { id: 'rotation', label: 'Rotation Lambda', icon: '🔄', x: 430, y: 50, type: 'compute', description: 'Triggered by Secrets Manager on schedule (e.g., every 30 days). Steps: createSecret → setSecret → testSecret → finishSecret.' },
          { id: 'rds', label: 'RDS Database', icon: '🗃️', x: 640, y: 120, type: 'storage', description: 'Database whose password is being rotated. Rotation Lambda connects to RDS, changes the password, and updates the secret.' },
          { id: 'trail', label: 'CloudTrail', icon: '📋', x: 430, y: 220, type: 'trigger', description: 'Logs every GetSecretValue, PutSecretValue, and RotateSecret call. Critical for auditing who accessed which secrets.' }
        ],
        edges: [
          { from: 'app', to: 'sm', label: 'GetSecretValue', animated: true },
          { from: 'sm', to: 'kms', label: 'Decrypt' },
          { from: 'sm', to: 'rotation', label: 'Trigger rotation' },
          { from: 'rotation', to: 'rds', label: 'Change password', animated: true },
          { from: 'rotation', to: 'sm', label: 'Update secret' },
          { from: 'sm', to: 'trail', label: 'Audit log' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Secret Versioning</h4>
          <ul>
            <li><strong>AWSCURRENT</strong>: The active version used by applications</li>
            <li><strong>AWSPENDING</strong>: The new version being created during rotation</li>
            <li><strong>AWSPREVIOUS</strong>: The last successfully rotated version (rollback safety)</li>
          </ul>

          <h4>2. Rotation Steps (4-Step Lambda)</h4>
          <ol>
            <li><strong>createSecret</strong>: Generate new credentials and store as AWSPENDING</li>
            <li><strong>setSecret</strong>: Set the new credentials on the target service (e.g., ALTER USER in RDS)</li>
            <li><strong>testSecret</strong>: Verify the AWSPENDING credentials work (connect to DB)</li>
            <li><strong>finishSecret</strong>: Move AWSPENDING → AWSCURRENT and AWSCURRENT → AWSPREVIOUS</li>
          </ol>

          <h4>3. Caching</h4>
          <p>Use <code>aws-secretsmanager-caching</code> library. In Lambda, initialize the cache OUTSIDE the handler so it persists across warm invocations.</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">from aws_secretsmanager_caching import SecretCache
cache = SecretCache()  # Outside handler = cached across invocations
def handler(event, context):
    secret = cache.get_secret_string('prod/db/credentials')</pre>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'Secrets Manager Boto3',
      content: {
        title: 'Store and Retrieve Secrets',
        languages: [
          {
            id: 'python-secrets',
            label: 'Secret Operations',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sm = boto3.client('secretsmanager')

def create_db_secret(secret_name, db_host, db_user, db_password, db_name):
    """Store database credentials as a secret."""
    secret_value = json.dumps({
        'host': db_host,
        'username': db_user,
        'password': db_password,
        'dbname': db_name,
        'port': 5432,
        'engine': 'postgres'
    })
    response = sm.create_secret(
        Name=secret_name,
        Description='Production database credentials',
        SecretString=secret_value,
        Tags=[
            {'Key': 'Environment', 'Value': 'production'},
            {'Key': 'RotationEnabled', 'Value': 'true'}
        ]
    )
    logger.info("Secret created: %s (ARN: %s)", secret_name, response['ARN'])
    return response['ARN']


def get_db_credentials(secret_name):
    """Retrieve database credentials from Secrets Manager."""
    response = sm.get_secret_value(SecretId=secret_name)
    secret = json.loads(response['SecretString'])
    logger.info("Retrieved credentials for: %s@%s/%s",
                secret['username'], secret['host'], secret['dbname'])
    return secret


def enable_rotation(secret_name, rotation_lambda_arn, rotation_days=30):
    """Enable automatic rotation for the secret."""
    sm.rotate_secret(
        SecretId=secret_name,
        RotationLambdaARN=rotation_lambda_arn,
        RotationRules={'AutomaticallyAfterDays': rotation_days}
    )
    logger.info("Rotation enabled for %s (every %d days)", secret_name, rotation_days)`,
            explanations: [
              { line: '12-19', text: 'Store secrets as JSON strings. Follow the standard schema (host, username, password, port, engine) so rotation Lambda functions can work generically.' },
              { line: '21-29', text: 'create_secret stores the value encrypted with the default aws/secretsmanager KMS key. Use KmsKeyId parameter to specify a CMK for cross-account decryption.' },
              { line: '36-37', text: 'get_secret_value returns the decrypted secret. In production, use the caching library instead to avoid API calls on every invocation.' },
              { line: '44-48', text: 'rotate_secret triggers the rotation Lambda immediately AND sets up the schedule. The Lambda must implement the 4-step rotation protocol.' }
            ]
          }
        ],
        defaultLang: 'python-secrets',
        expectedOutput: 'Secret created: prod/db/credentials (ARN: arn:aws:secretsmanager:...)\nRetrieved credentials for: admin@prod-db.example.com/myapp\nRotation enabled for prod/db/credentials (every 30 days)'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'Secrets Manager CLI',
      content: [
        {
          command: 'aws secretsmanager create-secret --name prod/api-key --secret-string \'{"api_key":"sk-live-abc123","api_url":"https://api.example.com"}\'',
          category: 'aws-cli',
          expectedOutput: '{\n  "ARN": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/api-key-AbCdEf",\n  "Name": "prod/api-key"\n}',
          explanation: 'Creates a new secret. The random suffix (-AbCdEf) in the ARN prevents name collisions after deletion (secrets remain for 7-30 days after deletion).'
        },
        {
          command: 'aws secretsmanager get-secret-value --secret-id prod/api-key --query SecretString --output text | python -m json.tool',
          category: 'aws-cli',
          expectedOutput: '{\n  "api_key": "sk-live-abc123",\n  "api_url": "https://api.example.com"\n}',
          explanation: 'Retrieves and pretty-prints the current secret value. Every call is logged in CloudTrail. Use --version-stage AWSPREVIOUS to get the last rotated version.',
          interviewQ: 'How do you retrieve the previous version of a rotated secret?'
        }
      ]
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common Issues',
      content: {
        items: [
          { title: 'Rotation fails with "unable to connect to database"', error: 'Rotation Lambda: Unable to connect to PostgreSQL on host prod-db.example.com:5432', cause: 'The rotation Lambda function runs in a VPC but cannot reach the RDS instance. Missing security group rules or no route to the database subnet.', fix: 'Ensure the rotation Lambda is in the SAME VPC as RDS. Add a security group rule allowing the Lambda SG to connect to the RDS SG on port 5432. Also add a VPC endpoint for Secrets Manager (so Lambda can call back to SM).' },
          { title: 'Application gets old password after rotation', error: 'Authentication failed for user "admin"', cause: 'Application is caching the old password. Or the rotation Lambda succeeded on setSecret but the application did not refresh.', fix: 'Use the Secrets Manager Caching Library with a TTL shorter than your rotation interval. Or add a retry-with-AWSPREVIOUS fallback in your connection logic.' },
          { title: 'AccessDeniedException on GetSecretValue', error: 'AccessDeniedException: Not authorized to perform secretsmanager:GetSecretValue', cause: 'Missing IAM permission OR the secret is encrypted with a CMK and the caller lacks kms:Decrypt permission on that key.', fix: 'Grant both: secretsmanager:GetSecretValue on the secret ARN AND kms:Decrypt on the KMS key ARN used to encrypt the secret.' }
        ]
      }
    },

        {
      id: 'terminal-generic',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'AWS Secrets Manager CLI Lab',
        mode: 'simulated',
        initialText: 'AWS Secrets Manager CLI Lab. Try exploring the AWS CLI commands for this service.',
        commands: {
          'aws help': {
            text: 'See AWS CLI documentation for AWS Secrets Manager commands.',
            type: 'output'
          }
        }
      }
    },
{
      id: 'quiz-secrets',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Secrets Manager Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your RDS database password is stored in Secrets Manager with automatic rotation every 30 days. After rotation, your application fails to connect. What is the most likely cause?',
            options: [
              { id: 'a', text: 'The rotation deleted the old secret' },
              { id: 'b', text: 'The application cached the old password and is not refreshing it' },
              { id: 'c', text: 'RDS does not support Secrets Manager rotation' },
              { id: 'd', text: 'The KMS key expired' }
            ],
            correctId: 'b',
            explanation: 'The most common rotation failure: the application caches credentials and does not refresh after rotation. Solution: use the Secrets Manager Caching Library with a TTL (e.g., 1 hour). Also implement retry logic that falls back to AWSPREVIOUS version on auth failure.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'When should you use Secrets Manager instead of SSM Parameter Store SecureString?',
            options: [
              { id: 'a', text: 'When you need automatic credential rotation' },
              { id: 'b', text: 'When you want to store feature flags' },
              { id: 'c', text: 'When the value is less than 4 KB' },
              { id: 'd', text: 'When you need free storage' }
            ],
            correctId: 'a',
            explanation: 'Secrets Manager is designed for secrets that need automatic rotation (DB passwords, API keys). SSM Parameter Store is better for configuration values, feature flags, and non-rotating secrets. The key differentiator is the built-in rotation Lambda framework.',
            difficulty: 'beginner'
          }
        ]
      }
    },

        {
      id: 'challenge-generic',
      type: 'challenge',
      title: 'Challenge: AWS Secrets Manager Security Pipeline',
      content: {
        title: 'Build a AWS Secrets Manager Security Gate',
        description: 'Write a Lambda function that interacts with AWS Secrets Manager and validates its security configuration.',
        difficulty: 'intermediate',
        requirements: [
          'Accept input related to AWS Secrets Manager',
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
          'Check the boto3 documentation for AWS Secrets Manager',
          'Ensure IAM permissions are correct'
        ],
        testCases: [
          { description: 'Validates configuration', keywords: ['boto3'], expectedOutput: 'PASS' }
        ]
      }
    },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 11: AWS KMS', url: 'module-22.html' }, next: { title: 'Chapter 13: AWS STS', url: 'module-23.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_24_DATA; } else { window.MODULE_24_DATA = MODULE_24_DATA; }
