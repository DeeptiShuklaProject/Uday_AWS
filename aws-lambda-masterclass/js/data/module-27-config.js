/**
 * MODULE 27 — AWS Config — Resource Configuration Compliance
 */
const MODULE_27_DATA = {
  id: 'config-fundamentals', moduleId: 'module-27',
  title: 'AWS Config — Resource Configuration Compliance',
  description: 'Master resource compliance. Covers Config rules (managed and custom), conformance packs, remediation actions, configuration timeline, and multi-account aggregation.',
  difficulty: 'intermediate', duration: '70 min', prerequisites: ['Module 01: AWS IAM', 'Module 26: AWS CloudTrail'],
  objectives: ['Enable AWS Config to record resource configurations', 'Create managed and custom Config rules', 'Set up automatic remediation with SSM Automation', 'Use conformance packs for compliance frameworks', 'Aggregate compliance across multiple accounts', 'Query resource configuration history'],
  sections: [
    { id: 'why-config', type: 'why', title: 'Why Config?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">✅</span><div class="alert-content"><div class="alert-title">Continuous Compliance — Is Every Resource Configured Correctly?</div><div class="alert-text">AWS Config continuously monitors and records resource configurations, letting you automate compliance checking. It answers: "Is this S3 bucket public? Is encryption enabled on all volumes?"</div></div></div>
      <table><thead><tr><th>Feature</th><th>AWS Config</th><th>CloudTrail</th><th>Security Hub</th></tr></thead><tbody>
        <tr><td><strong>Focus</strong></td><td>Resource configuration state</td><td>API call history</td><td>Security findings</td></tr>
        <tr><td><strong>Question</strong></td><td>Is this resource compliant?</td><td>Who changed this?</td><td>What issues exist?</td></tr>
        <tr><td><strong>Automation</strong></td><td>Auto-remediation</td><td>Log delivery</td><td>Findings workflow</td></tr>
      </tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Config Charges Per Item Recorded</div><div class="alert-text">AWS Config charges $0.003 per configuration item. In large accounts with frequent changes, costs add up. Filter resource types to record only what you need.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Config Architecture', content: { title: 'Record → Evaluate → Remediate', width: 750, height: 280,
      nodes: [
        { id: 'resource', label: 'AWS Resources', icon: '☁️', x: 10, y: 110, type: 'compute', description: 'EC2, S3, RDS, VPC. Every supported resource is tracked.' },
        { id: 'recorder', label: 'Config Recorder', icon: '📹', x: 200, y: 110, type: 'security', description: 'Records configuration changes and stores config items.' },
        { id: 'rule', label: 'Config Rules', icon: '✅', x: 400, y: 50, type: 'security', description: 'Evaluates resources. 200+ managed rules or custom Lambda rules.' },
        { id: 'remediate', label: 'Auto-Remediation', icon: '🔧', x: 400, y: 200, type: 'compute', description: 'SSM Automation triggered on NON_COMPLIANT resources.' },
        { id: 'dash', label: 'Dashboard', icon: '📊', x: 580, y: 110, type: 'storage', description: 'Compliance dashboard with conformance packs and aggregated views.' }
      ],
      edges: [
        { from: 'resource', to: 'recorder', label: 'Changes', animated: true },
        { from: 'recorder', to: 'rule', label: 'Evaluate' },
        { from: 'rule', to: 'remediate', label: 'NON_COMPLIANT' },
        { from: 'rule', to: 'dash', label: 'Report', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Config Rules</h4><table><thead><tr><th>Type</th><th>What</th><th>Example</th></tr></thead><tbody>
        <tr><td><strong>Managed</strong></td><td>AWS-provided (200+)</td><td>s3-bucket-public-read-prohibited, encrypted-volumes</td></tr>
        <tr><td><strong>Custom</strong></td><td>Your Lambda evaluates compliance</td><td>Check required tags on EC2</td></tr>
      </tbody></table>
      <h4>2. Evaluation Triggers</h4><ul><li><strong>Configuration change:</strong> Rule runs when resource changes</li><li><strong>Periodic:</strong> 1h, 3h, 6h, 12h, 24h intervals</li></ul>
      <h4>3. Conformance Packs</h4><p>Collection of rules + remediation for compliance frameworks: CIS Benchmarks, PCI DSS, HIPAA, NIST 800-53. Deploy an entire framework with one command.</p>
      <h4>4. Multi-Account Aggregation</h4><p>Aggregate compliance from multiple accounts into a single dashboard. Essential for enterprise governance.</p>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'Config Boto3 Operations', content: { title: 'Compliance Queries', languages: [
      { id: 'python-config', label: 'Compliance Check',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\nconfig = boto3.client('config')\n\ndef get_compliance_summary():\n    """Get compliance summary across all rules."""\n    response = config.get_compliance_summary_by_config_rule()\n    summary = response['ComplianceSummary']\n    compliant = summary.get('CompliantResourceCount', {}).get('CappedCount', 0)\n    non_compliant = summary.get('NonCompliantResourceCount', {}).get('CappedCount', 0)\n    logger.info("Compliant: %d, Non-compliant: %d", compliant, non_compliant)\n    return {'compliant': compliant, 'non_compliant': non_compliant}\n\n\ndef get_non_compliant_resources(rule_name):\n    """Get resources failing a specific Config rule."""\n    response = config.get_compliance_details_by_config_rule(\n        ConfigRuleName=rule_name,\n        ComplianceTypes=['NON_COMPLIANT']\n    )\n    resources = []\n    for result in response['EvaluationResults']:\n        qualifier = result['EvaluationResultIdentifier']['EvaluationResultQualifier']\n        resources.append({\n            'type': qualifier['ResourceType'],\n            'id': qualifier['ResourceId'],\n            'annotation': result.get('Annotation', '')\n        })\n        logger.warning("NON_COMPLIANT: %s %s", qualifier['ResourceType'], qualifier['ResourceId'])\n    return resources`,
        explanations: [
          { line: '11', text: 'get_compliance_summary_by_config_rule returns total compliant vs non-compliant counts across all rules.' },
          { line: '21-23', text: 'Filter by NON_COMPLIANT to find failing resources. Each result has resource type, ID, and annotation.' }
        ] }
    ], defaultLang: 'python-config', expectedOutput: 'Compliant: 142, Non-compliant: 8' } },
    { id: 'cli-commands', type: 'command', title: 'Config CLI Commands', content: [
      { command: 'aws configservice get-compliance-summary-by-config-rule', category: 'aws-cli', expectedOutput: '{\n  "ComplianceSummary": {\n    "CompliantResourceCount": {"CappedCount": 142},\n    "NonCompliantResourceCount": {"CappedCount": 8}\n  }\n}', explanation: 'Quick compliance overview across all rules.' },
      { command: 'aws configservice describe-compliance-by-config-rule', category: 'aws-cli', expectedOutput: '{\n  "ComplianceByConfigRules": [\n    {"ConfigRuleName": "s3-bucket-public-read-prohibited", "Compliance": {"ComplianceType": "COMPLIANT"}},\n    {"ConfigRuleName": "encrypted-volumes", "Compliance": {"ComplianceType": "NON_COMPLIANT"}}\n  ]\n}', explanation: 'Per-rule compliance status.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'Config CLI Lab', mode: 'simulated',
      initialText: 'AWS Config CLI Lab. Try:\n  aws configservice describe-config-rules\n  aws configservice get-compliance-summary-by-config-rule',
      commands: {
        'aws configservice describe-config-rules': { text: '{\n  "ConfigRules": [\n    {"ConfigRuleName": "s3-bucket-public-read-prohibited", "Source": {"Owner": "AWS"}, "ConfigRuleState": "ACTIVE"},\n    {"ConfigRuleName": "encrypted-volumes", "Source": {"Owner": "AWS"}, "ConfigRuleState": "ACTIVE"}\n  ]\n}', type: 'output' },
        'aws configservice get-compliance-summary-by-config-rule': { text: '{\n  "ComplianceSummary": {"CompliantResourceCount": {"CappedCount": 142}, "NonCompliantResourceCount": {"CappedCount": 8}}\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Recorder not recording', error: 'No configuration items captured', cause: 'Config recorder stopped or wrong resource types.', fix: 'Start recorder: aws configservice start-configuration-recorder. Check resource types.' },
      { title: 'Rule shows NOT_APPLICABLE', error: 'All evaluations return NOT_APPLICABLE', cause: 'Rule scope doesn\'t match any existing resources.', fix: 'Check rule scope targets existing resource types.' },
      { title: 'Remediation fails', error: 'SSM Automation execution failed', cause: 'Remediation role lacks permissions.', fix: 'Update remediation execution role with required permissions.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'Config Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'Ensure all S3 buckets have encryption. Which approach?', options: [{ id: 'a', text: 'CloudTrail alarm' }, { id: 'b', text: 'Config rule: s3-bucket-server-side-encryption-enabled' }, { id: 'c', text: 'Manual audit' }, { id: 'd', text: 'IAM deny CreateBucket' }], correctId: 'b', explanation: 'Config rule continuously evaluates. Add auto-remediation to enable encryption automatically.', difficulty: 'intermediate' },
      { id: 'q2', question: 'What is a conformance pack?', options: [{ id: 'a', text: 'EC2 instance group' }, { id: 'b', text: 'Bundle of Config rules + remediation for a compliance framework' }, { id: 'c', text: 'CloudFormation template' }, { id: 'd', text: 'IAM policy group' }], correctId: 'b', explanation: 'Conformance packs bundle rules for CIS, PCI-DSS, HIPAA standards.', difficulty: 'beginner' },
      { id: 'q3', question: 'Config vs CloudTrail?', options: [{ id: 'a', text: 'Same service' }, { id: 'b', text: 'Config: resource state; CloudTrail: API history' }, { id: 'c', text: 'Config: events; CloudTrail: configs' }, { id: 'd', text: 'Both track configs' }], correctId: 'b', explanation: 'Config = "Is this compliant?" CloudTrail = "Who did this?"', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Compliance Reporter', content: { title: 'Config Compliance Reporter', description: 'Check all Config rules and generate a compliance report.', difficulty: 'intermediate',
      requirements: ['Get compliance summary', 'List non-compliant rules', 'Get resources per rule', 'Return structured report'],
      starterCode: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\nconfig = boto3.client('config')\n\ndef lambda_handler(event, context):\n    # TODO: Get compliance summary\n    # TODO: Find non-compliant rules\n    # TODO: Return report\n    pass`,
      language: 'python', hints: ['config.get_compliance_summary_by_config_rule()', 'describe_compliance_by_config_rule()', 'Filter NON_COMPLIANT'],
      testCases: [{ description: 'Uses Config API', keywords: ['config'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 28: AWS CloudFormation', url: 'module-21.html' }, next: { title: 'Chapter 30: AWS Backup', url: 'module-28.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_27_DATA; } else { window.MODULE_27_DATA = MODULE_27_DATA; }
