/**
 * MODULE 35 — AWS Step Functions — Serverless Workflow Orchestration
 */
const MODULE_35_DATA = {
  id: 'stepfunctions-fundamentals', moduleId: 'module-35',
  title: 'AWS Step Functions — Serverless Workflow Orchestration',
  description: 'Master workflow orchestration. Covers state machines (Standard and Express), ASL (Amazon States Language), error handling, retries, parallel execution, and Lambda integration.',
  difficulty: 'advanced', duration: '75 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master Step Functions core concepts and architecture', 'Implement Step Functions using Boto3 and AWS CLI', 'Troubleshoot common Step Functions issues', 'Pass certification questions about Step Functions'],
  sections: [
    { id: 'why', type: 'why', title: 'Why Step Functions?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🔄</span><div class="alert-content"><div class="alert-title">Orchestrate Complex Workflows — Visually</div><div class="alert-text">Step Functions coordinates multiple AWS services into serverless workflows. Define state machines in JSON (ASL). Visual editor. Built-in error handling, retries, and parallel execution.</div></div></div>
      <table><thead><tr><th>Feature</th><th>Standard</th><th>Express</th></tr></thead><tbody><tr><td><strong>Duration</strong></td><td>Up to 1 year</td><td>5 minutes max</td></tr><tr><td><strong>Pricing</strong></td><td>$0.025/1K transitions</td><td>$1/million requests</td></tr><tr><td><strong>Execution</strong></td><td>Exactly-once</td><td>At-least-once</td></tr><tr><td><strong>History</strong></td><td>90 days</td><td>CloudWatch Logs</td></tr><tr><td><strong>Use Case</strong></td><td>Long workflows</td><td>High-volume, short</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Standard Workflows Cost Per State Transition</div><div class="alert-text">Each state transition costs $0.025/1K. A 10-step workflow running 1M times = $250. For high-volume, short workflows, use Express workflows ($1/million).</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Step Functions Architecture', content: { title: 'State Machine: Start → States → End', width: 750, height: 280,
      nodes: [
          { id: 'start', label: 'Start', icon: '▶️', x: 10, y: 110, type: 'trigger', description: 'State machine invoked via API, EventBridge, or API Gateway.' },
          { id: 'task1', label: 'Lambda Task', icon: '⚡', x: 180, y: 50, type: 'compute', description: 'Task state invokes a Lambda function and waits for result.' },
          { id: 'choice', label: 'Choice', icon: '🔀', x: 350, y: 110, type: 'security', description: 'Branch based on input. Like an if/else statement.' },
          { id: 'parallel', label: 'Parallel', icon: '⏸️', x: 520, y: 50, type: 'compute', description: 'Run multiple branches simultaneously. Wait for all to complete.' },
          { id: 'end', label: 'End', icon: '🏁', x: 520, y: 200, type: 'client', description: 'State machine complete. Returns final output.' }
      ],
      edges: [
          { from: 'start', to: 'task1', label: 'Input', animated: true },
          { from: 'task1', to: 'choice', label: 'Output' },
          { from: 'choice', to: 'parallel', label: 'Success' },
          { from: 'choice', to: 'end', label: 'Failure' },
          { from: 'parallel', to: 'end', label: 'Complete', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. State Types</h4><table><thead><tr><th>State</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>Task</strong></td><td>Execute work (Lambda, ECS, SNS, SQS, etc.)</td></tr><tr><td><strong>Choice</strong></td><td>Branch based on conditions</td></tr><tr><td><strong>Parallel</strong></td><td>Run branches simultaneously</td></tr><tr><td><strong>Wait</strong></td><td>Delay for time or until timestamp</td></tr><tr><td><strong>Map</strong></td><td>Iterate over array items</td></tr><tr><td><strong>Pass</strong></td><td>Transform input to output</td></tr><tr><td><strong>Succeed/Fail</strong></td><td>Terminal states</td></tr></tbody></table><h4>2. Error Handling</h4><p>Built-in Retry and Catch blocks. Retry with exponential backoff. Catch specific error types and route to fallback states.</p><h4>3. ASL (Amazon States Language)</h4><pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">{ "StartAt": "ProcessOrder", "States": { "ProcessOrder": { "Type": "Task", "Resource": "arn:aws:lambda:...", "Retry": [{"ErrorEquals": ["States.ALL"], "MaxAttempts": 3}], "End": true } } }</pre>` } },
    { id: 'lambda-code', type: 'code', title: 'Step Functions Boto3 Operations', content: { title: 'Step Functions Management', languages: [
      { id: 'python-stepfunctions', label: 'Core Operations',
        code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
sf = boto3.client('stepfunctions')

def start_execution(state_machine_arn, name, input_data):
    """Start a state machine execution."""
    response = sf.start_execution(
        stateMachineArn=state_machine_arn,
        name=name,
        input=json.dumps(input_data)
    )
    execution_arn = response['executionArn']
    logger.info("Started execution: %s", execution_arn)
    return execution_arn


def get_execution_status(execution_arn):
    """Check execution status and output."""
    response = sf.describe_execution(executionArn=execution_arn)
    status = response['status']
    output = json.loads(response.get('output', '{}'))
    logger.info("Execution %s: %s", execution_arn, status)
    return {'status': status, 'output': output}`,
        explanations: [
              { line: '11-14', text: 'start_execution triggers the state machine. Name must be unique per state machine.' },
              { line: '23-26', text: 'describe_execution returns status (RUNNING, SUCCEEDED, FAILED, TIMED_OUT) and the final output.' }
        ] }
    ], defaultLang: 'python-stepfunctions', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'Step Functions CLI Commands', content: [
        { command: 'aws stepfunctions list-state-machines', category: 'aws-cli', expectedOutput: '{\n  "stateMachines": [{"name": "order-processing", "stateMachineArn": "arn:aws:states:...", "type": "STANDARD"}]\n}', explanation: 'Lists all state machines with their type (Standard or Express).' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'Step Functions CLI Lab', mode: 'simulated',
      initialText: 'Step Functions CLI Lab. Try:\n  aws stepfunctions list-state-machines\n  aws stepfunctions list-executions --state-machine-arn arn',
      commands: {
          'aws stepfunctions list-state-machines': { text: '{\n  "stateMachines": [\n    {"name": "order-processing", "type": "STANDARD", "creationDate": "2026-06-01T10:00:00Z"},\n    {"name": "data-pipeline", "type": "EXPRESS", "creationDate": "2026-08-15T14:00:00Z"}\n  ]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'Execution fails: Lambda timeout', error: 'States.TaskFailed: Lambda exceeded timeout', cause: 'Lambda function takes longer than its configured timeout.', fix: 'Increase Lambda timeout (max 15 min). Add Retry in ASL for transient failures. For long tasks, use Activity tasks or ECS.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'Step Functions Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Standard vs Express workflow?', options: [
              { id: 'a', text: 'Standard: long-running, exactly-once; Express: short, at-least-once' },
              { id: 'b', text: 'Same but different pricing' },
              { id: 'c', text: 'Express is always better' },
              { id: 'd', text: 'Standard only supports Lambda' }
            ], correctId: 'a', explanation: 'Standard: up to 1 year, exactly-once, $0.025/1K transitions. Express: up to 5 min, at-least-once, $1/million.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Workflow Monitor', content: { title: 'Workflow Monitor', description: 'Monitor active Step Functions executions and report failures.', difficulty: 'intermediate',
      requirements: [
          'List state machines',
          'Get running and failed executions',
          'Return status report'
      ],
      starterCode: `import boto3\nsf = boto3.client('stepfunctions')\n\ndef lambda_handler(event, context):\n    # TODO: List state machines\n    # TODO: Check executions\n    pass`,
      language: 'python', hints: [
          'sf.list_state_machines()',
          'sf.list_executions(stateMachineArn=..., statusFilter="FAILED")'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Module 34: Amazon OpenSearch', url: 'module-34.html' }, next: { title: 'Module 36: AWS IAM Identity Center', url: 'module-36.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_35_DATA; } else { window.MODULE_35_DATA = MODULE_35_DATA; }
