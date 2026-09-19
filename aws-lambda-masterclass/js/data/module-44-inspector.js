/**
 * MODULE 44 — Amazon Inspector — Vulnerability Scanning
 */
const MODULE_44_DATA = {
  id: 'inspector-fundamentals', moduleId: 'module-44',
  title: 'Amazon Inspector — Automated Vulnerability Assessment',
  description: 'Master vulnerability management. Covers Inspector v2 scanning for EC2, ECR, and Lambda, CVE assessment, CVSS scoring, findings management, and CI/CD integration.',
  difficulty: 'intermediate', duration: '50 min',
  prerequisites: ['Module 03: Amazon EC2', 'Module 15: Amazon ECR'],
  objectives: ['Enable Inspector for EC2, ECR, and Lambda scanning', 'Understand CVE severity and CVSS scoring', 'Triage and remediate vulnerability findings', 'Integrate vulnerability scanning into CI/CD', 'Configure suppression rules for accepted risks', 'Generate compliance reports'],
  sections: [
    { id: 'why', type: 'why', title: 'Why Inspector?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#128270;</span><div class="alert-content"><div class="alert-title">Continuous Vulnerability Scanning — No Agents Needed</div><div class="alert-text">Inspector v2 automatically discovers and scans EC2 instances, container images in ECR, and Lambda functions for software vulnerabilities (CVEs) and network exposure. Findings include severity, fix recommendations, and affected packages.</div></div></div>
      <h4>What Inspector Scans</h4>
      <table><thead><tr><th>Target</th><th>What It Checks</th><th>Method</th></tr></thead><tbody>
        <tr><td><strong>EC2</strong></td><td>OS packages, software CVEs, network reachability</td><td>SSM Agent (agentless also available)</td></tr>
        <tr><td><strong>ECR</strong></td><td>Container image CVEs, OS + language packages</td><td>Scan on push + continuous re-scan</td></tr>
        <tr><td><strong>Lambda</strong></td><td>Function code + dependency CVEs</td><td>Automatic on deploy</td></tr>
      </tbody></table>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Inspector Architecture', content: { title: 'Continuous Scan &rarr; CVE Database &rarr; Findings', width: 700, height: 240,
      nodes: [
        { id: 'ec2', label: 'EC2 Instances', icon: '&#128421;&#65039;', x: 10, y: 40, type: 'compute', description: 'SSM Agent collects installed packages. Inspector checks against CVE database.' },
        { id: 'ecr', label: 'ECR Images', icon: '&#128230;', x: 10, y: 130, type: 'storage', description: 'Images scanned on push and continuously re-scanned as new CVEs are published.' },
        { id: 'lambda', label: 'Lambda Functions', icon: '&#9889;', x: 10, y: 220, type: 'compute', description: 'Function dependencies scanned for known vulnerabilities.' },
        { id: 'inspector', label: 'Inspector', icon: '&#128270;', x: 280, y: 130, type: 'security', description: 'Matches installed packages against NVD and vendor CVE databases. Calculates CVSS score.' },
        { id: 'findings', label: 'Findings', icon: '&#9888;&#65039;', x: 500, y: 70, type: 'monitoring', description: 'CVE findings with severity, affected package, fix version, and CVSS score.' },
        { id: 'sechub', label: 'Security Hub', icon: '&#127963;&#65039;', x: 500, y: 200, type: 'security', description: 'Findings flow to Security Hub for centralized security dashboard.' }
      ],
      edges: [
        { from: 'ec2', to: 'inspector', label: 'Packages' },
        { from: 'ecr', to: 'inspector', label: 'Layers' },
        { from: 'lambda', to: 'inspector', label: 'Dependencies' },
        { from: 'inspector', to: 'findings', label: 'CVE Match', animated: true },
        { from: 'inspector', to: 'sechub', label: 'Forward' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. CVSS Severity Levels</h4>
      <table><thead><tr><th>Severity</th><th>CVSS Score</th><th>SLA to Patch</th></tr></thead><tbody>
        <tr><td><strong>CRITICAL</strong></td><td>9.0 - 10.0</td><td>24 hours</td></tr>
        <tr><td><strong>HIGH</strong></td><td>7.0 - 8.9</td><td>7 days</td></tr>
        <tr><td><strong>MEDIUM</strong></td><td>4.0 - 6.9</td><td>30 days</td></tr>
        <tr><td><strong>LOW</strong></td><td>0.1 - 3.9</td><td>90 days</td></tr>
      </tbody></table>
      <h4>2. Inspector v1 vs v2</h4>
      <table><thead><tr><th>Feature</th><th>Inspector v1 (Classic)</th><th>Inspector v2 (Current)</th></tr></thead><tbody>
        <tr><td><strong>Setup</strong></td><td>Manual target creation</td><td>Automatic discovery</td></tr>
        <tr><td><strong>Scanning</strong></td><td>On-demand</td><td>Continuous</td></tr>
        <tr><td><strong>Targets</strong></td><td>EC2 only</td><td>EC2 + ECR + Lambda</td></tr>
        <tr><td><strong>Status</strong></td><td>Legacy</td><td>Current (use this)</td></tr>
      </tbody></table>
      <h4>3. Suppression Rules</h4>
      <p>For accepted risks (e.g., a CVE that doesn't apply to your configuration), create suppression rules to hide the finding without fixing it. Document the risk acceptance.</p>
      <h4>4. CI/CD Integration</h4>
      <p>ECR scan-on-push + EventBridge rule: if any CRITICAL CVE found in newly pushed image, trigger Lambda to fail the pipeline and notify the team.</p>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'Inspector Boto3', content: { title: 'Inspector Operations', languages: [
      { id: 'python-inspector', label: 'Core Operations',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\ninspector = boto3.client('inspector2')\n\ndef get_critical_findings():\n    """Get all CRITICAL vulnerability findings."""\n    response = inspector.list_findings(\n        filterCriteria={\n            'severity': [{'comparison': 'EQUALS', 'value': 'CRITICAL'}],\n            'findingStatus': [{'comparison': 'EQUALS', 'value': 'ACTIVE'}]\n        },\n        sortCriteria={'field': 'SEVERITY', 'sortOrder': 'DESC'}\n    )\n    for f in response['findings']:\n        vuln = f.get('packageVulnerabilityDetails', {})\n        logger.critical("CRITICAL: %s | %s | Fix: %s",\n            vuln.get('vulnerabilityId', 'N/A'),\n            f.get('title', 'N/A'),\n            vuln.get('fixAvailable', 'UNKNOWN'))\n    return response['findings']\n\ndef get_coverage_stats():\n    """Check scanning coverage across accounts."""\n    stats = inspector.list_coverage_statistics()\n    return stats.get('countsByGroup', [])`,
        explanations: [
          { line: '10-16', text: 'Filter for CRITICAL + ACTIVE findings. These need immediate attention (24-hour SLA).' },
          { line: '25-27', text: 'Coverage statistics show how many resources are being scanned vs not scanned.' }
        ] }
    ], defaultLang: 'python-inspector', expectedOutput: 'CRITICAL: CVE-2024-1234 | OpenSSL Buffer Overflow | Fix: YES (3.1.5)' } },
    { id: 'cli-commands', type: 'command', title: 'Inspector CLI', content: [
      { command: 'aws inspector2 list-findings --filter-criteria \'{"severity": [{"comparison": "EQUALS", "value": "CRITICAL"}]}\'', category: 'aws-cli', expectedOutput: '{\n  "findings": [{\n    "title": "CVE-2024-1234 - OpenSSL Buffer Overflow",\n    "severity": "CRITICAL",\n    "fixAvailable": "YES",\n    "packageVulnerabilityDetails": {"fixedInVersion": "3.1.5"}\n  }]\n}', explanation: 'List all critical findings. Fix available = YES means a patched version exists.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'Inspector CLI Lab', mode: 'simulated',
      initialText: 'Inspector Lab. Try:\n  aws inspector2 list-findings --filter-criteria \'{"severity":[{"comparison":"EQUALS","value":"CRITICAL"}]}\'',
      commands: {
        'aws inspector2 list-findings': { text: '{\n  "findings": [\n    {"title": "CVE-2024-1234", "severity": "CRITICAL", "fixAvailable": "YES", "resourceType": "AWS_ECR_CONTAINER_IMAGE"},\n    {"title": "CVE-2024-5678", "severity": "HIGH", "fixAvailable": "YES", "resourceType": "AWS_EC2_INSTANCE"}\n  ]\n}', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Vulnerability Scanning', content: {
      title: 'Enable Inspector and Investigate Findings',
      description: 'Enable Inspector for EC2 and ECR, review vulnerability findings, and understand remediation.',
      difficulty: 'beginner', duration: '15 min',
      objectives: ['Enable Inspector', 'View findings by severity', 'Understand fix recommendations'],
      steps: [
        { title: 'Enable Inspector', instructions: 'Inspector Console > Get Started.\nEnable for: EC2, ECR, Lambda.', validation: 'Inspector shows "Scanning" status' },
        { title: 'Review Findings', instructions: 'Findings tab > Filter by CRITICAL.\nClick a finding to see details.', validation: 'Finding shows CVE, affected resource, fix version' },
        { title: 'View ECR Scan Results', instructions: 'ECR Console > Repository > Image.\nView scan results tab.', validation: 'Image scan shows vulnerability counts by severity' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'EC2 instance not scanned', error: 'Instance shows "Not scanned" in coverage', cause: 'SSM Agent not installed or not running. IAM role missing SSM permissions.', fix: 'Install SSM Agent. Attach AmazonSSMManagedInstanceCore policy to instance role. Verify instance appears in SSM Fleet Manager.' },
      { title: 'Too many findings overwhelming the team', error: 'Thousands of findings, cannot prioritize', cause: 'Old instances with many unpatched packages.', fix: 'Focus on CRITICAL + fix available first. Use suppression rules for accepted risks. Rebuild with patched base AMI.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'Inspector Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'Inspector v2 can scan which resources?', options: [
        { id: 'a', text: 'EC2 only' }, { id: 'b', text: 'EC2, ECR images, and Lambda functions' }, { id: 'c', text: 'S3 buckets' }, { id: 'd', text: 'RDS databases' }
      ], correctId: 'b', explanation: 'Inspector v2 scans EC2 instances (OS packages), ECR container images (OS + language packages), and Lambda functions (code dependencies).', difficulty: 'beginner' },
      { id: 'q2', question: 'A CRITICAL CVE is found with fixAvailable=YES. What should you do?', options: [
        { id: 'a', text: 'Suppress the finding' }, { id: 'b', text: 'Patch within 24 hours' }, { id: 'c', text: 'Wait for next maintenance window' }, { id: 'd', text: 'Ignore — Inspector has false positives' }
      ], correctId: 'b', explanation: 'CRITICAL with fix available = immediate action. Patch within 24 hours (or per your organization SLA). Rebuild container images with patched base. Use SSM Patch Manager for EC2.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Vulnerability Report', content: { title: 'Inspector Compliance Report', description: 'Build a function that generates a vulnerability compliance report grouped by severity.', difficulty: 'intermediate',
      starterCode: `import boto3\n\ndef vulnerability_report():\n    """Generate vulnerability report.\n    Return: {'critical': N, 'high': N, 'medium': N, 'low': N, 'total': N, 'fixable': N}\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\n\ndef vulnerability_report():\n    inspector = boto3.client('inspector2')\n    report = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'total': 0, 'fixable': 0}\n    paginator = inspector.get_paginator('list_findings')\n    for page in paginator.paginate(filterCriteria={'findingStatus': [{'comparison': 'EQUALS', 'value': 'ACTIVE'}]}):\n        for f in page['findings']:\n            report['total'] += 1\n            severity = f['severity'].lower()\n            if severity in report: report[severity] += 1\n            if f.get('fixAvailable') == 'YES': report['fixable'] += 1\n    return report`,
      testCases: [{ description: 'Counts by severity', expectedBehavior: 'Output has severity counts and fixable count' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<ol><li>If testing only: disable Inspector scanning</li></ol><pre><code>aws inspector2 disable --resource-types EC2 ECR_CONTAINER_IMAGE LAMBDA_FUNCTION</code></pre><p><strong>Note:</strong> In production, keep Inspector enabled for continuous scanning.</p>` } },
    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'Amazon Inspector', nextModule: { title: 'AWS Security Hub', href: 'module-45.html' }, message: 'Next: centralized security findings dashboard.' } }
  ]
};
