/**
 * MODULE 45 — AWS Security Hub — Centralized Security
 */
const MODULE_45_DATA = {
  id: 'securityhub-fundamentals', moduleId: 'module-45',
  title: 'AWS Security Hub — Centralized Security Posture',
  description: 'Master security operations. Covers Security Hub standards (FSBP, CIS), aggregated findings from GuardDuty/Inspector/Config, compliance scoring, automated remediation, and multi-account management.',
  difficulty: 'intermediate', duration: '55 min',
  prerequisites: ['Module 43: Amazon GuardDuty', 'Module 44: Amazon Inspector'],
  objectives: ['Enable Security Hub with compliance standards', 'Understand ASFF finding format', 'Aggregate findings from multiple security services', 'Calculate and improve compliance scores', 'Set up automated remediation workflows', 'Configure multi-account security management'],
  sections: [
    { id: 'why', type: 'why', title: 'Why Security Hub?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#127963;&#65039;</span><div class="alert-content"><div class="alert-title">One Dashboard for All Security Findings</div><div class="alert-text">Security Hub aggregates findings from GuardDuty (threats), Inspector (vulnerabilities), Config (compliance), Firewall Manager, IAM Access Analyzer, and third-party tools into a single dashboard with compliance scoring.</div></div></div>
      <h4>Integrated Services</h4>
      <table><thead><tr><th>Service</th><th>What It Sends</th><th>Finding Type</th></tr></thead><tbody>
        <tr><td><strong>GuardDuty</strong></td><td>Threat findings</td><td>UnauthorizedAccess, CryptoCurrency</td></tr>
        <tr><td><strong>Inspector</strong></td><td>Vulnerability findings</td><td>CVE assessments</td></tr>
        <tr><td><strong>Config</strong></td><td>Compliance findings</td><td>Non-compliant resources</td></tr>
        <tr><td><strong>IAM Access Analyzer</strong></td><td>External access findings</td><td>Public/cross-account access</td></tr>
        <tr><td><strong>Firewall Manager</strong></td><td>Firewall policy findings</td><td>Non-compliant firewalls</td></tr>
      </tbody></table>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Security Hub Architecture', content: { title: 'Services &rarr; Security Hub &rarr; Findings + Compliance', width: 700, height: 280,
      nodes: [
        { id: 'gd', label: 'GuardDuty', icon: '&#128737;&#65039;', x: 10, y: 40, type: 'security', description: 'Sends threat detection findings.' },
        { id: 'insp', label: 'Inspector', icon: '&#128270;', x: 10, y: 130, type: 'security', description: 'Sends vulnerability findings.' },
        { id: 'config', label: 'Config', icon: '&#128203;', x: 10, y: 220, type: 'security', description: 'Sends compliance rule findings.' },
        { id: 'hub', label: 'Security Hub', icon: '&#127963;&#65039;', x: 280, y: 130, type: 'security', description: 'Aggregates all findings in ASFF format. Runs compliance checks against standards (FSBP, CIS).' },
        { id: 'dash', label: 'Dashboard', icon: '&#128202;', x: 500, y: 60, type: 'monitoring', description: 'Security score, compliance percentage, finding trends.' },
        { id: 'eb', label: 'EventBridge', icon: '&#128268;', x: 500, y: 200, type: 'compute', description: 'Auto-remediation: Security Hub finding event triggers Lambda.' }
      ],
      edges: [
        { from: 'gd', to: 'hub', label: 'Findings' },
        { from: 'insp', to: 'hub', label: 'Findings' },
        { from: 'config', to: 'hub', label: 'Findings' },
        { from: 'hub', to: 'dash', label: 'Score', animated: true },
        { from: 'hub', to: 'eb', label: 'Events' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Security Standards</h4>
      <table><thead><tr><th>Standard</th><th>Focus</th><th>Controls</th></tr></thead><tbody>
        <tr><td><strong>AWS FSBP</strong></td><td>AWS security best practices</td><td>~200 controls</td></tr>
        <tr><td><strong>CIS AWS Foundations</strong></td><td>CIS benchmarks</td><td>~50 controls</td></tr>
        <tr><td><strong>PCI DSS</strong></td><td>Payment card compliance</td><td>~150 controls</td></tr>
        <tr><td><strong>NIST 800-53</strong></td><td>Federal security</td><td>~200+ controls</td></tr>
      </tbody></table>
      <h4>2. ASFF (AWS Security Finding Format)</h4>
      <p>Standardized JSON format for all security findings. Key fields: Id, ProductArn, GeneratorId, Severity, Title, Description, Resources, Remediation, Compliance.</p>
      <h4>3. Security Score</h4>
      <p>Percentage of controls that are passing (PASSED / (PASSED + FAILED)). Target: 90%+. Score excludes suppressed and unknown status controls.</p>
      <h4>4. Finding Workflow</h4>
      <ul>
        <li><strong>NEW</strong> &mdash; Just detected, needs investigation</li>
        <li><strong>NOTIFIED</strong> &mdash; Alert sent to team</li>
        <li><strong>RESOLVED</strong> &mdash; Issue fixed</li>
        <li><strong>SUPPRESSED</strong> &mdash; Accepted risk (won't alert again)</li>
      </ul>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'Security Hub Boto3', content: { title: 'Security Hub Operations', languages: [
      { id: 'python-sechub', label: 'Core Operations',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\nsh = boto3.client('securityhub')\n\ndef get_compliance_score():\n    """Get overall compliance score for enabled standards."""\n    standards = sh.get_enabled_standards()['StandardsSubscriptions']\n    results = []\n    for std in standards:\n        controls = sh.describe_standards_controls(\n            StandardsSubscriptionArn=std['StandardsSubscriptionArn']\n        )['Controls']\n        passed = sum(1 for c in controls if c['ComplianceStatus'] == 'PASSED')\n        failed = sum(1 for c in controls if c['ComplianceStatus'] == 'FAILED')\n        total = passed + failed\n        score = round(passed / total * 100, 1) if total > 0 else 0\n        results.append({'standard': std['StandardsArn'].split('/')[-1], 'score': score, 'passed': passed, 'failed': failed})\n        logger.info("%s: %s%% (%d/%d)", results[-1]['standard'], score, passed, total)\n    return results\n\ndef get_critical_findings(max_results=20):\n    """Get critical and high severity findings."""\n    response = sh.get_findings(\n        Filters={'SeverityLabel': [{'Value': 'CRITICAL', 'Comparison': 'EQUALS'}], 'WorkflowStatus': [{'Value': 'NEW', 'Comparison': 'EQUALS'}]},\n        MaxResults=max_results,\n        SortCriteria=[{'Field': 'SeverityNormalized', 'SortOrder': 'desc'}]\n    )\n    return response['Findings']`,
        explanations: [
          { line: '9-20', text: 'Compliance score = PASSED / (PASSED + FAILED). Aim for 90%+ on all enabled standards.' },
          { line: '23-30', text: 'Filter for CRITICAL + NEW findings. These are unresolved critical issues requiring immediate action.' }
        ] }
    ], defaultLang: 'python-sechub', expectedOutput: 'FSBP: 87.5% (140/160)' } },
    { id: 'cli-commands', type: 'command', title: 'Security Hub CLI', content: [
      { command: 'aws securityhub get-findings --filters \'{"SeverityLabel": [{"Value": "CRITICAL", "Comparison": "EQUALS"}]}\' --max-items 5', category: 'aws-cli', expectedOutput: '{\n  "Findings": [{\n    "Title": "S3 bucket should have encryption enabled",\n    "SeverityLabel": "CRITICAL",\n    "ComplianceStatus": "FAILED",\n    "Remediation": {"Recommendation": {"Text": "Enable SSE-S3 or SSE-KMS"}}\n  }]\n}', explanation: 'Get critical findings. Each finding includes title, severity, affected resource, and remediation guidance.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'Security Hub CLI Lab', mode: 'simulated',
      initialText: 'Security Hub Lab. Try:\n  aws securityhub get-enabled-standards\n  aws securityhub describe-hub',
      commands: {
        'aws securityhub get-enabled-standards': { text: '{\n  "StandardsSubscriptions": [\n    {"StandardsArn": "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.4.0", "StandardsStatus": "READY"},\n    {"StandardsArn": "arn:aws:securityhub:us-east-1::standards/aws-foundational-security-best-practices/v/1.0.0", "StandardsStatus": "READY"}\n  ]\n}', type: 'output' },
        'aws securityhub describe-hub': { text: '{\n  "HubArn": "arn:aws:securityhub:us-east-1:123456789012:hub/default",\n  "AutoEnableControls": true\n}', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Centralized Security', content: {
      title: 'Enable Security Hub and Assess Compliance',
      description: 'Enable Security Hub with FSBP and CIS standards, review compliance scores, and investigate findings.',
      difficulty: 'intermediate', duration: '20 min',
      objectives: ['Enable Security Hub', 'Enable compliance standards', 'Review compliance score', 'Investigate failing controls'],
      steps: [
        { title: 'Enable Security Hub', instructions: 'Security Hub Console > Go to Security Hub > Enable.\nSelect standards: AWS FSBP + CIS AWS Foundations.', validation: 'Security Hub enabled with standards' },
        { title: 'Wait for Initial Assessment', instructions: 'Security Hub runs initial compliance checks (takes 15-30 minutes).\nView the Summary dashboard for compliance scores.', validation: 'Compliance scores appear (e.g., FSBP: 85%)' },
        { title: 'View Aggregated Findings', instructions: 'Findings tab > See GuardDuty + Inspector + Config findings in one place.\nFilter by severity, resource type, or source.', validation: 'Findings from multiple services visible in one dashboard' },
        { title: 'Fix a Failing Control', instructions: 'Security standards > View failing controls.\nClick a failed control > See remediation guidance.\nFix the issue (e.g., enable S3 encryption).', validation: 'Control status changes to PASSED after fix' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Low compliance score', error: 'FSBP score below 80%', cause: 'Many default-configured resources without security hardening.', fix: 'Focus on CRITICAL and HIGH severity failures first. Common quick wins: enable S3 encryption, block public access, enable CloudTrail, enable VPC Flow Logs.' },
      { title: 'No findings from GuardDuty', error: 'Security Hub shows no GuardDuty findings', cause: 'GuardDuty not enabled, or integration not configured.', fix: 'Enable GuardDuty first. Security Hub automatically integrates once both are enabled in the same region.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'Security Hub Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'What does Security Hub aggregate?', options: [
        { id: 'a', text: 'Only GuardDuty findings' },
        { id: 'b', text: 'Findings from GuardDuty, Inspector, Config, IAM Access Analyzer, and third-party tools' },
        { id: 'c', text: 'Only compliance data' },
        { id: 'd', text: 'Only vulnerability data' }
      ], correctId: 'b', explanation: 'Security Hub is the central aggregation point for findings from multiple AWS security services and supported third-party products, all in standardized ASFF format.', difficulty: 'beginner' },
      { id: 'q2', question: 'What is ASFF?', options: [
        { id: 'a', text: 'A programming language' },
        { id: 'b', text: 'AWS Security Finding Format — standardized JSON format for all findings' },
        { id: 'c', text: 'An encryption algorithm' },
        { id: 'd', text: 'A firewall rule format' }
      ], correctId: 'b', explanation: 'ASFF (AWS Security Finding Format) is the standardized JSON schema that all findings use in Security Hub, regardless of their source. This enables consistent processing and automation.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Security Posture Report', content: { title: 'Compliance Dashboard Generator', description: 'Build a function that generates a compliance posture report across all enabled standards.', difficulty: 'advanced',
      starterCode: `import boto3\n\ndef security_posture():\n    """Generate security posture report.\n    Return: {'overall_score': float, 'standards': [...], 'critical_findings': int}\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\n\ndef security_posture():\n    sh = boto3.client('securityhub')\n    stds = sh.get_enabled_standards()['StandardsSubscriptions']\n    total_p = total_f = 0\n    standards = []\n    for s in stds:\n        controls = sh.describe_standards_controls(StandardsSubscriptionArn=s['StandardsSubscriptionArn'])['Controls']\n        p = sum(1 for c in controls if c['ComplianceStatus'] == 'PASSED')\n        f = sum(1 for c in controls if c['ComplianceStatus'] == 'FAILED')\n        total_p += p; total_f += f\n        standards.append({'name': s['StandardsArn'].split('/')[-2], 'score': round(p/(p+f)*100,1) if p+f else 0})\n    critical = sh.get_findings(Filters={'SeverityLabel': [{'Value': 'CRITICAL', 'Comparison': 'EQUALS'}], 'WorkflowStatus': [{'Value': 'NEW', 'Comparison': 'EQUALS'}]}, MaxResults=1)\n    return {'overall_score': round(total_p/(total_p+total_f)*100,1) if total_p+total_f else 0, 'standards': standards, 'critical_findings': len(critical.get('Findings', []))}`,
      testCases: [{ description: 'Returns posture report', expectedBehavior: 'Output has overall_score, standards list, critical_findings count' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<ol><li>Disable standards if testing only</li><li>Disable Security Hub</li></ol><pre><code>aws securityhub disable-security-hub</code></pre>` } },
    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'AWS Security Hub', nextModule: { title: 'AWS Resource Access Manager', href: 'module-46.html' }, message: 'Next: share AWS resources across accounts.' } }
  ]
};
