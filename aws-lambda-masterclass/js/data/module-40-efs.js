/**
 * MODULE 40 — Amazon EFS — Elastic File System
 */
const MODULE_40_DATA = {
  id: 'efs-fundamentals', moduleId: 'module-40',
  title: 'Amazon EFS — Elastic File System',
  description: 'Master shared storage. Covers EFS architecture, performance modes, storage classes, mount targets, access points, encryption, and multi-AZ shared filesystem patterns.',
  difficulty: 'intermediate', duration: '60 min',
  prerequisites: ['Module 04: Amazon VPC', 'Module 03: Amazon EC2'],
  objectives: ['Create and configure EFS file systems', 'Mount EFS on multiple EC2 instances across AZs', 'Implement access points for application isolation', 'Configure lifecycle policies for cost optimization', 'Understand EFS vs EBS vs S3 trade-offs', 'Troubleshoot mount and performance issues'],
  sections: [
    { id: 'why', type: 'why', title: 'Why EFS?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#128193;</span><div class="alert-content"><div class="alert-title">Shared File System Across Multiple EC2 Instances</div><div class="alert-text">EFS is a fully managed NFS file system that can be mounted by hundreds of EC2 instances simultaneously across multiple AZs. It auto-scales from zero to petabytes with no provisioning.</div></div></div>
      <h4>EFS vs EBS vs S3</h4>
      <table><thead><tr><th>Feature</th><th>EFS</th><th>EBS</th><th>S3</th></tr></thead><tbody>
        <tr><td><strong>Access</strong></td><td>Multi-instance, multi-AZ</td><td>Single instance, single AZ</td><td>Any (via API)</td></tr>
        <tr><td><strong>Protocol</strong></td><td>NFS v4.1</td><td>Block device</td><td>HTTP API</td></tr>
        <tr><td><strong>Auto-scale</strong></td><td>Yes (elastic)</td><td>No (fixed size)</td><td>Yes (unlimited)</td></tr>
        <tr><td><strong>Latency</strong></td><td>Low ms</td><td>Sub-ms (SSD)</td><td>50-100ms</td></tr>
        <tr><td><strong>Use case</strong></td><td>Shared content, CMS, ML</td><td>Databases, boot volumes</td><td>Objects, backups, data lake</td></tr>
      </tbody></table>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'EFS Architecture', content: { title: 'Shared Filesystem Across AZs', width: 700, height: 260,
      nodes: [
        { id: 'efs', label: 'EFS Filesystem', icon: '&#128193;', x: 300, y: 10, type: 'storage', description: 'Fully managed NFS. Data replicated across multiple AZs automatically. Elastic — grows and shrinks as you add/remove files.' },
        { id: 'mta', label: 'Mount Target AZ-1', icon: '&#128268;', x: 100, y: 120, type: 'network', description: 'ENI in each AZ. EC2 instances connect to their local mount target for low-latency access.' },
        { id: 'mtb', label: 'Mount Target AZ-2', icon: '&#128268;', x: 500, y: 120, type: 'network', description: 'Second mount target in AZ-2. Same filesystem, different network entry point.' },
        { id: 'ec2a', label: 'EC2 AZ-1', icon: '&#128421;&#65039;', x: 100, y: 220, type: 'compute', description: 'Instance mounts EFS via NFS. Reads/writes are shared instantly with all other mounted instances.' },
        { id: 'ec2b', label: 'EC2 AZ-2', icon: '&#128421;&#65039;', x: 500, y: 220, type: 'compute', description: 'Another instance in different AZ sees the same files immediately.' }
      ],
      edges: [
        { from: 'efs', to: 'mta', label: 'Replicated' },
        { from: 'efs', to: 'mtb', label: 'Replicated' },
        { from: 'mta', to: 'ec2a', label: 'NFS Mount', animated: true },
        { from: 'mtb', to: 'ec2b', label: 'NFS Mount', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Performance Modes</h4>
      <table><thead><tr><th>Mode</th><th>Throughput</th><th>IOPS</th><th>Best For</th></tr></thead><tbody>
        <tr><td><strong>General Purpose</strong></td><td>Good</td><td>Up to 35,000</td><td>Web serving, CMS, home directories (default)</td></tr>
        <tr><td><strong>Max I/O</strong></td><td>Higher</td><td>500,000+</td><td>Big data, media processing, highly parallel workloads</td></tr>
      </tbody></table>
      <h4>2. Throughput Modes</h4>
      <ul>
        <li><strong>Bursting</strong> &mdash; Scales with storage size. 50 KB/s per GB stored. Free burst credits.</li>
        <li><strong>Provisioned</strong> &mdash; Fixed throughput regardless of storage. Use when you need consistent performance.</li>
        <li><strong>Elastic (recommended)</strong> &mdash; Auto-scales throughput up to 10 GB/s. Pay per use.</li>
      </ul>
      <h4>3. Storage Classes</h4>
      <table><thead><tr><th>Class</th><th>Cost</th><th>Access Pattern</th></tr></thead><tbody>
        <tr><td><strong>Standard</strong></td><td>$0.30/GB</td><td>Frequently accessed</td></tr>
        <tr><td><strong>Infrequent Access (IA)</strong></td><td>$0.025/GB + access fee</td><td>Files not accessed in 30+ days</td></tr>
        <tr><td><strong>Archive</strong></td><td>$0.008/GB + access fee</td><td>Files not accessed in 90+ days</td></tr>
      </tbody></table>
      <h4>4. Access Points</h4>
      <p>Application-specific entry points that enforce a specific user/group, root directory, and permissions. Each container or application gets its own access point — isolated from others.</p>
      <h4>5. Encryption</h4>
      <ul>
        <li><strong>At rest</strong> &mdash; KMS encryption (enable at creation, cannot change later)</li>
        <li><strong>In transit</strong> &mdash; TLS via mount helper (-o tls flag)</li>
      </ul>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'EFS Boto3 Operations', content: { title: 'EFS Management', languages: [
      { id: 'python-efs', label: 'Core Operations',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\nefs = boto3.client('efs')\n\ndef create_filesystem(name, encrypted=True, performance='generalPurpose'):\n    """Create an EFS filesystem with lifecycle policy."""\n    response = efs.create_file_system(\n        CreationToken=name,\n        PerformanceMode=performance,\n        Encrypted=encrypted,\n        ThroughputMode='elastic',\n        LifecyclePolicies=[\n            {'TransitionToIA': 'AFTER_30_DAYS'},\n            {'TransitionToArchive': 'AFTER_90_DAYS'}\n        ],\n        Tags=[{'Key': 'Name', 'Value': name}]\n    )\n    fs_id = response['FileSystemId']\n    logger.info("Created EFS: %s (%s)", name, fs_id)\n    return fs_id\n\ndef create_mount_targets(fs_id, subnet_ids, sg_id):\n    """Create mount targets in each subnet."""\n    for subnet in subnet_ids:\n        efs.create_mount_target(\n            FileSystemId=fs_id,\n            SubnetId=subnet,\n            SecurityGroups=[sg_id]\n        )\n        logger.info("Mount target created in %s", subnet)`,
        explanations: [
          { line: '10-14', text: 'Elastic throughput auto-scales. Lifecycle policies move cold data to cheaper storage classes automatically.' },
          { line: '25-31', text: 'One mount target per AZ. Security group must allow NFS (port 2049) from EC2 instances.' }
        ] }
    ], defaultLang: 'python-efs', expectedOutput: 'Created EFS: prod-shared-efs (fs-abc123)' } },
    { id: 'cli-commands', type: 'command', title: 'EFS CLI', content: [
      { command: 'aws efs create-file-system --creation-token prod-shared-efs --performance-mode generalPurpose --encrypted --throughput-mode elastic', category: 'aws-cli', expectedOutput: '{\n  "FileSystemId": "fs-abc123",\n  "LifeCycleState": "creating",\n  "Encrypted": true\n}', explanation: 'Create encrypted EFS with elastic throughput. CreationToken ensures idempotency.' },
      { command: 'sudo mount -t efs -o tls fs-abc123:/ /mnt/efs', category: 'bash', expectedOutput: '(no output = success)', explanation: 'Mount EFS with TLS encryption in transit. Requires amazon-efs-utils package.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'EFS CLI Lab', mode: 'simulated',
      initialText: 'EFS Lab. Try:\n  aws efs describe-file-systems\n  aws efs describe-mount-targets --file-system-id fs-abc123',
      commands: {
        'aws efs describe-file-systems': { text: '{\n  "FileSystems": [{\n    "FileSystemId": "fs-abc123",\n    "LifeCycleState": "available",\n    "SizeInBytes": {"Value": 1073741824},\n    "PerformanceMode": "generalPurpose",\n    "Encrypted": true,\n    "ThroughputMode": "elastic"\n  }]\n}', type: 'output' },
        'aws efs describe-mount-targets --file-system-id fs-abc123': { text: '{\n  "MountTargets": [\n    {"MountTargetId": "fsmt-aaa", "SubnetId": "subnet-priv-1a", "LifeCycleState": "available", "IpAddress": "10.0.3.45"},\n    {"MountTargetId": "fsmt-bbb", "SubnetId": "subnet-priv-1b", "LifeCycleState": "available", "IpAddress": "10.0.4.67"}\n  ]\n}', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Shared EFS', content: {
      title: 'Create EFS and Share Between EC2 Instances',
      description: 'Create an EFS filesystem, mount it on two EC2 instances in different AZs, and verify shared file access.',
      difficulty: 'beginner', duration: '25 min',
      objectives: ['Create EFS filesystem', 'Create mount targets', 'Mount from EC2', 'Verify cross-AZ sharing'],
      steps: [
        { title: 'Create EFS', instructions: 'EFS Console > Create file system.\n\nName: prod-shared-efs\nVPC: prod-vpc\nPerformance: General Purpose\nEncryption: Enabled', validation: 'EFS shows "Available" with mount targets in both AZs' },
        { title: 'Mount on Instance A', instructions: 'SSM Session Manager to Instance A:\n\nsudo dnf install -y amazon-efs-utils\nsudo mkdir /mnt/efs\nsudo mount -t efs -o tls fs-abc123:/ /mnt/efs\necho "Hello from A" | sudo tee /mnt/efs/test.txt', validation: 'File created at /mnt/efs/test.txt' },
        { title: 'Read from Instance B', instructions: 'SSM Session Manager to Instance B:\n\nsudo mount -t efs -o tls fs-abc123:/ /mnt/efs\ncat /mnt/efs/test.txt', validation: 'Shows "Hello from A" — file shared across AZs!' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Mount timeout', error: 'Connection timed out', cause: 'Security group not allowing NFS (port 2049) or no mount target in the AZ.', fix: 'Add inbound rule: NFS (2049) from EC2 security group. Verify mount target exists in the same AZ as the EC2 instance.' },
      { title: 'Permission denied', error: 'mount.nfs4: access denied by server', cause: 'EFS file system policy denying access, or IAM authorization required.', fix: 'Check EFS file system policy. If using IAM auth, ensure EC2 role has elasticfilesystem:ClientMount permission.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'EFS Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'How many EC2 instances can mount the same EFS filesystem?', options: [
        { id: 'a', text: '1 (like EBS)' }, { id: 'b', text: '10 maximum' }, { id: 'c', text: 'Hundreds or thousands simultaneously' }, { id: 'd', text: '2 (one per AZ)' }
      ], correctId: 'c', explanation: 'EFS supports thousands of concurrent NFS connections across multiple AZs. This is its primary advantage over EBS.', difficulty: 'beginner' },
      { id: 'q2', question: 'EFS vs EBS — which supports multi-AZ access?', options: [
        { id: 'a', text: 'EBS' }, { id: 'b', text: 'EFS' }, { id: 'c', text: 'Both' }, { id: 'd', text: 'Neither' }
      ], correctId: 'b', explanation: 'EFS is multi-AZ by design (mount targets in each AZ). EBS volumes are bound to a single AZ and can only attach to instances in that AZ.', difficulty: 'beginner' },
      { id: 'q3', question: 'What is the cheapest EFS storage class?', options: [
        { id: 'a', text: 'Standard ($0.30/GB)' }, { id: 'b', text: 'Infrequent Access ($0.025/GB)' }, { id: 'c', text: 'Archive ($0.008/GB)' }, { id: 'd', text: 'One Zone ($0.16/GB)' }
      ], correctId: 'c', explanation: 'Archive is the cheapest at $0.008/GB but charges per access. Lifecycle policies automatically transition files not accessed in 90+ days.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: EFS Cost Analyzer', content: { title: 'EFS Storage Cost Reporter', description: 'Calculate the monthly cost of an EFS filesystem based on storage class distribution.', difficulty: 'intermediate',
      starterCode: `import boto3\n\ndef efs_cost_report(fs_id):\n    """Calculate monthly EFS cost by storage class.\n    Return: {'standard_gb': N, 'ia_gb': N, 'total_cost': float}\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\n\ndef efs_cost_report(fs_id):\n    efs = boto3.client('efs')\n    desc = efs.describe_file_systems(FileSystemId=fs_id)['FileSystems'][0]\n    size = desc['SizeInBytes']\n    std_gb = size.get('ValueInStandard', 0) / (1024**3)\n    ia_gb = size.get('ValueInIA', 0) / (1024**3)\n    archive_gb = size.get('ValueInArchive', 0) / (1024**3)\n    cost = std_gb * 0.30 + ia_gb * 0.025 + archive_gb * 0.008\n    return {'standard_gb': round(std_gb, 2), 'ia_gb': round(ia_gb, 2), 'archive_gb': round(archive_gb, 2), 'total_cost': round(cost, 2)}`,
      testCases: [{ description: 'Returns cost breakdown', expectedBehavior: 'Output includes storage per class and total cost' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<ol><li>Unmount EFS from all instances: <code>sudo umount /mnt/efs</code></li><li>Delete mount targets</li><li>Delete file system</li></ol><pre><code>aws efs delete-mount-target --mount-target-id fsmt-xxx\naws efs delete-file-system --file-system-id fs-abc123</code></pre>` } },
    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'Amazon EFS', nextModule: { title: 'AWS X-Ray', href: 'module-41.html' }, message: 'Next: distributed tracing for debugging production issues.' } }
  ]
};
