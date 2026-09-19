/**
 * MODULE 43 — Amazon GuardDuty — Threat Detection
 */
const MODULE_43_DATA = {
  id: 'guardduty-fundamentals', moduleId: 'module-43',
  title: 'Amazon GuardDuty — Intelligent Threat Detection',
  description: 'Master threat detection. Covers GuardDuty data sources, finding types, severity levels, multi-account management, automated remediation, and integration with Security Hub.',
  difficulty: 'intermediate', duration: '55 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 26: AWS CloudTrail'],
  objectives: ['Enable and configure GuardDuty', 'Understand finding types and severity levels', 'Investigate and respond to threats', 'Set up automated remediation with EventBridge', 'Configure multi-account GuardDuty', 'Integrate with Security Hub and SNS'],
  sections: [
    { id: 'why', type: 'why', title: 'Why GuardDuty?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#128737;&#65039;</span><div class="alert-content"><div class="alert-title">Continuous Threat Detection Without Agents</div><div class="alert-text">GuardDuty uses ML and threat intelligence to analyze VPC Flow Logs, DNS logs, CloudTrail events, and S3 data events. It detects unauthorized access, compromised instances, crypto mining, and data exfiltration — all without deploying any agents.</div></div></div>
      <h4>Data Sources</h4>
      <table><thead><tr><th>Source</th><th>What It Detects</th><th>Example Finding</th></tr></thead><tbody>
        <tr><td><strong>VPC Flow Logs</strong></td><td>Network anomalies</td><td>Bitcoin mining traffic, port scanning</td></tr>
        <tr><td><strong>DNS Logs</strong></td><td>DNS exfiltration</td><td>Queries to known C2 domains</td></tr>
        <tr><td><strong>CloudTrail Events</strong></td><td>API abuse</td><td>Root account usage, unusual API calls</td></tr>
        <tr><td><strong>S3 Data Events</strong></td><td>S3 threats</td><td>Anomalous data access patterns</td></tr>
        <tr><td><strong>EKS Audit Logs</strong></td><td>K8s threats</td><td>Privileged container, anomalous API</td></tr>
      </tbody></table>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'GuardDuty Architecture', content: { title: 'Data Sources &rarr; ML Analysis &rarr; Findings', width: 700, height: 260,
      nodes: [
        { id: 'flow', label: 'VPC Flow Logs', icon: '&#128466;', x: 10, y: 40, type: 'network', description: 'Network traffic metadata (not content). Detects port scans, bitcoin mining, C2 communication.' },
        { id: 'dns', label: 'DNS Logs', icon: '&#127760;', x: 10, y: 120, type: 'network', description: 'DNS queries. Detects communication with known malicious domains.' },
        { id: 'ct', label: 'CloudTrail', icon: '&#128203;', x: 10, y: 200, type: 'storage', description: 'API calls. Detects credential abuse, unusual resource creation, root account usage.' },
        { id: 'gd', label: 'GuardDuty', icon: '&#128737;&#65039;', x: 280, y: 120, type: 'security', description: 'ML models + threat intelligence feeds. Analyzes all sources continuously. Generates findings with severity.' },
        { id: 'finding', label: 'Findings', icon: '&#9888;&#65039;', x: 480, y: 60, type: 'monitoring', description: 'Finding types: Recon, UnauthorizedAccess, Backdoor, CryptoCurrency, Trojan.' },
        { id: 'eb', label: 'EventBridge', icon: '&#128268;', x: 480, y: 190, type: 'compute', description: 'Auto-remediation: EventBridge rule triggers Lambda to isolate instance, revoke credentials, etc.' }
      ],
      edges: [
        { from: 'flow', to: 'gd', label: 'Analyze' },
        { from: 'dns', to: 'gd', label: 'Analyze' },
        { from: 'ct', to: 'gd', label: 'Analyze' },
        { from: 'gd', to: 'finding', label: 'Generate', animated: true },
        { from: 'gd', to: 'eb', label: 'Event', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Finding Types</h4>
      <table><thead><tr><th>Category</th><th>Example</th><th>Severity</th></tr></thead><tbody>
        <tr><td><strong>Recon</strong></td><td>Recon:EC2/PortProbeUnprotectedPort</td><td>Low</td></tr>
        <tr><td><strong>UnauthorizedAccess</strong></td><td>UnauthorizedAccess:EC2/RDPBruteForce</td><td>Medium-High</td></tr>
        <tr><td><strong>CryptoCurrency</strong></td><td>CryptoCurrency:EC2/BitcoinTool.B!DNS</td><td>High</td></tr>
        <tr><td><strong>Backdoor</strong></td><td>Backdoor:EC2/C&CActivity.B</td><td>High</td></tr>
        <tr><td><strong>Trojan</strong></td><td>Trojan:EC2/DriveBySourceTraffic!DNS</td><td>High</td></tr>
      </tbody></table>
      <h4>2. Severity Levels</h4>
      <ul>
        <li><strong>Low (1.0-3.9)</strong> &mdash; Informational. Investigate when time permits.</li>
        <li><strong>Medium (4.0-6.9)</strong> &mdash; Suspicious activity. Investigate soon.</li>
        <li><strong>High (7.0-8.9)</strong> &mdash; Active threat. Investigate immediately. Potential compromise.</li>
      </ul>
      <h4>3. Automated Remediation Pattern</h4>
      <p>GuardDuty finding &rarr; EventBridge rule &rarr; Lambda function &rarr; Isolate instance (modify security group to deny all traffic) or revoke IAM credentials.</p>
      <h4>4. Multi-Account</h4>
      <p>Delegated administrator in security account. All member accounts send findings to the admin account. Use with Organizations for automatic enrollment.</p>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'GuardDuty Boto3', content: { title: 'GuardDuty Management', languages: [
      { id: 'python-gd', label: 'Core Operations',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\ngd = boto3.client('guardduty')\n\ndef list_high_severity_findings(detector_id):\n    """Get all HIGH severity GuardDuty findings."""\n    criteria = {'severity': {'Gte': 7.0}}\n    response = gd.list_findings(\n        DetectorId=detector_id,\n        FindingCriteria={'Criterion': {'severity': {'Gte': 7}}},\n        SortCriteria={'AttributeName': 'severity', 'OrderBy': 'DESC'}\n    )\n    if response['FindingIds']:\n        findings = gd.get_findings(DetectorId=detector_id, FindingIds=response['FindingIds'])\n        for f in findings['Findings']:\n            logger.warning("HIGH: %s | %s | Severity: %s",\n                f['Type'], f['Title'], f['Severity'])\n        return findings['Findings']\n    return []\n\ndef auto_remediate_compromised_instance(finding):\n    """Auto-remediation: isolate compromised EC2 instance."""\n    ec2 = boto3.client('ec2')\n    instance_id = finding['Resource']['InstanceDetails']['InstanceId']\n    # Create isolation security group (deny all)\n    vpc_id = finding['Resource']['InstanceDetails']['NetworkInterfaces'][0]['VpcId']\n    sg = ec2.create_security_group(\n        GroupName=f'isolation-{instance_id}',\n        Description='GuardDuty auto-isolation',\n        VpcId=vpc_id\n    )\n    # Replace all SGs with isolation SG\n    ec2.modify_instance_attribute(\n        InstanceId=instance_id,\n        Groups=[sg['GroupId']]\n    )\n    logger.warning("ISOLATED instance %s with SG %s", instance_id, sg['GroupId'])`,
        explanations: [
          { line: '10-14', text: 'Filter findings by severity >= 7 (HIGH). Sort by severity descending to see worst first.' },
          { line: '24-38', text: 'Auto-remediation pattern: replace instance security groups with an empty isolation SG. Instance loses all network access but stays running for forensics.' }
        ] }
    ], defaultLang: 'python-gd', expectedOutput: 'HIGH: CryptoCurrency:EC2/BitcoinTool.B!DNS | Severity: 8' } },
    { id: 'cli-commands', type: 'command', title: 'GuardDuty CLI', content: [
      { command: 'aws guardduty list-detectors', category: 'aws-cli', expectedOutput: '{\n  "DetectorIds": ["abc123def456"]\n}', explanation: 'List GuardDuty detector IDs. Each account/region has one detector.' },
      { command: 'aws guardduty create-sample-findings --detector-id $DETECTOR_ID --finding-types "UnauthorizedAccess:EC2/RDPBruteForce"', category: 'aws-cli', expectedOutput: '(no output = success)', explanation: 'Generate sample findings for testing. Useful for building and testing remediation workflows.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'GuardDuty CLI Lab', mode: 'simulated',
      initialText: 'GuardDuty Lab. Try:\n  aws guardduty list-detectors\n  aws guardduty get-findings --detector-id abc123 --finding-ids fid-001',
      commands: {
        'aws guardduty list-detectors': { text: '{\n  "DetectorIds": ["abc123def456"]\n}', type: 'output' },
        'aws guardduty get-findings --detector-id abc123 --finding-ids fid-001': { text: '{\n  "Findings": [{\n    "Type": "UnauthorizedAccess:EC2/RDPBruteForce",\n    "Severity": 8,\n    "Title": "EC2 instance i-0abc is target of RDP brute force attack",\n    "Resource": {"InstanceDetails": {"InstanceId": "i-0abc123"}}\n  }]\n}', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Threat Detection', content: {
      title: 'Enable GuardDuty and Investigate Findings',
      description: 'Enable GuardDuty, generate sample findings, investigate a HIGH severity finding, and set up automated alerting.',
      difficulty: 'beginner', duration: '20 min',
      objectives: ['Enable GuardDuty', 'Generate sample findings', 'Investigate a finding', 'Set up SNS alerting'],
      steps: [
        { title: 'Enable GuardDuty', instructions: 'GuardDuty Console > Get Started > Enable GuardDuty.', validation: 'GuardDuty dashboard shows "Enabled"' },
        { title: 'Generate Sample Findings', instructions: 'Settings > Generate sample findings.\nWait 1-2 minutes for findings to appear.', validation: 'Sample findings appear in the findings list' },
        { title: 'Investigate HIGH Finding', instructions: 'Filter by severity: High.\nClick a finding > Review:\n- Actor information\n- Resource affected\n- Action details\n- Recommendation', validation: 'Can identify: who, what, when, where, and recommended action' },
        { title: 'Create EventBridge Alert', instructions: 'EventBridge > Create rule.\nEvent pattern: source = aws.guardduty.\nTarget: SNS topic > email.', validation: 'Email received when new finding is generated' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'No findings after enabling', error: 'GuardDuty enabled but no findings appear', cause: 'GuardDuty analyzes over time. It may take 24-48 hours to detect real threats.', fix: 'Use "Generate sample findings" for testing. Real findings appear as threats are detected. This is not real-time for all threat types.' },
      { title: 'False positive findings', error: 'Legitimate activity flagged as threat', cause: 'GuardDuty ML baseline not calibrated, or known trusted IPs flagged.', fix: 'Add trusted IPs to the Trusted IP List. Suppress specific finding types. Archive false positives — GuardDuty learns from this.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'GuardDuty Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'Does GuardDuty require installing agents on EC2?', options: [
        { id: 'a', text: 'Yes, GuardDuty agent is required' },
        { id: 'b', text: 'No — it analyzes VPC Flow Logs, DNS logs, and CloudTrail without agents' },
        { id: 'c', text: 'Only for EKS' },
        { id: 'd', text: 'Only for Windows instances' }
      ], correctId: 'b', explanation: 'GuardDuty is agentless for EC2. It analyzes network flow logs, DNS logs, and CloudTrail events without any software on the instance. EKS Runtime Monitoring does use an agent (add-on).', difficulty: 'beginner' },
      { id: 'q2', question: 'How do you auto-remediate a GuardDuty finding?', options: [
        { id: 'a', text: 'GuardDuty auto-remediates automatically' },
        { id: 'b', text: 'EventBridge rule catches GuardDuty event, triggers Lambda for remediation' },
        { id: 'c', text: 'Not possible — manual only' },
        { id: 'd', text: 'Use AWS Config auto-remediation' }
      ], correctId: 'b', explanation: 'GuardDuty detects but does NOT remediate. Use EventBridge to catch GuardDuty finding events, then trigger Lambda to isolate instances, revoke credentials, or notify the security team.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Threat Summary', content: { title: 'GuardDuty Threat Dashboard', description: 'Build a function that summarizes all active findings by severity and type.', difficulty: 'intermediate',
      starterCode: `import boto3\n\ndef threat_summary(detector_id):\n    """Summarize findings by severity and type.\n    Return: {'high': [types], 'medium': [types], 'low': [types], 'total': int}\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\n\ndef threat_summary(detector_id):\n    gd = boto3.client('guardduty')\n    ids = gd.list_findings(DetectorId=detector_id, FindingCriteria={'Criterion': {'service.archived': {'Eq': ['false']}}})['FindingIds']\n    summary = {'high': [], 'medium': [], 'low': [], 'total': len(ids)}\n    if ids:\n        findings = gd.get_findings(DetectorId=detector_id, FindingIds=ids[:50])['Findings']\n        for f in findings:\n            bucket = 'high' if f['Severity'] >= 7 else 'medium' if f['Severity'] >= 4 else 'low'\n            summary[bucket].append(f['Type'])\n    return summary`,
      testCases: [{ description: 'Groups findings by severity', expectedBehavior: 'Output has high, medium, low arrays and total count' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<ol><li>Archive sample findings</li><li>If testing only: disable GuardDuty (Settings > Disable)</li></ol><pre><code>aws guardduty delete-detector --detector-id $DETECTOR_ID</code></pre><p><strong>Warning:</strong> In production, never disable GuardDuty. It provides continuous threat detection.</p>` } },
    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'Amazon GuardDuty', nextModule: { title: 'Amazon Inspector', href: 'module-44.html' }, message: 'Next: vulnerability scanning for EC2, ECR, and Lambda.' } }
  ]
};
