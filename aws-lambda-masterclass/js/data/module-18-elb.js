/**
 * ============================================================
 * MODULE 18 — Elastic Load Balancing
 * ALB, NLB, CLB, target groups, health checks, routing
 * ============================================================
 */
const MODULE_18_DATA = {
  id: 'elb-fundamentals',
  moduleId: 'module-18',
  title: 'Elastic Load Balancing — ALB, NLB & CLB',
  description: 'Master AWS load balancing. Covers Application Load Balancer (ALB), Network Load Balancer (NLB), target groups, path-based routing, sticky sessions, SSL/TLS termination, and health checks.',
  difficulty: 'intermediate',
  duration: '75 min',
  prerequisites: ['Module 04: Amazon VPC', 'Module 03: Amazon EC2'],
  objectives: [
    'Differentiate between ALB, NLB, and CLB and choose appropriately',
    'Configure target groups with health checks',
    'Implement path-based and host-based routing with ALB',
    'Set up SSL/TLS termination with ACM certificates',
    'Configure sticky sessions for stateful applications',
    'Implement cross-zone load balancing for high availability',
    'Troubleshoot common health check failures'
  ],

  sections: [
    {
      id: 'why-elb',
      type: 'why',
      title: 'Why Elastic Load Balancing?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">⚖️</span>
            <div class="alert-content">
              <div class="alert-title">Distribute Traffic Across Healthy Targets — Automatically</div>
              <div class="alert-text">ELB automatically distributes incoming traffic across multiple targets (EC2, ECS, Lambda, IPs) in one or more Availability Zones. It detects unhealthy targets and routes traffic only to healthy ones. No single point of failure.</div>
            </div>
          </div>
          <h4>ALB vs NLB vs CLB</h4>
          <table>
            <thead><tr><th>Feature</th><th>ALB (Application)</th><th>NLB (Network)</th><th>CLB (Classic)</th></tr></thead>
            <tbody>
              <tr><td><strong>Layer</strong></td><td>Layer 7 (HTTP/HTTPS)</td><td>Layer 4 (TCP/UDP/TLS)</td><td>Layer 4 + basic L7</td></tr>
              <tr><td><strong>Routing</strong></td><td>Path, host, header, query string</td><td>Port-based only</td><td>Port-based only</td></tr>
              <tr><td><strong>Performance</strong></td><td>Millions of requests/sec</td><td>Millions of connections/sec, ultra-low latency</td><td>Limited</td></tr>
              <tr><td><strong>Static IP</strong></td><td>❌ (use Global Accelerator)</td><td>✅ Elastic IP per AZ</td><td>❌</td></tr>
              <tr><td><strong>WebSocket</strong></td><td>✅ Native</td><td>✅ (TCP passthrough)</td><td>❌</td></tr>
              <tr><td><strong>Lambda Targets</strong></td><td>✅</td><td>❌</td><td>❌</td></tr>
              <tr><td><strong>Best For</strong></td><td>Web apps, APIs, microservices</td><td>Gaming, IoT, real-time, TCP</td><td>Legacy (avoid)</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">CLB is Legacy — Always Use ALB or NLB</div>
              <div class="alert-text">Classic Load Balancer (CLB) is the original ELB from 2009. It lacks advanced routing, WebSocket support, and HTTP/2. AWS recommends migrating to ALB or NLB for all workloads.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'ELB Architecture',
      content: {
        title: 'ALB Request Flow: Listener → Rules → Target Group → Targets',
        width: 750,
        height: 280,
        nodes: [
          { id: 'client', label: 'Client', icon: '🌐', x: 10, y: 120, type: 'client', description: 'End user or API consumer. DNS resolves the ALB domain to multiple IP addresses across AZs.' },
          { id: 'alb', label: 'ALB', icon: '⚖️', x: 160, y: 120, type: 'trigger', description: 'Application Load Balancer operates at Layer 7. It terminates TLS, inspects HTTP headers, and routes requests based on rules.', eventPayload: { type: 'application', scheme: 'internet-facing', availabilityZones: ['us-east-1a', 'us-east-1b'] } },
          { id: 'listener', label: 'HTTPS Listener :443', icon: '🔒', x: 320, y: 50, type: 'security', description: 'Listener on port 443. Uses ACM certificate for TLS termination. Evaluates routing rules in priority order.' },
          { id: 'tg-api', label: 'TG: /api/*', icon: '🎯', x: 500, y: 30, type: 'compute', description: 'Target group for API requests. Contains ECS tasks or EC2 instances running the API service.' },
          { id: 'tg-web', label: 'TG: /*', icon: '🎯', x: 500, y: 120, type: 'compute', description: 'Default target group for all other requests. Contains the web frontend.' },
          { id: 'tg-health', label: 'Health Checks', icon: '💚', x: 500, y: 220, type: 'security', description: 'ALB periodically calls the health check endpoint (e.g., /health). Unhealthy targets are removed from rotation until they pass consecutive checks.' },
          { id: 'redirect', label: 'HTTP→HTTPS Redirect', icon: '🔄', x: 320, y: 220, type: 'trigger', description: 'HTTP listener on port 80 with a fixed redirect action to HTTPS. All traffic is encrypted.' }
        ],
        edges: [
          { from: 'client', to: 'alb', label: 'HTTPS :443', animated: true },
          { from: 'alb', to: 'listener', label: 'Route' },
          { from: 'listener', to: 'tg-api', label: 'Path: /api/*', animated: true },
          { from: 'listener', to: 'tg-web', label: 'Default: /*', animated: true },
          { from: 'alb', to: 'redirect', label: 'HTTP :80' },
          { from: 'tg-api', to: 'tg-health', label: 'Check /health' },
          { from: 'tg-web', to: 'tg-health', label: 'Check /health' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Listeners & Rules</h4>
          <p>A listener checks for connection requests on a port/protocol. Each listener has rules evaluated in priority order:</p>
          <ul>
            <li><strong>Path-based:</strong> <code>/api/*</code> → API target group, <code>/images/*</code> → Static target group</li>
            <li><strong>Host-based:</strong> <code>api.example.com</code> → API targets, <code>www.example.com</code> → Web targets</li>
            <li><strong>Header-based:</strong> Route based on custom HTTP headers</li>
            <li><strong>Query string:</strong> <code>?version=v2</code> → V2 target group</li>
          </ul>

          <h4>2. Target Groups</h4>
          <table>
            <thead><tr><th>Target Type</th><th>What Gets Registered</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>instance</strong></td><td>EC2 instance IDs</td><td>Traditional EC2 deployments</td></tr>
              <tr><td><strong>ip</strong></td><td>IP addresses</td><td>ECS Fargate (awsvpc), on-premises</td></tr>
              <tr><td><strong>lambda</strong></td><td>Lambda function ARN</td><td>Serverless backends</td></tr>
              <tr><td><strong>alb</strong></td><td>Another ALB</td><td>Chained load balancers (NLB → ALB)</td></tr>
            </tbody>
          </table>

          <h4>3. Health Checks</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">Protocol:    HTTP
Path:        /health
Port:        traffic-port (same as target)
Interval:    30 seconds
Timeout:     5 seconds
Healthy:     3 consecutive successes (200-299)
Unhealthy:   2 consecutive failures</pre>

          <h4>4. Sticky Sessions</h4>
          <p>Binds a user's session to a specific target. Two types:</p>
          <ul>
            <li><strong>Duration-based (AWSALB cookie):</strong> ALB generates cookie, sticky for N seconds</li>
            <li><strong>Application-based:</strong> Your app sets a custom cookie name</li>
          </ul>
          <p>⚠️ Sticky sessions reduce the effectiveness of load balancing. Use only when session state can't be externalized (e.g., to ElastiCache).</p>

          <h4>5. SSL/TLS Termination</h4>
          <p>ALB terminates TLS using certificates from AWS Certificate Manager (ACM). Benefits:</p>
          <ul>
            <li>Offloads CPU-intensive TLS from your application</li>
            <li>Free certificates from ACM (auto-renewed)</li>
            <li>Supports SNI (Server Name Indication) for multiple domains on one ALB</li>
          </ul>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'ELB Boto3 Operations',
      content: {
        title: 'ALB & Target Group Management',
        languages: [
          {
            id: 'python-alb',
            label: 'Create ALB + Target Group',
            code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

elbv2 = boto3.client('elbv2')

def create_alb_with_target_group(name, subnets, security_groups, vpc_id, certificate_arn):
    """Create an internet-facing ALB with HTTPS listener and target group."""
    
    # 1. Create the ALB
    alb = elbv2.create_load_balancer(
        Name=name,
        Subnets=subnets,             # Must be in at least 2 AZs
        SecurityGroups=security_groups,
        Scheme='internet-facing',     # or 'internal'
        Type='application',
        IpAddressType='ipv4'
    )
    alb_arn = alb['LoadBalancers'][0]['LoadBalancerArn']
    dns_name = alb['LoadBalancers'][0]['DNSName']
    logger.info("ALB created: %s (%s)", name, dns_name)

    # 2. Create Target Group with health check
    tg = elbv2.create_target_group(
        Name=f'{name}-tg',
        Protocol='HTTP',
        Port=8080,
        VpcId=vpc_id,
        TargetType='ip',              # 'ip' for Fargate, 'instance' for EC2
        HealthCheckPath='/health',
        HealthCheckIntervalSeconds=30,
        HealthCheckTimeoutSeconds=5,
        HealthyThresholdCount=3,
        UnhealthyThresholdCount=2,
        Matcher={'HttpCode': '200'}
    )
    tg_arn = tg['TargetGroups'][0]['TargetGroupArn']

    # 3. Create HTTPS Listener (port 443)
    elbv2.create_listener(
        LoadBalancerArn=alb_arn,
        Port=443,
        Protocol='HTTPS',
        Certificates=[{'CertificateArn': certificate_arn}],
        DefaultActions=[{
            'Type': 'forward',
            'TargetGroupArn': tg_arn
        }],
        SslPolicy='ELBSecurityPolicy-TLS13-1-2-2021-06'
    )

    # 4. Create HTTP → HTTPS redirect (port 80)
    elbv2.create_listener(
        LoadBalancerArn=alb_arn,
        Port=80,
        Protocol='HTTP',
        DefaultActions=[{
            'Type': 'redirect',
            'RedirectConfig': {
                'Protocol': 'HTTPS',
                'Port': '443',
                'StatusCode': 'HTTP_301'
            }
        }]
    )
    logger.info("HTTPS listener + HTTP redirect configured")

    return {'alb_arn': alb_arn, 'tg_arn': tg_arn, 'dns': dns_name}`,
            explanations: [
              { line: '16-17', text: 'ALB must span at least 2 AZs for high availability. Use public subnets for internet-facing ALBs.' },
              { line: '29', text: 'TargetType=ip is required for ECS Fargate (awsvpc). Each task registers its own private IP. Use "instance" for EC2-based deployments.' },
              { line: '48', text: 'SslPolicy controls TLS version and cipher suites. TLS13 policy enforces TLS 1.3 (most secure). Use at least TLS 1.2 for compliance.' },
              { line: '53-61', text: 'HTTP→HTTPS redirect with 301 (permanent). All traffic hitting port 80 is redirected to HTTPS. Essential for security compliance.' }
            ]
          }
        ],
        defaultLang: 'python-alb',
        expectedOutput: 'ALB created: my-api-alb (my-api-alb-123456.us-east-1.elb.amazonaws.com)\nHTTPS listener + HTTP redirect configured'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'ELB CLI Commands',
      content: [
        {
          command: 'aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/my-tg/abc123',
          category: 'aws-cli',
          expectedOutput: '{\n  "TargetHealthDescriptions": [\n    {"Target": {"Id": "10.0.1.42", "Port": 8080}, "HealthCheckPort": "8080", "TargetHealth": {"State": "healthy"}},\n    {"Target": {"Id": "10.0.2.15", "Port": 8080}, "HealthCheckPort": "8080", "TargetHealth": {"State": "healthy"}},\n    {"Target": {"Id": "10.0.1.88", "Port": 8080}, "HealthCheckPort": "8080", "TargetHealth": {"State": "unhealthy", "Reason": "Target.ResponseCodeMismatch", "Description": "Health checks failed with these codes: [503]"}}\n  ]\n}',
          explanation: 'Shows the health status of each target. "unhealthy" targets are removed from rotation. Common reasons: ResponseCodeMismatch (non-200), Timeout, ConnectionFailed. Essential for debugging failed ECS deployments.',
          interviewQ: 'An ALB target shows "unhealthy" with Reason "Target.ResponseCodeMismatch". What are the most common causes?'
        },
        {
          command: 'aws elbv2 create-rule --listener-arn arn:aws:elasticloadbalancing:...:listener/app/my-alb/123/456 --conditions Field=path-pattern,Values="/api/*" --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...:targetgroup/api-tg/789 --priority 10',
          category: 'aws-cli',
          expectedOutput: '{\n  "Rules": [{\n    "RuleArn": "arn:aws:elasticloadbalancing:...:listener-rule/app/my-alb/123/456/rule123",\n    "Priority": "10",\n    "Conditions": [{"Field": "path-pattern", "Values": ["/api/*"]}],\n    "Actions": [{"Type": "forward", "TargetGroupArn": "arn:aws:elasticloadbalancing:...:targetgroup/api-tg/789"}]\n  }]\n}',
          explanation: 'Creates a path-based routing rule. Requests matching /api/* go to the API target group. Priority determines evaluation order (lower = first). The default rule (priority=last) catches everything else.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'ELB CLI Lab',
        mode: 'simulated',
        initialText: 'ELB CLI Lab. Try:\n  aws elbv2 describe-load-balancers\n  aws elbv2 describe-target-groups\n  aws elbv2 describe-listeners --load-balancer-arn alb-arn',
        commands: {
          'aws elbv2 describe-load-balancers': {
            text: '{\n  "LoadBalancers": [\n    {"LoadBalancerName": "api-alb", "DNSName": "api-alb-123.us-east-1.elb.amazonaws.com", "Type": "application", "Scheme": "internet-facing", "State": {"Code": "active"}, "AvailabilityZones": [{"ZoneName": "us-east-1a"}, {"ZoneName": "us-east-1b"}]},\n    {"LoadBalancerName": "internal-nlb", "DNSName": "internal-nlb-456.us-east-1.elb.amazonaws.com", "Type": "network", "Scheme": "internal", "State": {"Code": "active"}}\n  ]\n}',
            type: 'output'
          },
          'aws elbv2 describe-target-groups': {
            text: '{\n  "TargetGroups": [\n    {"TargetGroupName": "api-tg", "Protocol": "HTTP", "Port": 8080, "TargetType": "ip", "HealthCheckPath": "/health", "HealthyThresholdCount": 3, "UnhealthyThresholdCount": 2},\n    {"TargetGroupName": "web-tg", "Protocol": "HTTP", "Port": 3000, "TargetType": "instance", "HealthCheckPath": "/", "HealthyThresholdCount": 5}\n  ]\n}',
            type: 'output'
          },
          'aws elbv2 describe-listeners --load-balancer-arn alb-arn': {
            text: '{\n  "Listeners": [\n    {"Port": 443, "Protocol": "HTTPS", "SslPolicy": "ELBSecurityPolicy-TLS13-1-2-2021-06", "Certificates": [{"CertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/abc-123"}], "DefaultActions": [{"Type": "forward", "TargetGroupArn": "arn:...:targetgroup/web-tg/789"}]},\n    {"Port": 80, "Protocol": "HTTP", "DefaultActions": [{"Type": "redirect", "RedirectConfig": {"Protocol": "HTTPS", "Port": "443", "StatusCode": "HTTP_301"}}]}\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common ELB Issues',
      content: {
        items: [
          { title: 'All targets showing "unhealthy"', error: 'TargetHealth: unhealthy, Reason: Target.FailedHealthChecks', cause: 'Health check path returns non-200 status, or the security group doesn\'t allow traffic from the ALB. Most common: the application hasn\'t started yet, or /health returns 404.', fix: '1. Verify health check path exists (curl localhost:8080/health from inside the container). 2. Ensure target security group allows inbound from ALB security group on the health check port. 3. Increase healthCheckGracePeriodSeconds on the ECS service.' },
          { title: '502 Bad Gateway', error: 'HTTP 502 Bad Gateway from ALB', cause: 'ALB sent a request to the target but the target closed the connection or returned an invalid response. Common when the application crashes during request processing.', fix: 'Check application logs for crashes. Ensure the application listens on the correct port. Check that the target group port matches the container port. Increase idle timeout if needed.' },
          { title: '503 Service Unavailable', error: 'HTTP 503 Service Unavailable', cause: 'No healthy targets in the target group. All targets failed health checks or were deregistered during a deployment.', fix: 'Check target health: aws elbv2 describe-target-health. Increase desiredCount in ECS service. Check if the application is crashing on startup (CloudWatch Logs).' },
          { title: 'Uneven traffic distribution', error: 'One AZ receives significantly more traffic than others', cause: 'Cross-zone load balancing is disabled. By default, ALB has cross-zone enabled, but NLB has it disabled.', fix: 'Enable cross-zone load balancing: aws elbv2 modify-load-balancer-attributes --attributes Key=load_balancing.cross_zone.enabled,Value=true. ALB: free. NLB: charges for cross-AZ data transfer.' }
        ]
      }
    },

    {
      id: 'quiz-elb',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Elastic Load Balancing Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You need to route requests for api.example.com to one target group and www.example.com to another. Which load balancer and routing type should you use?',
            options: [
              { id: 'a', text: 'NLB with port-based routing' },
              { id: 'b', text: 'ALB with host-based routing rules' },
              { id: 'c', text: 'CLB with path-based routing' },
              { id: 'd', text: 'NLB with header-based routing' }
            ],
            correctId: 'b',
            explanation: 'ALB operates at Layer 7 and supports host-based routing rules. You create listener rules that match the Host header to route api.example.com and www.example.com to different target groups. NLB operates at Layer 4 and cannot inspect HTTP headers.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'Your application requires a static IP address for whitelisting by external partners. Which load balancer provides this?',
            options: [
              { id: 'a', text: 'ALB — assign an Elastic IP' },
              { id: 'b', text: 'NLB — supports one Elastic IP per AZ' },
              { id: 'c', text: 'CLB — supports Elastic IP' },
              { id: 'd', text: 'None — use Route 53 instead' }
            ],
            correctId: 'b',
            explanation: 'NLB supports assigning one static Elastic IP per Availability Zone. ALB does not support Elastic IPs (use Global Accelerator for static IPs with ALB). This is a key differentiator when partners need to whitelist specific IPs.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'An ALB health check is configured with: interval=30s, timeout=5s, unhealthy_threshold=2, healthy_threshold=3. How long before an unhealthy target is removed from rotation?',
            options: [
              { id: 'a', text: '10 seconds (2 × 5s timeout)' },
              { id: 'b', text: '60 seconds (2 × 30s interval)' },
              { id: 'c', text: '35 seconds (30s interval + 5s timeout)' },
              { id: 'd', text: '90 seconds (3 × 30s interval)' }
            ],
            correctId: 'b',
            explanation: 'The ALB checks every 30 seconds (interval). After 2 consecutive failures (unhealthy_threshold=2), the target is marked unhealthy: 2 × 30s = 60 seconds minimum. The timeout (5s) is how long the ALB waits for a response within each check.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    {
      id: 'challenge-elb',
      type: 'challenge',
      title: 'Challenge: Target Health Monitor',
      content: {
        title: 'Build an ALB Target Health Reporter',
        description: 'Write a Lambda function that checks all target groups and reports any unhealthy targets with their failure reasons.',
        difficulty: 'intermediate',
        requirements: [
          'List all target groups using describe_target_groups',
          'For each target group, call describe_target_health',
          'Collect any targets with State != "healthy"',
          'Return a report with: target group name, unhealthy target IDs, and health check failure reasons',
          'Log the total unhealthy count as a WARNING'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

elbv2 = boto3.client('elbv2')

def lambda_handler(event, context):
    # TODO: List all target groups
    # TODO: Check health of each target group
    # TODO: Collect unhealthy targets with reasons
    # TODO: Return report

    pass`,
        language: 'python',
        hints: [
          'elbv2.describe_target_groups() returns all target groups',
          'elbv2.describe_target_health(TargetGroupArn=tg_arn)',
          'Check target["TargetHealth"]["State"] != "healthy"',
          'Get reason from target["TargetHealth"].get("Reason", "Unknown")'
        ],
        testCases: [
          { description: 'Uses describe_target_groups', keywords: ['describe_target_groups'], expectedOutput: 'groups' },
          { description: 'Uses describe_target_health', keywords: ['describe_target_health'], expectedOutput: 'health' },
          { description: 'Checks health state', keywords: ['healthy', 'unhealthy'], expectedOutput: 'state' }
        ]
      }
    },

    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: { title: 'Module 17: AWS Fargate', url: 'module-17.html' },
        next: { title: 'Module 19: AWS CodeBuild', url: 'module-19.html' }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_18_DATA; } else { window.MODULE_18_DATA = MODULE_18_DATA; }
