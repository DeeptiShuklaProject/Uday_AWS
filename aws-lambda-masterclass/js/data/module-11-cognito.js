/**
 * ============================================================
 * MODULE 11 — Amazon Cognito
 * User authentication, User Pools, Identity Pools, Lambda triggers
 * ============================================================
 */
const MODULE_11_DATA = {
  id: 'cognito-fundamentals',
  moduleId: 'module-11',
  title: 'Amazon Cognito — Authentication & Authorization',
  description: 'Add production-grade auth to serverless apps using Amazon Cognito. Covers User Pools, Identity Pools, JWT validation, OAuth 2.0 flows, Lambda triggers, and API Gateway integration.',
  difficulty: 'intermediate',
  duration: '75 min',
  prerequisites: ['Module 08: AWS Lambda', 'Module 09: API Gateway', 'Basic OAuth 2.0 knowledge'],
  objectives: [
    'Explain the difference between Cognito User Pools and Identity Pools',
    'Implement user sign-up, sign-in, and token refresh flows',
    'Validate Cognito JWTs in a Lambda function without a library',
    'Configure API Gateway Cognito Authorizer to protect endpoints',
    'Use Lambda triggers to customize authentication flows',
    'Implement MFA and password policies',
    'Map Cognito groups to IAM roles for authorization'
  ],

  sections: [
    {
      id: 'why-cognito',
      type: 'why',
      title: 'Why Cognito?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔐</span>
            <div class="alert-content">
              <div class="alert-title">Authentication is Hard — Let AWS Handle It</div>
              <div class="alert-text">Building secure authentication from scratch requires: secure password hashing, brute-force protection, MFA, token management, refresh flows, PKCE, and compliance (SOC2, HIPAA). Cognito provides all of this as a managed service.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Cognito Component</th><th>Purpose</th><th>What it Issues</th></tr></thead>
            <tbody>
              <tr><td><strong>User Pool</strong></td><td>User directory — sign-up, sign-in, MFA, password policies</td><td>JWT tokens: ID token, Access token, Refresh token</td></tr>
              <tr><td><strong>Identity Pool</strong></td><td>Federated identity — exchange tokens for temporary AWS credentials</td><td>STS temporary credentials (AccessKeyId, SecretAccessKey, SessionToken)</td></tr>
            </tbody>
          </table>
          <p><strong>The most common serverless pattern:</strong></p>
          <ol>
            <li>User authenticates against <strong>Cognito User Pool</strong> → receives JWT tokens</li>
            <li>Client sends JWT in <code>Authorization: Bearer &lt;token&gt;</code> header</li>
            <li><strong>API Gateway Cognito Authorizer</strong> validates the JWT automatically</li>
            <li>Lambda receives the verified user claims in <code>event.requestContext.authorizer.claims</code></li>
          </ol>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Cognito Auth Flow',
      content: {
        title: 'Amazon Cognito → API Gateway → Lambda Auth Flow',
        width: 750,
        height: 260,
        nodes: [
          { id: 'client', label: 'Mobile/Web App', icon: '📱', x: 10, y: 100, type: 'client', description: 'Client application handles the auth UI and token storage.' },
          { id: 'cognito', label: 'Cognito User Pool', icon: '🔐', x: 160, y: 100, type: 'security', description: 'User Pool authenticates credentials and issues JWT tokens. Hosts the hosted UI for OAuth2 flows.', eventPayload: { IdToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...', AccessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...', ExpiresIn: 3600, TokenType: 'Bearer' } },
          { id: 'apigw', label: 'API Gateway + Cognito Authorizer', icon: '🌐', x: 360, y: 100, type: 'trigger', description: 'API Gateway Cognito Authorizer validates the JWT signature using the User Pool\'s public keys (JWKS). No Lambda invocation needed — it\'s native.' },
          { id: 'lambda', label: 'Lambda', icon: '⚡', x: 550, y: 100, type: 'compute', description: 'Lambda receives pre-validated claims in event.requestContext.authorizer.claims — no JWT validation code needed.', eventPayload: { 'requestContext.authorizer.claims': { sub: 'user-uuid-123', email: 'alice@example.com', 'cognito:groups': 'Admins', exp: 1758000000 } } },
          { id: 'idpool', label: 'Identity Pool', icon: '🎫', x: 160, y: 210, type: 'security', description: 'Identity Pool exchanges User Pool JWT for temporary AWS credentials via STS AssumeRoleWithWebIdentity.' },
          { id: 'sts', label: 'STS', icon: '☁️', x: 360, y: 210, type: 'storage', description: 'STS issues short-lived credentials (1 hour) mapped to the appropriate IAM role based on Cognito group membership.' }
        ],
        edges: [
          { from: 'client', to: 'cognito', label: 'Sign-in', animated: true },
          { from: 'cognito', to: 'client', label: 'JWT Tokens' },
          { from: 'client', to: 'apigw', label: 'Bearer Token', animated: true },
          { from: 'apigw', to: 'lambda', label: 'Claims', animated: true },
          { from: 'client', to: 'idpool', label: 'Exchange JWT' },
          { from: 'idpool', to: 'sts', label: 'AssumeRole' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. JWT Token Structure</h4>
          <p>Cognito issues three tokens:</p>
          <ul>
            <li><strong>ID Token</strong>: Contains user attributes (email, name, phone). Use this for identity in your app.</li>
            <li><strong>Access Token</strong>: Used to call Cognito APIs (GetUser, etc.) and to authorize API Gateway calls.</li>
            <li><strong>Refresh Token</strong>: Long-lived (30 days by default). Used to get new ID/Access tokens when they expire (default 1 hour).</li>
          </ul>

          <h4>2. JWT Validation</h4>
          <p>JWTs are signed with RS256 (RSA + SHA-256). Validation steps:</p>
          <ol>
            <li>Decode the JWT header to get the <code>kid</code> (key ID)</li>
            <li>Fetch Cognito's public keys from: <code>https://cognito-idp.{region}.amazonaws.com/{poolId}/.well-known/jwks.json</code></li>
            <li>Verify the signature using the matching public key</li>
            <li>Verify <code>exp</code> (not expired), <code>iss</code> (correct pool), <code>aud</code> (correct client)</li>
          </ol>

          <h4>3. Lambda Triggers</h4>
          <table>
            <thead><tr><th>Trigger</th><th>When it Fires</th><th>Common Use Case</th></tr></thead>
            <tbody>
              <tr><td>Pre Sign-Up</td><td>Before creating the user</td><td>Validate email domain, auto-confirm users</td></tr>
              <tr><td>Post Confirmation</td><td>After user confirms email</td><td>Create user profile in DynamoDB</td></tr>
              <tr><td>Pre Token Generation</td><td>Before issuing tokens</td><td>Add custom claims to JWT</td></tr>
              <tr><td>Custom Authentication</td><td>Define custom auth challenge</td><td>OTP, CAPTCHA, passwordless login</td></tr>
              <tr><td>Post Authentication</td><td>After successful sign-in</td><td>Audit logging, update last-login</td></tr>
            </tbody>
          </table>

          <h4>4. User Pool Groups & Roles</h4>
          <p>Assign users to Cognito Groups (e.g., Admins, Editors). Groups appear in the <code>cognito:groups</code> claim. Map groups to IAM roles in Identity Pool for AWS service access control.</p>

          <h4>5. OAuth 2.0 Flows</h4>
          <ul>
            <li><strong>Authorization Code + PKCE</strong>: Recommended for SPAs and mobile apps. Most secure.</li>
            <li><strong>Implicit Flow</strong>: Deprecated. Avoid — tokens exposed in URL.</li>
            <li><strong>Client Credentials</strong>: Machine-to-machine (no user). For service accounts.</li>
          </ul>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'Lambda Trigger & JWT Handler',
      content: {
        title: 'Cognito Lambda Triggers',
        languages: [
          {
            id: 'python-trigger',
            label: 'Pre Token Trigger',
            code: `import json
import boto3

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')

def lambda_handler(event, context):
    """
    Pre Token Generation Lambda Trigger.
    Fires BEFORE Cognito issues tokens.
    Use it to add custom claims to the JWT.
    """
    trigger_source = event.get('triggerSource', '')
    user_sub       = event['request']['userAttributes'].get('sub')
    user_email     = event['request']['userAttributes'].get('email')

    # Add custom claims to the token
    # These appear in event.requestContext.authorizer.claims in Lambda
    event['response']['claimsOverrideDetails'] = {
        'claimsToAddOrOverride': {
            'custom:userId':   user_sub,
            'custom:email':    user_email,
            'custom:appRole':  _get_user_role(user_sub),
        },
        # Optionally suppress some default claims
        'claimsToSuppress': []
    }

    # CRITICAL: Must return the event object unchanged/modified
    return event

def _get_user_role(user_sub):
    """Fetch user role from DynamoDB and inject into JWT."""
    try:
        response = users_table.get_item(Key={'userId': user_sub})
        return response.get('Item', {}).get('role', 'viewer')
    except Exception:
        return 'viewer'


# =========================================================
# POST CONFIRMATION TRIGGER — runs after email verification
# =========================================================
def post_confirmation_handler(event, context):
    """
    Create a user profile in DynamoDB when a new user confirms their email.
    """
    attrs      = event['request']['userAttributes']
    user_sub   = attrs.get('sub')
    user_email = attrs.get('email')
    user_name  = attrs.get('name', user_email.split('@')[0])

    # Create profile in DynamoDB
    users_table.put_item(Item={
        'userId':    user_sub,
        'email':     user_email,
        'name':      user_name,
        'role':      'viewer',       # default role
        'createdAt': __import__('datetime').datetime.utcnow().isoformat(),
        'active':    True
    })

    # Return event unchanged — Cognito requires this
    return event`,
            explanations: [
              { line: '7', text: 'Pre Token Generation fires just before Cognito issues ID, Access, or Refresh tokens. The return value must be the event object with your modifications.' },
              { line: '17-23', text: 'claimsOverrideDetails.claimsToAddOrOverride adds custom claims. These appear in the JWT payload and in event.requestContext.authorizer.claims in downstream Lambda.' },
              { line: '28', text: 'CRITICAL: Every Cognito trigger must return the event object (possibly modified). Returning nothing or throwing causes the auth to fail.' },
              { line: '44', text: 'Post Confirmation is the perfect place to initialize user resources. At this point the user email is verified and the user is committed to the system.' }
            ]
          },
          {
            id: 'python-validate',
            label: 'JWT Validation',
            code: `"""
Manual JWT validation in Lambda (no external libraries).
Used when you can't use API Gateway Cognito Authorizer
(e.g., WebSocket connections, custom auth flows).
"""
import json
import time
import base64
import hashlib
import urllib.request

# Cache the JWKS — fetched once per cold start
_JWKS_CACHE = {}
REGION    = __import__('os').environ.get('AWS_REGION', 'us-east-1')
POOL_ID   = __import__('os').environ.get('COGNITO_POOL_ID')
CLIENT_ID = __import__('os').environ.get('COGNITO_CLIENT_ID')

def validate_jwt(token):
    """
    Validates a Cognito JWT. Returns decoded claims or raises ValueError.
    """
    # 1. Split JWT into parts
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")

    # 2. Decode header to get key ID
    header = _decode_b64(parts[0])
    kid    = header.get('kid')
    alg    = header.get('alg', 'RS256')
    if alg != 'RS256':
        raise ValueError(f"Unsupported algorithm: {alg}")

    # 3. Decode payload
    payload = _decode_b64(parts[1])

    # 4. Check expiration
    if payload.get('exp', 0) < time.time():
        raise ValueError("Token has expired")

    # 5. Check issuer matches our User Pool
    expected_iss = f"https://cognito-idp.{REGION}.amazonaws.com/{POOL_ID}"
    if payload.get('iss') != expected_iss:
        raise ValueError("Invalid token issuer")

    # 6. Check audience (client_id)
    if payload.get('aud') != CLIENT_ID and payload.get('client_id') != CLIENT_ID:
        raise ValueError("Invalid token audience")

    # NOTE: Signature verification requires a crypto library (cryptography/PyJWT)
    # In production, use: pip install python-jose[cryptography]
    # For API Gateway use cases, the Cognito Authorizer handles all of this natively.

    return payload

def _decode_b64(s):
    """Decode base64url-encoded JWT segment."""
    padding = 4 - len(s) % 4
    s = s + '=' * (padding % 4)
    return json.loads(base64.urlsafe_b64decode(s))

def lambda_handler(event, context):
    auth_header = event.get('headers', {}).get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return {'statusCode': 401, 'body': json.dumps({'error': 'Missing Bearer token'})}

    token = auth_header[7:]
    try:
        claims = validate_jwt(token)
        user_id = claims.get('sub')
        return {'statusCode': 200, 'body': json.dumps({'userId': user_id, 'claims': claims})}
    except ValueError as e:
        return {'statusCode': 401, 'body': json.dumps({'error': str(e)})}`
          }
        ],
        defaultLang: 'python-trigger',
        expectedOutput: '{\n  "triggerSource": "TokenGeneration_Authentication",\n  "response": {\n    "claimsOverrideDetails": {\n      "claimsToAddOrOverride": {\n        "custom:userId": "user-sub-uuid",\n        "custom:appRole": "admin"\n      }\n    }\n  }\n}'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'Cognito CLI Commands',
      content: [
        {
          command: 'aws cognito-idp admin-initiate-auth --user-pool-id us-east-1_aBcDeFgHi --client-id 1a2b3c4d5e6f7g8h9i0j --auth-flow ADMIN_NO_SRP_AUTH --auth-parameters USERNAME=alice@example.com,PASSWORD=TempPass123!',
          category: 'aws-cli',
          expectedOutput: '{\n  "AuthenticationResult": {\n    "AccessToken": "eyJraWQiOi...",\n    "IdToken": "eyJraWQiOi...",\n    "RefreshToken": "eyJjdHki...",\n    "ExpiresIn": 3600,\n    "TokenType": "Bearer"\n  }\n}',
          explanation: 'Admin authentication bypasses SRP (Secure Remote Password) — only use for server-side testing. In production, clients should use InitiateAuth with USER_PASSWORD_AUTH or SRP flows.',
          interviewQ: 'What is the difference between ADMIN_NO_SRP_AUTH and USER_PASSWORD_AUTH flows in Cognito?',
          onRun: () => '{\n  "AuthenticationResult": {\n    "AccessToken": "eyJraWQiOi...",\n    "IdToken": "eyJraWQiOi...",\n    "ExpiresIn": 3600\n  }\n}'
        },
        {
          command: 'aws cognito-idp list-users --user-pool-id us-east-1_aBcDeFgHi --filter "email = \\"alice@example.com\\""',
          category: 'aws-cli',
          expectedOutput: '{\n  "Users": [{\n    "Username": "alice",\n    "Attributes": [\n      {"Name": "sub", "Value": "a1b2c3d4-..."},\n      {"Name": "email", "Value": "alice@example.com"},\n      {"Name": "email_verified", "Value": "true"}\n    ],\n    "UserStatus": "CONFIRMED",\n    "Enabled": true\n  }]\n}',
          explanation: 'Lists users matching a filter expression. Filter supports standard and custom attributes. Use this for admin lookup, not for user-facing search (Cognito is not a search engine).',
          commonErrors: [
            { error: 'InvalidParameterException: Filter not supported', cause: 'Only specific attributes support filtering: email, phone_number, status, username, etc.', fix: 'Use only supported filter attributes or query DynamoDB for advanced user searches' }
          ]
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'Cognito CLI Lab',
        mode: 'simulated',
        initialText: 'Cognito CLI Lab. Try:\n  aws cognito-idp list-user-pools --max-results 10\n  aws cognito-idp describe-user-pool --user-pool-id us-east-1_abc123\n  aws cognito-idp admin-get-user --user-pool-id us-east-1_abc123 --username alice',
        commands: {
          'aws cognito-idp list-user-pools --max-results 10': {
            text: '{\n  "UserPools": [{\n    "Id": "us-east-1_aBcDeFgHi",\n    "Name": "MyAppUserPool",\n    "LambdaConfig": {"PreTokenGeneration": "arn:aws:lambda:..."},\n    "Status": "Enabled",\n    "CreationDate": "2026-01-15T08:00:00+00:00"\n  }]\n}',
            type: 'output'
          },
          'aws cognito-idp describe-user-pool --user-pool-id us-east-1_abc123': {
            text: '{\n  "UserPool": {\n    "Id": "us-east-1_abc123",\n    "Name": "MyAppUserPool",\n    "Policies": {"PasswordPolicy": {"MinimumLength": 12, "RequireUppercase": true, "RequireNumbers": true}},\n    "MfaConfiguration": "OPTIONAL",\n    "EstimatedNumberOfUsers": 1543\n  }\n}',
            type: 'output'
          },
          'aws cognito-idp admin-get-user --user-pool-id us-east-1_abc123 --username alice': {
            text: '{\n  "Username": "alice",\n  "UserAttributes": [\n    {"Name": "sub", "Value": "a1b2c3-..."},\n    {"Name": "email", "Value": "alice@example.com"},\n    {"Name": "email_verified", "Value": "true"},\n    {"Name": "custom:appRole", "Value": "admin"}\n  ],\n  "UserStatus": "CONFIRMED",\n  "Enabled": true\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common Cognito Issues',
      content: {
        items: [
          { title: 'Token validation fails — invalid signature', error: '401 Unauthorized: Invalid token signature', cause: 'Validating token against wrong JWKS endpoint, or token issued by a different User Pool/region.', fix: 'Fetch JWKS from exact URL: https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json. Cache JWKS locally, refresh only on kid not found.' },
          { title: 'Lambda trigger fails — user cannot sign in', error: 'User cannot log in after adding Lambda trigger', cause: 'Lambda trigger threw an exception or returned an incorrectly shaped event object.', fix: 'All Cognito triggers must return the event object. Use try/catch in your trigger and always return event in the catch block too. Check CloudWatch Logs for the trigger function.' },
          { title: 'Custom claims not appearing in token', error: 'custom:userId claim missing from JWT', cause: 'Pre Token Generation trigger not returning claimsOverrideDetails correctly, or the User Pool App Client has "Read" attribute permissions disabled.', fix: 'Verify the trigger returns event with response.claimsOverrideDetails set. Check App Client settings — custom attributes must be readable.' },
          { title: 'NotAuthorizedException: Incorrect username or password', error: 'NotAuthorizedException during admin-initiate-auth', cause: 'Wrong credentials, user not in CONFIRMED status, or account locked after too many failed attempts.', fix: 'Check UserStatus with admin-get-user. Use admin-confirm-sign-up if stuck in UNCONFIRMED. Use admin-set-user-password to reset.' }
        ]
      }
    },

    {
      id: 'quiz-cognito',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon Cognito Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'A user signs in and receives an IdToken, AccessToken, and RefreshToken. The IdToken expires after 1 hour. Which token should the client use to get a new IdToken without the user signing in again?',
            options: [
              { id: 'a', text: 'AccessToken — exchange it for a new IdToken' },
              { id: 'b', text: 'RefreshToken — call InitiateAuth with REFRESH_TOKEN_AUTH flow' },
              { id: 'c', text: 'Sign in again — tokens cannot be refreshed' },
              { id: 'd', text: 'Call the Cognito hosted UI to silently refresh' }
            ],
            correctId: 'b',
            explanation: 'The RefreshToken (valid 30 days by default) is used with InitiateAuth using REFRESH_TOKEN_AUTH flow to get new ID and Access tokens without re-authentication. This enables seamless "stay logged in" behavior.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'You need to add a custom "role" claim to Cognito JWTs from a DynamoDB lookup. Which Lambda trigger should you use?',
            options: [
              { id: 'a', text: 'Pre Sign-Up trigger' },
              { id: 'b', text: 'Post Confirmation trigger' },
              { id: 'c', text: 'Pre Token Generation trigger' },
              { id: 'd', text: 'Custom Authentication trigger' }
            ],
            correctId: 'c',
            explanation: 'Pre Token Generation fires just before Cognito issues a token. It receives the request and lets you add/override claims via response.claimsOverrideDetails.claimsToAddOrOverride. This is the only trigger that can modify token content.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'What is the main difference between a Cognito User Pool and an Identity Pool?',
            options: [
              { id: 'a', text: 'User Pool stores users; Identity Pool stores AWS resources' },
              { id: 'b', text: 'User Pool handles authentication and issues JWTs; Identity Pool exchanges tokens for temporary AWS credentials' },
              { id: 'c', text: 'User Pool is for web apps; Identity Pool is for mobile apps' },
              { id: 'd', text: 'User Pool requires MFA; Identity Pool does not' }
            ],
            correctId: 'b',
            explanation: 'User Pool = AuthN (who are you?) — stores users, handles sign-up/sign-in, issues JWTs. Identity Pool = AuthZ for AWS (what can you access?) — exchanges any OIDC token (including Cognito JWT) for temporary AWS STS credentials with specific IAM role permissions.',
            difficulty: 'beginner'
          }
        ]
      }
    },

    {
      id: 'challenge-cognito',
      type: 'challenge',
      title: 'Challenge: Cognito Trigger — Post Confirmation',
      content: {
        title: 'Post Confirmation Lambda Trigger',
        description: 'Write a Cognito Post Confirmation Lambda trigger that creates a user profile in DynamoDB and sends a welcome email via SNS when a new user confirms their email address.',
        difficulty: 'intermediate',
        requirements: [
          'Extract sub, email, and name from event.request.userAttributes',
          'Create a user profile item in DynamoDB with userId=sub, role=viewer, active=True',
          'Publish a welcome message to an SNS topic (WELCOME_TOPIC_ARN env var)',
          'Log the new user creation with the user\'s email',
          'Return the event object unchanged (required by Cognito)',
          'Handle exceptions gracefully — do NOT re-raise (would block user creation)'
        ],
        starterCode: `import json
import boto3
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
table = dynamodb.Table(os.environ.get('USERS_TABLE', 'Users'))
TOPIC_ARN = os.environ.get('WELCOME_TOPIC_ARN')

def lambda_handler(event, context):
    """
    Post Confirmation Cognito Trigger.
    Fires after user confirms email.
    Must return event unchanged.
    """
    # TODO: Extract user attributes from event
    # TODO: Create DynamoDB user profile
    # TODO: Publish SNS welcome notification
    # TODO: Return event

    return event  # Always return event!`,
        language: 'python',
        hints: [
          'Access user attributes: event["request"]["userAttributes"]',
          'Use attrs.get("sub") for the unique user ID',
          'DynamoDB put_item with userId as partition key',
          'SNS publish: sns.publish(TopicArn=TOPIC_ARN, Message=..., Subject=...)',
          'Wrap in try/except — never raise in a Cognito trigger (blocks auth)'
        ],
        testCases: [
          { description: 'Extracts sub from userAttributes', keywords: ['userAttributes', 'sub'], expectedOutput: 'sub' },
          { description: 'Creates DynamoDB profile item', keywords: ['put_item', 'userId'], expectedOutput: 'put_item' },
          { description: 'Sets default role to viewer', keywords: ['viewer'], expectedOutput: 'viewer' },
          { description: 'Publishes to SNS', keywords: ['sns', 'publish'], expectedOutput: 'publish' },
          { description: 'Returns event at end', keywords: ['return event'], expectedOutput: 'return event' },
          { description: 'Uses try/except for error handling', keywords: ['try', 'except'], expectedOutput: 'except' }
        ]
      }
    },

    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 17: Amazon DynamoDB', url: 'module-10.html' }, next: { title: 'Chapter 19: Amazon SQS', url: 'module-12.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_11_DATA;
} else {
  window.MODULE_11_DATA = MODULE_11_DATA;
}
