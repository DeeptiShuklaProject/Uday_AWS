/**
 * ============================================================
 * MODULE 16 — Amazon ECS
 * Elastic Container Service, clusters, tasks, services
 * ============================================================
 */
const MODULE_16_DATA = {
  id: 'ecs-fundamentals',
  moduleId: 'module-16',
  title: 'Amazon ECS — Elastic Container Service',
  description: 'Master AWS container orchestration. Covers clusters, Task Definitions, Services, EC2 vs Fargate launch types, rolling updates, ALB integration, and ECS Exec debugging.',
  difficulty: 'intermediate',
  duration: '80 min',
  prerequisites: ['Module 04: Amazon VPC', 'Module 15: Amazon ECR', 'Docker basics'],
  objectives: [
    'Understand ECS components: Clusters, Services, Tasks, and Task Definitions',
    'Write Task Definitions specifying containers, CPU/memory, IAM roles, and logging',
    'Deploy long-running services with desired count and rolling updates',
    'Integrate ECS services with Application Load Balancers',
    'Differentiate Task Role vs Task Execution Role for least-privilege security',
    'Debug running containers using ECS Exec (SSM)',
    'Choose between EC2 and Fargate launch types for different workloads'
  ],

  sections: [
    {
      id: 'why-ecs',
      type: 'why',
      title: 'Why ECS?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🚀</span>
            <div class="alert-content">
              <div class="alert-title">AWS-Native Container Orchestration — Simpler Than Kubernetes</div>
              <div class="alert-text">ECS is AWS's native container orchestration service. It manages the lifecycle of Docker containers across a cluster of EC2 instances or serverless Fargate compute. Unlike EKS (Kubernetes), ECS has zero control plane cost, deep IAM integration, and a simpler operational model.</div>
            </div>
          </div>
          <h4>ECS vs EKS vs Lambda</h4>
          <table>
            <thead><tr><th>Feature</th><th>Amazon ECS</th><th>Amazon EKS</th><th>AWS Lambda</th></tr></thead>
            <tbody>
              <tr><td><strong>Complexity</strong></td><td>Low (AWS native)</td><td>High (CNCF ecosystem)</td><td>Lowest (no containers)</td></tr>
              <tr><td><strong>Control Plane Cost</strong></td><td>Free</td><td>$0.10/hr (~$73/month)</td><td>Free</td></tr>
              <tr><td><strong>Max Duration</strong></td><td>Unlimited</td><td>Unlimited</td><td>15 minutes</td></tr>
              <tr><td><strong>Portability</strong></td><td>AWS only</td><td>Multi-cloud (K8s)</td><td>AWS only</td></tr>
              <tr><td><strong>Best For</strong></td><td>Long-running microservices</td><td>K8s ecosystem / multi-cloud</td><td>Event-driven, short tasks</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Task Role vs Task Execution Role — Don't Mix These Up!</div>
              <div class="alert-text"><strong>Task Execution Role:</strong> Used by the ECS agent to pull images from ECR, fetch secrets, and push logs to CloudWatch. <strong>Task Role:</strong> Used by YOUR application code running inside the container to talk to AWS services (S3, DynamoDB, SQS). Mixing these up is the #1 ECS security mistake.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'ECS Architecture',
      content: {
        title: 'ECS Cluster → Service → Task Hierarchy',
        width: 750,
        height: 320,
        nodes: [
          { id: 'client', label: 'Client', icon: '🌐', x: 10, y: 130, type: 'client', description: 'End user or API consumer sending HTTP requests to the application.' },
          { id: 'alb', label: 'ALB', icon: '⚖️', x: 150, y: 130, type: 'trigger', description: 'Application Load Balancer distributes traffic across healthy ECS tasks using target groups and health checks.' },
          { id: 'service', label: 'ECS Service', icon: '⚙️', x: 320, y: 50, type: 'security', description: 'Maintains desired count of tasks. If a task crashes, the service scheduler launches a replacement. Handles rolling deployments and ALB registration.', eventPayload: { desiredCount: 3, runningCount: 3, deploymentStatus: 'PRIMARY', rolloutState: 'COMPLETED' } },
          { id: 'task1', label: 'Task (awsvpc)', icon: '📦', x: 500, y: 30, type: 'compute', description: 'Running instance of a Task Definition. Each task gets its own ENI with a private IP and Security Group (awsvpc mode).' },
          { id: 'task2', label: 'Task (awsvpc)', icon: '📦', x: 500, y: 130, type: 'compute', description: 'Another running task instance. The service ensures this count matches the desired count.' },
          { id: 'ecr', label: 'ECR', icon: '🗄️', x: 680, y: 30, type: 'storage', description: 'Container image registry. Task Execution Role pulls images from ECR.' },
          { id: 'cw', label: 'CloudWatch', icon: '📊', x: 680, y: 130, type: 'storage', description: 'Container logs and metrics. awslogs driver streams stdout/stderr to CloudWatch Logs.' },
          { id: 'cluster', label: 'ECS Cluster', icon: '🖥️', x: 320, y: 230, type: 'compute', description: 'Logical grouping of services and standalone tasks. Clusters are free — you pay only for the underlying compute (EC2 or Fargate).' },
          { id: 'worker', label: 'Standalone Task', icon: '🔧', x: 500, y: 230, type: 'compute', description: 'One-off task run via RunTask API (batch jobs, migrations). Not managed by a Service — runs once and exits.' }
        ],
        edges: [
          { from: 'client', to: 'alb', label: 'HTTPS', animated: true },
          { from: 'alb', to: 'task1', label: 'Route', animated: true },
          { from: 'alb', to: 'task2', label: 'Route', animated: true },
          { from: 'service', to: 'task1', label: 'Manages' },
          { from: 'service', to: 'task2', label: 'Manages' },
          { from: 'task1', to: 'ecr', label: 'Pull Image' },
          { from: 'task1', to: 'cw', label: 'Logs' },
          { from: 'cluster', to: 'service', label: 'Contains' },
          { from: 'cluster', to: 'worker', label: 'Contains' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts Deep Dive',
      content: {
        html: `
          <h4>1. Task Definition</h4>
          <p>A JSON blueprint describing up to 10 containers. It specifies:</p>
          <ul>
            <li><strong>Image URI</strong> — Docker image from ECR or Docker Hub</li>
            <li><strong>CPU / Memory</strong> — Resource limits (Fargate requires specific combos)</li>
            <li><strong>IAM Roles</strong> — Task Execution Role + Task Role</li>
            <li><strong>Network Mode</strong> — <code>awsvpc</code> (recommended), bridge, host</li>
            <li><strong>Port Mappings</strong> — Container port → host port</li>
            <li><strong>Log Configuration</strong> — awslogs driver for CloudWatch</li>
          </ul>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">{
  "family": "my-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",        // 0.25 vCPU
  "memory": "512",     // 512 MB
  "executionRoleArn": "arn:aws:iam::...:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::...:role/myAppTaskRole",
  "containerDefinitions": [{
    "name": "api",
    "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-api:v1.0",
    "portMappings": [{"containerPort": 8080}],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/my-api",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}</pre>

          <h4>2. Task vs Service</h4>
          <table>
            <thead><tr><th>Concept</th><th>Task</th><th>Service</th></tr></thead>
            <tbody>
              <tr><td><strong>What</strong></td><td>Running instance of a Task Definition</td><td>Controller that maintains N running tasks</td></tr>
              <tr><td><strong>Lifecycle</strong></td><td>Starts → runs → stops</td><td>Continuously running, replaces failed tasks</td></tr>
              <tr><td><strong>Use Case</strong></td><td>Batch jobs, one-off migrations</td><td>Web servers, APIs, workers</td></tr>
              <tr><td><strong>ALB</strong></td><td>Not registered with ALB</td><td>Auto-registers tasks with target group</td></tr>
            </tbody>
          </table>

          <h4>3. Launch Types</h4>
          <table>
            <thead><tr><th>Feature</th><th>Fargate</th><th>EC2</th></tr></thead>
            <tbody>
              <tr><td><strong>Infrastructure</strong></td><td>Serverless — AWS manages</td><td>You provision & manage EC2</td></tr>
              <tr><td><strong>Pricing</strong></td><td>Per vCPU/memory/second</td><td>EC2 instance pricing</td></tr>
              <tr><td><strong>GPU Support</strong></td><td>No</td><td>Yes</td></tr>
              <tr><td><strong>Best For</strong></td><td>Most workloads</td><td>GPU, high memory, reserved capacity</td></tr>
            </tbody>
          </table>

          <h4>4. Networking: awsvpc Mode</h4>
          <p>Every task gets its own ENI (Elastic Network Interface) with a private IP from your VPC subnet. Each task can have its own Security Group. Required for Fargate, recommended for EC2.</p>

          <h4>5. ECS Exec</h4>
          <p>Allows you to <code>exec</code> into a running container via SSM Session Manager — no SSH daemon or open ports needed:</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">aws ecs execute-command --cluster prod \\
  --task abc123 --container api \\
  --interactive --command "/bin/sh"</pre>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'ECS Boto3 Operations',
      content: {
        title: 'ECS Task & Service Management',
        languages: [
          {
            id: 'python-ecs-deploy',
            label: 'Deploy Service',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ecs = boto3.client('ecs')

def create_fargate_service(cluster, service_name, task_def, subnets, sg, target_group_arn):
    """
    Create an ECS Fargate service with ALB integration.

    Args:
        cluster: ECS cluster name
        service_name: Name for the service
        task_def: Task definition family:revision (e.g., 'my-api:3')
        subnets: List of private subnet IDs
        sg: Security group ID for tasks
        target_group_arn: ALB target group ARN
    """
    response = ecs.create_service(
        cluster=cluster,
        serviceName=service_name,
        taskDefinition=task_def,
        desiredCount=2,
        launchType='FARGATE',
        networkConfiguration={
            'awsvpcConfiguration': {
                'subnets': subnets,
                'securityGroups': [sg],
                'assignPublicIp': 'DISABLED'  # Private subnets
            }
        },
        loadBalancers=[{
            'targetGroupArn': target_group_arn,
            'containerName': 'api',
            'containerPort': 8080
        }],
        deploymentConfiguration={
            'maximumPercent': 200,           # Allow 2x tasks during deploy
            'minimumHealthyPercent': 100      # Keep 100% healthy during deploy
        },
        enableExecuteCommand=True  # Enable ECS Exec for debugging
    )
    service_arn = response['service']['serviceArn']
    logger.info("Created service: %s", service_arn)
    return service_arn


def rolling_update(cluster, service_name, new_task_def):
    """Trigger a rolling update to a new task definition revision."""
    response = ecs.update_service(
        cluster=cluster,
        service=service_name,
        taskDefinition=new_task_def,
        forceNewDeployment=True
    )
    status = response['service']['deployments'][0]['rolloutState']
    logger.info("Deployment status: %s", status)
    return status


def run_one_off_task(cluster, task_def, subnets, sg, command):
    """Run a standalone task (batch job, migration)."""
    response = ecs.run_task(
        cluster=cluster,
        taskDefinition=task_def,
        launchType='FARGATE',
        count=1,
        networkConfiguration={
            'awsvpcConfiguration': {
                'subnets': subnets,
                'securityGroups': [sg],
                'assignPublicIp': 'DISABLED'
            }
        },
        overrides={
            'containerOverrides': [{
                'name': 'api',
                'command': command  # e.g., ['python', 'migrate.py']
            }]
        }
    )
    task_arn = response['tasks'][0]['taskArn']
    logger.info("Started task: %s", task_arn)
    return task_arn`,
            explanations: [
              { line: '24-43', text: 'create_service with Fargate launch type. Tasks run in private subnets (assignPublicIp=DISABLED) and register with an ALB target group automatically.' },
              { line: '44-47', text: 'deploymentConfiguration: maximumPercent=200 allows ECS to launch new tasks before stopping old ones (zero-downtime). minimumHealthyPercent=100 keeps all old tasks running until new ones pass health checks.' },
              { line: '48', text: 'enableExecuteCommand=True allows ECS Exec (SSM-based shell) for debugging. Requires the task role to have ssmmessages:* permissions.' },
              { line: '53-60', text: 'update_service with forceNewDeployment=True triggers a rolling update even if the task definition hasn\'t changed (useful when pulling "latest" tags).' }
            ]
          },
          {
            id: 'python-ecs-monitor',
            label: 'Monitor Tasks',
            code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ecs = boto3.client('ecs')

def describe_service_health(cluster, service_name):
    """Check service health and deployment status."""
    response = ecs.describe_services(
        cluster=cluster,
        services=[service_name]
    )
    service = response['services'][0]

    # Service-level health
    info = {
        'status': service['status'],
        'desiredCount': service['desiredCount'],
        'runningCount': service['runningCount'],
        'pendingCount': service['pendingCount'],
        'deployments': len(service['deployments']),
    }

    # Check each deployment
    for dep in service['deployments']:
        logger.info("Deployment %s: status=%s, desired=%d, running=%d, rollout=%s",
                     dep['id'], dep['status'],
                     dep['desiredCount'], dep['runningCount'],
                     dep.get('rolloutState', 'N/A'))

    # Check for failed tasks
    if info['runningCount'] < info['desiredCount']:
        logger.warning("UNHEALTHY: Running %d/%d tasks",
                       info['runningCount'], info['desiredCount'])

    return info


def get_stopped_task_reason(cluster, task_arn):
    """Diagnose why a task stopped — critical for troubleshooting."""
    response = ecs.describe_tasks(
        cluster=cluster,
        tasks=[task_arn]
    )
    task = response['tasks'][0]

    # Task-level stop reason
    stop_reason = task.get('stoppedReason', 'Unknown')
    logger.info("Task stopped: %s", stop_reason)

    # Container-level exit info
    for container in task.get('containers', []):
        exit_code = container.get('exitCode', 'N/A')
        reason = container.get('reason', 'N/A')
        logger.info("Container '%s': exitCode=%s, reason=%s",
                     container['name'], exit_code, reason)

    return stop_reason`,
            explanations: [
              { line: '11-15', text: 'describe_services returns the full state: running/desired/pending counts, deployments, and events. Use this to monitor rollout progress.' },
              { line: '36-38', text: 'If runningCount < desiredCount, tasks are failing to start or crashing. Check CloudWatch Logs and describe_tasks for the stop reason.' },
              { line: '42-55', text: 'describe_tasks with a stopped task ARN reveals the stoppedReason (e.g., "Essential container exited" or "Task failed ELB health checks"). Container-level exitCode helps identify OOM (137) vs app crash (1).' }
            ]
          }
        ],
        defaultLang: 'python-ecs-deploy',
        expectedOutput: 'Created service: arn:aws:ecs:us-east-1:123456789012:service/prod/my-api-service\nDeployment status: IN_PROGRESS'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'ECS CLI Commands',
      content: [
        {
          command: 'aws ecs create-cluster --cluster-name production-cluster --capacity-providers FARGATE FARGATE_SPOT --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1',
          category: 'aws-cli',
          expectedOutput: '{\n  "cluster": {\n    "clusterArn": "arn:aws:ecs:us-east-1:123456789012:cluster/production-cluster",\n    "clusterName": "production-cluster",\n    "status": "ACTIVE",\n    "capacityProviders": ["FARGATE", "FARGATE_SPOT"]\n  }\n}',
          explanation: 'Creates an ECS cluster with both Fargate and Fargate Spot capacity providers. Clusters are free — you only pay for the tasks running inside them.',
          interviewQ: 'What is the difference between an ECS cluster with Fargate vs EC2 capacity providers?'
        },
        {
          command: 'aws ecs register-task-definition --cli-input-json file://task-def.json',
          category: 'aws-cli',
          expectedOutput: '{\n  "taskDefinition": {\n    "taskDefinitionArn": "arn:aws:ecs:us-east-1:123456789012:task-definition/my-api:3",\n    "family": "my-api",\n    "revision": 3,\n    "status": "ACTIVE"\n  }\n}',
          explanation: 'Registers a new task definition revision. Task definitions are immutable — updating creates a new revision (:1, :2, :3). Always reference a specific revision in production.',
          interviewQ: 'Why are ECS task definitions immutable?'
        },
        {
          command: 'aws ecs update-service --cluster production-cluster --service my-api --task-definition my-api:3 --force-new-deployment',
          category: 'aws-cli',
          expectedOutput: '{\n  "service": {\n    "serviceName": "my-api",\n    "taskDefinition": "arn:aws:ecs:us-east-1:123456789012:task-definition/my-api:3",\n    "desiredCount": 2,\n    "deployments": [\n      {"status": "PRIMARY", "rolloutState": "IN_PROGRESS", "runningCount": 0, "desiredCount": 2},\n      {"status": "ACTIVE", "rolloutState": "COMPLETED", "runningCount": 2, "desiredCount": 2}\n    ]\n  }\n}',
          explanation: 'Triggers a rolling deployment to the new task definition. --force-new-deployment restarts tasks even if the revision didn\'t change (useful for pulling updated "latest" tags). The old deployment stays ACTIVE until new tasks are healthy.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'ECS CLI Lab',
        mode: 'simulated',
        initialText: 'ECS CLI Lab. Try:\n  aws ecs list-clusters\n  aws ecs describe-services --cluster prod --services my-api\n  aws ecs list-tasks --cluster prod --service-name my-api\n  aws ecs describe-tasks --cluster prod --tasks abc123',
        commands: {
          'aws ecs list-clusters': {
            text: '{\n  "clusterArns": [\n    "arn:aws:ecs:us-east-1:123456789012:cluster/production-cluster",\n    "arn:aws:ecs:us-east-1:123456789012:cluster/staging-cluster"\n  ]\n}',
            type: 'output'
          },
          'aws ecs describe-services --cluster prod --services my-api': {
            text: '{\n  "services": [{\n    "serviceName": "my-api",\n    "status": "ACTIVE",\n    "desiredCount": 3,\n    "runningCount": 3,\n    "pendingCount": 0,\n    "launchType": "FARGATE",\n    "taskDefinition": "arn:aws:ecs:us-east-1:123456789012:task-definition/my-api:5",\n    "deployments": [{"status": "PRIMARY", "rolloutState": "COMPLETED", "runningCount": 3}],\n    "events": [\n      {"message": "(service my-api) has reached a steady state."},\n      {"message": "(service my-api) registered 1 targets in target-group my-api-tg"}\n    ]\n  }]\n}',
            type: 'output'
          },
          'aws ecs list-tasks --cluster prod --service-name my-api': {
            text: '{\n  "taskArns": [\n    "arn:aws:ecs:us-east-1:123456789012:task/prod/a1b2c3d4e5f6",\n    "arn:aws:ecs:us-east-1:123456789012:task/prod/f6e5d4c3b2a1",\n    "arn:aws:ecs:us-east-1:123456789012:task/prod/1a2b3c4d5e6f"\n  ]\n}',
            type: 'output'
          },
          'aws ecs describe-tasks --cluster prod --tasks abc123': {
            text: '{\n  "tasks": [{\n    "taskArn": "arn:aws:ecs:us-east-1:123456789012:task/prod/abc123",\n    "lastStatus": "STOPPED",\n    "stoppedReason": "Essential container in task exited",\n    "stopCode": "EssentialContainerExited",\n    "containers": [{\n      "name": "api",\n      "exitCode": 137,\n      "reason": "OutOfMemoryError: Container killed due to memory usage"\n    }],\n    "cpu": "256",\n    "memory": "512"\n  }]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common ECS Issues',
      content: {
        items: [
          { title: 'Task stops immediately — "Essential container exited"', error: 'Essential container in task exited (exit code: 1)', cause: 'The application crashed on startup. Common causes: missing environment variables, wrong database connection string, unhandled exception in main(). Exit code 1 = application error.', fix: 'Check CloudWatch Logs for the container output. Look at /ecs/<family> log group. Fix the application error. Use ECS Exec to shell into a running container for debugging.' },
          { title: 'Task killed with exit code 137 — OOM', error: 'Container killed (exit code: 137) — OutOfMemoryError', cause: 'The container exceeded its memory limit. Fargate hard-kills containers that exceed the task memory. Exit code 137 = SIGKILL (OOM killer).', fix: 'Increase the memory in the task definition. For Fargate, valid combos: 256 CPU → 512/1024/2048 MB. Monitor memory usage via Container Insights to right-size.' },
          { title: 'Task fails ELB health checks', error: 'service my-api (instance i-xxx) is unhealthy in target-group — draining', cause: 'The container started but the ALB health check endpoint (e.g., /health) returned non-200 or timed out. The health check interval, timeout, and threshold settings may be too aggressive.', fix: '1. Verify health check path returns 200 (curl localhost:8080/health inside container). 2. Increase healthCheckGracePeriodSeconds on the service (default 0). 3. Increase deregistration_delay on the target group.' },
          { title: 'Task stuck in PROVISIONING', error: 'Task remains in PROVISIONING state for minutes', cause: 'Fargate cannot allocate an ENI in the specified subnets. Common causes: subnet has no available IP addresses, security group doesn\'t exist, or NAT Gateway is missing (tasks can\'t pull from ECR).', fix: 'Check subnet IP availability. Ensure private subnets have a route to NAT Gateway (for ECR/CloudWatch access). Or use VPC endpoints for ECR and CloudWatch.' }
        ]
      }
    },

    {
      id: 'quiz-ecs',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon ECS Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your ECS task needs to read objects from an S3 bucket. Which IAM role should have the S3 permissions?',
            options: [
              { id: 'a', text: 'Task Execution Role' },
              { id: 'b', text: 'Task Role' },
              { id: 'c', text: 'ECS Service Role' },
              { id: 'd', text: 'EC2 Instance Profile' }
            ],
            correctId: 'b',
            explanation: 'The Task Role is assumed by YOUR application code running inside the container. It grants permissions to AWS services like S3, DynamoDB, SQS. The Task Execution Role is used by the ECS agent infrastructure to pull images and push logs — completely separate.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'An ECS task keeps stopping with exit code 137. What is the most likely cause?',
            options: [
              { id: 'a', text: 'The container image is corrupted' },
              { id: 'b', text: 'The task exceeded its memory limit (OOM killed)' },
              { id: 'c', text: 'The IAM role is missing permissions' },
              { id: 'd', text: 'The VPC subnet has no available IPs' }
            ],
            correctId: 'b',
            explanation: 'Exit code 137 = SIGKILL, which means the Linux OOM killer terminated the process. The container exceeded the memory limit specified in the task definition. Fix: increase memory allocation or optimize the application\'s memory usage.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'What is the key advantage of awsvpc network mode over bridge mode?',
            options: [
              { id: 'a', text: 'awsvpc is faster because it bypasses Docker networking' },
              { id: 'b', text: 'Each task gets its own ENI with a private IP and Security Group, enabling task-level network isolation' },
              { id: 'c', text: 'awsvpc allows tasks to use public IP addresses' },
              { id: 'd', text: 'Bridge mode is deprecated and cannot be used' }
            ],
            correctId: 'b',
            explanation: 'awsvpc gives each task its own Elastic Network Interface (ENI) with a VPC IP address and its own Security Group. This enables granular, task-level firewall rules instead of sharing the host\'s network stack. It\'s required for Fargate and recommended for EC2 launch type.',
            difficulty: 'advanced'
          },
          {
            id: 'q4',
            question: 'During a rolling deployment, you want zero downtime. Which deploymentConfiguration ensures new tasks are healthy before stopping old ones?',
            options: [
              { id: 'a', text: 'maximumPercent=100, minimumHealthyPercent=50' },
              { id: 'b', text: 'maximumPercent=200, minimumHealthyPercent=100' },
              { id: 'c', text: 'maximumPercent=100, minimumHealthyPercent=100' },
              { id: 'd', text: 'maximumPercent=200, minimumHealthyPercent=0' }
            ],
            correctId: 'b',
            explanation: 'maximumPercent=200 allows ECS to launch new tasks (up to 2x desired count) while old tasks are still running. minimumHealthyPercent=100 ensures ALL old tasks stay running until new ones pass health checks. This guarantees zero-downtime deployments.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    {
      id: 'challenge-ecs',
      type: 'challenge',
      title: 'Challenge: ECS Service Health Monitor',
      content: {
        title: 'Build an ECS Service Health Monitor',
        description: 'Write a Lambda function that checks ECS service health and alerts if any service has fewer running tasks than desired.',
        difficulty: 'intermediate',
        requirements: [
          'Accept cluster_name as input',
          'List all services in the cluster using list_services',
          'Describe each service to get desiredCount and runningCount',
          'Flag any service where runningCount < desiredCount as UNHEALTHY',
          'Return a summary with service name, status, and counts',
          'Log warnings for unhealthy services'
        ],
        starterCode: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ecs = boto3.client('ecs')

def lambda_handler(event, context):
    cluster = event['cluster_name']

    # TODO: List all services in the cluster
    # TODO: Describe services to get health status
    # TODO: Compare runningCount vs desiredCount
    # TODO: Return summary with HEALTHY/UNHEALTHY status

    pass`,
        language: 'python',
        hints: [
          'ecs.list_services(cluster=cluster) returns service ARNs',
          'ecs.describe_services(cluster=cluster, services=service_arns)',
          'Compare service["runningCount"] vs service["desiredCount"]',
          'Return {"services": [{"name": ..., "status": "HEALTHY/UNHEALTHY", "running": N, "desired": N}]}'
        ],
        testCases: [
          { description: 'Uses list_services', keywords: ['list_services'], expectedOutput: 'services' },
          { description: 'Uses describe_services', keywords: ['describe_services'], expectedOutput: 'describe' },
          { description: 'Compares running vs desired', keywords: ['runningCount', 'desiredCount'], expectedOutput: 'count' },
          { description: 'Returns health status', keywords: ['HEALTHY', 'UNHEALTHY'], expectedOutput: 'status' }
        ]
      }
    },

    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: { title: 'Module 15: Amazon ECR', url: 'module-15.html' },
        next: { title: 'Module 17: AWS Fargate', url: 'module-17.html' }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_16_DATA; } else { window.MODULE_16_DATA = MODULE_16_DATA; }
