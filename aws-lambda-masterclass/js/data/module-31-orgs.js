/**
 * MODULE 31 — AWS Organizations & Control Tower — Multi-Account Governance
 */
const MODULE_31_DATA = {
  id: 'organizations-fundamentals', moduleId: 'module-31',
  title: 'AWS Organizations & Control Tower — Multi-Account Governance',
  description: 'Master multi-account strategy. Covers OUs, SCPs, consolidated billing, Control Tower, Account Factory, guardrails, and landing zone architecture.',
  difficulty: 'intermediate', duration: '65 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master Organizations & Control Tower core concepts and architecture', 'Implement Organizations & Control Tower using Boto3 and AWS CLI', 'Troubleshoot common Organizations & Control Tower issues', 'Pass certification questions about Organizations & Control Tower'],
  sections: [
    { id: 'why', type: 'why', title: 'Why Organizations & Control Tower?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🏢</span><div class="alert-content"><div class="alert-title">Multi-Account Strategy — The AWS Well-Architected Way</div><div class="alert-text">AWS Organizations lets you centrally manage multiple AWS accounts. SCPs enforce permission guardrails. Consolidated billing reduces costs. Control Tower automates landing zone setup.</div></div></div>
      <table><thead><tr><th>Feature</th><th>Organizations</th><th>Control Tower</th><th>IAM</th></tr></thead><tbody><tr><td><strong>Scope</strong></td><td>Multi-account</td><td>Landing zone automation</td><td>Single account</td></tr><tr><td><strong>Guardrails</strong></td><td>SCPs</td><td>Preventive + Detective</td><td>IAM policies</td></tr><tr><td><strong>Billing</strong></td><td>Consolidated</td><td>Via Organizations</td><td>Per-account</td></tr><tr><td><strong>Cost</strong></td><td>Free</td><td>Free</td><td>Free</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">SCPs Don't Grant Permissions — They Only Restrict</div><div class="alert-text">SCPs set maximum permissions boundaries. Even if an IAM policy allows an action, an SCP deny overrides it. Never remove the FullAWSAccess SCP from the management account.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Organizations & Control Tower Architecture', content: { title: 'Organization: Root → OUs → Accounts', width: 750, height: 280,
      nodes: [
          { id: 'root', label: 'Root', icon: '🏢', x: 10, y: 110, type: 'security', description: 'Top of the organization hierarchy. Policies here affect all accounts.' },
          { id: 'ou-prod', label: 'OU: Production', icon: '📁', x: 200, y: 50, type: 'compute', description: 'Organizational Unit grouping production accounts.' },
          { id: 'ou-dev', label: 'OU: Development', icon: '📁', x: 200, y: 200, type: 'compute', description: 'OU for dev/sandbox accounts with relaxed SCPs.' },
          { id: 'acct1', label: 'Account: Prod', icon: '👤', x: 420, y: 50, type: 'client', description: 'Production workload account.' },
          { id: 'acct2', label: 'Account: Dev', icon: '👤', x: 420, y: 200, type: 'client', description: 'Developer sandbox account.' },
          { id: 'scp', label: 'SCPs', icon: '🔒', x: 580, y: 110, type: 'security', description: 'Service Control Policies. JSON documents that set maximum permissions.' }
      ],
      edges: [
          { from: 'root', to: 'ou-prod', label: 'Contains' },
          { from: 'root', to: 'ou-dev', label: 'Contains' },
          { from: 'ou-prod', to: 'acct1', label: 'Member' },
          { from: 'ou-dev', to: 'acct2', label: 'Member' },
          { from: 'root', to: 'scp', label: 'Enforces', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. SCPs (Service Control Policies)</h4><p>JSON documents that set maximum permissions for member accounts. SCPs don't grant permissions — they restrict what IAM policies can do.</p><h4>2. OU Structure Best Practices</h4><ul><li><strong>Security OU:</strong> Log Archive, Audit accounts</li><li><strong>Infrastructure OU:</strong> Shared services, networking</li><li><strong>Workloads OU:</strong> Production, Staging sub-OUs</li><li><strong>Sandbox OU:</strong> Developer experimentation</li></ul><h4>3. Control Tower</h4><p>Automated landing zone setup with guardrails. Account Factory provisions new accounts with baseline configs. Guardrails = preventive (SCPs) + detective (Config rules).</p>` } },
    { id: 'lambda-code', type: 'code', title: 'Organizations & Control Tower Boto3 Operations', content: { title: 'Organizations & Control Tower Management', languages: [
      { id: 'python-organizations', label: 'Core Operations',
        code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
orgs = boto3.client('organizations')

def list_accounts():
    """List all accounts in the organization."""
    paginator = orgs.get_paginator('list_accounts')
    accounts = []
    for page in paginator.paginate():
        for acct in page['Accounts']:
            accounts.append({
                'id': acct['Id'],
                'name': acct['Name'],
                'email': acct['Email'],
                'status': acct['Status']
            })
    logger.info("Found %d accounts", len(accounts))
    return accounts`,
        explanations: [
              { line: '10', text: 'list_accounts returns all member accounts with their status and email.' },
              { line: '14-18', text: 'Each account has Id, Name, Email, Status, and JoinedTimestamp.' }
        ] }
    ], defaultLang: 'python-organizations', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'Organizations & Control Tower CLI Commands', content: [
        { command: 'aws organizations list-accounts', category: 'aws-cli', expectedOutput: '{\n  "Accounts": [{"Id": "123456789012", "Name": "Production", "Email": "prod@company.com", "Status": "ACTIVE"}]\n}', explanation: 'Lists all accounts in the organization.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'Organizations & Control Tower CLI Lab', mode: 'simulated',
      initialText: 'Organizations CLI Lab. Try:\n  aws organizations describe-organization\n  aws organizations list-accounts',
      commands: {
          'aws organizations describe-organization': { text: '{\n  "Organization": {"Id": "o-abc123", "MasterAccountId": "111111111111", "FeatureSet": "ALL"}\n}', type: 'output' },
          'aws organizations list-accounts': { text: '{\n  "Accounts": [\n    {"Id": "111111111111", "Name": "Management", "Status": "ACTIVE"},\n    {"Id": "222222222222", "Name": "Production", "Status": "ACTIVE"},\n    {"Id": "333333333333", "Name": "Development", "Status": "ACTIVE"}\n  ]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'SCP blocks admin actions', error: 'Access Denied even with AdministratorAccess', cause: 'SCP deny overrides IAM allow. The SCP on the OU restricts the action.', fix: 'Check SCPs: aws organizations list-policies-for-target. Modify the SCP or move account to a different OU.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'Organizations & Control Tower Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'An IAM admin user gets AccessDenied for EC2. They have AdministratorAccess policy. Why?', options: [
              { id: 'a', text: 'IAM policy is wrong' },
              { id: 'b', text: 'An SCP on the OU denies EC2 actions' },
              { id: 'c', text: 'The account is suspended' },
              { id: 'd', text: 'EC2 is not available in the region' }
            ], correctId: 'b', explanation: 'SCPs set maximum permissions. Even AdministratorAccess IAM policy cannot override an SCP deny.', difficulty: 'advanced' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Organization Account Reporter', content: { title: 'Organization Account Reporter', description: 'List all accounts with their OU membership.', difficulty: 'intermediate',
      requirements: [
          'List all accounts',
          'Get OU for each account',
          'Return structured report'
      ],
      starterCode: `import boto3\nimport logging\norgs = boto3.client('organizations')\n\ndef lambda_handler(event, context):\n    # TODO: List accounts\n    # TODO: Get OU for each\n    pass`,
      language: 'python', hints: [
          'orgs.list_accounts()',
          'orgs.list_parents(ChildId=account_id)'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 34: Amazon OpenSearch', url: 'module-34.html' }, next: { title: 'Chapter 36: AWS IAM Identity Center', url: 'module-36.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_31_DATA; } else { window.MODULE_31_DATA = MODULE_31_DATA; }
