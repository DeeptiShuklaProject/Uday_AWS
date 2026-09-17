/**
 * ============================================================
 * MODULE 23 — AWS STS (Security Token Service)
 * Temporary credentials, assuming roles, federation
 * ============================================================
 */
const MODULE_23_DATA = {
  id: 'sts-fundamentals',
  moduleId: 'module-23',
  title: 'AWS STS — Security Token Service',
  description: 'Master temporary credentials on AWS. Covers AssumeRole, cross-account access, web identity federation, session policies, and external ID for third-party access.',
  difficulty: 'intermediate',
  duration: '65 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: [
    'Understand how STS provides temporary security credentials',
    'Use AssumeRole for cross-account access patterns',
    'Implement web identity federation with Cognito',
    'Apply session policies to scope down permissions',
    'Use external IDs to prevent confused deputy attacks'
  ],

  sections: [
    {
      id: 'why-sts',
      type: 'why',
      title: 'Why STS?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🎫</span>
            <div class="alert-content">
              <div class="alert-title">Temporary Credentials — The Foundation of AWS Security</div>
              <div class="alert-text">STS issues temporary, limited-privilege credentials (access key + secret key + session token) that automatically expire. Every time a Lambda function runs, an EC2 instance uses a role, or a user assumes a role — STS is behind the scenes.</div>
            </div>
          </div>
          <h4>STS API Operations</h4>
          <table>
            <thead><tr><th>API</th><th>Who Calls It</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>AssumeRole</strong></td><td>IAM users, roles, services</td><td>Cross-account access, privilege escalation, role chaining</td></tr>
              <tr><td><strong>AssumeRoleWithWebIdentity</strong></td><td>Mobile/web apps</td><td>Login with Google, Facebook, or any OIDC provider</td></tr>
              <tr><td><strong>AssumeRoleWithSAML</strong></td><td>Enterprise SSO</td><td>Active Directory federation, SAML 2.0 IdP</td></tr>
              <tr><td><strong>GetSessionToken</strong></td><td>IAM users</td><td>MFA-protected API access from CLI</td></tr>
              <tr><td><strong>GetCallerIdentity</strong></td><td>Anyone</td><td>Debug: "Who am I?" — returns account, ARN, user ID</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Role Chaining Limits Duration to 1 Hour</div>
              <div class="alert-text">When a role assumes another role (role chaining), the maximum session duration is capped at <strong>1 hour</strong> regardless of the role's configured max session duration. This is a common gotcha in multi-account architectures.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Cross-Account AssumeRole',
      content: {
        title: 'Cross-Account Access Pattern with STS',
        width: 750,
        height: 260,
        nodes: [
          { id: 'dev', label: 'Dev Account (111)', icon: '👨‍💻', x: 10, y: 120, type: 'client', description: 'Developer or automation in Account A wants to access resources in Account B.' },
          { id: 'sts', label: 'AWS STS', icon: '🎫', x: 220, y: 120, type: 'security', description: 'STS validates the trust policy on the target role, generates temporary credentials (access key + secret key + session token), valid for 1-12 hours.' },
          { id: 'role', label: 'Cross-Account Role', icon: '🔑', x: 430, y: 50, type: 'security', description: 'IAM role in Account B with a trust policy allowing Account A to assume it. The role has permissions policies attached.' },
          { id: 'resources', label: 'Prod Resources', icon: '🗄️', x: 640, y: 50, type: 'storage', description: 'S3 buckets, DynamoDB tables, Lambda functions in Account B that the cross-account role can access.' },
          { id: 'trail', label: 'CloudTrail', icon: '📋', x: 430, y: 210, type: 'trigger', description: 'AssumeRole call logged in BOTH accounts. Shows who assumed what role, when, and from which source IP.' }
        ],
        edges: [
          { from: 'dev', to: 'sts', label: 'sts:AssumeRole', animated: true },
          { from: 'sts', to: 'role', label: 'Validate trust policy' },
          { from: 'sts', to: 'dev', label: 'Temp credentials' },
          { from: 'dev', to: 'resources', label: 'Access with temp creds', animated: true },
          { from: 'sts', to: 'trail', label: 'Audit log' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Trust Policy vs Permissions Policy</h4>
          <ul>
            <li><strong>Trust Policy</strong>: Attached to the ROLE. Defines WHO can assume this role (principals).</li>
            <li><strong>Permissions Policy</strong>: Attached to the ROLE. Defines WHAT the assumed role can do (actions on resources).</li>
          </ul>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">// Trust Policy — WHO can assume
{
  "Principal": {"AWS": "arn:aws:iam::111111111111:root"},
  "Action": "sts:AssumeRole",
  "Condition": {"StringEquals": {"sts:ExternalId": "my-secret-id"}}
}

// Permissions Policy — WHAT they can do
{
  "Action": ["s3:GetObject", "s3:ListBucket"],
  "Resource": "arn:aws:s3:::prod-data-bucket/*"
}</pre>

          <h4>2. External ID (Confused Deputy Prevention)</h4>
          <p>When a third-party service assumes a role in your account, an external ID prevents another customer from tricking the service into accessing YOUR resources. Always require ExternalId in trust policies for third-party access.</p>

          <h4>3. Session Policies</h4>
          <p>Optional JSON policy passed during AssumeRole that further restricts (never expands) the assumed role's permissions for that specific session.</p>

          <h4>4. Credential Expiration</h4>
          <table>
            <thead><tr><th>Scenario</th><th>Default Duration</th><th>Max Duration</th></tr></thead>
            <tbody>
              <tr><td>AssumeRole (direct)</td><td>1 hour</td><td>12 hours (configurable)</td></tr>
              <tr><td>Role Chaining</td><td>1 hour</td><td>1 hour (hard limit)</td></tr>
              <tr><td>Web Identity / SAML</td><td>1 hour</td><td>12 hours</td></tr>
              <tr><td>GetSessionToken</td><td>12 hours</td><td>36 hours</td></tr>
            </tbody>
          </table>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'STS Boto3 Operations',
      content: {
        title: 'Cross-Account Access with STS',
        languages: [
          {
            id: 'python-sts',
            label: 'AssumeRole Pattern',
            code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sts = boto3.client('sts')

def get_caller_identity():
    """Check current identity (debug helper)."""
    response = sts.get_caller_identity()
    logger.info("Account: %s, ARN: %s", response['Account'], response['Arn'])
    return response


def assume_cross_account_role(role_arn, session_name, external_id=None):
    """Assume a role in another AWS account."""
    params = {
        'RoleArn': role_arn,
        'RoleSessionName': session_name,
        'DurationSeconds': 3600  # 1 hour
    }
    if external_id:
        params['ExternalId'] = external_id

    response = sts.assume_role(**params)
    credentials = response['Credentials']

    logger.info("Assumed role: %s (expires: %s)",
                response['AssumedRoleUser']['Arn'],
                credentials['Expiration'])

    # Create a new boto3 session with temporary credentials
    session = boto3.Session(
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken']
    )
    return session


def list_prod_s3_buckets():
    """Example: List S3 buckets in the production account."""
    prod_session = assume_cross_account_role(
        role_arn='arn:aws:iam::222222222222:role/ProdReadOnly',
        session_name='dev-audit-session',
        external_id='unique-external-id-12345'
    )

    s3 = prod_session.client('s3')
    buckets = s3.list_buckets()['Buckets']
    for b in buckets:
        logger.info("Prod bucket: %s", b['Name'])
    return buckets`,
            explanations: [
              { line: '10-13', text: 'GetCallerIdentity is the AWS equivalent of "whoami". Always call this first when debugging permission issues to verify which identity is making the API call.' },
              { line: '19-27', text: 'AssumeRole parameters: RoleArn (target role), RoleSessionName (appears in CloudTrail for auditing), ExternalId (confused deputy prevention for third-party access).' },
              { line: '35-39', text: 'Create a NEW boto3 Session using the temporary credentials. All clients created from this session will use the assumed role permissions.' },
              { line: '48-50', text: 'Real-world pattern: assume a read-only role in the production account from a dev/automation account. External ID ensures only your service can assume the role.' }
            ]
          }
        ],
        defaultLang: 'python-sts',
        expectedOutput: 'Account: 111111111111, ARN: arn:aws:iam::111111111111:user/dev-user\nAssumed role: arn:aws:sts::222222222222:assumed-role/ProdReadOnly/dev-audit-session\nProd bucket: prod-data-bucket'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'STS CLI Commands',
      content: [
        {
          command: 'aws sts get-caller-identity',
          category: 'aws-cli',
          expectedOutput: '{\n  "UserId": "AIDACKCEVSQ6C2EXAMPLE",\n  "Account": "123456789012",\n  "Arn": "arn:aws:iam::123456789012:user/dev-user"\n}',
          explanation: 'The "whoami" of AWS. Shows which identity is making API calls. Works even with assumed roles (shows the assumed role ARN). Always your first debugging step.',
          interviewQ: 'How do you determine which IAM identity is making API calls in your current terminal session?'
        },
        {
          command: 'aws sts assume-role --role-arn arn:aws:iam::222222222222:role/ProdReadOnly --role-session-name my-session --external-id unique-id-123',
          category: 'aws-cli',
          expectedOutput: '{\n  "Credentials": {\n    "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",\n    "SecretAccessKey": "wJalrXUtnFEMI...",\n    "SessionToken": "FwoGZXIvYXdzE...",\n    "Expiration": "2026-09-16T17:00:00Z"\n  }\n}',
          explanation: 'Returns temporary credentials. Export them as AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN environment variables to use in subsequent CLI commands.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'STS CLI Lab',
        mode: 'simulated',
        initialText: 'STS CLI Lab. Try:\n  aws sts get-caller-identity\n  aws sts decode-authorization-message --encoded-message <message>',
        commands: {
          'aws sts get-caller-identity': {
            text: '{\n  "UserId": "AIDACKCEVSQ6C2EXAMPLE",\n  "Account": "123456789012",\n  "Arn": "arn:aws:iam::123456789012:user/dev-user"\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common STS Issues',
      content: {
        items: [
          { title: 'AccessDenied when assuming role', error: 'AccessDenied: User is not authorized to perform sts:AssumeRole', cause: 'Either the trust policy on the target role does not allow the calling principal, OR the calling principal does not have sts:AssumeRole permission in their IAM policy.', fix: 'Check BOTH: (1) Trust policy on the target role allows the source principal, (2) Source principal has sts:AssumeRole on the target role ARN. Also check for condition keys like ExternalId.' },
          { title: 'Role chaining duration error', error: 'DurationSeconds exceeds the MaxSessionDuration for role chaining', cause: 'Role chaining (Role A assumes Role B) has a hard limit of 1 hour. You cannot extend this.', fix: 'Redesign to avoid role chaining. Have the original principal assume the final role directly. Or use separate sessions.' },
          { title: 'Confused deputy attack', error: 'Third-party service accessing wrong customer resources', cause: 'Trust policy without ExternalId condition allows any customer of the third-party service to trick it into assuming your role.', fix: 'Always require ExternalId in trust policies for third-party access. The third party provides a unique ExternalId per customer.' }
        ]
      }
    },

    {
      id: 'quiz-sts',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS STS Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'A Lambda function in Account A needs to write to a DynamoDB table in Account B. What is the recommended approach?',
            options: [
              { id: 'a', text: 'Create an IAM user in Account B and hardcode credentials in the Lambda' },
              { id: 'b', text: 'Create a cross-account IAM role in Account B, have the Lambda assume it via STS' },
              { id: 'c', text: 'Make the DynamoDB table public' },
              { id: 'd', text: 'Use VPC peering between the accounts' }
            ],
            correctId: 'b',
            explanation: 'Cross-account IAM roles are the standard pattern. Create a role in Account B with a trust policy allowing Account A\'s Lambda execution role. The Lambda calls sts:AssumeRole, gets temporary credentials, and uses them to write to DynamoDB. Never hardcode credentials.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'What is the purpose of the ExternalId condition in an IAM trust policy?',
            options: [
              { id: 'a', text: 'It provides an additional password for assuming the role' },
              { id: 'b', text: 'It prevents confused deputy attacks when granting cross-account access to third parties' },
              { id: 'c', text: 'It encrypts the temporary credentials' },
              { id: 'd', text: 'It extends the maximum session duration' }
            ],
            correctId: 'b',
            explanation: 'ExternalId is a unique string that prevents the confused deputy problem. Without it, a malicious third-party customer could trick the service into assuming YOUR role. The ExternalId must match what the third party passes during AssumeRole.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

        {
      id: 'challenge-generic',
      type: 'challenge',
      title: 'Challenge: AWS STS Security Pipeline',
      content: {
        title: 'Build a AWS STS Security Gate',
        description: 'Write a Lambda function that interacts with AWS STS and validates its security configuration.',
        difficulty: 'intermediate',
        requirements: [
          'Accept input related to AWS STS',
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
          'Check the boto3 documentation for AWS STS',
          'Ensure IAM permissions are correct'
        ],
        testCases: [
          { description: 'Validates configuration', keywords: ['boto3'], expectedOutput: 'PASS' }
        ]
      }
    },
    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: { title: 'Module 22: AWS KMS', url: 'module-22.html' },
        next: { title: 'Module 24: AWS Secrets Manager', url: 'module-24.html' }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_23_DATA; } else { window.MODULE_23_DATA = MODULE_23_DATA; }
