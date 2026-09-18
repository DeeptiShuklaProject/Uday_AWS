/**
 * MODULE 28 — AWS Backup — Centralized Backup Management
 */
const MODULE_28_DATA = {
  id: 'backup-fundamentals', moduleId: 'module-28',
  title: 'AWS Backup — Centralized Backup Management',
  description: 'Master backup automation. Covers backup plans, vaults, recovery points, cross-region backup, Vault Lock (WORM), and compliance with backup policies.',
  difficulty: 'intermediate', duration: '60 min', prerequisites: ['Module 01: AWS IAM', 'Module 06: Amazon RDS'],
  objectives: ['Create backup plans with schedules and retention rules', 'Configure backup vaults with access policies', 'Implement cross-region and cross-account backup', 'Restore resources from recovery points', 'Enable Vault Lock for WORM compliance', 'Use AWS Backup Audit Manager'],
  sections: [
    { id: 'why-backup', type: 'why', title: 'Why AWS Backup?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">💾</span><div class="alert-content"><div class="alert-title">One Service to Backup Everything — Centrally</div><div class="alert-text">AWS Backup provides centralized, policy-driven backup for 15+ AWS services. Instead of managing separate backup mechanisms for RDS, EBS, DynamoDB, EFS, S3, use one plan for all.</div></div></div>
      <table><thead><tr><th>Feature</th><th>AWS Backup</th><th>Service-Native</th></tr></thead><tbody>
        <tr><td><strong>Management</strong></td><td>Centralized</td><td>Per-service</td></tr>
        <tr><td><strong>Cross-Region</strong></td><td>Built-in</td><td>Varies</td></tr>
        <tr><td><strong>Compliance</strong></td><td>Vault Lock (WORM)</td><td>Limited</td></tr>
        <tr><td><strong>Supported</strong></td><td>15+ services</td><td>One service each</td></tr>
      </tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Vault Lock is IRREVERSIBLE</div><div class="alert-text">In compliance mode, Vault Lock CANNOT be changed — even by root. Test thoroughly before enabling. Designed for SEC 17a-4, CFTC, FINRA.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Backup Architecture', content: { title: 'Plan → Schedule → Vault → Restore', width: 750, height: 260,
      nodes: [
        { id: 'plan', label: 'Backup Plan', icon: '📋', x: 10, y: 110, type: 'security', description: 'Defines frequency, retention, and target vault.' },
        { id: 'resources', label: 'AWS Resources', icon: '☁️', x: 200, y: 50, type: 'compute', description: 'EBS, RDS, DynamoDB, EFS, S3, Aurora, FSx, EC2 AMIs.' },
        { id: 'vault', label: 'Backup Vault', icon: '🔐', x: 400, y: 110, type: 'storage', description: 'Encrypted container for recovery points. Optional Vault Lock.' },
        { id: 'cross', label: 'Cross-Region', icon: '🌍', x: 580, y: 50, type: 'storage', description: 'Auto-replicate to another region for DR.' },
        { id: 'restore', label: 'Restore', icon: '♻️', x: 580, y: 200, type: 'compute', description: 'Create new resources from recovery points.' }
      ],
      edges: [
        { from: 'plan', to: 'resources', label: 'Schedule', animated: true },
        { from: 'resources', to: 'vault', label: 'Backup', animated: true },
        { from: 'vault', to: 'cross', label: 'Replicate' },
        { from: 'vault', to: 'restore', label: 'Restore' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Backup Plan Components</h4><table><thead><tr><th>Component</th><th>Purpose</th></tr></thead><tbody>
        <tr><td><strong>Rule</strong></td><td>Schedule (cron), retention, vault target</td></tr>
        <tr><td><strong>Resource Assignment</strong></td><td>Resources to backup (by tag, ARN, or all)</td></tr>
        <tr><td><strong>Lifecycle</strong></td><td>Transition to cold storage, delete after N days</td></tr>
        <tr><td><strong>Copy Action</strong></td><td>Cross-region or cross-account replication</td></tr>
      </tbody></table>
      <h4>2. Vault Lock</h4><ul><li><strong>Governance mode:</strong> Admins can delete with proper IAM</li><li><strong>Compliance mode:</strong> Nobody can delete — WORM (immutable)</li></ul>
      <h4>3. Supported Services</h4><p>EBS, RDS, Aurora, DynamoDB, EFS, FSx, S3, EC2 (AMI), Storage Gateway, DocumentDB, Neptune, Redshift, SAP HANA</p>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'Backup Boto3 Operations', content: { title: 'Backup Management', languages: [
      { id: 'python-backup', label: 'Recovery Points',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\nbackup = boto3.client('backup')\n\ndef list_recovery_points(vault_name):\n    """List all recovery points in a vault."""\n    response = backup.list_recovery_points_by_backup_vault(\n        BackupVaultName=vault_name\n    )\n    points = []\n    for rp in response['RecoveryPoints']:\n        points.append({\n            'arn': rp['RecoveryPointArn'],\n            'resource': rp['ResourceType'],\n            'created': str(rp['CreationDate']),\n            'status': rp['Status']\n        })\n        logger.info("Recovery point: %s (%s)", rp['ResourceType'], rp['Status'])\n    return points\n\n\ndef start_restore(recovery_point_arn, iam_role_arn, metadata):\n    """Restore a resource from a recovery point."""\n    response = backup.start_restore_job(\n        RecoveryPointArn=recovery_point_arn,\n        IamRoleArn=iam_role_arn,\n        Metadata=metadata\n    )\n    logger.info("Restore job: %s", response['RestoreJobId'])\n    return response['RestoreJobId']`,
        explanations: [
          { line: '11', text: 'list_recovery_points_by_backup_vault returns all backups in a vault.' },
          { line: '28-31', text: 'start_restore_job creates a new resource from the backup. Metadata specifies restore params.' }
        ] }
    ], defaultLang: 'python-backup', expectedOutput: 'Recovery point: RDS (COMPLETED)' } },
    { id: 'cli-commands', type: 'command', title: 'Backup CLI Commands', content: [
      { command: 'aws backup list-backup-plans', category: 'aws-cli', expectedOutput: '{\n  "BackupPlansList": [{\n    "BackupPlanName": "daily-production",\n    "BackupPlanId": "abc-123"\n  }]\n}', explanation: 'Lists all backup plans with schedules and retention.' },
      { command: 'aws backup list-recovery-points-by-backup-vault --backup-vault-name Default', category: 'aws-cli', expectedOutput: '{\n  "RecoveryPoints": [{\n    "ResourceType": "RDS", "Status": "COMPLETED", "BackupSizeInBytes": 5368709120\n  }]\n}', explanation: 'Lists backups in a vault. Use the ARN to restore.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'Backup CLI Lab', mode: 'simulated',
      initialText: 'AWS Backup CLI Lab. Try:\n  aws backup list-backup-plans\n  aws backup list-backup-vaults',
      commands: {
        'aws backup list-backup-plans': { text: '{\n  "BackupPlansList": [{"BackupPlanName": "daily-production", "BackupPlanId": "abc-123"}]\n}', type: 'output' },
        'aws backup list-backup-vaults': { text: '{\n  "BackupVaultList": [{"BackupVaultName": "Default", "NumberOfRecoveryPoints": 45, "Locked": false}]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Backup job AccessDenied', error: 'AccessDeniedException', cause: 'Backup role lacks snapshot permissions.', fix: 'Use AWSBackupServiceRolePolicyForBackup managed policy.' },
      { title: 'Cross-region copy fails', error: 'Destination vault not found', cause: 'No vault in target region or KMS key issue.', fix: 'Create vault in destination region. Use multi-region KMS key.' },
      { title: 'Cannot delete recovery point', error: 'Vault lock prevents deletion', cause: 'Vault Lock compliance mode.', fix: 'Wait for retention period. Use governance mode for testing.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'Backup Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'What is Vault Lock compliance mode?', options: [{ id: 'a', text: 'KMS encryption' }, { id: 'b', text: 'WORM — prevents deletion even by root' }, { id: 'c', text: 'Locks vault from new backups' }, { id: 'd', text: 'Requires MFA' }], correctId: 'b', explanation: 'WORM protection. Even root cannot delete before retention expires.', difficulty: 'advanced' },
      { id: 'q2', question: 'Cross-region DR with AWS Backup?', options: [{ id: 'a', text: 'Manual copy' }, { id: 'b', text: 'Add copy action in backup plan rule' }, { id: 'c', text: 'S3 replication' }, { id: 'd', text: 'Separate plans per region' }], correctId: 'b', explanation: 'Built-in cross-region copy via CopyAction in the backup plan rule.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Backup Reporter', content: { title: 'Backup Compliance Reporter', description: 'Verify backup plans are running and report failures.', difficulty: 'intermediate',
      requirements: ['List backup jobs from last 24 hours', 'Check for FAILED status', 'Return report with details'],
      starterCode: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\nbackup = boto3.client('backup')\n\ndef lambda_handler(event, context):\n    # TODO: List backup jobs\n    # TODO: Check for failures\n    # TODO: Return report\n    pass`,
      language: 'python', hints: ['backup.list_backup_jobs(ByState="FAILED")', 'Include ResourceType and StatusMessage'],
      testCases: [{ description: 'Uses backup API', keywords: ['backup'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 29: AWS Config', url: 'module-27.html' }, next: { title: 'Chapter 31: AWS WAF & Shield', url: 'module-30.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_28_DATA; } else { window.MODULE_28_DATA = MODULE_28_DATA; }
