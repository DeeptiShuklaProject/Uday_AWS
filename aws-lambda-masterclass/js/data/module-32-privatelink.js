/**
 * MODULE 32 — AWS PrivateLink — Private Connectivity to Services
 */
const MODULE_32_DATA = {
  id: 'ec2-fundamentals', moduleId: 'module-32',
  title: 'AWS PrivateLink — Private Connectivity to Services',
  description: 'Master private connectivity. Covers VPC endpoints (interface and gateway), endpoint services, PrivateLink for SaaS, and eliminating internet exposure.',
  difficulty: 'intermediate', duration: '65 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master PrivateLink core concepts and architecture', 'Implement PrivateLink using Boto3 and AWS CLI', 'Troubleshoot common PrivateLink issues', 'Pass certification questions about PrivateLink'],
  sections: [
    { id: 'why', type: 'why', title: 'Why PrivateLink?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🔒</span><div class="alert-content"><div class="alert-title">Access AWS Services Without the Internet</div><div class="alert-text">PrivateLink keeps traffic between your VPC and AWS services on the AWS backbone network. No internet gateway, NAT, or public IPs needed. Eliminates exposure to the public internet.</div></div></div>
      <table><thead><tr><th>Feature</th><th>Gateway Endpoint</th><th>Interface Endpoint</th></tr></thead><tbody><tr><td><strong>Services</strong></td><td>S3, DynamoDB</td><td>100+ services</td></tr><tr><td><strong>Cost</strong></td><td>Free</td><td>~$7/month + data</td></tr><tr><td><strong>Implementation</strong></td><td>Route table entry</td><td>ENI in subnet</td></tr><tr><td><strong>DNS</strong></td><td>Automatic</td><td>Private DNS zone</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Gateway Endpoints Only Support S3 and DynamoDB</div><div class="alert-text">Gateway endpoints are free but only work for S3 and DynamoDB. For all other services (ECR, CloudWatch, SQS, etc.), you need interface endpoints ($7/month each).</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'PrivateLink Architecture', content: { title: 'VPC Endpoint: Private Access to AWS Services', width: 750, height: 280,
      nodes: [
          { id: 'app', label: 'Application', icon: '🖥️', x: 10, y: 110, type: 'compute', description: 'EC2 or Fargate task in private subnet.' },
          { id: 'gw', label: 'Gateway Endpoint', icon: '🚪', x: 250, y: 50, type: 'security', description: 'Free. Route table entry for S3/DynamoDB. Traffic stays on AWS backbone.' },
          { id: 'iface', label: 'Interface Endpoint', icon: '🔌', x: 250, y: 200, type: 'security', description: 'ENI in your subnet. Private IP for AWS service. ~$7/month.' },
          { id: 's3', label: 'S3', icon: '🪣', x: 500, y: 50, type: 'storage', description: 'Accessed privately via gateway endpoint.' },
          { id: 'ecr', label: 'ECR / SQS / etc', icon: '📦', x: 500, y: 200, type: 'compute', description: 'Accessed privately via interface endpoint.' }
      ],
      edges: [
          { from: 'app', to: 'gw', label: 'S3/DynamoDB', animated: true },
          { from: 'app', to: 'iface', label: 'Other Services', animated: true },
          { from: 'gw', to: 's3', label: 'Private' },
          { from: 'iface', to: 'ecr', label: 'Private' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. Gateway Endpoints</h4><ul><li>Free, no bandwidth charges</li><li>Only S3 and DynamoDB</li><li>Added as route table entry</li><li>Cannot access from on-premises (VPN/Direct Connect)</li></ul><h4>2. Interface Endpoints</h4><ul><li>~$7/month per AZ + $0.01/GB</li><li>100+ services supported</li><li>ENI with private IP in your subnet</li><li>Private DNS resolves service domain to private IP</li><li>Works with VPN and Direct Connect</li></ul><h4>3. Endpoint Policies</h4><p>JSON policies that control which resources the endpoint can access. E.g., restrict S3 endpoint to specific buckets only.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'PrivateLink Boto3 Operations', content: { title: 'PrivateLink Management', languages: [
      { id: 'python-ec2', label: 'Core Operations',
        code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
ec2 = boto3.client('ec2')

def create_interface_endpoint(vpc_id, service, subnets, security_groups):
    """Create a VPC interface endpoint for a service."""
    response = ec2.create_vpc_endpoint(
        VpcId=vpc_id,
        ServiceName=f'com.amazonaws.us-east-1.{service}',
        VpcEndpointType='Interface',
        SubnetIds=subnets,
        SecurityGroupIds=security_groups,
        PrivateDnsEnabled=True
    )
    endpoint_id = response['VpcEndpoint']['VpcEndpointId']
    logger.info("Endpoint created: %s for %s", endpoint_id, service)
    return endpoint_id`,
        explanations: [
              { line: '12', text: 'Service name format: com.amazonaws.<region>.<service>. E.g., com.amazonaws.us-east-1.ecr.api' },
              { line: '16', text: 'PrivateDnsEnabled=True makes the public service domain resolve to the private endpoint IP.' }
        ] }
    ], defaultLang: 'python-ec2', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'PrivateLink CLI Commands', content: [
        { command: 'aws ec2 describe-vpc-endpoints --filters Name=vpc-id,Values=vpc-abc123', category: 'aws-cli', expectedOutput: '{\n  "VpcEndpoints": [{"VpcEndpointId": "vpce-123", "ServiceName": "com.amazonaws.us-east-1.s3", "VpcEndpointType": "Gateway", "State": "available"}]\n}', explanation: 'Lists VPC endpoints in a VPC.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'PrivateLink CLI Lab', mode: 'simulated',
      initialText: 'PrivateLink CLI Lab. Try:\n  aws ec2 describe-vpc-endpoints\n  aws ec2 describe-vpc-endpoint-services',
      commands: {
          'aws ec2 describe-vpc-endpoints': { text: '{\n  "VpcEndpoints": [\n    {"VpcEndpointId": "vpce-s3", "ServiceName": "com.amazonaws.us-east-1.s3", "VpcEndpointType": "Gateway"},\n    {"VpcEndpointId": "vpce-ecr", "ServiceName": "com.amazonaws.us-east-1.ecr.dkr", "VpcEndpointType": "Interface"}\n  ]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'Service still using public endpoint', error: 'Traffic going through NAT instead of endpoint', cause: 'PrivateDnsEnabled not set, or DNS resolution not configured.', fix: 'Enable PrivateDnsEnabled on the interface endpoint. Ensure VPC DNS hostnames and DNS resolution are enabled.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'PrivateLink Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Which VPC endpoint type is free and works for S3?', options: [
              { id: 'a', text: 'Interface endpoint' },
              { id: 'b', text: 'Gateway endpoint' },
              { id: 'c', text: 'NAT Gateway' },
              { id: 'd', text: 'Internet Gateway' }
            ], correctId: 'b', explanation: 'Gateway endpoints are free for S3 and DynamoDB. They add a route table entry.', difficulty: 'beginner' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Endpoint Inventory', content: { title: 'Endpoint Inventory', description: 'List all VPC endpoints and their types.', difficulty: 'intermediate',
      requirements: [
          'Describe all VPC endpoints',
          'Categorize by type',
          'Return inventory'
      ],
      starterCode: `import boto3\nec2 = boto3.client('ec2')\n\ndef lambda_handler(event, context):\n    # TODO: Describe VPC endpoints\n    pass`,
      language: 'python', hints: [
          'ec2.describe_vpc_endpoints()'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 31: AWS WAF & Shield', url: 'module-30.html' }, next: { title: 'Chapter 33: Amazon ElastiCache', url: 'module-33.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_32_DATA; } else { window.MODULE_32_DATA = MODULE_32_DATA; }
