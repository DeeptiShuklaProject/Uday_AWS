/**
 * MODULE 36 — AWS IAM Identity Center — SSO & Workforce Identity
 */
const MODULE_36_DATA = {
  id: 'sso-admin-fundamentals', moduleId: 'module-36',
  title: 'AWS IAM Identity Center — SSO & Workforce Identity',
  description: 'Master SSO and workforce identity. Covers permission sets, AWS accounts assignment, identity sources (internal, Active Directory, external IdP), SCIM provisioning, and MFA.',
  difficulty: 'advanced', duration: '75 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master IAM Identity Center core concepts and architecture', 'Implement IAM Identity Center using Boto3 and AWS CLI', 'Troubleshoot common IAM Identity Center issues', 'Pass certification questions about IAM Identity Center'],
  sections: [
    { id: 'why', type: 'why', title: 'Why IAM Identity Center?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🔐</span><div class="alert-content"><div class="alert-title">Single Sign-On Across All AWS Accounts</div><div class="alert-text">IAM Identity Center (successor to AWS SSO) provides one place to manage workforce access to multiple AWS accounts and business applications. Users sign in once to access everything.</div></div></div>
      <table><thead><tr><th>Feature</th><th>IAM Identity Center</th><th>IAM Users</th><th>Cognito</th></tr></thead><tbody><tr><td><strong>Purpose</strong></td><td>Workforce SSO</td><td>Service access</td><td>Customer identity</td></tr><tr><td><strong>Multi-Account</strong></td><td>Built-in</td><td>Cross-account roles</td><td>N/A</td></tr><tr><td><strong>Identity Source</strong></td><td>Internal, AD, external IdP</td><td>IAM only</td><td>User pools</td></tr><tr><td><strong>Cost</strong></td><td>Free</td><td>Free</td><td>Per MAU</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">IAM Identity Center Requires AWS Organizations</div><div class="alert-text">You must have AWS Organizations enabled. Identity Center works at the organization level to manage access across all member accounts.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'IAM Identity Center Architecture', content: { title: 'SSO: Identity Source → Permission Sets → Accounts', width: 750, height: 280,
      nodes: [
          { id: 'user', label: 'User', icon: '👤', x: 10, y: 110, type: 'client', description: 'Workforce user (employee, contractor).' },
          { id: 'portal', label: 'SSO Portal', icon: '🔐', x: 200, y: 110, type: 'security', description: 'Single sign-on portal. User authenticates once.' },
          { id: 'idp', label: 'Identity Source', icon: '📋', x: 200, y: 250, type: 'storage', description: 'Internal directory, Active Directory, or external IdP (Okta, Azure AD).' },
          { id: 'perm', label: 'Permission Sets', icon: '🔑', x: 420, y: 110, type: 'security', description: 'Collection of IAM policies assigned to users/groups for specific accounts.' },
          { id: 'acct1', label: 'Account: Prod', icon: '🏢', x: 600, y: 50, type: 'compute', description: 'User gets temporary IAM role credentials.' },
          { id: 'acct2', label: 'Account: Dev', icon: '🧪', x: 600, y: 200, type: 'compute', description: 'Same user, different permissions per account.' }
      ],
      edges: [
          { from: 'user', to: 'portal', label: 'Login', animated: true },
          { from: 'idp', to: 'portal', label: 'Auth' },
          { from: 'portal', to: 'perm', label: 'Assign' },
          { from: 'perm', to: 'acct1', label: 'Admin Role' },
          { from: 'perm', to: 'acct2', label: 'Dev Role', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. Permission Sets</h4><p>Reusable collections of IAM policies. Assign to users/groups for specific AWS accounts. When a user accesses an account, they get temporary STS credentials with the permission set's policies.</p><h4>2. Identity Sources</h4><table><thead><tr><th>Source</th><th>Use When</th></tr></thead><tbody><tr><td><strong>Internal</strong></td><td>Small teams, no existing directory</td></tr><tr><td><strong>Active Directory</strong></td><td>Enterprise with AD (via AD Connector or AWS Managed AD)</td></tr><tr><td><strong>External IdP</strong></td><td>Okta, Azure AD, OneLogin (via SAML 2.0)</td></tr></tbody></table><h4>3. SCIM Provisioning</h4><p>Automatic user/group sync from external IdP. When a user is added in Okta, they auto-appear in Identity Center.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'IAM Identity Center Boto3 Operations', content: { title: 'IAM Identity Center Management', languages: [
      { id: 'python-sso-admin', label: 'Core Operations',
        code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
sso = boto3.client('sso-admin')

def list_permission_sets(instance_arn):
    """List all permission sets."""
    response = sso.list_permission_sets(InstanceArn=instance_arn)
    sets = []
    for ps_arn in response['PermissionSets']:
        detail = sso.describe_permission_set(
            InstanceArn=instance_arn,
            PermissionSetArn=ps_arn
        )
        ps = detail['PermissionSet']
        sets.append({
            'name': ps['Name'],
            'arn': ps_arn,
            'duration': ps.get('SessionDuration', 'PT1H')
        })
    logger.info("Found %d permission sets", len(sets))
    return sets`,
        explanations: [
              { line: '10', text: 'list_permission_sets returns ARNs. Call describe_permission_set for details.' },
              { line: '21', text: 'SessionDuration controls how long the temporary credentials last (ISO 8601 format).' }
        ] }
    ], defaultLang: 'python-sso-admin', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'IAM Identity Center CLI Commands', content: [
        { command: 'aws sso-admin list-instances', category: 'aws-cli', expectedOutput: '{\n  "Instances": [{"InstanceArn": "arn:aws:sso:::instance/ssoins-123", "IdentityStoreId": "d-123456"}]\n}', explanation: 'Gets the SSO instance ARN needed for all other API calls.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'IAM Identity Center CLI Lab', mode: 'simulated',
      initialText: 'Identity Center CLI Lab. Try:\n  aws sso-admin list-instances\n  aws sso-admin list-permission-sets --instance-arn arn',
      commands: {
          'aws sso-admin list-instances': { text: '{\n  "Instances": [{"InstanceArn": "arn:aws:sso:::instance/ssoins-123", "IdentityStoreId": "d-123456"}]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'User cannot access account', error: 'User doesn\'t see the account in SSO portal', cause: 'Permission set not assigned to user/group for that account.', fix: 'Assign the permission set: aws sso-admin create-account-assignment. Check both user AND group assignments.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'IAM Identity Center Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'What replaces AWS SSO?', options: [
              { id: 'a', text: 'IAM roles' },
              { id: 'b', text: 'AWS IAM Identity Center (same service, renamed)' },
              { id: 'c', text: 'Cognito' },
              { id: 'd', text: 'Active Directory' }
            ], correctId: 'b', explanation: 'AWS SSO was renamed to IAM Identity Center in 2022. Same service, same APIs, new name.', difficulty: 'beginner' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: SSO Access Report', content: { title: 'SSO Access Report', description: 'List all permission sets and their account assignments.', difficulty: 'intermediate',
      requirements: [
          'List permission sets',
          'Get account assignments per set',
          'Return access matrix'
      ],
      starterCode: `import boto3\nsso = boto3.client('sso-admin')\n\ndef lambda_handler(event, context):\n    # TODO: List permission sets\n    # TODO: Get assignments\n    pass`,
      language: 'python', hints: [
          'sso.list_permission_sets(InstanceArn=...)',
          'sso.list_account_assignments(InstanceArn=..., AccountId=..., PermissionSetArn=...)'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Module 35: AWS Step Functions', url: 'module-35.html' }, next: { title: 'Module 37: Amazon Bedrock & GenAI', url: 'module-37.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_36_DATA; } else { window.MODULE_36_DATA = MODULE_36_DATA; }
