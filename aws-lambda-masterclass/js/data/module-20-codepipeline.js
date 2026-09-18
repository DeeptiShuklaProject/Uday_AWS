/**
 * ============================================================
 * MODULE 20 — AWS CodePipeline
 * CI/CD pipeline orchestration, stages, actions, approvals
 * ============================================================
 */
const MODULE_20_DATA = {
  id: 'codepipeline-fundamentals',
  moduleId: 'module-20',
  title: 'AWS CodePipeline — CI/CD Pipeline Orchestration',
  description: 'Master CI/CD automation. Covers pipeline stages, source/build/deploy actions, manual approval gates, cross-region deployments, and pipeline-as-code with CloudFormation.',
  difficulty: 'intermediate',
  duration: '70 min',
  prerequisites: ['Module 19: AWS CodeBuild', 'Module 16: Amazon ECS'],
  objectives: [
    'Create multi-stage pipelines with Source, Build, Test, and Deploy stages',
    'Configure source actions for GitHub, CodeCommit, and S3',
    'Add manual approval gates for production deployments',
    'Implement cross-region pipeline actions',
    'Handle pipeline artifacts and action variables',
    'Troubleshoot pipeline execution failures'
  ],

  sections: [
    {
      id: 'why-codepipeline',
      type: 'why',
      title: 'Why CodePipeline?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔄</span>
            <div class="alert-content">
              <div class="alert-title">Orchestrate Your Entire Release Process — Automatically</div>
              <div class="alert-text">CodePipeline is a fully managed CI/CD orchestration service. It connects your source repository to build, test, and deploy stages — automatically triggering on every commit. No Jenkins master to maintain, no cron jobs to schedule.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Feature</th><th>CodePipeline</th><th>Jenkins</th><th>GitHub Actions</th></tr></thead>
            <tbody>
              <tr><td><strong>Pipeline Model</strong></td><td>Stage → Action (visual)</td><td>Declarative/Scripted Groovy</td><td>YAML workflows</td></tr>
              <tr><td><strong>AWS Deploy</strong></td><td>Native (ECS, Lambda, S3, CFN)</td><td>Plugins/scripts</td><td>AWS actions</td></tr>
              <tr><td><strong>Approval Gates</strong></td><td>Built-in (SNS notification)</td><td>Input step</td><td>Environment protection</td></tr>
              <tr><td><strong>Cross-Region</strong></td><td>Built-in</td><td>Manual config</td><td>Manual config</td></tr>
              <tr><td><strong>Pricing</strong></td><td>$1/pipeline/month</td><td>EC2 hosting costs</td><td>Per minute</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Always Add Manual Approval Before Production</div>
              <div class="alert-text">Never deploy directly to production without a manual approval gate. Add an Approval action between staging and production stages. It sends an SNS notification and waits for a human to approve or reject.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'CodePipeline Architecture',
      content: {
        title: 'Pipeline: Source → Build → Stage → Approve → Deploy',
        width: 750,
        height: 260,
        nodes: [
          { id: 'source', label: 'Source Stage', icon: '📁', x: 10, y: 110, type: 'storage', description: 'Polls for changes in GitHub/CodeCommit/S3. Triggers pipeline on new commits. Outputs source artifact.' },
          { id: 'build', label: 'Build Stage', icon: '🔨', x: 160, y: 110, type: 'compute', description: 'CodeBuild compiles, tests, and packages the application. Produces build artifacts (Docker image, ZIP).' },
          { id: 'staging', label: 'Deploy to Staging', icon: '🧪', x: 320, y: 60, type: 'compute', description: 'Deploy to staging environment for integration testing. ECS, Lambda, or CloudFormation deploy action.' },
          { id: 'approve', label: 'Manual Approval', icon: '✋', x: 480, y: 110, type: 'security', description: 'Sends SNS notification to team. Pipeline pauses until a human approves. Has configurable timeout (1-7 days).', eventPayload: { status: 'InProgress', approver: 'team-lead@company.com', timeout: '7 days' } },
          { id: 'prod', label: 'Deploy to Prod', icon: '🚀', x: 640, y: 110, type: 'compute', description: 'After approval, deploys to production. Uses the same artifact from Build stage (immutable artifact).' },
          { id: 'artifact', label: 'S3 Artifact Store', icon: '📦', x: 320, y: 220, type: 'storage', description: 'Pipeline artifacts are stored in S3 between stages. Each action reads input artifacts and writes output artifacts.' }
        ],
        edges: [
          { from: 'source', to: 'build', label: 'Source Artifact', animated: true },
          { from: 'build', to: 'staging', label: 'Build Artifact', animated: true },
          { from: 'staging', to: 'approve', label: 'Deployed ✓' },
          { from: 'approve', to: 'prod', label: 'Approved ✓', animated: true },
          { from: 'build', to: 'artifact', label: 'Store' },
          { from: 'artifact', to: 'prod', label: 'Retrieve' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Pipeline Structure</h4>
          <p>A pipeline consists of <strong>Stages</strong>, each containing one or more <strong>Actions</strong>:</p>
          <ul>
            <li><strong>Stage</strong>: A logical grouping (Source, Build, Test, Approve, Deploy). Stages execute sequentially.</li>
            <li><strong>Action</strong>: A task within a stage (CodeBuild, ECS Deploy, Lambda Invoke, Manual Approval). Actions within a stage can run in parallel.</li>
            <li><strong>Artifact</strong>: Output from one action passed as input to another (stored in S3).</li>
          </ul>

          <h4>2. Action Types</h4>
          <table>
            <thead><tr><th>Category</th><th>Provider</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td><strong>Source</strong></td><td>GitHub, CodeCommit, S3, ECR</td><td>Detect changes and output source</td></tr>
              <tr><td><strong>Build</strong></td><td>CodeBuild, Jenkins</td><td>Compile, test, package</td></tr>
              <tr><td><strong>Test</strong></td><td>CodeBuild, DeviceFarm</td><td>Run integration/E2E tests</td></tr>
              <tr><td><strong>Deploy</strong></td><td>ECS, Lambda, S3, CloudFormation, CodeDeploy</td><td>Deploy to target environment</td></tr>
              <tr><td><strong>Approval</strong></td><td>Manual</td><td>Human review gate</td></tr>
              <tr><td><strong>Invoke</strong></td><td>Lambda, Step Functions</td><td>Custom logic</td></tr>
            </tbody>
          </table>

          <h4>3. Pipeline Execution</h4>
          <ul>
            <li>Triggered by source changes (webhook or polling)</li>
            <li>Each execution uses a <strong>unique execution ID</strong></li>
            <li>If a new commit arrives while pipeline is running, it queues (or supersedes, depending on config)</li>
            <li>Artifacts are <strong>immutable per execution</strong> — the same build artifact deploys to staging and production</li>
          </ul>

          <h4>4. Cross-Region Deployments</h4>
          <p>CodePipeline can deploy to multiple regions in a single pipeline. It automatically replicates artifacts to the target region's S3 artifact store. Useful for multi-region ECS or CloudFormation deployments.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'CodePipeline Boto3 Operations',
      content: {
        title: 'Pipeline Management',
        languages: [
          {
            id: 'python-pipeline',
            label: 'Create Pipeline',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

pipeline = boto3.client('codepipeline')

def create_ecs_deploy_pipeline(name, repo, branch, build_project, 
                                cluster, service, role_arn):
    """Create a Source → Build → Deploy pipeline for ECS."""
    response = pipeline.create_pipeline(
        pipeline={
            'name': name,
            'roleArn': role_arn,
            'artifactStore': {
                'type': 'S3',
                'location': f'{name}-artifacts'
            },
            'stages': [
                {
                    'name': 'Source',
                    'actions': [{
                        'name': 'GitHubSource',
                        'actionTypeId': {
                            'category': 'Source',
                            'owner': 'AWS',
                            'provider': 'CodeStarSourceConnection',
                            'version': '1'
                        },
                        'configuration': {
                            'ConnectionArn': 'arn:aws:codestar-connections:...',
                            'FullRepositoryId': repo,
                            'BranchName': branch
                        },
                        'outputArtifacts': [{'name': 'SourceOutput'}]
                    }]
                },
                {
                    'name': 'Build',
                    'actions': [{
                        'name': 'CodeBuild',
                        'actionTypeId': {
                            'category': 'Build',
                            'owner': 'AWS',
                            'provider': 'CodeBuild',
                            'version': '1'
                        },
                        'configuration': {
                            'ProjectName': build_project
                        },
                        'inputArtifacts': [{'name': 'SourceOutput'}],
                        'outputArtifacts': [{'name': 'BuildOutput'}]
                    }]
                },
                {
                    'name': 'Approval',
                    'actions': [{
                        'name': 'ManualApproval',
                        'actionTypeId': {
                            'category': 'Approval',
                            'owner': 'AWS',
                            'provider': 'Manual',
                            'version': '1'
                        },
                        'configuration': {
                            'NotificationArn': 'arn:aws:sns:...:deploy-approvals',
                            'CustomData': 'Please review and approve production deployment'
                        }
                    }]
                },
                {
                    'name': 'Deploy',
                    'actions': [{
                        'name': 'ECS-Deploy',
                        'actionTypeId': {
                            'category': 'Deploy',
                            'owner': 'AWS',
                            'provider': 'ECS',
                            'version': '1'
                        },
                        'configuration': {
                            'ClusterName': cluster,
                            'ServiceName': service,
                            'FileName': 'imagedefinitions.json'
                        },
                        'inputArtifacts': [{'name': 'BuildOutput'}]
                    }]
                }
            ]
        }
    )
    logger.info("Pipeline created: %s", name)
    return response['pipeline']['name']`,
            explanations: [
              { line: '28-29', text: 'CodeStarSourceConnection is the recommended way to connect GitHub (v2). It uses OAuth apps instead of personal access tokens.' },
              { line: '58-67', text: 'Manual Approval stage sends an SNS notification and pauses the pipeline. Someone must approve/reject before it proceeds. Essential for production safety.' },
              { line: '79', text: 'imagedefinitions.json maps container names to image URIs. CodeBuild generates this file, and the ECS deploy action uses it to update the task definition.' }
            ]
          }
        ],
        defaultLang: 'python-pipeline',
        expectedOutput: 'Pipeline created: my-api-pipeline'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'CodePipeline CLI Commands',
      content: [
        {
          command: 'aws codepipeline get-pipeline-state --name my-api-pipeline',
          category: 'aws-cli',
          expectedOutput: '{\n  "pipelineName": "my-api-pipeline",\n  "stageStates": [\n    {"stageName": "Source", "latestExecution": {"status": "Succeeded"}},\n    {"stageName": "Build", "latestExecution": {"status": "Succeeded"}},\n    {"stageName": "Approval", "latestExecution": {"status": "InProgress"}},\n    {"stageName": "Deploy", "latestExecution": {"status": "NotStarted"}}\n  ]\n}',
          explanation: 'Shows the current state of each pipeline stage. "InProgress" on Approval means it\'s waiting for manual approval. Essential for monitoring deployments.',
          interviewQ: 'How do you implement a manual approval gate in CodePipeline?'
        },
        {
          command: 'aws codepipeline put-approval-result --pipeline-name my-api-pipeline --stage-name Approval --action-name ManualApproval --result summary="Reviewed and approved",status=Approved --token abc123',
          category: 'aws-cli',
          expectedOutput: '{\n  "approvedAt": "2026-09-17T12:00:00Z"\n}',
          explanation: 'Programmatically approves a pending approval action. The token comes from the approval notification (SNS). status can be "Approved" or "Rejected".'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'CodePipeline CLI Lab',
        mode: 'simulated',
        initialText: 'CodePipeline CLI Lab. Try:\n  aws codepipeline list-pipelines\n  aws codepipeline get-pipeline-state --name my-api-pipeline\n  aws codepipeline list-pipeline-executions --pipeline-name my-api-pipeline',
        commands: {
          'aws codepipeline list-pipelines': {
            text: '{\n  "pipelines": [\n    {"name": "my-api-pipeline", "version": 3, "created": "2026-06-15T10:00:00Z", "updated": "2026-09-10T14:30:00Z"},\n    {"name": "frontend-pipeline", "version": 1, "created": "2026-08-01T09:00:00Z"}\n  ]\n}',
            type: 'output'
          },
          'aws codepipeline get-pipeline-state --name my-api-pipeline': {
            text: '{\n  "pipelineName": "my-api-pipeline",\n  "stageStates": [\n    {"stageName": "Source", "latestExecution": {"status": "Succeeded", "lastStatusChange": "2026-09-17T11:00:00Z"}},\n    {"stageName": "Build", "latestExecution": {"status": "Succeeded", "lastStatusChange": "2026-09-17T11:05:00Z"}},\n    {"stageName": "Approval", "latestExecution": {"status": "InProgress"}, "actionStates": [{"actionName": "ManualApproval", "latestExecution": {"status": "InProgress", "token": "abc-123-def"}}]},\n    {"stageName": "Deploy", "inboundExecution": {"status": "NotStarted"}}\n  ]\n}',
            type: 'output'
          },
          'aws codepipeline list-pipeline-executions --pipeline-name my-api-pipeline': {
            text: '{\n  "pipelineExecutionSummaries": [\n    {"pipelineExecutionId": "exec-001", "status": "InProgress", "trigger": {"triggerType": "Webhook", "triggerDetail": "push to main"}},\n    {"pipelineExecutionId": "exec-000", "status": "Succeeded", "trigger": {"triggerType": "Webhook"}}\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common CodePipeline Issues',
      content: {
        items: [
          { title: 'Pipeline doesn\'t trigger on commit', error: 'No pipeline execution after pushing to the repository', cause: 'Webhook is not configured or the connection (CodeStar) is in PENDING status. For CodeCommit, EventBridge rule might be missing.', fix: 'Check the source connection status: aws codestar-connections list-connections. If PENDING, complete the handshake in the Console. For GitHub (v1), verify the webhook URL in repo settings.' },
          { title: 'Deploy to ECS fails: imagedefinitions.json not found', error: 'ActionConfigurationException: imagedefinitions.json not found in build artifact', cause: 'CodeBuild didn\'t produce imagedefinitions.json in the artifacts section. The ECS deploy action expects this file to know which container image to deploy.', fix: 'Add to buildspec.yml artifacts: { files: [imagedefinitions.json] }. The file format is: [{"name":"container-name","imageUri":"123.dkr.ecr.region.amazonaws.com/repo:tag"}]' },
          { title: 'Approval timeout', error: 'Approval action timed out after 7 days', cause: 'No one approved or rejected within the timeout period (default 7 days). The pipeline execution fails.', fix: 'Set up SNS notifications so the team gets alerted. Consider reducing timeout or using a Slack/Teams integration for approval notifications.' },
          { title: 'Stage stuck in "InProgress"', error: 'Pipeline stage shows InProgress indefinitely', cause: 'The action (usually CodeBuild or CloudFormation) is hanging. CloudFormation might be waiting for a resource that\'s stuck (e.g., ECS service can\'t stabilize).', fix: 'Check the action\'s detail page for logs. For CodeBuild: check build logs. For CloudFormation: check stack events. You can manually retry or stop the execution.' }
        ]
      }
    },

    {
      id: 'quiz-codepipeline',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS CodePipeline Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'What file format does the ECS deploy action in CodePipeline expect to determine which Docker image to deploy?',
            options: [
              { id: 'a', text: 'Dockerfile' },
              { id: 'b', text: 'imagedefinitions.json' },
              { id: 'c', text: 'appspec.yml' },
              { id: 'd', text: 'task-definition.json' }
            ],
            correctId: 'b',
            explanation: 'The ECS deploy action uses imagedefinitions.json, which maps container names to image URIs: [{"name":"api","imageUri":"123.dkr.ecr.region.amazonaws.com/api:v1.2"}]. CodeBuild generates this file during the post_build phase.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'A pipeline has Source → Build → Deploy stages. A new commit arrives while Build is executing. What happens?',
            options: [
              { id: 'a', text: 'The new commit is ignored until the current execution finishes' },
              { id: 'b', text: 'The current execution is cancelled and restarted with the new commit' },
              { id: 'c', text: 'The new source change waits and starts a new execution after the current one completes' },
              { id: 'd', text: 'Both executions run simultaneously' }
            ],
            correctId: 'c',
            explanation: 'By default, CodePipeline queues the new source change. After the current execution completes (or fails), it starts a new execution with the latest source. Only one execution per stage can run at a time. You can also configure SUPERSEDED mode to cancel stale executions.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'How does CodePipeline pass data between stages?',
            options: [
              { id: 'a', text: 'Directly through memory between actions' },
              { id: 'b', text: 'Through S3 artifacts — each action produces output artifacts consumed by downstream actions' },
              { id: 'c', text: 'Through DynamoDB tables shared across stages' },
              { id: 'd', text: 'Through environment variables only' }
            ],
            correctId: 'b',
            explanation: 'CodePipeline uses S3 as the artifact store. Each action declares inputArtifacts and outputArtifacts. Source outputs source code, Build outputs compiled artifacts, and Deploy consumes them. Artifacts are immutable per execution ID.',
            difficulty: 'beginner'
          }
        ]
      }
    },

    {
      id: 'challenge-codepipeline',
      type: 'challenge',
      title: 'Challenge: Pipeline Status Dashboard',
      content: {
        title: 'Build a Pipeline Health Dashboard',
        description: 'Write a Lambda function that checks all pipelines and reports any with failed or stalled stages.',
        difficulty: 'intermediate',
        requirements: [
          'List all pipelines using list_pipelines',
          'Get the state of each pipeline using get_pipeline_state',
          'Check each stage for status == "Failed" or long-running "InProgress"',
          'Return a summary with pipeline name, stage name, status, and last update time'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cp = boto3.client('codepipeline')

def lambda_handler(event, context):
    # TODO: List all pipelines
    # TODO: Get state of each pipeline
    # TODO: Check for failed or stalled stages
    # TODO: Return summary

    pass`,
        language: 'python',
        hints: [
          'cp.list_pipelines()["pipelines"]',
          'cp.get_pipeline_state(name=pipeline_name)',
          'Check stage["latestExecution"]["status"] for "Failed"',
          'Return [{pipeline, stage, status, lastChange}]'
        ],
        testCases: [
          { description: 'Lists pipelines', keywords: ['list_pipelines'], expectedOutput: 'pipelines' },
          { description: 'Gets pipeline state', keywords: ['get_pipeline_state'], expectedOutput: 'state' },
          { description: 'Checks for failures', keywords: ['Failed'], expectedOutput: 'failed' }
        ]
      }
    },

    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 26: AWS CodeBuild', url: 'module-19.html' }, next: { title: 'Chapter 28: AWS CloudFormation', url: 'module-21.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_20_DATA; } else { window.MODULE_20_DATA = MODULE_20_DATA; }
