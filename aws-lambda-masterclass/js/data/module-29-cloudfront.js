/**
 * MODULE 29 — Amazon CloudFront — Content Delivery Network
 */
const MODULE_29_DATA = {
  id: 'cloudfront-fundamentals', moduleId: 'module-29',
  title: 'Amazon CloudFront — Content Delivery Network',
  description: 'Master CDN delivery. Covers distributions, origins, cache behaviors, invalidation, Lambda@Edge, Origin Access Control, signed URLs, and HTTPS/TLS configuration.',
  difficulty: 'intermediate', duration: '65 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master CloudFront core concepts and architecture', 'Implement CloudFront using Boto3 and AWS CLI', 'Troubleshoot common CloudFront issues', 'Pass certification questions about CloudFront'],
  sections: [
    { id: 'why', type: 'why', title: 'Why CloudFront?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🌐</span><div class="alert-content"><div class="alert-title">Deliver Content Globally — Sub-Second Latency</div><div class="alert-text">CloudFront caches your content at 400+ edge locations worldwide. Users get responses from the nearest edge instead of your origin server.</div></div></div>
      <table><thead><tr><th>Feature</th><th>CloudFront</th><th>S3 Direct</th><th>ALB Direct</th></tr></thead><tbody><tr><td><strong>Latency</strong></td><td>~10ms (edge)</td><td>50-200ms</td><td>50-200ms</td></tr><tr><td><strong>Caching</strong></td><td>Built-in</td><td>None</td><td>None</td></tr><tr><td><strong>DDoS</strong></td><td>Shield Standard free</td><td>Limited</td><td>Limited</td></tr><tr><td><strong>Cost</strong></td><td>$0.085/GB</td><td>$0.09/GB</td><td>$0.09/GB</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Always Use Origin Access Control (OAC) for S3</div><div class="alert-text">Never make your S3 bucket public. Use OAC to let CloudFront access S3 privately. OAC replaces the older Origin Access Identity (OAI).</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'CloudFront Architecture', content: { title: 'CloudFront: Client → Edge → Origin', width: 750, height: 280,
      nodes: [
          { id: 'client', label: 'Client', icon: '👤', x: 10, y: 110, type: 'client', description: 'User requesting content from nearest edge.' },
          { id: 'edge', label: 'Edge Location', icon: '🌐', x: 200, y: 110, type: 'compute', description: '400+ PoPs worldwide. Caches content based on cache behaviors.' },
          { id: 'cf', label: 'CloudFront', icon: '⚡', x: 390, y: 110, type: 'trigger', description: 'Distribution configuration: origins, behaviors, SSL, WAF.' },
          { id: 's3', label: 'S3 Origin', icon: '🪣', x: 580, y: 50, type: 'storage', description: 'Static assets (HTML, CSS, JS, images). Protected by OAC.' },
          { id: 'alb', label: 'ALB Origin', icon: '⚖️', x: 580, y: 200, type: 'compute', description: 'Dynamic API origin. CloudFront forwards requests to ALB.' }
      ],
      edges: [
          { from: 'client', to: 'edge', label: 'GET /index.html', animated: true },
          { from: 'edge', to: 'cf', label: 'Cache Miss' },
          { from: 'cf', to: 's3', label: 'Static' },
          { from: 'cf', to: 'alb', label: 'Dynamic', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. Distributions</h4><p>A distribution maps a domain (d123.cloudfront.net or custom) to one or more origins with cache behaviors.</p><h4>2. Cache Behaviors</h4><table><thead><tr><th>Setting</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>Path Pattern</strong></td><td>/api/* → ALB origin, /* → S3 origin</td></tr><tr><td><strong>TTL</strong></td><td>How long to cache (default 24h)</td></tr><tr><td><strong>Forwarded Headers</strong></td><td>Which headers to forward to origin</td></tr><tr><td><strong>Viewer Protocol</strong></td><td>Redirect HTTP to HTTPS</td></tr></tbody></table><h4>3. Origin Access Control (OAC)</h4><p>Allows CloudFront to access private S3 buckets. S3 bucket policy grants access only to the CloudFront distribution. Replaces deprecated OAI.</p><h4>4. Lambda@Edge</h4><p>Run Lambda functions at edge locations for: URL rewrites, A/B testing, auth at the edge, custom headers. Triggered on viewer-request, origin-request, origin-response, viewer-response events.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'CloudFront Boto3 Operations', content: { title: 'CloudFront Management', languages: [
      { id: 'python-cloudfront', label: 'Core Operations',
        code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
cf = boto3.client('cloudfront')

def create_invalidation(distribution_id, paths):
    """Invalidate cached content at edge locations."""
    response = cf.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            'Paths': {'Quantity': len(paths), 'Items': paths},
            'CallerReference': str(int(__import__('time').time()))
        }
    )
    inv_id = response['Invalidation']['Id']
    logger.info("Invalidation created: %s for paths: %s", inv_id, paths)
    return inv_id


def list_distributions():
    """List all CloudFront distributions."""
    response = cf.list_distributions()
    dists = []
    for d in response.get('DistributionList', {}).get('Items', []):
        dists.append({
            'id': d['Id'],
            'domain': d['DomainName'],
            'status': d['Status'],
            'origins': [o['DomainName'] for o in d['Origins']['Items']]
        })
    return dists`,
        explanations: [
              { line: '10-16', text: 'create_invalidation removes cached content from edge locations. Use /* to invalidate everything. First 1,000 paths/month are free.' },
              { line: '24-32', text: 'list_distributions returns all CDN distributions with their origins and status.' }
        ] }
    ], defaultLang: 'python-cloudfront', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'CloudFront CLI Commands', content: [
        { command: 'aws cloudfront create-invalidation --distribution-id E123 --paths "/*"', category: 'aws-cli', expectedOutput: '{\n  "Invalidation": {"Id": "I123", "Status": "InProgress", "CreateTime": "2026-09-17T12:00:00Z"}\n}', explanation: 'Invalidates all cached content. Takes 5-10 minutes to propagate globally.', interviewQ: 'When would you invalidate CloudFront cache vs setting a lower TTL?' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'CloudFront CLI Lab', mode: 'simulated',
      initialText: 'CloudFront CLI Lab. Try:\n  aws cloudfront list-distributions\n  aws cloudfront get-distribution --id E123',
      commands: {
          'aws cloudfront list-distributions': { text: '{\n  "DistributionList": {"Items": [{"Id": "E123", "DomainName": "d123.cloudfront.net", "Status": "Deployed", "Origins": {"Items": [{"DomainName": "my-bucket.s3.amazonaws.com"}]}}]}\n}', type: 'output' },
          'aws cloudfront get-distribution --id E123': { text: '{\n  "Distribution": {"Id": "E123", "Status": "Deployed", "DomainName": "d123.cloudfront.net", "DistributionConfig": {"DefaultCacheBehavior": {"ViewerProtocolPolicy": "redirect-to-https"}, "Origins": {"Items": [{"DomainName": "my-bucket.s3.amazonaws.com", "OriginAccessControlId": "OAC123"}]}}}\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: '403 Access Denied from S3 origin', error: '403 Forbidden', cause: 'S3 bucket policy doesn\'t allow CloudFront OAC access.', fix: 'Update bucket policy: Principal=cloudfront.amazonaws.com, Condition: StringEquals aws:SourceArn to distribution ARN.' },
          { title: 'Stale content after deployment', error: 'Users see old content', cause: 'CloudFront caches content for TTL duration (default 24h).', fix: 'Create invalidation for changed paths, or use versioned filenames (app.v2.js) instead.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'CloudFront Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Best way to serve static assets globally with lowest latency?', options: [
              { id: 'a', text: 'S3 directly' },
              { id: 'b', text: 'CloudFront + S3 with OAC' },
              { id: 'c', text: 'ALB in each region' },
              { id: 'd', text: 'EC2 in each region' }
            ], correctId: 'b', explanation: 'CloudFront caches at 400+ edge locations. OAC keeps S3 private.', difficulty: 'beginner' },
          { id: 'q2', question: 'What replaced Origin Access Identity (OAI)?', options: [
              { id: 'a', text: 'IAM roles' },
              { id: 'b', text: 'Origin Access Control (OAC)' },
              { id: 'c', text: 'S3 bucket policies' },
              { id: 'd', text: 'CloudFront functions' }
            ], correctId: 'b', explanation: 'OAC supports more features: SSE-KMS, HTTP POST/PUT, all S3 regions.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Cache Invalidation Manager', content: { title: 'Cache Invalidation Manager', description: 'Build a Lambda that invalidates CloudFront cache on S3 object updates.', difficulty: 'intermediate',
      requirements: [
          'Accept S3 event notification',
          'Extract changed object paths',
          'Create CloudFront invalidation'
      ],
      starterCode: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\ncf = boto3.client('cloudfront')\n\ndef lambda_handler(event, context):\n    # TODO: Extract S3 paths from event\n    # TODO: Create CloudFront invalidation\n    pass`,
      language: 'python', hints: [
          'event[\'Records\'][0][\'s3\'][\'object\'][\'key\']',
          'cf.create_invalidation(DistributionId=..., InvalidationBatch=...)'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Module 28: AWS Backup', url: 'module-28.html' }, next: { title: 'Module 30: AWS WAF & Shield', url: 'module-30.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_29_DATA; } else { window.MODULE_29_DATA = MODULE_29_DATA; }
