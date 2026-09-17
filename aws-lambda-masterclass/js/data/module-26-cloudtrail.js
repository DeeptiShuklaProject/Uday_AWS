/**
 * ============================================================
 * MODULE 26 — AWS CloudTrail
 * API audit logging, trails, event selectors, forensics
 * ============================================================
 */
const MODULE_26_DATA = {
  id: 'cloudtrail-fundamentals',
  moduleId: 'module-26',
  title: 'AWS CloudTrail — API Audit Logging',
  description: 'Master API auditing. Covers trails, management vs data events, organization trails, log file validation, CloudWatch integration, Athena queries, and security incident investigation.',
  difficulty: 'intermediate',
  duration: '65 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 02: Amazon S3'],
  objectives: [
    'Create multi-region trails for comprehensive API auditing',
    'Differentiate management events, data events, and Insights',
    'Configure S3 log delivery with encryption and validation',
    'Integrate with CloudWatch Logs for real-time alerting',
    'Investigate security incidents using lookup_events',
    'Set up organization trails for multi-account logging'
  ],

  sections: [
    { id: 'why-cloudtrail', type: 'why', title: 'Why CloudTrail?',
      content: { html: `
        <div class="alert alert-info"><span class="alert-icon">📋</span><div class="alert-content"><div class="alert-title">Who Did What, When, and From Where — Every API Call Logged</div><div class="alert-text">CloudTrail records every API call: who made it, what action, which resources, from what IP, and when. It is the foundation for security auditing, compliance, and incident investigation.</div></div></div>
        <table><thead><tr><th>Feature</th><th>Event History</th><th>Trail (S3)</th></tr></thead><tbody>
          <tr><td><strong>Retention</strong></td><td>90 days</td><td>Unlimited (S3 lifecycle)</td></tr>
          <tr><td><strong>Event Types</strong></td><td>Management only</td><td>Management + Data + Insights</td></tr>
          <tr><td><strong>Search</strong></td><td>Console lookup</td><td>Athena SQL queries</td></tr>
          <tr><td><strong>Cost</strong></td><td>Free</td><td>First trail free, $2/100K data events</td></tr>
        </tbody></table>
        <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Event History is Only 90 Days</div><div class="alert-text">The free Event History shows 90 days of management events. For long-term retention, compliance, and data events, you MUST create a trail delivering to S3.</div></div></div>
      ` } },

    { id: 'architecture', type: 'architecture', title: 'CloudTrail Architecture',
      content: { title: 'API Call → Trail → S3 → Analysis', width: 750, height: 280,
        nodes: [
          { id: 'caller', label: 'API Caller', icon: '👤', x: 10, y: 110, type: 'client', description: 'Any entity making AWS API calls: Console user, CLI, SDK, or AWS service.' },
          { id: 'ct', label: 'CloudTrail', icon: '📋', x: 180, y: 110, type: 'security', description: 'Captures API call metadata. Delivers events to S3 and optionally CloudWatch Logs.' },
          { id: 's3', label: 'S3 Bucket', icon: '🪣', x: 380, y: 50, type: 'storage', description: 'Gzipped JSON log files. Enable SSE-KMS encryption and log file validation.' },
          { id: 'cw', label: 'CloudWatch Logs', icon: '📊', x: 380, y: 200, type: 'storage', description: 'Real-time streaming. Create metric filters and alarms for security alerts.' },
          { id: 'athena', label: 'Athena', icon: '🔍', x: 570, y: 110, type: 'compute', description: 'SQL queries on CloudTrail logs. Find all API calls from a specific IP or user.' }
        ],
        edges: [
          { from: 'caller', to: 'ct', label: 'API Call', animated: true },
          { from: 'ct', to: 's3', label: 'Deliver', animated: true },
          { from: 'ct', to: 'cw', label: 'Stream', animated: true },
          { from: 's3', to: 'athena', label: 'Query' }
        ]
      } },

    { id: 'concepts', type: 'concept', title: 'Core Concepts',
      content: { html: `
        <h4>1. Event Types</h4>
        <table><thead><tr><th>Type</th><th>What</th><th>Example</th><th>Cost</th></tr></thead><tbody>
          <tr><td><strong>Management</strong></td><td>Control plane operations</td><td>CreateBucket, RunInstances</td><td>First trail free</td></tr>
          <tr><td><strong>Data</strong></td><td>Data plane operations</td><td>GetObject, PutObject, Invoke</td><td>$2/100K events</td></tr>
          <tr><td><strong>Insights</strong></td><td>Anomaly detection</td><td>Unusual API call volume</td><td>$0.35/100K analyzed</td></tr>
        </tbody></table>
        <h4>2. Event Structure</h4>
        <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">{
  "eventName": "StopInstances",
  "eventSource": "ec2.amazonaws.com",
  "userIdentity": {
    "type": "IAMUser",
    "userName": "admin-bob"
  },
  "sourceIPAddress": "203.0.113.50",
  "requestParameters": { "instancesSet": { "items": [{"instanceId": "i-abc123"}] } }
}</pre>
        <h4>3. Log File Validation</h4>
        <p>CloudTrail creates SHA-256 digest files hourly. Use <code>aws cloudtrail validate-logs</code> to verify no files have been tampered with. Essential for forensics and compliance.</p>
        <h4>4. Organization Trail</h4>
        <p>Single trail logging ALL accounts in an AWS Organization. Logs delivered to a central S3 bucket. Only the management account can create org trails.</p>
      ` } },

    { id: 'lambda-code', type: 'code', title: 'CloudTrail Boto3 Operations',
      content: { title: 'Trail & Event Management', languages: [
        { id: 'python-cloudtrail', label: 'Create Trail & Investigate',
          code: `import boto3
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ct = boto3.client('cloudtrail')

def create_secure_trail(trail_name, bucket_name, kms_key_id=None):
    """Create a multi-region trail with security best practices."""
    kwargs = {
        'Name': trail_name,
        'S3BucketName': bucket_name,
        'IsMultiRegionTrail': True,
        'EnableLogFileValidation': True,
        'IncludeGlobalServiceEvents': True,
    }
    if kms_key_id:
        kwargs['KmsKeyId'] = kms_key_id
    trail = ct.create_trail(**kwargs)
    ct.start_logging(Name=trail_name)
    logger.info("Trail created and started: %s", trail['TrailARN'])
    return trail['TrailARN']


def lookup_root_logins(hours=24):
    """Find root account console logins in the last N hours."""
    start = datetime.utcnow() - timedelta(hours=hours)
    events = []
    paginator = ct.get_paginator('lookup_events')
    for page in paginator.paginate(
        LookupAttributes=[{
            'AttributeKey': 'EventName',
            'AttributeValue': 'ConsoleLogin'
        }],
        StartTime=start
    ):
        for event in page['Events']:
            data = json.loads(event['CloudTrailEvent'])
            if data.get('userIdentity', {}).get('type') == 'Root':
                events.append({
                    'time': str(event['EventTime']),
                    'ip': data.get('sourceIPAddress'),
                    'mfa': data.get('additionalEventData', {}).get('MFAUsed')
                })
                logger.warning("ROOT LOGIN from %s", data.get('sourceIPAddress'))
    return events`,
          explanations: [
            { line: '16', text: 'IsMultiRegionTrail=True logs API calls from ALL regions. Critical because attackers may use different regions.' },
            { line: '17', text: 'EnableLogFileValidation creates hourly SHA-256 digest files for tamper detection.' },
            { line: '33-38', text: 'lookup_events searches the 90-day event history. Filter by EventName, Username, ResourceType, or EventSource.' }
          ] }
      ], defaultLang: 'python-cloudtrail', expectedOutput: 'Trail created and started: arn:aws:cloudtrail:us-east-1:123456789012:trail/prod-trail' } },

    { id: 'cli-commands', type: 'command', title: 'CloudTrail CLI Commands',
      content: [
        { command: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin --max-results 5',
          category: 'aws-cli', expectedOutput: '{\n  "Events": [{\n    "EventName": "ConsoleLogin",\n    "Username": "admin-bob",\n    "EventTime": "2026-09-17T10:30:00Z"\n  }]\n}',
          explanation: 'Looks up console logins for incident investigation.', interviewQ: 'How would you find who deleted an S3 bucket using CloudTrail?' },
        { command: 'aws cloudtrail get-trail-status --name production-trail',
          category: 'aws-cli', expectedOutput: '{\n  "IsLogging": true,\n  "LatestDeliveryTime": "2026-09-17T12:00:00Z",\n  "StartLoggingTime": "2026-01-15T10:00:00Z"\n}',
          explanation: 'Checks if trail is actively logging. IsLogging=false is a security incident.' }
      ] },

    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal',
      content: { title: 'CloudTrail CLI Lab', mode: 'simulated',
        initialText: 'CloudTrail CLI Lab. Try:\n  aws cloudtrail describe-trails\n  aws cloudtrail lookup-events --max-results 3',
        commands: {
          'aws cloudtrail describe-trails': { text: '{\n  "trailList": [{\n    "Name": "production-trail",\n    "S3BucketName": "cloudtrail-logs",\n    "IsMultiRegionTrail": true,\n    "LogFileValidationEnabled": true\n  }]\n}', type: 'output' },
          'aws cloudtrail lookup-events --max-results 3': { text: '{\n  "Events": [\n    {"EventName": "DescribeInstances", "Username": "alice", "EventTime": "2026-09-17T11:55:00Z"},\n    {"EventName": "AssumeRole", "Username": "ci-deploy", "EventTime": "2026-09-17T11:50:00Z"},\n    {"EventName": "GetObject", "Username": "bob", "EventTime": "2026-09-17T11:45:00Z"}\n  ]\n}', type: 'output' }
        } } },

    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues',
      content: { items: [
        { title: 'Trail stopped logging', error: 'IsLogging: false on get-trail-status', cause: 'Someone called StopLogging — possibly an attacker covering tracks.', fix: 'Restart immediately. Create CloudWatch alarm on StopLogging. Use SCP to deny cloudtrail:StopLogging.' },
        { title: 'Log delivery failing', error: 'LatestDeliveryError: Access Denied', cause: 'S3 bucket policy missing CloudTrail write permission.', fix: 'Update bucket policy to allow cloudtrail.amazonaws.com PutObject.' },
        { title: 'Data events not appearing', error: 'No S3 GetObject events found', cause: 'Data events not enabled by default.', fix: 'Configure event selectors with DataResources for S3/Lambda.' }
      ] } },

    { id: 'quiz', type: 'quiz', title: 'Knowledge Check',
      content: { title: 'CloudTrail Quiz', type: 'knowledge-check', questions: [
        { id: 'q1', question: 'Your company requires 7-year API audit retention. What approach?',
          options: [{ id: 'a', text: 'Use Event History (90 days)' }, { id: 'b', text: 'Trail to S3 with 7-year lifecycle policy' }, { id: 'c', text: 'Export logs weekly' }, { id: 'd', text: 'CloudWatch Logs 7-year retention' }],
          correctId: 'b', explanation: 'Event History only keeps 90 days. Trail to S3 with lifecycle (Glacier after 90d) is most cost-effective.', difficulty: 'intermediate' },
        { id: 'q2', question: 'S3 GetObject is what type of CloudTrail event?',
          options: [{ id: 'a', text: 'Management event' }, { id: 'b', text: 'Data event' }, { id: 'c', text: 'Insight event' }, { id: 'd', text: 'Global event' }],
          correctId: 'b', explanation: 'S3 GetObject/PutObject are data events. Not logged by default — must enable data event selectors.', difficulty: 'beginner' },
        { id: 'q3', question: 'Someone stopped your CloudTrail. How to prevent this?',
          options: [{ id: 'a', text: 'IAM policies' }, { id: 'b', text: 'SCP deny StopLogging' }, { id: 'c', text: 'CloudWatch alarm' }, { id: 'd', text: 'All of the above' }],
          correctId: 'd', explanation: 'Defense in depth: IAM restricts, SCP prevents, CloudWatch detects.', difficulty: 'advanced' }
      ] } },

    { id: 'challenge', type: 'challenge', title: 'Challenge: Security Auditor',
      content: { title: 'Build a CloudTrail Security Auditor', description: 'Scan CloudTrail for root logins, IAM changes, and security group modifications.', difficulty: 'intermediate',
        requirements: ['Look up events for last 24 hours', 'Filter security-relevant events', 'Flag root usage as CRITICAL', 'Return categorized report'],
        starterCode: `import boto3\nimport json\nimport logging\nfrom datetime import datetime, timedelta\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\nct = boto3.client('cloudtrail')\n\ndef lambda_handler(event, context):\n    # TODO: Look up events from last 24 hours\n    # TODO: Categorize security events\n    # TODO: Return report\n    pass`,
        language: 'python', hints: ['ct.lookup_events(StartTime=...)', 'Check userIdentity type for Root', 'Group by EventName'],
        testCases: [{ description: 'Uses lookup_events', keywords: ['lookup_events'], expectedOutput: 'events' }] } },

    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Module 25: AWS SSM', url: 'module-25.html' }, next: { title: 'Module 27: AWS Config', url: 'module-27.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_26_DATA; } else { window.MODULE_26_DATA = MODULE_26_DATA; }
