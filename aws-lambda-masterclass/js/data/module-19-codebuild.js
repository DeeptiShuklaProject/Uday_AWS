/**
 * ============================================================
 * MODULE 19 — AWS CodeBuild
 * Managed build service, buildspec.yml, phases, artifacts
 * ============================================================
 */
const MODULE_19_DATA = {
  id: 'codebuild-fundamentals',
  moduleId: 'module-19',
  title: 'AWS CodeBuild — Managed Build Service',
  description: 'Master CI build automation. Covers build projects, buildspec.yml, build phases, artifacts, environment variables, Docker builds, caching, and integration with CodePipeline.',
  difficulty: 'intermediate',
  duration: '65 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 15: Amazon ECR'],
  objectives: [
    'Create CodeBuild projects for compiling, testing, and packaging code',
    'Write buildspec.yml files with install, pre_build, build, and post_build phases',
    'Configure environment variables and secrets injection',
    'Build and push Docker images to ECR from CodeBuild',
    'Set up S3 and local caching to speed up builds',
    'Troubleshoot common build failures'
  ],

  sections: [
    {
      id: 'why-codebuild',
      type: 'why',
      title: 'Why CodeBuild?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔨</span>
            <div class="alert-content">
              <div class="alert-title">Fully Managed Build Service — No Jenkins to Maintain</div>
              <div class="alert-text">CodeBuild is a fully managed CI service that compiles source code, runs tests, and produces deployable artifacts. No servers to provision, patch, or scale. It scales automatically to handle multiple concurrent builds.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Feature</th><th>CodeBuild</th><th>Jenkins</th><th>GitHub Actions</th></tr></thead>
            <tbody>
              <tr><td><strong>Management</strong></td><td>Fully managed</td><td>Self-hosted</td><td>SaaS</td></tr>
              <tr><td><strong>Scaling</strong></td><td>Auto-scales to any concurrency</td><td>Manual (add agents)</td><td>Limited by plan</td></tr>
              <tr><td><strong>AWS Integration</strong></td><td>Native (IAM, ECR, S3, SSM)</td><td>Plugins required</td><td>AWS CLI actions</td></tr>
              <tr><td><strong>Docker Builds</strong></td><td>Privileged mode built-in</td><td>DinD or DooD setup</td><td>Built-in</td></tr>
              <tr><td><strong>Pricing</strong></td><td>Per build minute</td><td>EC2/hosting costs</td><td>Per minute (paid plans)</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Never Hardcode Secrets in buildspec.yml</div>
              <div class="alert-text">Use SSM Parameter Store or Secrets Manager to inject secrets at build time. CodeBuild natively supports <code>parameter-store</code> and <code>secrets-manager</code> reference types in environment variables.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'CodeBuild Architecture',
      content: {
        title: 'CodeBuild: Source → Build Container → Artifacts',
        width: 750,
        height: 260,
        nodes: [
          { id: 'source', label: 'Source', icon: '📁', x: 10, y: 110, type: 'storage', description: 'Source code from: CodeCommit, GitHub, Bitbucket, S3 bucket, or CodePipeline.' },
          { id: 'project', label: 'Build Project', icon: '🔨', x: 170, y: 110, type: 'compute', description: 'Defines the build environment: compute type (small/medium/large), Docker image, IAM role, timeout, VPC config.', eventPayload: { computeType: 'BUILD_GENERAL1_MEDIUM', image: 'aws/codebuild/amazonlinux2-x86_64-standard:5.0', privilegedMode: true } },
          { id: 'container', label: 'Build Container', icon: '📦', x: 370, y: 50, type: 'compute', description: 'Fresh Docker container spun up for each build. Runs buildspec.yml phases: install → pre_build → build → post_build.' },
          { id: 'buildspec', label: 'buildspec.yml', icon: '📝', x: 370, y: 200, type: 'security', description: 'YAML file defining build commands for each phase. Located in the source root or specified in the project.' },
          { id: 'artifacts', label: 'Artifacts (S3)', icon: '📤', x: 570, y: 50, type: 'storage', description: 'Build outputs (JAR, ZIP, Docker image) uploaded to S3 or pushed to ECR.' },
          { id: 'logs', label: 'CloudWatch Logs', icon: '📊', x: 570, y: 200, type: 'storage', description: 'Build logs streamed in real-time to CloudWatch Logs for debugging.' }
        ],
        edges: [
          { from: 'source', to: 'project', label: 'Triggers', animated: true },
          { from: 'project', to: 'container', label: 'Provisions', animated: true },
          { from: 'buildspec', to: 'container', label: 'Commands' },
          { from: 'container', to: 'artifacts', label: 'Outputs', animated: true },
          { from: 'container', to: 'logs', label: 'Logs' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. buildspec.yml Structure</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">version: 0.2

env:
  variables:
    APP_ENV: "production"
  parameter-store:
    DB_PASSWORD: "/myapp/db-password"  # From SSM
  secrets-manager:
    API_KEY: "prod/api-key:API_KEY"    # From Secrets Manager

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install -r requirements.txt

  pre_build:
    commands:
      - echo "Logging into ECR..."
      - aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
      - echo "Running tests..."
      - pytest tests/ -v

  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t $ECR_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .
      - docker push $ECR_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION

  post_build:
    commands:
      - echo "Build completed at $(date)"
      - echo "Image: $ECR_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION"

artifacts:
  files:
    - imagedefinitions.json
  discard-paths: yes

cache:
  paths:
    - '/root/.cache/pip/**/*'</pre>

          <h4>2. Build Phases</h4>
          <table>
            <thead><tr><th>Phase</th><th>Purpose</th><th>Failure Behavior</th></tr></thead>
            <tbody>
              <tr><td><strong>INSTALL</strong></td><td>Install dependencies, runtime versions</td><td>Build fails immediately</td></tr>
              <tr><td><strong>PRE_BUILD</strong></td><td>Login to registries, run tests, linting</td><td>Build fails, skips build/post_build</td></tr>
              <tr><td><strong>BUILD</strong></td><td>Compile code, build Docker images</td><td>Build fails, post_build still runs</td></tr>
              <tr><td><strong>POST_BUILD</strong></td><td>Push images, generate reports, notifications</td><td>Build marked as failed</td></tr>
            </tbody>
          </table>

          <h4>3. Compute Types</h4>
          <table>
            <thead><tr><th>Type</th><th>vCPU</th><th>Memory</th><th>Cost/min</th></tr></thead>
            <tbody>
              <tr><td>BUILD_GENERAL1_SMALL</td><td>2</td><td>3 GB</td><td>$0.005</td></tr>
              <tr><td>BUILD_GENERAL1_MEDIUM</td><td>4</td><td>7 GB</td><td>$0.010</td></tr>
              <tr><td>BUILD_GENERAL1_LARGE</td><td>8</td><td>15 GB</td><td>$0.020</td></tr>
              <tr><td>BUILD_GENERAL1_2XLARGE</td><td>72</td><td>145 GB</td><td>$0.200</td></tr>
            </tbody>
          </table>

          <h4>4. Environment Variables</h4>
          <ul>
            <li><code>CODEBUILD_BUILD_ID</code> — Unique build identifier</li>
            <li><code>CODEBUILD_RESOLVED_SOURCE_VERSION</code> — Git commit SHA</li>
            <li><code>CODEBUILD_BUILD_NUMBER</code> — Sequential build number</li>
            <li><code>CODEBUILD_SRC_DIR</code> — Path to source code</li>
          </ul>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'CodeBuild Boto3 Operations',
      content: {
        title: 'CodeBuild Project Management',
        languages: [
          {
            id: 'python-codebuild',
            label: 'Create Build Project',
            code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

codebuild = boto3.client('codebuild')

def create_docker_build_project(project_name, repo_url, ecr_uri, service_role_arn):
    """Create a CodeBuild project for building Docker images."""
    response = codebuild.create_project(
        name=project_name,
        source={
            'type': 'GITHUB',
            'location': repo_url,
            'buildspec': 'buildspec.yml',
            'auth': {'type': 'OAUTH'}  # GitHub OAuth connection
        },
        artifacts={'type': 'NO_ARTIFACTS'},  # We push to ECR, not S3
        environment={
            'type': 'LINUX_CONTAINER',
            'image': 'aws/codebuild/amazonlinux2-x86_64-standard:5.0',
            'computeType': 'BUILD_GENERAL1_MEDIUM',
            'privilegedMode': True,   # Required for Docker builds
            'environmentVariables': [
                {'name': 'ECR_URI', 'value': ecr_uri, 'type': 'PLAINTEXT'},
                {'name': 'DB_PASSWORD', 'value': '/myapp/db-password',
                 'type': 'PARAMETER_STORE'}  # Injected from SSM
            ]
        },
        serviceRole=service_role_arn,
        timeoutInMinutes=30,
        cache={'type': 'LOCAL', 'modes': ['LOCAL_DOCKER_LAYER_CACHE']},
        logsConfig={
            'cloudWatchLogs': {
                'status': 'ENABLED',
                'groupName': f'/codebuild/{project_name}'
            }
        }
    )
    logger.info("Created project: %s", project_name)
    return response['project']['arn']


def start_build(project_name, branch='main'):
    """Trigger a build manually."""
    response = codebuild.start_build(
        projectName=project_name,
        sourceVersion=branch,
        environmentVariablesOverride=[
            {'name': 'APP_ENV', 'value': 'staging', 'type': 'PLAINTEXT'}
        ]
    )
    build_id = response['build']['id']
    logger.info("Started build: %s", build_id)
    return build_id`,
            explanations: [
              { line: '23', text: 'privilegedMode=True is REQUIRED for Docker-in-Docker builds. Without it, docker build commands fail with permission errors.' },
              { line: '27', text: 'type=PARAMETER_STORE injects the value from SSM at build time. The actual secret never appears in the project config.' },
              { line: '30', text: 'LOCAL_DOCKER_LAYER_CACHE reuses Docker layers between builds, dramatically speeding up Docker builds (from minutes to seconds for unchanged layers).' }
            ]
          }
        ],
        defaultLang: 'python-codebuild',
        expectedOutput: 'Created project: my-api-build\nStarted build: my-api-build:a1b2c3d4-5678-90ab-cdef-example'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'CodeBuild CLI Commands',
      content: [
        {
          command: 'aws codebuild start-build --project-name my-api-build --source-version main',
          category: 'aws-cli',
          expectedOutput: '{\n  "build": {\n    "id": "my-api-build:a1b2c3d4-5678-90ab-cdef-example",\n    "buildNumber": 42,\n    "buildStatus": "IN_PROGRESS",\n    "currentPhase": "SUBMITTED",\n    "sourceVersion": "main"\n  }\n}',
          explanation: 'Triggers a build from the specified branch. The build runs in a fresh container each time. Use --environment-variables-override to inject build-specific values.',
          interviewQ: 'How do you pass secrets to a CodeBuild project without hardcoding them?'
        },
        {
          command: 'aws codebuild batch-get-builds --ids my-api-build:a1b2c3d4-5678-90ab-cdef-example',
          category: 'aws-cli',
          expectedOutput: '{\n  "builds": [{\n    "id": "my-api-build:a1b2c3d4",\n    "buildStatus": "SUCCEEDED",\n    "phases": [\n      {"phaseType": "INSTALL", "phaseStatus": "SUCCEEDED", "durationInSeconds": 12},\n      {"phaseType": "PRE_BUILD", "phaseStatus": "SUCCEEDED", "durationInSeconds": 45},\n      {"phaseType": "BUILD", "phaseStatus": "SUCCEEDED", "durationInSeconds": 120},\n      {"phaseType": "POST_BUILD", "phaseStatus": "SUCCEEDED", "durationInSeconds": 8}\n    ]\n  }]\n}',
          explanation: 'Retrieves detailed build information including phase-by-phase status and duration. Use this to identify which phase failed and how long each phase took.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'CodeBuild CLI Lab',
        mode: 'simulated',
        initialText: 'CodeBuild CLI Lab. Try:\n  aws codebuild list-projects\n  aws codebuild batch-get-projects --names my-api-build\n  aws codebuild list-builds-for-project --project-name my-api-build',
        commands: {
          'aws codebuild list-projects': {
            text: '{\n  "projects": [\n    "my-api-build",\n    "frontend-build",\n    "lambda-deploy"\n  ]\n}',
            type: 'output'
          },
          'aws codebuild batch-get-projects --names my-api-build': {
            text: '{\n  "projects": [{\n    "name": "my-api-build",\n    "source": {"type": "GITHUB", "location": "https://github.com/org/my-api.git"},\n    "environment": {"type": "LINUX_CONTAINER", "image": "aws/codebuild/amazonlinux2-x86_64-standard:5.0", "computeType": "BUILD_GENERAL1_MEDIUM", "privilegedMode": true},\n    "cache": {"type": "LOCAL", "modes": ["LOCAL_DOCKER_LAYER_CACHE"]},\n    "timeoutInMinutes": 30\n  }]\n}',
            type: 'output'
          },
          'aws codebuild list-builds-for-project --project-name my-api-build': {
            text: '{\n  "ids": [\n    "my-api-build:build-44",\n    "my-api-build:build-43",\n    "my-api-build:build-42"\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common CodeBuild Issues',
      content: {
        items: [
          { title: 'Build fails: "docker: command not found"', error: 'COMMAND_EXECUTION_ERROR: docker: command not found', cause: 'privilegedMode is not enabled on the build project. Docker commands require privileged mode to run Docker-in-Docker.', fix: 'Update the project: set privilegedMode=True in the environment configuration. Or use aws/codebuild/standard image which includes Docker.' },
          { title: 'Build fails: "Unable to locate credentials"', error: 'Unable to locate credentials. You can configure credentials by running "aws configure"', cause: 'The CodeBuild service role doesn\'t have the required IAM permissions. CodeBuild assumes the service role to execute AWS CLI commands.', fix: 'Add the missing permissions to the CodeBuild service role. Common ones: ecr:GetAuthorizationToken, ecr:BatchGetImage, s3:PutObject, ssm:GetParameters.' },
          { title: 'Build times out', error: 'Build timed out after 60 minutes', cause: 'Build process takes longer than the configured timeout. Or the build is hanging on a command that requires user input.', fix: 'Increase timeoutInMinutes. Check for commands requiring interactive input (add -y flags). Use caching (LOCAL_DOCKER_LAYER_CACHE) to speed up Docker builds.' },
          { title: 'Secrets not injected from SSM', error: 'Parameter /myapp/db-password not found', cause: 'The SSM parameter doesn\'t exist, or the CodeBuild service role lacks ssm:GetParameters permission, or the parameter is in a different region.', fix: 'Verify the parameter exists: aws ssm get-parameter --name /myapp/db-password. Add ssm:GetParameters to the service role. Ensure the region matches.' }
        ]
      }
    },

    {
      id: 'quiz-codebuild',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS CodeBuild Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your CodeBuild project needs to build Docker images and push them to ECR. What must be enabled?',
            options: [
              { id: 'a', text: 'VPC configuration' },
              { id: 'b', text: 'Privileged mode in the environment configuration' },
              { id: 'c', text: 'Batch build mode' },
              { id: 'd', text: 'S3 artifact upload' }
            ],
            correctId: 'b',
            explanation: 'Privileged mode allows the build container to run Docker-in-Docker (DinD). Without it, docker build and docker push commands fail with permission errors. This is required for any build that creates Docker images.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'In a buildspec.yml, the BUILD phase fails. What happens to the POST_BUILD phase?',
            options: [
              { id: 'a', text: 'POST_BUILD is skipped entirely' },
              { id: 'b', text: 'POST_BUILD still executes (but the build is marked as failed)' },
              { id: 'c', text: 'The build retries the BUILD phase' },
              { id: 'd', text: 'POST_BUILD runs only if there are cleanup commands' }
            ],
            correctId: 'b',
            explanation: 'Unlike PRE_BUILD failure (which skips subsequent phases), a BUILD phase failure still runs POST_BUILD. This allows cleanup actions like sending failure notifications. However, the overall build status is FAILED.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'How should you inject a database password into a CodeBuild environment?',
            options: [
              { id: 'a', text: 'Hardcode it in buildspec.yml' },
              { id: 'b', text: 'Use type: PARAMETER_STORE or SECRETS_MANAGER in environment variables' },
              { id: 'c', text: 'Pass it as a command-line argument' },
              { id: 'd', text: 'Store it in the source code repository' }
            ],
            correctId: 'b',
            explanation: 'CodeBuild natively supports injecting secrets from SSM Parameter Store (type: PARAMETER_STORE) and Secrets Manager (type: SECRETS_MANAGER). The values are resolved at build time and never appear in the project configuration or logs.',
            difficulty: 'beginner'
          }
        ]
      }
    },

    {
      id: 'challenge-codebuild',
      type: 'challenge',
      title: 'Challenge: Build Status Reporter',
      content: {
        title: 'Build a CodeBuild Status Dashboard',
        description: 'Write a Lambda function that gets the last 5 builds for a project and reports their status and duration.',
        difficulty: 'intermediate',
        requirements: [
          'Accept project_name as input',
          'List the last 5 build IDs using list_builds_for_project',
          'Get detailed info using batch_get_builds',
          'Calculate total build duration from phases',
          'Return a summary: build_id, status, duration_seconds, source_version'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

codebuild = boto3.client('codebuild')

def lambda_handler(event, context):
    project = event['project_name']

    # TODO: Get last 5 build IDs
    # TODO: Get detailed build info
    # TODO: Calculate duration from phases
    # TODO: Return summary

    pass`,
        language: 'python',
        hints: [
          'codebuild.list_builds_for_project(projectName=project, sortOrder="DESCENDING")["ids"][:5]',
          'codebuild.batch_get_builds(ids=build_ids)["builds"]',
          'duration = sum(p.get("durationInSeconds", 0) for p in build["phases"])',
          'Return [{build_id, status, duration, source_version}]'
        ],
        testCases: [
          { description: 'Uses list_builds_for_project', keywords: ['list_builds_for_project'], expectedOutput: 'builds' },
          { description: 'Uses batch_get_builds', keywords: ['batch_get_builds'], expectedOutput: 'details' },
          { description: 'Calculates duration', keywords: ['durationInSeconds'], expectedOutput: 'duration' }
        ]
      }
    },

    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: { title: 'Module 18: Elastic Load Balancing', url: 'module-18.html' },
        next: { title: 'Module 20: AWS CodePipeline', url: 'module-20.html' }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_19_DATA; } else { window.MODULE_19_DATA = MODULE_19_DATA; }
