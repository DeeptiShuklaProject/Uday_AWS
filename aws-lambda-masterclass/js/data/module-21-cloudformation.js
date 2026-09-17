/**
 * ============================================================
 * MODULE 21 — AWS CloudFormation
 * Infrastructure as Code, stacks, templates, change sets
 * ============================================================
 */
const MODULE_21_DATA = {
  id: 'cloudformation-fundamentals',
  moduleId: 'module-21',
  title: 'AWS CloudFormation — Infrastructure as Code',
  description: 'Master Infrastructure as Code on AWS. Covers stacks, templates (YAML/JSON), parameters, outputs, mappings, conditions, intrinsic functions, change sets, drift detection, and rollbacks.',
  difficulty: 'intermediate',
  duration: '80 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 04: Amazon VPC'],
  objectives: [
    'Write CloudFormation templates with Resources, Parameters, and Outputs',
    'Use intrinsic functions (!Ref, !Sub, !GetAtt, !Join, Fn::If)',
    'Create and update stacks using change sets for safety',
    'Implement cross-stack references with Exports/Imports',
    'Detect and remediate configuration drift',
    'Handle stack rollbacks and deletion policies'
  ],

  sections: [
    {
      id: 'why-cfn',
      type: 'why',
      title: 'Why CloudFormation?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">📋</span>
            <div class="alert-content">
              <div class="alert-title">Declare Your Entire Infrastructure in a Template — Reproducibly</div>
              <div class="alert-text">CloudFormation lets you model your entire AWS infrastructure in a YAML/JSON template. Create it once, deploy it to any account/region, and track every change through version control. No more clicking in the Console and hoping you remember what you did.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Feature</th><th>CloudFormation</th><th>Terraform</th><th>CDK</th></tr></thead>
            <tbody>
              <tr><td><strong>Language</strong></td><td>YAML / JSON</td><td>HCL</td><td>TypeScript, Python, Java</td></tr>
              <tr><td><strong>State</strong></td><td>AWS-managed (no state file)</td><td>You manage state file</td><td>Generates CloudFormation</td></tr>
              <tr><td><strong>Multi-Cloud</strong></td><td>AWS only</td><td>Yes</td><td>AWS only (primary)</td></tr>
              <tr><td><strong>Drift Detection</strong></td><td>Built-in</td><td>terraform plan</td><td>Via CloudFormation</td></tr>
              <tr><td><strong>Rollback</strong></td><td>Automatic on failure</td><td>Manual</td><td>Via CloudFormation</td></tr>
              <tr><td><strong>Cost</strong></td><td>Free (pay for resources)</td><td>Free OSS / paid Cloud</td><td>Free</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Always Use Change Sets for Production Updates</div>
              <div class="alert-text">Never run <code>update-stack</code> directly on production. Always create a change set first, review the proposed changes (especially Replacement changes that destroy and recreate resources), then execute. A Replacement on an RDS instance means data loss.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'CloudFormation Architecture',
      content: {
        title: 'Template → Stack → Resources',
        width: 750,
        height: 280,
        nodes: [
          { id: 'template', label: 'Template (YAML)', icon: '📝', x: 10, y: 120, type: 'storage', description: 'Declarative YAML/JSON file describing all resources, parameters, outputs, and their relationships.' },
          { id: 'changeset', label: 'Change Set', icon: '🔍', x: 170, y: 50, type: 'security', description: 'Preview of changes before execution. Shows Add, Modify, Remove, and Replacement actions. Critical for production safety.' },
          { id: 'cfn', label: 'CloudFormation Service', icon: '⚙️', x: 350, y: 120, type: 'compute', description: 'Orchestration engine that creates/updates/deletes resources in dependency order. Handles rollback on failure automatically.', eventPayload: { stackStatus: 'CREATE_COMPLETE', driftStatus: 'IN_SYNC', resourceCount: 12 } },
          { id: 'vpc', label: 'VPC', icon: '🔒', x: 550, y: 30, type: 'security', description: 'Created resource. CloudFormation resolves !Ref and !GetAtt to inject the VPC ID into dependent resources.' },
          { id: 'ec2', label: 'EC2 / ECS', icon: '🖥️', x: 550, y: 120, type: 'compute', description: 'Depends on VPC. CloudFormation waits for VPC to be CREATE_COMPLETE before provisioning compute.' },
          { id: 'rds', label: 'RDS', icon: '🗄️', x: 550, y: 220, type: 'storage', description: 'Database with DeletionPolicy: Snapshot. If the stack is deleted, RDS creates a final snapshot instead of being destroyed.' }
        ],
        edges: [
          { from: 'template', to: 'changeset', label: 'Review' },
          { from: 'changeset', to: 'cfn', label: 'Execute', animated: true },
          { from: 'template', to: 'cfn', label: 'Create Stack', animated: true },
          { from: 'cfn', to: 'vpc', label: 'Create 1st' },
          { from: 'cfn', to: 'ec2', label: 'Create 2nd' },
          { from: 'cfn', to: 'rds', label: 'Create 3rd' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Template Structure</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">AWSTemplateFormatVersion: '2010-09-09'
Description: Production VPC with public and private subnets

Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, production]
    Default: dev

Mappings:
  RegionAMI:
    us-east-1:
      HVM64: ami-0abcdef1234567890

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      Tags:
        - Key: Name
          Value: !Sub "\${Environment}-vpc"

Outputs:
  VpcId:
    Value: !Ref VPC
    Export:
      Name: !Sub "\${Environment}-VpcId"</pre>

          <h4>2. Intrinsic Functions</h4>
          <table>
            <thead><tr><th>Function</th><th>Purpose</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td><strong>!Ref</strong></td><td>Reference a parameter or resource</td><td><code>!Ref VPC</code> → VPC ID</td></tr>
              <tr><td><strong>!GetAtt</strong></td><td>Get an attribute of a resource</td><td><code>!GetAtt VPC.CidrBlock</code></td></tr>
              <tr><td><strong>!Sub</strong></td><td>String substitution</td><td><code>!Sub "arn:aws:s3:::\${BucketName}"</code></td></tr>
              <tr><td><strong>!Join</strong></td><td>Join strings with delimiter</td><td><code>!Join ["-", [!Ref Env, "vpc"]]</code></td></tr>
              <tr><td><strong>!Select</strong></td><td>Pick from a list</td><td><code>!Select [0, !GetAZs ""]</code></td></tr>
              <tr><td><strong>!If</strong></td><td>Conditional value</td><td><code>!If [IsProd, t3.large, t3.micro]</code></td></tr>
              <tr><td><strong>!ImportValue</strong></td><td>Cross-stack reference</td><td><code>!ImportValue prod-VpcId</code></td></tr>
            </tbody>
          </table>

          <h4>3. Stack Lifecycle</h4>
          <ul>
            <li><strong>CREATE_IN_PROGRESS</strong> → <strong>CREATE_COMPLETE</strong> or <strong>ROLLBACK_IN_PROGRESS</strong></li>
            <li><strong>UPDATE_IN_PROGRESS</strong> → <strong>UPDATE_COMPLETE</strong> or <strong>UPDATE_ROLLBACK_IN_PROGRESS</strong></li>
            <li><strong>DELETE_IN_PROGRESS</strong> → <strong>DELETE_COMPLETE</strong></li>
          </ul>

          <h4>4. DeletionPolicy</h4>
          <table>
            <thead><tr><th>Policy</th><th>Behavior</th><th>Use For</th></tr></thead>
            <tbody>
              <tr><td><strong>Delete</strong> (default)</td><td>Resource is destroyed with the stack</td><td>Ephemeral resources</td></tr>
              <tr><td><strong>Retain</strong></td><td>Resource is kept but no longer managed</td><td>S3 buckets with data</td></tr>
              <tr><td><strong>Snapshot</strong></td><td>Creates a snapshot before deletion</td><td>RDS, EBS volumes</td></tr>
            </tbody>
          </table>

          <h4>5. Drift Detection</h4>
          <p>Detects when actual resource configuration differs from what's defined in the template (e.g., someone manually edited a security group in the Console). Statuses: IN_SYNC, DRIFTED, NOT_CHECKED.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'CloudFormation Boto3 Operations',
      content: {
        title: 'Stack Management',
        languages: [
          {
            id: 'python-cfn',
            label: 'Create Stack & Change Set',
            code: `import boto3
import json
import logging
import time

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cfn = boto3.client('cloudformation')

def create_stack(stack_name, template_body, params, tags=None):
    """Create a CloudFormation stack."""
    response = cfn.create_stack(
        StackName=stack_name,
        TemplateBody=template_body,
        Parameters=[
            {'ParameterKey': k, 'ParameterValue': v}
            for k, v in params.items()
        ],
        Tags=[
            {'Key': k, 'Value': v}
            for k, v in (tags or {}).items()
        ],
        Capabilities=['CAPABILITY_NAMED_IAM'],  # Required if template creates IAM roles
        OnFailure='ROLLBACK'  # Auto-rollback on failure
    )
    stack_id = response['StackId']
    logger.info("Stack creating: %s (%s)", stack_name, stack_id)
    return stack_id


def safe_update_with_change_set(stack_name, template_body, params):
    """Update a stack safely using a change set (review before execute)."""
    change_set_name = f'{stack_name}-cs-{int(time.time())}'
    
    # 1. Create change set (preview only)
    cfn.create_change_set(
        StackName=stack_name,
        ChangeSetName=change_set_name,
        TemplateBody=template_body,
        Parameters=[
            {'ParameterKey': k, 'ParameterValue': v}
            for k, v in params.items()
        ],
        Capabilities=['CAPABILITY_NAMED_IAM']
    )
    
    # 2. Wait for change set to be ready
    waiter = cfn.get_waiter('change_set_create_complete')
    waiter.wait(StackName=stack_name, ChangeSetName=change_set_name)
    
    # 3. Describe changes (review what will happen)
    changes = cfn.describe_change_set(
        StackName=stack_name,
        ChangeSetName=change_set_name
    )
    
    for change in changes['Changes']:
        resource = change['ResourceChange']
        logger.info("Change: %s %s (%s) — Replacement: %s",
                     resource['Action'],        # Add, Modify, Remove
                     resource['LogicalResourceId'],
                     resource['ResourceType'],
                     resource.get('Replacement', 'N/A'))
    
    return change_set_name  # Return for manual review/execute


def detect_drift(stack_name):
    """Detect configuration drift from the template."""
    detection = cfn.detect_stack_drift(StackName=stack_name)
    detection_id = detection['StackDriftDetectionId']
    logger.info("Drift detection started: %s", detection_id)
    return detection_id`,
            explanations: [
              { line: '24', text: 'CAPABILITY_NAMED_IAM is required when the template creates IAM resources with custom names. Without it, CloudFormation rejects the stack for security.' },
              { line: '35-46', text: 'Change sets are the safe way to update stacks. They show what will change without actually changing anything. Look for Replacement: "True" — that means the resource will be DESTROYED and recreated (data loss risk!).' },
              { line: '56-58', text: 'Review each change. Action=Modify with Replacement=Conditional means the change MIGHT cause a replacement depending on the specific property being changed.' }
            ]
          }
        ],
        defaultLang: 'python-cfn',
        expectedOutput: 'Stack creating: prod-vpc (arn:aws:cloudformation:us-east-1:123456789012:stack/prod-vpc/abc123)\nChange: Modify SecurityGroup (AWS::EC2::SecurityGroup) — Replacement: False'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'CloudFormation CLI Commands',
      content: [
        {
          command: 'aws cloudformation create-stack --stack-name prod-vpc --template-body file://vpc.yaml --parameters ParameterKey=Environment,ParameterValue=production --capabilities CAPABILITY_NAMED_IAM',
          category: 'aws-cli',
          expectedOutput: '{\n  "StackId": "arn:aws:cloudformation:us-east-1:123456789012:stack/prod-vpc/abc-123"\n}',
          explanation: 'Creates a stack from a local template. --capabilities CAPABILITY_NAMED_IAM is required when the template creates IAM resources. The stack transitions from CREATE_IN_PROGRESS to CREATE_COMPLETE.',
          interviewQ: 'When would CloudFormation automatically rollback a stack creation?'
        },
        {
          command: 'aws cloudformation detect-stack-drift --stack-name prod-vpc && aws cloudformation describe-stack-drift-detection-status --stack-drift-detection-id abc123',
          category: 'aws-cli',
          expectedOutput: '{\n  "StackDriftDetectionId": "abc123",\n  "StackDriftStatus": "DRIFTED",\n  "DriftedStackResourceCount": 1,\n  "DetectionStatus": "DETECTION_COMPLETE"\n}',
          explanation: 'Detects drift — when actual resources differ from the template (e.g., someone manually edited a security group in the Console). DRIFTED status means at least one resource has been modified outside CloudFormation.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'CloudFormation CLI Lab',
        mode: 'simulated',
        initialText: 'CloudFormation CLI Lab. Try:\n  aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE\n  aws cloudformation describe-stacks --stack-name prod-vpc\n  aws cloudformation describe-stack-events --stack-name prod-vpc',
        commands: {
          'aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE': {
            text: '{\n  "StackSummaries": [\n    {"StackName": "prod-vpc", "StackStatus": "CREATE_COMPLETE", "CreationTime": "2026-08-15T10:00:00Z", "DriftInformation": {"StackDriftStatus": "IN_SYNC"}},\n    {"StackName": "prod-ecs", "StackStatus": "CREATE_COMPLETE", "CreationTime": "2026-09-01T14:00:00Z", "DriftInformation": {"StackDriftStatus": "DRIFTED"}}\n  ]\n}',
            type: 'output'
          },
          'aws cloudformation describe-stacks --stack-name prod-vpc': {
            text: '{\n  "Stacks": [{\n    "StackName": "prod-vpc",\n    "StackStatus": "CREATE_COMPLETE",\n    "Parameters": [{"ParameterKey": "Environment", "ParameterValue": "production"}],\n    "Outputs": [{"OutputKey": "VpcId", "OutputValue": "vpc-abc123", "ExportName": "production-VpcId"}],\n    "Tags": [{"Key": "Environment", "Value": "production"}],\n    "DriftInformation": {"StackDriftStatus": "IN_SYNC"}\n  }]\n}',
            type: 'output'
          },
          'aws cloudformation describe-stack-events --stack-name prod-vpc': {
            text: '{\n  "StackEvents": [\n    {"Timestamp": "2026-08-15T10:05:00Z", "ResourceType": "AWS::CloudFormation::Stack", "ResourceStatus": "CREATE_COMPLETE"},\n    {"Timestamp": "2026-08-15T10:04:50Z", "ResourceType": "AWS::EC2::Subnet", "LogicalResourceId": "PrivateSubnet1", "ResourceStatus": "CREATE_COMPLETE"},\n    {"Timestamp": "2026-08-15T10:02:00Z", "ResourceType": "AWS::EC2::VPC", "LogicalResourceId": "VPC", "ResourceStatus": "CREATE_COMPLETE"},\n    {"Timestamp": "2026-08-15T10:00:10Z", "ResourceType": "AWS::EC2::VPC", "LogicalResourceId": "VPC", "ResourceStatus": "CREATE_IN_PROGRESS"}\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common CloudFormation Issues',
      content: {
        items: [
          { title: 'Stack stuck in ROLLBACK_IN_PROGRESS', error: 'Stack status: ROLLBACK_IN_PROGRESS for 30+ minutes', cause: 'A resource created during stack creation can\'t be deleted during rollback (e.g., non-empty S3 bucket, RDS with delete protection).', fix: 'Manually delete the blocking resource, then run: aws cloudformation continue-update-rollback --stack-name <name>. For future: add DeletionPolicy: Retain to S3 buckets, use DeleteionProtection: false for dev.' },
          { title: 'InsufficientCapabilitiesException', error: 'Requires capabilities: [CAPABILITY_NAMED_IAM]', cause: 'The template creates IAM resources (roles, policies) with custom names. CloudFormation requires explicit acknowledgment for security.', fix: 'Add --capabilities CAPABILITY_NAMED_IAM to the CLI command. For templates creating unnamed IAM resources, use CAPABILITY_IAM. Both can be specified.' },
          { title: 'Template format error', error: 'Template format error: YAML not well-formed', cause: 'Indentation error in YAML template. YAML is whitespace-sensitive — tabs vs spaces, inconsistent indentation.', fix: 'Use a YAML linter (yamllint, VS Code YAML extension). Validate before deploying: aws cloudformation validate-template --template-body file://template.yaml.' },
          { title: 'Resource replacement causes data loss', error: 'Change set shows Replacement: True for RDS instance', cause: 'Certain property changes require CloudFormation to delete and recreate the resource. For databases, this means data loss unless DeletionPolicy: Snapshot is set.', fix: 'Always review change sets before executing. For RDS, set DeletionPolicy: Snapshot. For properties that cause replacement (e.g., changing RDS engine), consider manual migration instead of CloudFormation updates.' }
        ]
      }
    },

    {
      id: 'quiz-cfn',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS CloudFormation Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'A CloudFormation change set shows "Action: Modify, Replacement: True" for an RDS instance. What does this mean?',
            options: [
              { id: 'a', text: 'The RDS instance will be updated in place with no downtime' },
              { id: 'b', text: 'The RDS instance will be DELETED and RECREATED — potential data loss' },
              { id: 'c', text: 'The change set is invalid and cannot be executed' },
              { id: 'd', text: 'Only the RDS configuration will change, data is preserved' }
            ],
            correctId: 'b',
            explanation: 'Replacement: True means CloudFormation will delete the existing resource and create a new one. For RDS, this means DATA LOSS unless DeletionPolicy: Snapshot is set. Always review change sets for Replacement changes before executing on production.',
            difficulty: 'advanced'
          },
          {
            id: 'q2',
            question: 'How do you share a VPC ID from one CloudFormation stack with another stack?',
            options: [
              { id: 'a', text: 'Hardcode the VPC ID in the second template' },
              { id: 'b', text: 'Use Outputs with Export in the first stack, and !ImportValue in the second' },
              { id: 'c', text: 'Store it in DynamoDB and read it in the second template' },
              { id: 'd', text: 'Pass it as a command-line parameter only' }
            ],
            correctId: 'b',
            explanation: 'Cross-stack references use Outputs + Export in the source stack and !ImportValue in the consuming stack. Example: Output VpcId with Export Name "prod-VpcId", then use !ImportValue "prod-VpcId" in other stacks. The export name must be unique per region.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'What is the purpose of DeletionPolicy: Snapshot on an RDS resource?',
            options: [
              { id: 'a', text: 'Takes a snapshot every hour for backup' },
              { id: 'b', text: 'Creates a final snapshot before CloudFormation deletes the database' },
              { id: 'c', text: 'Prevents the stack from being deleted' },
              { id: 'd', text: 'Enables automated backups on the RDS instance' }
            ],
            correctId: 'b',
            explanation: 'DeletionPolicy: Snapshot instructs CloudFormation to create a final RDS snapshot before deleting the instance (during stack deletion or resource replacement). This preserves your data. Without it, the default DeletionPolicy: Delete destroys the database and all data permanently.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-cfn',
      type: 'challenge',
      title: 'Challenge: Stack Drift Reporter',
      content: {
        title: 'Build a CloudFormation Drift Detector',
        description: 'Write a Lambda function that checks all stacks for configuration drift and reports drifted resources.',
        difficulty: 'intermediate',
        requirements: [
          'List all stacks with status CREATE_COMPLETE or UPDATE_COMPLETE',
          'Trigger drift detection on each stack',
          'Wait for detection to complete',
          'Report any stacks with DRIFTED status and their drifted resource count'
        ],
        starterCode: `import boto3
import logging
import time

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cfn = boto3.client('cloudformation')

def lambda_handler(event, context):
    # TODO: List active stacks
    # TODO: Detect drift on each
    # TODO: Wait for detection to complete
    # TODO: Report drifted stacks

    pass`,
        language: 'python',
        hints: [
          'cfn.list_stacks(StackStatusFilter=["CREATE_COMPLETE", "UPDATE_COMPLETE"])',
          'cfn.detect_stack_drift(StackName=name)',
          'cfn.describe_stack_drift_detection_status(StackDriftDetectionId=id)',
          'Check StackDriftStatus == "DRIFTED"'
        ],
        testCases: [
          { description: 'Lists stacks', keywords: ['list_stacks'], expectedOutput: 'stacks' },
          { description: 'Detects drift', keywords: ['detect_stack_drift'], expectedOutput: 'drift' },
          { description: 'Reports drifted stacks', keywords: ['DRIFTED'], expectedOutput: 'drifted' }
        ]
      }
    },

    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: { title: 'Module 20: AWS CodePipeline', url: 'module-20.html' },
        next: { title: 'Module 22: AWS KMS', url: 'module-22.html' }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_21_DATA; } else { window.MODULE_21_DATA = MODULE_21_DATA; }
