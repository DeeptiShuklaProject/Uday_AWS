/**
 * MODULE 46 — AWS Resource Access Manager (RAM)
 */
const MODULE_46_DATA = {
  id: 'ram-fundamentals', moduleId: 'module-46',
  title: 'AWS Resource Access Manager — Cross-Account Sharing',
  description: 'Master multi-account resource sharing. Covers RAM shared resources, principals, resource shares, VPC subnet sharing, Transit Gateway sharing, and Organizations integration.',
  difficulty: 'intermediate', duration: '45 min',
  prerequisites: ['Module 04: Amazon VPC', 'Module 31: AWS Organizations'],
  objectives: ['Share VPC subnets across AWS accounts', 'Understand which resources can be shared via RAM', 'Configure sharing with Organizations vs individual accounts', 'Implement centralized network architecture', 'Share Transit Gateways and Route 53 resolver rules', 'Troubleshoot sharing permissions'],
  sections: [
    { id: 'why', type: 'why', title: 'Why RAM?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#129309;</span><div class="alert-content"><div class="alert-title">Share Resources Without Duplication</div><div class="alert-text">RAM lets you share VPC subnets, Transit Gateways, Route 53 resolver rules, and other resources across AWS accounts without copying them. The owner manages the resource; consumers use it.</div></div></div>
      <h4>Key Benefits</h4>
      <table><thead><tr><th>Without RAM</th><th>With RAM</th></tr></thead><tbody>
        <tr><td>Each account creates its own VPC + NAT Gateway ($32/mo each)</td><td>Central VPC, shared subnets. One NAT Gateway shared.</td></tr>
        <tr><td>VPC Peering for every account pair (N&sup2; connections)</td><td>Transit Gateway shared via RAM (hub-and-spoke)</td></tr>
        <tr><td>Duplicate network configurations</td><td>Network team manages centrally, workload teams deploy into shared subnets</td></tr>
      </tbody></table>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'RAM Architecture', content: { title: 'Owner Account Shares &rarr; Consumer Accounts Use', width: 700, height: 240,
      nodes: [
        { id: 'owner', label: 'Network Account\n(Owner)', icon: '&#127963;&#65039;', x: 10, y: 100, type: 'security', description: 'Owns VPC, subnets, NAT Gateway, Transit Gateway. Controls routing and security.' },
        { id: 'ram', label: 'RAM\nResource Share', icon: '&#129309;', x: 230, y: 100, type: 'network', description: 'Resource share defines what to share and with whom (specific accounts or entire OU).' },
        { id: 'dev', label: 'Dev Account\n(Consumer)', icon: '&#128187;', x: 470, y: 40, type: 'compute', description: 'Launches EC2/RDS/Lambda into shared subnets. Cannot modify the subnet.' },
        { id: 'prod', label: 'Prod Account\n(Consumer)', icon: '&#128421;&#65039;', x: 470, y: 170, type: 'compute', description: 'Launches production workloads into shared subnets. Same network, different account.' }
      ],
      edges: [
        { from: 'owner', to: 'ram', label: 'Share Subnets', animated: true },
        { from: 'ram', to: 'dev', label: 'Accept/Auto' },
        { from: 'ram', to: 'prod', label: 'Accept/Auto' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Shareable Resources</h4>
      <table><thead><tr><th>Resource</th><th>Common Use Case</th></tr></thead><tbody>
        <tr><td><strong>VPC Subnets</strong></td><td>Centralized networking (most common)</td></tr>
        <tr><td><strong>Transit Gateway</strong></td><td>Hub-and-spoke network</td></tr>
        <tr><td><strong>Route 53 Resolver Rules</strong></td><td>Centralized DNS resolution</td></tr>
        <tr><td><strong>License Manager Configs</strong></td><td>Centralized license management</td></tr>
        <tr><td><strong>Aurora DB Clusters</strong></td><td>Cross-account database access</td></tr>
        <tr><td><strong>CodeBuild Projects</strong></td><td>Shared build infrastructure</td></tr>
      </tbody></table>
      <h4>2. Sharing with Organizations</h4>
      <p>When sharing within an Organization, consumers auto-accept (no manual acceptance needed). Share with specific accounts, OUs, or the entire organization.</p>
      <h4>3. Owner vs Consumer Permissions</h4>
      <table><thead><tr><th>Action</th><th>Owner</th><th>Consumer</th></tr></thead><tbody>
        <tr><td>Modify shared resource</td><td>Yes</td><td>No</td></tr>
        <tr><td>Delete shared resource</td><td>Yes</td><td>No</td></tr>
        <tr><td>Launch into shared subnet</td><td>Yes</td><td>Yes</td></tr>
        <tr><td>See consumer resources</td><td>No</td><td>N/A (own resources only)</td></tr>
      </tbody></table>
      <h4>4. Subnet Sharing Best Practices</h4>
      <ul>
        <li>Network account owns VPC + subnets + NAT + routes</li>
        <li>Workload accounts launch EC2/RDS into shared subnets</li>
        <li>Each account manages its own security groups</li>
        <li>Central network team controls routing and firewall</li>
      </ul>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'RAM Boto3', content: { title: 'RAM Operations', languages: [
      { id: 'python-ram', label: 'Core Operations',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\nram = boto3.client('ram')\n\ndef create_subnet_share(name, subnet_arns, principal_arns):\n    """Share VPC subnets with other accounts."""\n    response = ram.create_resource_share(\n        name=name,\n        resourceArns=subnet_arns,\n        principals=principal_arns,\n        allowExternalPrincipals=False,\n        tags=[{'key': 'Purpose', 'value': 'centralized-networking'}]\n    )\n    share_arn = response['resourceShare']['resourceShareArn']\n    logger.info("Created resource share: %s (%s)", name, share_arn)\n    return share_arn\n\ndef list_shared_resources():\n    """List all resources shared by this account."""\n    response = ram.list_resources(resourceOwner='SELF')\n    for r in response['resources']:\n        logger.info("Shared: %s | Type: %s | Status: %s",\n            r['arn'], r['type'], r['status'])\n    return response['resources']`,
        explanations: [
          { line: '10-15', text: 'allowExternalPrincipals=False restricts sharing to within the Organization. Set True to share with any AWS account.' },
          { line: '21-26', text: 'resourceOwner=SELF lists resources you are sharing. Use OTHER-ACCOUNTS to see resources shared with you.' }
        ] }
    ], defaultLang: 'python-ram', expectedOutput: 'Created resource share: shared-network-subnets (arn:aws:ram:...)' } },
    { id: 'cli-commands', type: 'command', title: 'RAM CLI', content: [
      { command: 'aws ram create-resource-share --name shared-network --resource-arns arn:aws:ec2:us-east-1:111:subnet/subnet-abc --principals arn:aws:organizations::111:ou/o-xxx/ou-yyy', category: 'aws-cli', expectedOutput: '{\n  "resourceShare": {\n    "name": "shared-network",\n    "status": "ACTIVE"\n  }\n}', explanation: 'Share subnets with an OU. All accounts in that OU can launch resources into these subnets.' },
      { command: 'aws ram get-resource-shares --resource-owner SELF', category: 'aws-cli', expectedOutput: '{\n  "resourceShares": [{"name": "shared-network", "status": "ACTIVE", "owningAccountId": "111111111111"}]\n}', explanation: 'List resource shares you own. Use OTHER-ACCOUNTS for shares others have made with you.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'RAM CLI Lab', mode: 'simulated',
      initialText: 'RAM Lab. Try:\n  aws ram get-resource-shares --resource-owner SELF\n  aws ram list-resources --resource-owner SELF',
      commands: {
        'aws ram get-resource-shares --resource-owner SELF': { text: '{\n  "resourceShares": [\n    {"name": "shared-network-subnets", "status": "ACTIVE", "owningAccountId": "111111111111"},\n    {"name": "shared-tgw", "status": "ACTIVE", "owningAccountId": "111111111111"}\n  ]\n}', type: 'output' },
        'aws ram list-resources --resource-owner SELF': { text: '{\n  "resources": [\n    {"arn": "arn:aws:ec2:us-east-1:111:subnet/subnet-priv-1a", "type": "ec2:Subnet", "status": "ASSOCIATED"},\n    {"arn": "arn:aws:ec2:us-east-1:111:subnet/subnet-priv-1b", "type": "ec2:Subnet", "status": "ASSOCIATED"}\n  ]\n}', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Subnet Sharing', content: {
      title: 'Share VPC Subnets Across Accounts',
      description: 'Create a RAM resource share for VPC subnets and demonstrate cross-account resource deployment.',
      difficulty: 'intermediate', duration: '20 min',
      objectives: ['Create resource share', 'Share subnets with another account', 'Launch EC2 in shared subnet from consumer account'],
      steps: [
        { title: 'Create Resource Share', instructions: 'RAM Console > Create resource share.\n\nName: shared-network-subnets\nResources: Select private subnets from prod-vpc\nPrincipals: Add target account ID or OU ARN', validation: 'Resource share created with status "Active"' },
        { title: 'Accept in Consumer Account', instructions: 'Switch to consumer account.\nRAM > Shared with me > Accept resource share.\n(Auto-accepted if within Organization)', validation: 'Shared subnets visible in consumer account VPC console' },
        { title: 'Launch EC2 in Shared Subnet', instructions: 'In consumer account: EC2 > Launch instance.\nSelect the shared subnet.\nLaunch instance.', validation: 'EC2 running in shared subnet, managed by consumer account' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Resource share pending acceptance', error: 'Share status: PENDING', cause: 'Sharing with accounts outside the Organization requires manual acceptance.', fix: 'Consumer account must accept the share in RAM console. Or enable sharing within Organization for auto-accept.' },
      { title: 'Cannot see shared subnets', error: 'Subnets not visible in consumer account', cause: 'Share not accepted, or sharing with wrong account/OU.', fix: 'Verify the principal (account ID or OU ARN) is correct. Check RAM > Shared with me in consumer account.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'RAM Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'Can a consumer account modify a shared VPC subnet?', options: [
        { id: 'a', text: 'Yes, full control' }, { id: 'b', text: 'No — only the owner can modify the subnet' }, { id: 'c', text: 'Yes, if granted permission' }, { id: 'd', text: 'Only if in the same Organization' }
      ], correctId: 'b', explanation: 'Consumers can launch resources INTO shared subnets but cannot modify subnet configuration (CIDR, route table, NACL). Only the owner account controls the network.', difficulty: 'beginner' },
      { id: 'q2', question: 'What is the main cost benefit of VPC subnet sharing?', options: [
        { id: 'a', text: 'Shared subnets are free' }, { id: 'b', text: 'One NAT Gateway shared across accounts instead of one per account ($32/mo savings each)' }, { id: 'c', text: 'No VPC costs' }, { id: 'd', text: 'Free data transfer' }
      ], correctId: 'b', explanation: 'Without RAM, each account needs its own VPC + NAT Gateway ($32+/month each). With shared subnets, one NAT Gateway serves all accounts in the shared VPC.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Share Inventory', content: { title: 'RAM Resource Share Report', description: 'Build a function that reports all resources shared by and with your account.', difficulty: 'intermediate',
      starterCode: `import boto3\n\ndef share_inventory():\n    """Report shared resources.\n    Return: {'shared_by_me': [arns], 'shared_with_me': [arns]}\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\n\ndef share_inventory():\n    ram = boto3.client('ram')\n    by_me = ram.list_resources(resourceOwner='SELF')['resources']\n    with_me = ram.list_resources(resourceOwner='OTHER-ACCOUNTS')['resources']\n    return {\n        'shared_by_me': [r['arn'] for r in by_me],\n        'shared_with_me': [r['arn'] for r in with_me]\n    }`,
      testCases: [{ description: 'Returns shared resource inventory', expectedBehavior: 'Two lists of ARNs' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<ol><li>Terminate consumer resources in shared subnets</li><li>Delete resource share</li></ol><pre><code>aws ram delete-resource-share --resource-share-arn $SHARE_ARN</code></pre>` } },
    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'AWS RAM', nextModule: { title: 'AWS Cost Explorer & Budgets', href: 'module-47.html' }, message: 'Final chapter: cost management and optimization!' } }
  ]
};
