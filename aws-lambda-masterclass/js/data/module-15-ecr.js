/**
 * ============================================================
 * MODULE 15 — Amazon ECR
 * Container image registry, scanning, lifecycle policies
 * ============================================================
 */
const MODULE_15_DATA = {
  id: 'ecr-fundamentals',
  moduleId: 'module-15',
  title: 'Amazon ECR — Elastic Container Registry',
  description: 'Master container image management. Covers repositories, image scanning, lifecycle policies, cross-account access, immutable tags, and CI/CD integration with ECS and Fargate.',
  difficulty: 'intermediate',
  duration: '70 min',
  prerequisites: ['Module 01: AWS IAM', 'Docker basics'],
  objectives: [
    'Create and manage ECR repositories for container images',
    'Push and pull Docker images using ECR authentication',
    'Configure image scanning for vulnerability detection',
    'Implement lifecycle policies to manage image retention',
    'Set up cross-account and cross-region image replication',
    'Integrate ECR with ECS, Fargate, and CI/CD pipelines'
  ],

  sections: [
    {
      id: 'why-ecr',
      type: 'why',
      title: 'Why ECR?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">📦</span>
            <div class="alert-content">
              <div class="alert-title">Your Private Docker Hub — Fully Integrated with AWS</div>
              <div class="alert-text">ECR is a fully managed container registry that eliminates the need to operate your own Docker registry. It integrates natively with ECS, EKS, and Lambda, and stores images encrypted in S3 with 99.999999999% durability.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Feature</th><th>ECR</th><th>Docker Hub</th><th>Self-Hosted Registry</th></tr></thead>
            <tbody>
              <tr><td><strong>Management</strong></td><td>Fully managed</td><td>SaaS</td><td>You manage</td></tr>
              <tr><td><strong>Scanning</strong></td><td>Built-in (Basic + Enhanced/Inspector)</td><td>Paid tier only</td><td>Manual (Trivy, Clair)</td></tr>
              <tr><td><strong>IAM Integration</strong></td><td>Native IAM policies</td><td>Separate auth</td><td>Separate auth</td></tr>
              <tr><td><strong>Encryption</strong></td><td>KMS at rest + TLS in transit</td><td>TLS only</td><td>You configure</td></tr>
              <tr><td><strong>Cross-Region</strong></td><td>Built-in replication</td><td>N/A</td><td>Manual mirror</td></tr>
              <tr><td><strong>Cost</strong></td><td>$0.10/GB/month storage</td><td>Free tier + paid</td><td>Infrastructure cost</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">ECR Auth Tokens Expire Every 12 Hours</div>
              <div class="alert-text">The <code>aws ecr get-login-password</code> token is valid for 12 hours only. CI/CD pipelines must refresh credentials before each build. Stale tokens cause "no basic auth credentials" errors.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'ECR Architecture',
      content: {
        title: 'ECR Image Lifecycle: Build → Push → Scan → Deploy',
        width: 750,
        height: 260,
        nodes: [
          { id: 'dev', label: 'Developer / CI', icon: '👨‍💻', x: 10, y: 110, type: 'client', description: 'Developer builds a Docker image locally or CI/CD (CodeBuild) builds it automatically on commit.' },
          { id: 'ecr', label: 'ECR Repository', icon: '📦', x: 200, y: 110, type: 'storage', description: 'Private Docker registry. Each repo holds images for one application. Images stored encrypted in S3. Supports immutable tags for production safety.', eventPayload: { repositoryUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app', imageTag: 'v1.2.3', imageSizeBytes: 85000000, imageScanStatus: 'COMPLETE' } },
          { id: 'scan', label: 'Image Scanning', icon: '🔍', x: 390, y: 30, type: 'security', description: 'Basic scanning (Clair CVE DB) is free. Enhanced scanning (Amazon Inspector) provides continuous monitoring, OS + language package vulnerabilities.' },
          { id: 'lifecycle', label: 'Lifecycle Policy', icon: '🔄', x: 390, y: 200, type: 'security', description: 'Automatically expire old images. Rules: keep last N images, delete untagged after X days, keep images matching tag patterns.' },
          { id: 'ecs', label: 'ECS / Fargate', icon: '🚀', x: 570, y: 60, type: 'compute', description: 'ECS pulls images from ECR using task execution role. No docker login needed — IAM handles auth automatically.' },
          { id: 'lambda', label: 'Lambda Container', icon: '⚡', x: 570, y: 170, type: 'compute', description: 'Lambda supports container images up to 10 GB. Must implement the Lambda Runtime Interface.' }
        ],
        edges: [
          { from: 'dev', to: 'ecr', label: 'docker push', animated: true },
          { from: 'ecr', to: 'scan', label: 'On Push' },
          { from: 'ecr', to: 'lifecycle', label: 'Auto-clean' },
          { from: 'ecr', to: 'ecs', label: 'Pull Image', animated: true },
          { from: 'ecr', to: 'lambda', label: 'Pull Image', animated: true }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Repository Structure</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">Registry:    123456789012.dkr.ecr.us-east-1.amazonaws.com
Repository:  my-app
Image:       123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.2.3
Digest:      sha256:abc123def456...  (immutable content-addressable ID)</pre>

          <h4>2. Image Tags & Immutability</h4>
          <ul>
            <li><strong>Mutable tags (default)</strong>: Same tag can point to different images (e.g., <code>latest</code> gets overwritten). Dangerous in production.</li>
            <li><strong>Immutable tags</strong>: Once pushed, a tag cannot be overwritten. Prevents accidental production image replacement. <strong>Always use for production.</strong></li>
          </ul>

          <h4>3. Image Scanning</h4>
          <table>
            <thead><tr><th>Type</th><th>Database</th><th>Frequency</th><th>Cost</th></tr></thead>
            <tbody>
              <tr><td><strong>Basic Scanning</strong></td><td>Clair CVE database</td><td>On push or manual</td><td>Free</td></tr>
              <tr><td><strong>Enhanced Scanning</strong></td><td>Amazon Inspector (NIST NVD + more)</td><td>Continuous monitoring</td><td>$0.09/image/month</td></tr>
            </tbody>
          </table>

          <h4>4. Lifecycle Policies</h4>
          <p>JSON rules that automatically clean up old images:</p>
          <ul>
            <li>Keep only the last N tagged images</li>
            <li>Delete untagged images older than X days</li>
            <li>Prioritize by tag pattern (keep <code>prod-*</code>, expire <code>dev-*</code>)</li>
          </ul>

          <h4>5. Cross-Account & Cross-Region</h4>
          <ul>
            <li><strong>Repository Policy</strong>: Resource-based policy granting other accounts pull access</li>
            <li><strong>Replication</strong>: Automatically replicate images to other regions or accounts</li>
          </ul>

          <h4>6. ECR Public</h4>
          <p>Public gallery (public.ecr.aws) for open-source images. Free for public pulls. Alternative to Docker Hub with no rate limiting for authenticated AWS users.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'ECR Boto3 Operations',
      content: {
        title: 'ECR Repository & Image Management',
        languages: [
          {
            id: 'python-ecr',
            label: 'Create Repo & Lifecycle',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ecr = boto3.client('ecr')

def create_secure_repository(repo_name, scan_on_push=True, immutable_tags=True):
    """Create an ECR repository with security best practices."""
    response = ecr.create_repository(
        repositoryName=repo_name,
        imageScanningConfiguration={'scanOnPush': scan_on_push},
        imageTagMutability='IMMUTABLE' if immutable_tags else 'MUTABLE',
        encryptionConfiguration={
            'encryptionType': 'KMS'  # KMS encryption (vs AES256 default)
        },
        tags=[
            {'Key': 'Environment', 'Value': 'production'},
            {'Key': 'ManagedBy', 'Value': 'automation'}
        ]
    )
    repo_uri = response['repository']['repositoryUri']
    logger.info("Created repo: %s (%s)", repo_name, repo_uri)
    return repo_uri


def set_lifecycle_policy(repo_name):
    """Set lifecycle policy to auto-clean old images."""
    policy = {
        "rules": [
            {
                "rulePriority": 1,
                "description": "Keep last 10 production images",
                "selection": {
                    "tagStatus": "tagged",
                    "tagPrefixList": ["prod-", "release-"],
                    "countType": "imageCountMoreThan",
                    "countNumber": 10
                },
                "action": {"type": "expire"}
            },
            {
                "rulePriority": 2,
                "description": "Delete untagged images after 7 days",
                "selection": {
                    "tagStatus": "untagged",
                    "countType": "sinceImagePushed",
                    "countUnit": "days",
                    "countNumber": 7
                },
                "action": {"type": "expire"}
            },
            {
                "rulePriority": 3,
                "description": "Keep max 50 dev images",
                "selection": {
                    "tagStatus": "tagged",
                    "tagPrefixList": ["dev-", "feature-"],
                    "countType": "imageCountMoreThan",
                    "countNumber": 50
                },
                "action": {"type": "expire"}
            }
        ]
    }
    ecr.put_lifecycle_policy(
        repositoryName=repo_name,
        lifecyclePolicyText=json.dumps(policy)
    )
    logger.info("Lifecycle policy set for %s", repo_name)


def list_image_vulnerabilities(repo_name, image_tag):
    """Get vulnerability scan results for an image."""
    response = ecr.describe_image_scan_findings(
        repositoryName=repo_name,
        imageId={'imageTag': image_tag}
    )
    findings = response['imageScanFindings']
    counts = findings.get('findingSeverityCounts', {})
    logger.info("Scan results for %s:%s — CRITICAL: %d, HIGH: %d, MEDIUM: %d",
                repo_name, image_tag,
                counts.get('CRITICAL', 0),
                counts.get('HIGH', 0),
                counts.get('MEDIUM', 0))
    return findings`,
            explanations: [
              { line: '14', text: 'scanOnPush=True triggers automatic vulnerability scanning on every docker push. Free with basic scanning.' },
              { line: '15', text: 'IMMUTABLE tags prevent overwriting. Once prod-v1.2.3 is pushed, pushing another image with that tag fails. Essential for production safety.' },
              { line: '30-62', text: 'Lifecycle rules run in priority order. Keep 10 prod images, delete untagged after 7 days, keep 50 dev images. Prevents unbounded storage costs.' },
              { line: '74', text: 'describe_image_scan_findings returns CVE details. Block deployments if CRITICAL > 0 in your CI/CD pipeline.' }
            ]
          }
        ],
        defaultLang: 'python-ecr',
        expectedOutput: 'Created repo: my-app (123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app)\nLifecycle policy set for my-app'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'ECR CLI Commands',
      content: [
        {
          command: 'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com',
          category: 'aws-cli',
          expectedOutput: 'Login Succeeded',
          explanation: 'Authenticates Docker CLI with ECR. The token is valid for 12 hours. Pipe the password to avoid it appearing in shell history. Must run before docker push/pull.',
          interviewQ: 'Why does the ECR auth token expire after 12 hours?'
        },
        {
          command: 'docker build -t my-app:v1.2.3 . && docker tag my-app:v1.2.3 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.2.3 && docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.2.3',
          category: 'docker',
          expectedOutput: 'Successfully built abc123def456\nSuccessfully tagged 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.2.3\nv1.2.3: digest: sha256:abc123... size: 2200',
          explanation: 'Build, tag with ECR URI, and push. The tag must match the ECR repository URI exactly. Use semantic versioning (v1.2.3) instead of "latest" for production.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'ECR CLI Lab',
        mode: 'simulated',
        initialText: 'ECR CLI Lab. Try:\n  aws ecr describe-repositories\n  aws ecr list-images --repository-name my-app\n  aws ecr describe-image-scan-findings --repository-name my-app --image-id imageTag=v1.2.3',
        commands: {
          'aws ecr describe-repositories': {
            text: '{\n  "repositories": [\n    {"repositoryName": "my-app", "repositoryUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app", "imageScanningConfiguration": {"scanOnPush": true}, "imageTagMutability": "IMMUTABLE", "encryptionConfiguration": {"encryptionType": "KMS"}},\n    {"repositoryName": "api-gateway", "repositoryUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/api-gateway", "imageScanningConfiguration": {"scanOnPush": true}, "imageTagMutability": "MUTABLE"}\n  ]\n}',
            type: 'output'
          },
          'aws ecr list-images --repository-name my-app': {
            text: '{\n  "imageIds": [\n    {"imageDigest": "sha256:abc123...", "imageTag": "prod-v1.2.3"},\n    {"imageDigest": "sha256:def456...", "imageTag": "prod-v1.2.2"},\n    {"imageDigest": "sha256:ghi789...", "imageTag": "dev-feature-auth"}\n  ]\n}',
            type: 'output'
          },
          'aws ecr describe-image-scan-findings --repository-name my-app --image-id imageTag=v1.2.3': {
            text: '{\n  "imageScanFindings": {\n    "findingSeverityCounts": {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 4, "LOW": 12, "INFORMATIONAL": 8},\n    "findings": [{"name": "CVE-2026-12345", "severity": "HIGH", "description": "Buffer overflow in libcurl < 8.5.0"}]\n  },\n  "imageScanStatus": {"status": "COMPLETE"}\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common ECR Issues',
      content: {
        items: [
          { title: 'docker push: "no basic auth credentials"', error: 'Error: no basic auth credentials', cause: 'ECR login token expired (12-hour TTL) or never ran docker login.', fix: 'Re-authenticate: aws ecr get-login-password | docker login --username AWS --password-stdin <registry-uri>. In CI/CD, add this as the first step of every build.' },
          { title: 'Image push fails with "tag already exists"', error: 'tag invalid: The image tag already exists and image tag immutability is enabled', cause: 'Repository has immutable tags enabled. Cannot overwrite an existing tag.', fix: 'Use a new unique tag (e.g., git SHA, build number). Or disable immutability (not recommended for production).' },
          { title: 'ECS task fails to pull image', error: 'CannotPullContainerError: repository does not exist or may require docker login', cause: 'ECS task execution role missing ecr:GetAuthorizationToken, ecr:BatchGetImage, ecr:GetDownloadUrlForLayer permissions.', fix: 'Attach AmazonECSTaskExecutionRolePolicy (managed policy) to the task execution role. Or add specific ECR read permissions to a custom policy.' },
          { title: 'ECR storage costs growing', error: 'Unexpected ECR storage charges', cause: 'No lifecycle policy — every image version is kept forever. Untagged images from layer caching also consume storage.', fix: 'Add lifecycle policy: expire untagged images after 7 days, keep only last N tagged images per prefix. Run: aws ecr get-lifecycle-policy to audit.' }
        ]
      }
    },

    {
      id: 'quiz-ecr',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon ECR Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your production ECS tasks pull images tagged "latest" from ECR. A developer accidentally pushes a broken image with the "latest" tag. How do you prevent this?',
            options: [
              { id: 'a', text: 'Enable image scanning to block broken images' },
              { id: 'b', text: 'Enable immutable tags on the repository — prevent overwriting existing tags' },
              { id: 'c', text: 'Use ECR lifecycle policies to protect the latest tag' },
              { id: 'd', text: 'Set the repository to read-only mode' }
            ],
            correctId: 'b',
            explanation: 'Immutable tags prevent any tag from being overwritten once pushed. But the real fix is to STOP using "latest" in production — use semantic version tags (v1.2.3) or git SHAs. Immutable tags + versioned tags = safe deployments.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'What permissions does an ECS task need to pull images from ECR?',
            options: [
              { id: 'a', text: 'ecr:* on all resources' },
              { id: 'b', text: 'ecr:GetAuthorizationToken, ecr:BatchGetImage, ecr:GetDownloadUrlForLayer' },
              { id: 'c', text: 'Only ecr:GetAuthorizationToken' },
              { id: 'd', text: 'No permissions — ECR is public by default' }
            ],
            correctId: 'b',
            explanation: 'ECS needs: GetAuthorizationToken (to authenticate), BatchGetImage (to get image manifest), and GetDownloadUrlForLayer (to download image layers). The managed policy AmazonECSTaskExecutionRolePolicy includes all three.',
            difficulty: 'beginner'
          },
          {
            id: 'q3',
            question: 'You need to share ECR images with a different AWS account. What is the most secure approach?',
            options: [
              { id: 'a', text: 'Make the repository public' },
              { id: 'b', text: 'Add a repository policy (resource-based policy) granting the target account pull access' },
              { id: 'c', text: 'Export images as tar files and transfer via S3' },
              { id: 'd', text: 'Create IAM users in the source account for the target account' }
            ],
            correctId: 'b',
            explanation: 'ECR repository policies are resource-based policies that can grant cross-account access. Specify the target account\'s principal ARN with ecr:BatchGetImage and ecr:GetDownloadUrlForLayer actions. Alternatively, use ECR replication to automatically replicate images to the target account.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-ecr',
      type: 'challenge',
      title: 'Challenge: ECR Security Pipeline',
      content: {
        title: 'Build an ECR Security Gate',
        description: 'Write a Lambda function that checks ECR image scan results and blocks deployment if any CRITICAL vulnerabilities are found.',
        difficulty: 'intermediate',
        requirements: [
          'Accept repository_name and image_tag as inputs',
          'Call describe_image_scan_findings to get scan results',
          'Check findingSeverityCounts for CRITICAL vulnerabilities',
          'Return PASS/FAIL status with vulnerability counts',
          'Log all findings at severity HIGH and above'
        ],
        starterCode: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ecr = boto3.client('ecr')

def lambda_handler(event, context):
    repo = event['repository_name']
    tag  = event['image_tag']

    # TODO: Get scan findings
    # TODO: Check CRITICAL count
    # TODO: Return PASS/FAIL with details

    pass`,
        language: 'python',
        hints: [
          'ecr.describe_image_scan_findings(repositoryName=repo, imageId={"imageTag": tag})',
          'findings = response["imageScanFindings"]',
          'counts = findings.get("findingSeverityCounts", {})',
          'critical = counts.get("CRITICAL", 0)',
          'Return {"gate": "FAIL", "critical": critical} if critical > 0'
        ],
        testCases: [
          { description: 'Calls describe_image_scan_findings', keywords: ['describe_image_scan_findings'], expectedOutput: 'scan' },
          { description: 'Checks CRITICAL count', keywords: ['CRITICAL'], expectedOutput: 'CRITICAL' },
          { description: 'Returns gate status', keywords: ['PASS', 'FAIL'], expectedOutput: 'gate' }
        ]
      }
    },

    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: { title: 'Module 14: Amazon EventBridge', url: 'module-14.html' },
        next: { title: 'Module 16: Amazon ECS', url: 'module-16.html' }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_15_DATA; } else { window.MODULE_15_DATA = MODULE_15_DATA; }
