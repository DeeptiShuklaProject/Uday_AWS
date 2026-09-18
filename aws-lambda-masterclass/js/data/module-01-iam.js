/**
 * ============================================================
 * MODULE 01 — AWS IAM
 * Identity & Access Management, policies, roles, groups, MFA
 * ============================================================
 */
const MODULE_01_DATA = {
  id: 'iam-fundamentals',
  moduleId: 'module-01',
  title: 'AWS IAM — Identity & Access Management',
  description: 'Master the security foundation of AWS. Covers IAM Users, Groups, Roles, Policies (identity-based & resource-based), MFA, least-privilege, cross-account access, IAM Access Analyzer, and production incident response.',
  difficulty: 'beginner',
  duration: '90 min',
  prerequisites: ['AWS Account (free tier)', 'Basic JSON understanding'],
  objectives: [
    'Explain the difference between IAM Users, Groups, and Roles',
    'Write IAM policies using the Effect/Action/Resource model',
    'Apply the principle of least privilege to production workloads',
    'Configure MFA for root and IAM users',
    'Implement cross-account access using AssumeRole with ExternalId',
    'Use IAM Policy Simulator and Access Analyzer to audit permissions',
    'Troubleshoot AccessDenied errors using CloudTrail and policy simulation'
  ],

  sections: [
    {
      id: 'why-iam',
      type: 'why',
      title: 'Why IAM?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔐</span>
            <div class="alert-content">
              <div class="alert-title">IAM is the Gateway to Every AWS Service</div>
              <div class="alert-text">Every single API call to AWS — whether from the Console, CLI, SDK, or another service — is authenticated and authorized by IAM. If you don't understand IAM, you can't secure anything in AWS. It's the single most important service to master.</div>
            </div>
          </div>
          <h4>The Core Problem IAM Solves</h4>
          <p>Without IAM: Everyone uses the root account with full admin access. One compromised credential → entire AWS account owned. No audit trail, no access controls, no compliance.</p>
          <p>With IAM: Every human and service gets a unique identity with only the exact permissions they need. Every action is logged. Temporary credentials expire automatically.</p>
          <table>
            <thead><tr><th>IAM Component</th><th>What It Is</th><th>When to Use</th></tr></thead>
            <tbody>
              <tr><td><strong>User</strong></td><td>Permanent identity with long-lived credentials</td><td>Individual humans (minimize usage — prefer SSO)</td></tr>
              <tr><td><strong>Group</strong></td><td>Collection of Users that share policies</td><td>Organize users by team/role (Developers, Admins, ReadOnly)</td></tr>
              <tr><td><strong>Role</strong></td><td>Temporary identity assumed by services or users</td><td>Lambda functions, EC2 instances, cross-account access</td></tr>
              <tr><td><strong>Policy</strong></td><td>JSON document defining Allow/Deny permissions</td><td>Attached to Users, Groups, or Roles</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Never Use the Root Account for Daily Work</div>
              <div class="alert-text">The root account has unrestricted access to everything. Enable MFA on root immediately, lock it away, and create IAM Users/Roles for all operations. AWS explicitly recommends this in the Well-Architected Framework.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'IAM Request Authorization Flow',
      content: {
        title: 'How Every AWS API Call is Authorized',
        width: 750,
        height: 260,
        nodes: [
          { id: 'caller', label: 'API Caller', icon: '👤', x: 10, y: 100, type: 'client', description: 'Any entity making an AWS API call: Console user, CLI script, Lambda function, or another AWS service.' },
          { id: 'sigv4', label: 'SigV4 Signing', icon: '🔑', x: 150, y: 100, type: 'security', description: 'Every request is signed with AWS Signature Version 4 using access key + secret key (or STS temporary credentials). This proves the caller\'s identity cryptographically.' },
          { id: 'iam-engine', label: 'IAM Policy Engine', icon: '⚖️', x: 320, y: 100, type: 'security', description: 'IAM evaluates ALL applicable policies: identity-based, resource-based, SCPs, session policies, permission boundaries. Default: IMPLICIT DENY. Explicit Deny always wins.', eventPayload: { Decision: 'ALLOW or DENY', EvaluatedPolicies: ['Identity Policy', 'Resource Policy', 'SCP', 'Permission Boundary'], Rule: 'Explicit Deny > Explicit Allow > Implicit Deny' } },
          { id: 'service', label: 'AWS Service', icon: '☁️', x: 500, y: 100, type: 'compute', description: 'If IAM allows the request, it reaches the target service (S3, DynamoDB, Lambda, EC2, etc.) and the action is executed.' },
          { id: 'cloudtrail', label: 'CloudTrail', icon: '📋', x: 500, y: 210, type: 'storage', description: 'Every API call (allowed or denied) is logged in CloudTrail. This provides a complete audit trail for compliance and incident investigation.' }
        ],
        edges: [
          { from: 'caller', to: 'sigv4', label: 'Sign Request', animated: true },
          { from: 'sigv4', to: 'iam-engine', label: 'Authenticate', animated: true },
          { from: 'iam-engine', to: 'service', label: 'Authorize ✓', animated: true },
          { from: 'iam-engine', to: 'cloudtrail', label: 'Log' },
          { from: 'service', to: 'cloudtrail', label: 'Log Result' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts Deep Dive',
      content: {
        html: `
          <h4>1. IAM Policy Structure</h4>
          <p>Every IAM policy is a JSON document with this structure:</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowS3ReadOnly",
    "Effect": "Allow",              // Allow or Deny
    "Action": [                     // What actions
      "s3:GetObject",
      "s3:ListBucket"
    ],
    "Resource": [                   // On what resources
      "arn:aws:s3:::my-bucket",
      "arn:aws:s3:::my-bucket/*"
    ],
    "Condition": {                  // Under what conditions
      "IpAddress": {
        "aws:SourceIp": "203.0.113.0/24"
      }
    }
  }]
}</pre>

          <h4>2. Policy Evaluation Logic</h4>
          <ol>
            <li><strong>Default</strong>: Everything is IMPLICITLY DENIED</li>
            <li>IAM evaluates all applicable policies (identity + resource + SCP + boundary)</li>
            <li>If ANY policy has an <strong>Explicit Deny</strong> → DENIED (always wins)</li>
            <li>If a policy has an <strong>Explicit Allow</strong> AND no Deny → ALLOWED</li>
            <li>Otherwise → IMPLICITLY DENIED</li>
          </ol>

          <h4>3. Identity-Based vs Resource-Based Policies</h4>
          <table>
            <thead><tr><th>Type</th><th>Attached To</th><th>Specifies Principal?</th><th>Cross-Account?</th></tr></thead>
            <tbody>
              <tr><td><strong>Identity-Based</strong></td><td>User, Group, or Role</td><td>No (implied by attachment)</td><td>Requires AssumeRole</td></tr>
              <tr><td><strong>Resource-Based</strong></td><td>The resource itself (S3 bucket, SQS queue, etc.)</td><td>Yes — "Principal" field required</td><td>Allows direct cross-account without AssumeRole</td></tr>
            </tbody>
          </table>

          <h4>4. IAM Roles & AssumeRole</h4>
          <p>Roles provide <strong>temporary credentials</strong> via STS (Security Token Service). A role has:</p>
          <ul>
            <li><strong>Trust Policy</strong>: WHO can assume this role (Principal)</li>
            <li><strong>Permission Policy</strong>: WHAT the role can do once assumed</li>
          </ul>
          <p>Lambda, EC2, ECS all use roles — they never have long-lived access keys.</p>

          <h4>5. Permission Boundaries</h4>
          <p>A permission boundary is a policy that sets the <strong>maximum permissions</strong> an identity can have. Even if the identity policy grants <code>s3:*</code>, if the boundary only allows <code>s3:GetObject</code>, only GetObject works. Used for delegation: "Create any role you want, but it can never access production databases."</p>

          <h4>6. MFA (Multi-Factor Authentication)</h4>
          <ul>
            <li>Enable on root account immediately — non-negotiable</li>
            <li>Use <code>Condition: {"Bool": {"aws:MultiFactorAuthPresent": "true"}}</code> to require MFA for sensitive actions</li>
            <li>Support: Virtual MFA (Authenticator apps), U2F hardware keys, hardware TOTP tokens</li>
          </ul>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'IAM Boto3 Operations',
      content: {
        title: 'IAM Policy Management with Boto3',
        languages: [
          {
            id: 'python-policy',
            label: 'Create Policy & Role',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

iam = boto3.client('iam')

def create_least_privilege_role(role_name, service_principal, policy_document):
    """
    Create an IAM Role with least-privilege permissions.
    
    Args:
        role_name: Name for the IAM role
        service_principal: AWS service that assumes this role (e.g., 'lambda.amazonaws.com')
        policy_document: Dict with the permission policy
    """
    # 1. Create the Trust Policy — WHO can assume this role
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": service_principal
            },
            "Action": "sts:AssumeRole"
        }]
    }

    # 2. Create the Role
    role_response = iam.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description=f'Least-privilege role for {service_principal}',
        MaxSessionDuration=3600,  # 1 hour max session
        Tags=[
            {'Key': 'Environment', 'Value': 'production'},
            {'Key': 'ManagedBy', 'Value': 'automation'}
        ]
    )
    role_arn = role_response['Role']['Arn']
    logger.info("Created role: %s (%s)", role_name, role_arn)

    # 3. Create and attach the Permission Policy — WHAT the role can do
    policy_name = f'{role_name}-policy'
    policy_response = iam.create_policy(
        PolicyName=policy_name,
        PolicyDocument=json.dumps(policy_document),
        Description=f'Least-privilege policy for {role_name}'
    )
    policy_arn = policy_response['Policy']['Arn']

    # 4. Attach policy to role
    iam.attach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
    logger.info("Attached policy %s to role %s", policy_name, role_name)

    return {'roleArn': role_arn, 'policyArn': policy_arn}


# Example: Create a Lambda execution role
lambda_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowDynamoDBCRUD",
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/Users"
        },
        {
            "Sid": "AllowCloudWatchLogs",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:us-east-1:123456789012:*"
        }
    ]
}

# create_least_privilege_role('MyLambdaRole', 'lambda.amazonaws.com', lambda_policy)`,
            explanations: [
              { line: '19-28', text: 'Trust Policy defines WHO can assume this role. The Principal field specifies the AWS service. For cross-account, Principal would be an account ARN.' },
              { line: '36', text: 'MaxSessionDuration limits how long temporary credentials from AssumeRole last (1-12 hours). Default is 1 hour. Shorter = more secure.' },
              { line: '63-80', text: 'The permission policy follows least privilege: only specific DynamoDB actions on ONE specific table, plus CloudWatch Logs for observability. No s3:* or dynamodb:*.' }
            ]
          },
          {
            id: 'python-simulate',
            label: 'Policy Simulator',
            code: `import boto3
import json

iam = boto3.client('iam')

def simulate_policy(role_arn, actions, resource_arns):
    """
    Simulate IAM policy evaluation — test what a role can do
    WITHOUT actually calling the service.
    
    Use this to audit permissions before deploying to production.
    """
    response = iam.simulate_principal_policy(
        PolicySourceArn=role_arn,
        ActionNames=actions,
        ResourceArns=resource_arns
    )

    results = []
    for result in response['EvaluationResults']:
        action   = result['EvalActionName']
        decision = result['EvalDecision']  # 'allowed' or 'implicitDeny' or 'explicitDeny'
        matched  = result.get('MatchedStatements', [])

        status = '✅ ALLOWED' if decision == 'allowed' else '❌ DENIED'
        results.append({
            'action': action,
            'decision': decision,
            'status': status,
            'matchedStatements': len(matched)
        })
        print(f"  {status}: {action} → {decision}")

    return results


# Test: Can this role read from S3?
simulate_policy(
    role_arn='arn:aws:iam::123456789012:role/MyLambdaRole',
    actions=['s3:GetObject', 'dynamodb:PutItem', 'ec2:TerminateInstances'],
    resource_arns=['arn:aws:s3:::my-bucket/*']
)

# Expected output:
#   ❌ DENIED: s3:GetObject → implicitDeny
#   ✅ ALLOWED: dynamodb:PutItem → allowed
#   ❌ DENIED: ec2:TerminateInstances → implicitDeny`
          }
        ],
        defaultLang: 'python-policy',
        expectedOutput: 'Created role: MyLambdaRole (arn:aws:iam::123456789012:role/MyLambdaRole)\nAttached policy MyLambdaRole-policy to role MyLambdaRole'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'IAM CLI Commands',
      content: [
        {
          command: 'aws iam create-user --user-name developer-alice --tags Key=Team,Value=Engineering Key=Environment,Value=dev',
          category: 'aws-cli',
          expectedOutput: '{\n  "User": {\n    "Path": "/",\n    "UserName": "developer-alice",\n    "UserId": "AIDAEXAMPLE123456",\n    "Arn": "arn:aws:iam::123456789012:user/developer-alice",\n    "CreateDate": "2026-09-16T00:00:00+00:00"\n  }\n}',
          explanation: 'Creates an IAM user. Always add tags for organization. The user has NO permissions until you attach a policy or add them to a group.',
          interviewQ: 'A new IAM user can\'t access any AWS services. Why?'
        },
        {
          command: 'aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456789012:role/MyRole --action-names s3:GetObject s3:PutObject --resource-arns arn:aws:s3:::prod-bucket/*',
          category: 'aws-cli',
          expectedOutput: '{\n  "EvaluationResults": [\n    {"EvalActionName": "s3:GetObject", "EvalDecision": "allowed"},\n    {"EvalActionName": "s3:PutObject", "EvalDecision": "implicitDeny"}\n  ]\n}',
          explanation: 'Simulates IAM policy evaluation without calling the actual service. Essential for auditing: "Can this role do X?" Use this before deploying roles to production.',
          commonErrors: [
            { error: 'AccessDenied on simulate-principal-policy', cause: 'Caller lacks iam:SimulatePrincipalPolicy permission', fix: 'Add iam:SimulatePrincipalPolicy to the caller\'s policy' }
          ]
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'IAM CLI Lab',
        mode: 'simulated',
        initialText: 'IAM CLI Lab. Try:\n  aws iam list-users\n  aws iam list-roles --max-items 5\n  aws iam get-user --user-name alice\n  aws iam list-attached-role-policies --role-name MyLambdaRole',
        commands: {
          'aws iam list-users': {
            text: '{\n  "Users": [\n    {"UserName": "admin-bob", "UserId": "AIDA111", "Arn": "arn:aws:iam::123456789012:user/admin-bob", "CreateDate": "2025-01-15"},\n    {"UserName": "developer-alice", "UserId": "AIDA222", "Arn": "arn:aws:iam::123456789012:user/developer-alice", "CreateDate": "2025-06-20"},\n    {"UserName": "ci-deploy", "UserId": "AIDA333", "Arn": "arn:aws:iam::123456789012:user/ci-deploy", "CreateDate": "2026-02-10"}\n  ]\n}',
            type: 'output'
          },
          'aws iam list-roles --max-items 5': {
            text: '{\n  "Roles": [\n    {"RoleName": "AWSServiceRoleForLambda", "Arn": "arn:aws:iam::123456789012:role/aws-service-role/lambda.amazonaws.com/AWSServiceRoleForLambda"},\n    {"RoleName": "MyLambdaRole", "Arn": "arn:aws:iam::123456789012:role/MyLambdaRole"},\n    {"RoleName": "EC2-S3-ReadOnly", "Arn": "arn:aws:iam::123456789012:role/EC2-S3-ReadOnly"}\n  ]\n}',
            type: 'output'
          },
          'aws iam get-user --user-name alice': {
            text: '{\n  "User": {\n    "UserName": "developer-alice",\n    "UserId": "AIDA222",\n    "Arn": "arn:aws:iam::123456789012:user/developer-alice",\n    "Tags": [{"Key": "Team", "Value": "Engineering"}],\n    "PasswordLastUsed": "2026-09-15T14:30:00+00:00"\n  }\n}',
            type: 'output'
          },
          'aws iam list-attached-role-policies --role-name MyLambdaRole': {
            text: '{\n  "AttachedPolicies": [\n    {"PolicyName": "MyLambdaRole-policy", "PolicyArn": "arn:aws:iam::123456789012:policy/MyLambdaRole-policy"},\n    {"PolicyName": "AWSLambdaBasicExecutionRole", "PolicyArn": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"}\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common IAM Issues',
      content: {
        items: [
          { title: 'AccessDenied — Implicit Deny', error: 'An error occurred (AccessDenied) when calling the PutObject operation', cause: 'No policy explicitly allows the action. IAM defaults to implicit deny. The role/user simply doesn\'t have the required permission.', fix: 'Identify the missing action using CloudTrail (look for errorCode: AccessDenied). Add the specific action and resource ARN to the identity or resource policy. Use IAM Policy Simulator to verify.' },
          { title: 'AccessDenied — Explicit Deny overriding Allow', error: 'CI/CD pipeline fails with AccessDenied despite having s3:PutObject in the role policy', cause: 'An S3 bucket policy or SCP contains an explicit Deny that overrides the Allow. Explicit Deny ALWAYS wins in IAM evaluation.', fix: 'Check ALL policies: identity policy, resource policy (S3 bucket policy), SCP (Organizations), and permission boundary. An explicit Deny in ANY of these blocks the action.' },
          { title: 'AssumeRole fails cross-account', error: 'AssumeRoleUnauthorizedAccess when assuming a role in another account', cause: 'The target role\'s trust policy doesn\'t include the source account ARN, or ExternalId is missing/wrong.', fix: 'Update the trust policy Principal to include the source account/role ARN. Add Condition with sts:ExternalId if required. Verify the source has sts:AssumeRole permission for the target role ARN.' },
          { title: 'New IAM user can\'t log into Console', error: 'User created but cannot sign in to AWS Console', cause: 'IAM users need Console password explicitly enabled. Creating a user via CLI doesn\'t create a Console password by default.', fix: 'Use aws iam create-login-profile --user-name <user> --password <temp-pass> --password-reset-required. Or enable Console access in the IAM Console.' }
        ]
      }
    },

    {
      id: 'quiz-iam',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS IAM Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'A Lambda function has an IAM role with s3:GetObject permission. The S3 bucket has a bucket policy with an explicit Deny for the Lambda role. What happens when Lambda tries to read from S3?',
            options: [
              { id: 'a', text: 'Access is ALLOWED because the identity policy grants s3:GetObject' },
              { id: 'b', text: 'Access is DENIED because an explicit Deny always overrides an Allow' },
              { id: 'c', text: 'Access is ALLOWED because identity-based policies take precedence over resource-based policies' },
              { id: 'd', text: 'The request fails with a 500 error due to conflicting policies' }
            ],
            correctId: 'b',
            explanation: 'In IAM policy evaluation, an EXPLICIT DENY in any policy (identity, resource, SCP, or boundary) always wins — regardless of any Allow statements elsewhere. This is the #1 IAM rule to remember.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'What is the key difference between an IAM User and an IAM Role?',
            options: [
              { id: 'a', text: 'Users have policies; Roles do not' },
              { id: 'b', text: 'Users have long-lived credentials; Roles provide temporary credentials via STS' },
              { id: 'c', text: 'Users are for humans; Roles are only for Lambda functions' },
              { id: 'd', text: 'Users are regional; Roles are global' }
            ],
            correctId: 'b',
            explanation: 'Users have permanent access keys (long-lived). Roles issue temporary credentials via STS AssumeRole (1-12 hours). Roles are preferred because temporary credentials automatically expire, reducing the blast radius of a compromise. Both IAM Users and Roles are global (not regional).',
            difficulty: 'beginner'
          },
          {
            id: 'q3',
            question: 'You need to allow an EC2 instance in Account A to read from an S3 bucket in Account B. What is the most secure approach?',
            options: [
              { id: 'a', text: 'Create an IAM user in Account B with access keys and hardcode them on the EC2 instance' },
              { id: 'b', text: 'Make the S3 bucket public so any account can read it' },
              { id: 'c', text: 'Create a cross-account IAM Role in Account B with a trust policy allowing Account A, and have the EC2 instance assume it' },
              { id: 'd', text: 'Share the root account credentials of Account B with Account A' }
            ],
            correctId: 'c',
            explanation: 'Cross-account IAM Roles are the gold standard. The role in Account B trusts Account A\'s principal. The EC2 instance (with its own role) calls AssumeRole to get temporary credentials for Account B. No long-lived keys, no public access, full audit trail in CloudTrail.',
            difficulty: 'advanced'
          },
          {
            id: 'q4',
            question: 'What does a Permission Boundary do?',
            options: [
              { id: 'a', text: 'It restricts which AWS Regions a user can access' },
              { id: 'b', text: 'It sets the maximum permissions an IAM entity can have, even if their identity policy grants broader access' },
              { id: 'c', text: 'It replaces the need for identity-based policies' },
              { id: 'd', text: 'It only applies to the root account' }
            ],
            correctId: 'b',
            explanation: 'Permission Boundaries define the ceiling. If a user\'s identity policy allows s3:*, but their boundary only allows s3:GetObject, they can only GetObject. Used for delegation: allow developers to create roles, but limit what those roles can do.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-iam',
      type: 'challenge',
      title: 'Challenge: Build a Least-Privilege Policy',
      content: {
        title: 'Write a Least-Privilege IAM Policy',
        description: 'Create an IAM policy JSON document that allows a Lambda function to: read and write items to a specific DynamoDB table, write logs to CloudWatch, and send messages to a specific SQS queue — nothing else.',
        difficulty: 'intermediate',
        requirements: [
          'Use Version "2012-10-17"',
          'Include separate Statement entries for each service (DynamoDB, CloudWatch Logs, SQS)',
          'DynamoDB: Allow GetItem, PutItem, Query, UpdateItem on ONE specific table ARN',
          'CloudWatch Logs: Allow CreateLogGroup, CreateLogStream, PutLogEvents',
          'SQS: Allow sqs:SendMessage on ONE specific queue ARN',
          'Do NOT use wildcards (*) for Actions — list each action explicitly',
          'Add a Sid (Statement ID) to each statement for readability'
        ],
        starterCode: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDynamoDB",
      "Effect": "Allow",
      "Action": [
        // TODO: Add specific DynamoDB actions
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/Orders"
    },
    {
      "Sid": "AllowCloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        // TODO: Add specific CloudWatch Logs actions
      ],
      "Resource": "arn:aws:logs:us-east-1:123456789012:*"
    },
    {
      "Sid": "AllowSQSSend",
      "Effect": "Allow",
      "Action": [
        // TODO: Add specific SQS action
      ],
      "Resource": "arn:aws:sqs:us-east-1:123456789012:order-notifications"
    }
  ]
}`,
        language: 'json',
        hints: [
          'DynamoDB read: dynamodb:GetItem, dynamodb:Query',
          'DynamoDB write: dynamodb:PutItem, dynamodb:UpdateItem',
          'CloudWatch: logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents',
          'SQS: sqs:SendMessage (just this one action for sending)',
          'Never use * for actions in a least-privilege policy'
        ],
        testCases: [
          { description: 'Includes dynamodb:GetItem', keywords: ['dynamodb:GetItem'], expectedOutput: 'GetItem' },
          { description: 'Includes dynamodb:PutItem', keywords: ['dynamodb:PutItem'], expectedOutput: 'PutItem' },
          { description: 'Includes logs:PutLogEvents', keywords: ['logs:PutLogEvents'], expectedOutput: 'PutLogEvents' },
          { description: 'Includes sqs:SendMessage', keywords: ['sqs:SendMessage'], expectedOutput: 'SendMessage' },
          { description: 'No wildcard actions', keywords: ['*'], expectedOutput: '' }
        ]
      }
    },

    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 03: Amazon S3', url: 'module-02.html' }, next: { title: 'Chapter 05: Elastic Load Balancing', url: 'module-18.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_01_DATA;
} else {
  window.MODULE_01_DATA = MODULE_01_DATA;
}
