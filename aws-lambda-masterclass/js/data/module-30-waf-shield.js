/**
 * MODULE 30 — AWS WAF & Shield — Web Application Firewall
 */
const MODULE_30_DATA = {
  id: 'wafv2-fundamentals', moduleId: 'module-30',
  title: 'AWS WAF & Shield — Web Application Firewall',
  description: 'Master web security. Covers WAF rules, web ACLs, managed rule groups, rate limiting, Shield Standard/Advanced, and integration with CloudFront and ALB.',
  difficulty: 'intermediate', duration: '65 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master WAF & Shield core concepts and architecture', 'Implement WAF & Shield using Boto3 and AWS CLI', 'Troubleshoot common WAF & Shield issues', 'Pass certification questions about WAF & Shield'],
  sections: [
    { id: 'why', type: 'why', title: 'Why WAF & Shield?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🛡️</span><div class="alert-content"><div class="alert-title">Protect Your Web Applications from Attacks</div><div class="alert-text">WAF filters malicious HTTP requests (SQL injection, XSS, bot traffic). Shield provides DDoS protection. Together they protect ALB, CloudFront, and API Gateway.</div></div></div>
      <table><thead><tr><th>Feature</th><th>Shield Standard</th><th>Shield Advanced</th><th>WAF</th></tr></thead><tbody><tr><td><strong>DDoS L3/L4</strong></td><td>✅ Free</td><td>✅ Enhanced</td><td>❌</td></tr><tr><td><strong>DDoS L7</strong></td><td>❌</td><td>✅</td><td>✅ (rules)</td></tr><tr><td><strong>Cost</strong></td><td>Free</td><td>$3K/month</td><td>$5/rule/month</td></tr><tr><td><strong>Response Team</strong></td><td>❌</td><td>24/7 SRT</td><td>❌</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">WAF Rules Without Testing Can Block Legitimate Traffic</div><div class="alert-text">Always deploy WAF rules in Count mode first. Monitor matched requests for false positives before switching to Block mode.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'WAF & Shield Architecture', content: { title: 'WAF: Request → Rules → Allow/Block', width: 750, height: 280,
      nodes: [
          { id: 'client', label: 'Client', icon: '🌐', x: 10, y: 110, type: 'client', description: 'Incoming HTTP request.' },
          { id: 'waf', label: 'WAF Web ACL', icon: '🛡️', x: 200, y: 110, type: 'security', description: 'Evaluates requests against rules in priority order.' },
          { id: 'rules', label: 'Rule Groups', icon: '📋', x: 390, y: 50, type: 'security', description: 'Managed rules (OWASP, Bot Control) + custom rules.' },
          { id: 'shield', label: 'Shield', icon: '🔒', x: 390, y: 200, type: 'security', description: 'DDoS protection. Standard (L3/L4, free) and Advanced (L7, $3K/mo).' },
          { id: 'app', label: 'Application', icon: '🖥️', x: 580, y: 110, type: 'compute', description: 'Protected resource: ALB, CloudFront, or API Gateway.' }
      ],
      edges: [
          { from: 'client', to: 'waf', label: 'HTTP Request', animated: true },
          { from: 'waf', to: 'rules', label: 'Evaluate' },
          { from: 'waf', to: 'shield', label: 'DDoS Check' },
          { from: 'waf', to: 'app', label: 'Allow', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. WAF Rule Types</h4><table><thead><tr><th>Type</th><th>Purpose</th><th>Example</th></tr></thead><tbody><tr><td><strong>Managed</strong></td><td>AWS or marketplace rules</td><td>AWSManagedRulesCommonRuleSet (OWASP)</td></tr><tr><td><strong>Rate-based</strong></td><td>Block IPs exceeding threshold</td><td>Block IPs with >2000 requests/5min</td></tr><tr><td><strong>IP Set</strong></td><td>Allow/block specific IPs</td><td>Allowlist corporate IPs</td></tr><tr><td><strong>Regex</strong></td><td>Pattern matching</td><td>Block requests with SQL keywords</td></tr></tbody></table><h4>2. Shield Tiers</h4><ul><li><strong>Standard (Free):</strong> Automatic DDoS protection for L3/L4 (SYN floods, UDP reflection)</li><li><strong>Advanced ($3K/month):</strong> L7 DDoS, 24/7 Shield Response Team, cost protection, health-based detection</li></ul>` } },
    { id: 'lambda-code', type: 'code', title: 'WAF & Shield Boto3 Operations', content: { title: 'WAF & Shield Management', languages: [
      { id: 'python-wafv2', label: 'Core Operations',
        code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
waf = boto3.client('wafv2')

def get_web_acl_summary(name, scope='REGIONAL'):
    """Get summary of a WAF Web ACL including rule actions."""
    acls = waf.list_web_acls(Scope=scope)
    for acl in acls['WebACLs']:
        if acl['Name'] == name:
            detail = waf.get_web_acl(Name=name, Scope=scope, Id=acl['Id'])
            web_acl = detail['WebACL']
            rules = []
            for rule in web_acl.get('Rules', []):
                rules.append({'name': rule['Name'], 'priority': rule['Priority']})
            logger.info("Web ACL '%s': %d rules", name, len(rules))
            return {'name': name, 'rules': rules, 'default_action': str(web_acl['DefaultAction'])}
    return None`,
        explanations: [
              { line: '10', text: 'list_web_acls with REGIONAL scope for ALB/API Gateway, CLOUDFRONT for CloudFront distributions.' },
              { line: '13-18', text: 'get_web_acl returns the full ACL with all rules, priorities, and actions.' }
        ] }
    ], defaultLang: 'python-wafv2', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'WAF & Shield CLI Commands', content: [
        { command: 'aws wafv2 list-web-acls --scope REGIONAL', category: 'aws-cli', expectedOutput: '{\n  "WebACLs": [{"Name": "api-protection", "Id": "abc-123"}]\n}', explanation: 'Lists WAF Web ACLs. REGIONAL for ALB, CLOUDFRONT for CF.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'WAF & Shield CLI Lab', mode: 'simulated',
      initialText: 'WAF CLI Lab. Try:\n  aws wafv2 list-web-acls --scope REGIONAL\n  aws wafv2 list-available-managed-rule-groups --scope REGIONAL',
      commands: {
          'aws wafv2 list-web-acls --scope REGIONAL': { text: '{\n  "WebACLs": [{"Name": "api-protection", "Id": "abc-123", "ARN": "arn:aws:wafv2:...:webacl/api-protection/abc"}]\n}', type: 'output' },
          'aws wafv2 list-available-managed-rule-groups --scope REGIONAL': { text: '{\n  "ManagedRuleGroups": [\n    {"VendorName": "AWS", "Name": "AWSManagedRulesCommonRuleSet", "Description": "OWASP Top 10 protection"},\n    {"VendorName": "AWS", "Name": "AWSManagedRulesBotControlRuleSet", "Description": "Bot detection and mitigation"}\n  ]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'Legitimate traffic blocked', error: '403 Forbidden from WAF', cause: 'WAF rule matching legitimate requests (false positive).', fix: 'Check WAF logs in S3/CloudWatch. Switch rule to Count mode. Add exclusion for the specific rule.' },
          { title: 'Rate limiting too aggressive', error: 'Many users blocked during peak', cause: 'Rate-based rule threshold too low.', fix: 'Increase the threshold. Use scope-down statements to rate-limit only specific paths.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'WAF & Shield Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Shield Standard vs Advanced?', options: [
              { id: 'a', text: 'Standard: L3/L4 free; Advanced: L7 + SRT + $3K/mo' },
              { id: 'b', text: 'Same features, different pricing' },
              { id: 'c', text: 'Standard is paid, Advanced is free' },
              { id: 'd', text: 'Both only protect CloudFront' }
            ], correctId: 'a', explanation: 'Standard is free automatic L3/L4 DDoS protection. Advanced adds L7, 24/7 response team, and cost protection for $3K/month.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: WAF Rule Analyzer', content: { title: 'WAF Rule Analyzer', description: 'Report all WAF rules and their action modes.', difficulty: 'intermediate',
      requirements: [
          'List all Web ACLs',
          'Get rules for each ACL',
          'Report rule names and actions'
      ],
      starterCode: `import boto3\nimport logging\n\nwaf = boto3.client('wafv2')\n\ndef lambda_handler(event, context):\n    # TODO: List Web ACLs\n    # TODO: Get rules per ACL\n    pass`,
      language: 'python', hints: [
          'waf.list_web_acls(Scope="REGIONAL")',
          'waf.get_web_acl(Name=..., Scope=..., Id=...)'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 30: AWS Backup', url: 'module-28.html' }, next: { title: 'Chapter 32: AWS PrivateLink', url: 'module-32.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_30_DATA; } else { window.MODULE_30_DATA = MODULE_30_DATA; }
