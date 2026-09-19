/**
 * MODULE 38 — AWS Certificate Manager (ACM)
 * SSL/TLS certificate provisioning, management, and deployment
 */
const MODULE_38_DATA = {
  id: 'acm-fundamentals', moduleId: 'module-38',
  title: 'AWS Certificate Manager (ACM) — SSL/TLS Certificates',
  description: 'Master SSL/TLS on AWS. Covers public/private certificates, DNS & email validation, auto-renewal, ALB & CloudFront integration, and certificate transparency.',
  difficulty: 'intermediate', duration: '60 min',
  prerequisites: ['Module 07: Route 53', 'Module 18: Elastic Load Balancing'],
  objectives: [
    'Request and validate public SSL/TLS certificates',
    'Understand DNS validation vs email validation trade-offs',
    'Attach certificates to ALB, CloudFront, and API Gateway',
    'Configure automatic renewal for zero-downtime HTTPS',
    'Use ACM Private CA for internal services',
    'Troubleshoot certificate validation and renewal failures'
  ],

  sections: [
    { id: 'why', type: 'why', title: 'Why ACM?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#128272;</span><div class="alert-content"><div class="alert-title">Free SSL/TLS Certificates, Fully Managed</div><div class="alert-text">ACM provides free public certificates that auto-renew. No more expired certs crashing your site at 2 AM. No more buying from third-party CAs. No more manual renewal cycles.</div></div></div>
      <h4>The Problem ACM Solves</h4>
      <p>Without ACM: Buy certificates ($50-$300/year), manually install them on every server, track expiration dates, manually renew every year, risk outages from expired certs.</p>
      <p>With ACM: Free certificates, automatic renewal, one-click deployment to ALB/CloudFront, no private keys to manage, no expiration anxiety.</p>
      <table><thead><tr><th>Feature</th><th>ACM (AWS)</th><th>Traditional CA</th></tr></thead><tbody>
        <tr><td><strong>Cost</strong></td><td>Free (public)</td><td>$50-$300/year</td></tr>
        <tr><td><strong>Renewal</strong></td><td>Automatic</td><td>Manual</td></tr>
        <tr><td><strong>Installation</strong></td><td>One-click to ALB</td><td>Upload PEM files</td></tr>
        <tr><td><strong>Private Key</strong></td><td>AWS manages (can't export)</td><td>You manage</td></tr>
        <tr><td><strong>Wildcard</strong></td><td>Yes, free</td><td>Usually costs more</td></tr>
      </tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">&#9888;&#65039;</span><div class="alert-content"><div class="alert-title">ACM Certificates Cannot Be Used on EC2 Directly</div><div class="alert-text">ACM certificates can only be deployed to integrated AWS services (ALB, CloudFront, API Gateway, Elastic Beanstalk). You cannot download the private key. For EC2, use Let's Encrypt or import a certificate.</div></div></div>
    ` } },

    { id: 'architecture', type: 'architecture', title: 'ACM Certificate Lifecycle', content: { title: 'Request &rarr; Validate &rarr; Issue &rarr; Deploy &rarr; Auto-Renew', width: 750, height: 280,
      nodes: [
        { id: 'request', label: 'Request Cert', icon: '&#128221;', x: 10, y: 110, type: 'client', description: 'Request a public certificate for your domain (e.g., *.example.com). Specify domain names and SANs.' },
        { id: 'validate', label: 'DNS Validation', icon: '&#9989;', x: 170, y: 110, type: 'security', description: 'Prove domain ownership by adding a CNAME record to Route 53. ACM checks this record to issue the certificate.' },
        { id: 'issue', label: 'Certificate Issued', icon: '&#128272;', x: 340, y: 110, type: 'security', description: 'ACM issues the certificate. Status changes to "Issued". Certificate is stored securely in ACM.' },
        { id: 'deploy', label: 'Deploy to ALB', icon: '&#9889;', x: 510, y: 50, type: 'compute', description: 'Attach certificate to ALB HTTPS listener, CloudFront distribution, or API Gateway custom domain.' },
        { id: 'renew', label: 'Auto-Renew', icon: '&#128260;', x: 510, y: 200, type: 'storage', description: 'ACM automatically renews DNS-validated certificates before expiration. Zero manual intervention needed.' }
      ],
      edges: [
        { from: 'request', to: 'validate', label: 'DNS CNAME', animated: true },
        { from: 'validate', to: 'issue', label: 'Verified', animated: true },
        { from: 'issue', to: 'deploy', label: 'Attach', animated: true },
        { from: 'issue', to: 'renew', label: '60 days before expiry' }
      ] } },

    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Certificate Types</h4>
      <table><thead><tr><th>Type</th><th>Cost</th><th>Use Case</th><th>Can Export?</th></tr></thead><tbody>
        <tr><td><strong>Public</strong></td><td>Free</td><td>Internet-facing websites, APIs</td><td>No</td></tr>
        <tr><td><strong>Private (ACM PCA)</strong></td><td>$400/month/CA</td><td>Internal services, mTLS, IoT</td><td>Yes</td></tr>
        <tr><td><strong>Imported</strong></td><td>Free (cert cost varies)</td><td>Third-party certs, EC2</td><td>N/A (you already have it)</td></tr>
      </tbody></table>

      <h4>2. Validation Methods</h4>
      <table><thead><tr><th>Method</th><th>How</th><th>Speed</th><th>Auto-Renewal</th><th>Best For</th></tr></thead><tbody>
        <tr><td><strong>DNS</strong></td><td>Add CNAME to DNS</td><td>Minutes (Route 53)</td><td>Yes (automatic)</td><td>Production (always use this)</td></tr>
        <tr><td><strong>Email</strong></td><td>Click link in email</td><td>Hours (human required)</td><td>No (manual each time)</td><td>Testing only</td></tr>
      </tbody></table>

      <h4>3. Supported AWS Services</h4>
      <ul>
        <li><strong>ALB/NLB</strong> &mdash; SSL termination at load balancer (most common)</li>
        <li><strong>CloudFront</strong> &mdash; HTTPS at edge (certificate MUST be in us-east-1)</li>
        <li><strong>API Gateway</strong> &mdash; Custom domain names</li>
        <li><strong>Elastic Beanstalk</strong> &mdash; HTTPS for EB environments</li>
        <li><strong>App Runner</strong> &mdash; Custom domains</li>
      </ul>

      <h4>4. Certificate Transparency (CT)</h4>
      <p>All public ACM certificates are logged in CT logs (publicly visible). This means anyone can see what domains you have certificates for. Use Private CA if you need confidentiality for internal domain names.</p>

      <h4>5. Regional vs Global</h4>
      <div class="alert alert-warning"><span class="alert-icon">&#9888;&#65039;</span><div class="alert-content"><div class="alert-title">CloudFront Requires us-east-1</div><div class="alert-text">For CloudFront distributions, the ACM certificate MUST be in us-east-1 (N. Virginia). For ALB, the certificate must be in the same region as the ALB.</div></div></div>
    ` } },

    { id: 'lambda-code', type: 'code', title: 'ACM Boto3 Operations', content: { title: 'Certificate Management', languages: [
      { id: 'python-acm', label: 'Core Operations',
        code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
acm = boto3.client('acm')

def request_certificate(domain, san_list=None):
    """Request a public ACM certificate with DNS validation."""
    params = {
        'DomainName': domain,
        'ValidationMethod': 'DNS',
        'Tags': [{'Key': 'Environment', 'Value': 'production'}]
    }
    if san_list:
        params['SubjectAlternativeNames'] = san_list

    response = acm.request_certificate(**params)
    cert_arn = response['CertificateArn']
    logger.info("Certificate requested: %s", cert_arn)

    # Get DNS validation records
    waiter = acm.get_waiter('certificate_validated')
    desc = acm.describe_certificate(CertificateArn=cert_arn)
    for opt in desc['Certificate']['DomainValidationOptions']:
        rr = opt.get('ResourceRecord', {})
        logger.info("Add CNAME: %s -> %s", rr.get('Name'), rr.get('Value'))
    return cert_arn

def list_certificates(statuses=None):
    """List all ACM certificates with optional status filter."""
    params = {}
    if statuses:
        params['CertificateStatuses'] = statuses
    certs = acm.list_certificates(**params)
    for c in certs['CertificateSummaryList']:
        logger.info("%s | %s | %s", c['DomainName'], c['Status'], c['CertificateArn'])
    return certs['CertificateSummaryList']

def check_expiring(days=30):
    """Find certificates expiring within N days."""
    from datetime import datetime, timezone, timedelta
    threshold = datetime.now(timezone.utc) + timedelta(days=days)
    certs = acm.list_certificates(CertificateStatuses=['ISSUED'])
    expiring = []
    for c in certs['CertificateSummaryList']:
        desc = acm.describe_certificate(CertificateArn=c['CertificateArn'])
        not_after = desc['Certificate'].get('NotAfter')
        if not_after and not_after < threshold:
            expiring.append({'domain': c['DomainName'], 'expires': str(not_after)})
            logger.warning("EXPIRING: %s on %s", c['DomainName'], not_after)
    return expiring`,
        explanations: [
          { line: '9-10', text: 'DNS validation is recommended over email — enables auto-renewal and is faster with Route 53.' },
          { line: '22-24', text: 'After requesting, retrieve the CNAME records needed for DNS validation. Add these to your Route 53 hosted zone.' },
          { line: '35-42', text: 'Monitoring for expiring certificates is critical. Imported certificates do NOT auto-renew.' }
        ] }
    ], defaultLang: 'python-acm', expectedOutput: 'Certificate ARN: arn:aws:acm:us-east-1:123456789012:certificate/abc-123' } },

    { id: 'cli-commands', type: 'command', title: 'ACM CLI Commands', content: [
      { command: 'aws acm request-certificate --domain-name "*.example.com" --validation-method DNS --subject-alternative-names "example.com"', category: 'aws-cli', expectedOutput: '{\n  "CertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/abc-123-def"\n}', explanation: 'Request a wildcard certificate with the apex domain as SAN. DNS validation enables auto-renewal.' },
      { command: 'aws acm describe-certificate --certificate-arn $CERT_ARN --query "Certificate.DomainValidationOptions[].ResourceRecord"', category: 'aws-cli', expectedOutput: '[\n  {\n    "Name": "_abc123.example.com.",\n    "Type": "CNAME",\n    "Value": "_def456.acm-validations.aws."\n  }\n]', explanation: 'Get the DNS CNAME records needed for validation. Add these to your Route 53 hosted zone.' },
      { command: 'aws acm list-certificates --certificate-statuses ISSUED', category: 'aws-cli', expectedOutput: '{\n  "CertificateSummaryList": [\n    {"DomainName": "*.example.com", "CertificateArn": "arn:...", "Status": "ISSUED"}\n  ]\n}', explanation: 'List all issued certificates. Filter by status: PENDING_VALIDATION, ISSUED, INACTIVE, EXPIRED, FAILED.' }
    ] },

    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'ACM CLI Lab', mode: 'simulated',
      initialText: 'ACM Certificate Lab. Try:\n  aws acm list-certificates\n  aws acm request-certificate --domain-name example.com --validation-method DNS',
      commands: {
        'aws acm list-certificates': { text: '{\n  "CertificateSummaryList": [\n    {"DomainName": "*.example.com", "CertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/abc-123", "Status": "ISSUED"},\n    {"DomainName": "api.example.com", "CertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/def-456", "Status": "ISSUED"}\n  ]\n}', type: 'output' },
        'aws acm request-certificate --domain-name example.com --validation-method DNS': { text: '{\n  "CertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/new-cert-789"\n}\n\nNote: Certificate is PENDING_VALIDATION. Add the CNAME record to your DNS to complete validation.', type: 'output' },
        'aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/abc-123': { text: '{\n  "Certificate": {\n    "DomainName": "*.example.com",\n    "Status": "ISSUED",\n    "Type": "AMAZON_ISSUED",\n    "KeyAlgorithm": "RSA-2048",\n    "NotBefore": "2024-01-15T00:00:00Z",\n    "NotAfter": "2025-01-15T00:00:00Z",\n    "RenewalSummary": {"RenewalStatus": "SUCCESS"}\n  }\n}', type: 'output' }
      } } },

    { id: 'lab', type: 'lab', title: 'Practical Lab: HTTPS with ACM + ALB', content: {
      title: 'Request ACM Certificate and Attach to ALB',
      description: 'Request a free SSL certificate, validate via DNS, attach to ALB HTTPS listener, and configure HTTP-to-HTTPS redirect.',
      difficulty: 'intermediate', duration: '25 min',
      objectives: ['Request ACM certificate', 'Complete DNS validation via Route 53', 'Create HTTPS listener on ALB', 'Configure HTTP redirect'],
      steps: [
        { title: 'Request ACM Certificate', instructions: 'Go to ACM Console > Request certificate > Request a public certificate.\n\nDomain name: example.com\nAdditional names: *.example.com\nValidation method: DNS\n\nClick Request.', validation: 'Certificate shows status "Pending validation"' },
        { title: 'Complete DNS Validation', instructions: 'Click the certificate > Click "Create records in Route 53".\n\nACM automatically adds the CNAME validation record to your Route 53 hosted zone.\n\nWait 5-10 minutes for validation.', validation: 'Certificate status changes to "Issued"' },
        { title: 'Add HTTPS Listener to ALB', instructions: 'Go to EC2 > Load Balancers > Select ALB > Listeners tab.\n\nAdd listener:\n  Protocol: HTTPS\n  Port: 443\n  Default action: Forward to target group\n  Default SSL certificate: Select your ACM cert', validation: 'HTTPS:443 listener shows with ACM certificate' },
        { title: 'Configure HTTP Redirect', instructions: 'Edit the HTTP:80 listener.\n\nChange action to: Redirect to HTTPS\n  Protocol: HTTPS\n  Port: 443\n  Status code: 301 (permanent)', validation: 'HTTP requests redirect to HTTPS automatically' },
        { title: 'Test HTTPS', instructions: 'Open browser: https://www.example.com\n\nVerify:\n  - Padlock icon shows in browser\n  - Certificate issued by Amazon\n  - No certificate warnings', validation: 'Website loads with valid HTTPS and padlock' }
      ] } },

    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Certificate stuck in Pending Validation', error: 'Status: PENDING_VALIDATION for hours', cause: 'DNS CNAME record not added, or DNS propagation delay, or wrong hosted zone.', fix: '1. Verify CNAME record in Route 53 matches exactly (including trailing dot). 2. Check you added it to the correct hosted zone. 3. Wait up to 72 hours for non-Route 53 DNS.' },
      { title: 'Certificate not showing in CloudFront dropdown', error: 'Cannot select ACM certificate for CloudFront', cause: 'Certificate is not in us-east-1 region.', fix: 'Request a new certificate in us-east-1 (N. Virginia). CloudFront only uses certificates from that region.' },
      { title: 'Auto-renewal failed', error: 'Certificate renewal status: FAILED', cause: 'Email-validated certificate (requires manual action) or DNS CNAME record was deleted.', fix: 'For DNS validation: ensure the CNAME validation record still exists in DNS. For email: check domain contact email and click renewal link.' },
      { title: 'ERR_CERT_COMMON_NAME_INVALID in browser', error: 'Browser shows certificate name mismatch', cause: 'Certificate domain does not match the URL being accessed.', fix: 'Ensure the certificate covers the exact domain. Use wildcard (*.example.com) to cover subdomains. The apex (example.com) needs to be listed separately as a SAN.' }
    ] } },

    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'ACM Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'Which ACM validation method supports automatic certificate renewal?', options: [
        { id: 'a', text: 'DNS validation (CNAME record)' },
        { id: 'b', text: 'Email validation' },
        { id: 'c', text: 'Both support auto-renewal' },
        { id: 'd', text: 'Neither — all require manual renewal' }
      ], correctId: 'a', explanation: 'DNS validation supports auto-renewal because ACM can re-verify domain ownership by checking the CNAME record. Email validation requires manual action each time.', difficulty: 'beginner' },
      { id: 'q2', question: 'You need an ACM certificate for a CloudFront distribution serving content from ap-south-1. Where must the certificate be?', options: [
        { id: 'a', text: 'ap-south-1 (same as content origin)' },
        { id: 'b', text: 'us-east-1 (N. Virginia) — always' },
        { id: 'c', text: 'Any region — CloudFront is global' },
        { id: 'd', text: 'The certificate must be imported, not ACM' }
      ], correctId: 'b', explanation: 'CloudFront is a global service that requires ACM certificates to be in us-east-1, regardless of where the origin is located.', difficulty: 'intermediate' },
      { id: 'q3', question: 'Can you export the private key of an ACM-issued public certificate?', options: [
        { id: 'a', text: 'Yes, via the ACM console' },
        { id: 'b', text: 'Yes, via the CLI' },
        { id: 'c', text: 'No — ACM manages the private key and it cannot be exported' },
        { id: 'd', text: 'Only with KMS permissions' }
      ], correctId: 'c', explanation: 'ACM-issued public certificates have their private keys managed entirely by AWS. You cannot export them. This is a security feature. If you need the private key (e.g., for EC2), use ACM Private CA or import your own certificate.', difficulty: 'intermediate' },
      { id: 'q4', question: 'Your ACM certificate renewal failed. What is the most likely cause?', options: [
        { id: 'a', text: 'The DNS CNAME validation record was deleted' },
        { id: 'b', text: 'The certificate is too old' },
        { id: 'c', text: 'ACM does not support renewal' },
        { id: 'd', text: 'The ALB was stopped' }
      ], correctId: 'a', explanation: 'ACM auto-renewal requires the DNS CNAME validation record to still exist. If it was deleted (e.g., during DNS migration), renewal fails. The fix is to re-add the CNAME record.', difficulty: 'advanced' },
      { id: 'q5', question: 'What is the cost of a public ACM certificate?', options: [
        { id: 'a', text: '$75/year' },
        { id: 'b', text: '$12/month' },
        { id: 'c', text: 'Free' },
        { id: 'd', text: 'Depends on the number of domains' }
      ], correctId: 'c', explanation: 'Public ACM certificates are completely free, including wildcard certificates. You only pay for the AWS resources that use them (ALB, CloudFront, etc.). ACM Private CA costs $400/month.', difficulty: 'beginner' }
    ] } },

    { id: 'challenge', type: 'challenge', title: 'Challenge: Certificate Inventory', content: { title: 'ACM Certificate Auditor', description: 'Write a function that audits all ACM certificates across regions, identifies expiring/failed certificates, and returns a compliance report.', difficulty: 'advanced',
      starterCode: `import boto3\nfrom datetime import datetime, timezone, timedelta\n\ndef audit_certificates(regions=['us-east-1', 'ap-south-1']):\n    """Audit ACM certificates across regions.\n    Return: {'total': N, 'issued': N, 'expiring_30d': [...], 'failed': [...]}\n    """\n    report = {'total': 0, 'issued': 0, 'expiring_30d': [], 'failed': []}\n    # YOUR CODE HERE\n    return report`,
      solution: `import boto3\nfrom datetime import datetime, timezone, timedelta\n\ndef audit_certificates(regions=['us-east-1', 'ap-south-1']):\n    report = {'total': 0, 'issued': 0, 'expiring_30d': [], 'failed': []}\n    threshold = datetime.now(timezone.utc) + timedelta(days=30)\n    for region in regions:\n        acm = boto3.client('acm', region_name=region)\n        certs = acm.list_certificates(Includes={'keyTypes': ['RSA_2048', 'EC_prime256v1']})\n        for c in certs['CertificateSummaryList']:\n            report['total'] += 1\n            desc = acm.describe_certificate(CertificateArn=c['CertificateArn'])\n            cert = desc['Certificate']\n            if cert['Status'] == 'ISSUED':\n                report['issued'] += 1\n                if cert.get('NotAfter') and cert['NotAfter'] < threshold:\n                    report['expiring_30d'].append({'domain': cert['DomainName'], 'region': region, 'expires': str(cert['NotAfter'])})\n            elif cert['Status'] == 'FAILED':\n                report['failed'].append({'domain': cert['DomainName'], 'region': region, 'reason': cert.get('FailureReason', 'UNKNOWN')})\n    return report`,
      testCases: [
        { description: 'Returns dict with required keys', expectedBehavior: 'Output contains total, issued, expiring_30d, failed' }
      ] } },

    { id: 'interview', type: 'concept', title: 'Interview Questions', content: { html: `
      <h4>Beginner</h4>
      <ul>
        <li><strong>Q: What is ACM?</strong><br>A: AWS Certificate Manager provides free public SSL/TLS certificates with automatic renewal, managed by AWS.</li>
        <li><strong>Q: DNS vs Email validation?</strong><br>A: DNS validation adds a CNAME record — faster, supports auto-renewal. Email requires manual clicks — no auto-renewal. Always use DNS.</li>
      </ul>
      <h4>Intermediate</h4>
      <ul>
        <li><strong>Q: Can you use ACM certs on EC2?</strong><br>A: No directly. ACM certs deploy only to ALB, CloudFront, API Gateway. For EC2, use ACM Private CA (exportable) or Let's Encrypt.</li>
        <li><strong>Q: Why must CloudFront certs be in us-east-1?</strong><br>A: CloudFront is a global service managed from us-east-1. It only reads certificates from that region's ACM.</li>
      </ul>
      <h4>Advanced / Scenario</h4>
      <ul>
        <li><strong>Q: Certificate renewal failed. How do you investigate?</strong><br>A: Check ACM console for FailureReason. If DNS-validated, verify CNAME validation record still exists. If email-validated, check domain owner email. Check CloudTrail for ACM events. Set up EventBridge rule for ACM certificate expiry events.</li>
        <li><strong>Q: How do you implement end-to-end encryption (not just SSL termination)?</strong><br>A: ALB does SSL termination (HTTPS from client). For end-to-end: configure ALB to re-encrypt to targets (HTTPS target group). Install a certificate on the EC2/container too. Or use NLB with TLS passthrough.</li>
      </ul>
    ` } },

    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `
      <h4>Resources to Remove</h4>
      <ol>
        <li>Remove HTTPS listener from ALB (or delete ALB)</li>
        <li>Delete ACM certificate (must be disassociated from all resources first)</li>
        <li>Remove DNS validation CNAME from Route 53 (optional — it's harmless)</li>
      </ol>
      <pre><code>aws acm delete-certificate --certificate-arn $CERT_ARN</code></pre>
    ` } },

    { id: 'next', type: 'next', title: 'Next Steps', content: {
      currentModule: 'ACM',
      nextModule: { title: 'Amazon EC2 Auto Scaling', href: 'module-39.html' },
      message: 'Now that HTTPS is configured, learn how to scale your application automatically.'
    } }
  ]
};
