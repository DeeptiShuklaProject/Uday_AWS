/**
 * MODULE 42 — AWS CodeDeploy — Automated Deployments
 */
const MODULE_42_DATA = {
  id: 'codedeploy-fundamentals', moduleId: 'module-42',
  title: 'AWS CodeDeploy — Automated Deployment Strategies',
  description: 'Master deployment automation. Covers in-place and blue/green deployments, AppSpec files, lifecycle hooks, rollback strategies, and integration with CodePipeline.',
  difficulty: 'advanced', duration: '70 min',
  prerequisites: ['Module 03: Amazon EC2', 'Module 19: AWS CodeBuild'],
  objectives: ['Configure in-place and blue/green deployment strategies', 'Write AppSpec files for EC2 and ECS', 'Implement lifecycle hooks for custom deployment logic', 'Configure automatic rollback on failure', 'Integrate CodeDeploy with CodePipeline', 'Troubleshoot failed deployments'],
  sections: [
    { id: 'why', type: 'why', title: 'Why CodeDeploy?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#128640;</span><div class="alert-content"><div class="alert-title">Deploy Without Downtime, Rollback Instantly</div><div class="alert-text">CodeDeploy automates code deployments to EC2, Lambda, and ECS. Blue/green deployments provide zero-downtime releases with instant rollback. No manual SSH deployments.</div></div></div>
      <h4>Deployment Strategies</h4>
      <table><thead><tr><th>Strategy</th><th>How</th><th>Downtime</th><th>Rollback</th><th>Cost</th></tr></thead><tbody>
        <tr><td><strong>In-Place</strong></td><td>Update instances one-by-one</td><td>Brief (per instance)</td><td>Re-deploy previous</td><td>No extra infra</td></tr>
        <tr><td><strong>Blue/Green (EC2)</strong></td><td>New fleet, switch traffic</td><td>Zero</td><td>Switch back instantly</td><td>2x during deploy</td></tr>
        <tr><td><strong>Blue/Green (ECS)</strong></td><td>New task set, shift traffic</td><td>Zero</td><td>Route back to old tasks</td><td>2x during deploy</td></tr>
        <tr><td><strong>Canary (Lambda)</strong></td><td>10% traffic &rarr; wait &rarr; 100%</td><td>Zero</td><td>Shift back to old version</td><td>Minimal</td></tr>
      </tbody></table>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Blue/Green Architecture', content: { title: 'Blue/Green: Zero-Downtime Deployment', width: 700, height: 260,
      nodes: [
        { id: 'alb', label: 'ALB', icon: '&#9889;', x: 10, y: 110, type: 'network', description: 'ALB routes traffic. During deployment, traffic shifts from blue to green.' },
        { id: 'blue', label: 'Blue (Current)', icon: '&#128309;', x: 220, y: 50, type: 'compute', description: 'Current production instances running v1. Continue serving until green is verified.' },
        { id: 'green', label: 'Green (New)', icon: '&#128994;', x: 220, y: 190, type: 'compute', description: 'New instances running v2. CodeDeploy provisions, deploys, and health-checks.' },
        { id: 'cd', label: 'CodeDeploy', icon: '&#128640;', x: 430, y: 110, type: 'security', description: 'Orchestrates: provision green > deploy > health check > shift traffic > terminate blue.' },
        { id: 'appspec', label: 'AppSpec', icon: '&#128196;', x: 600, y: 110, type: 'storage', description: 'YAML file defining: files to copy, lifecycle hooks (BeforeInstall, AfterInstall, ValidateService).' }
      ],
      edges: [
        { from: 'alb', to: 'blue', label: '100% traffic' },
        { from: 'alb', to: 'green', label: '0% (then shift)', animated: true },
        { from: 'cd', to: 'green', label: 'Deploy v2' },
        { from: 'appspec', to: 'cd', label: 'Instructions' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. AppSpec File</h4>
      <p>YAML file that tells CodeDeploy what to do during each lifecycle event.</p>
      <pre><code>version: 0.0
os: linux
files:
  - source: /
    destination: /var/www/html
hooks:
  BeforeInstall:
    - location: scripts/stop_server.sh
      timeout: 60
  AfterInstall:
    - location: scripts/start_server.sh
      timeout: 60
  ValidateService:
    - location: scripts/health_check.sh
      timeout: 120</code></pre>
      <h4>2. Lifecycle Events (EC2/On-Premises)</h4>
      <table><thead><tr><th>Event</th><th>Phase</th><th>Use Case</th></tr></thead><tbody>
        <tr><td><strong>BeforeInstall</strong></td><td>Before files are copied</td><td>Stop server, backup config</td></tr>
        <tr><td><strong>AfterInstall</strong></td><td>After files are copied</td><td>Install dependencies, set permissions</td></tr>
        <tr><td><strong>ApplicationStart</strong></td><td>Start application</td><td>Start web server</td></tr>
        <tr><td><strong>ValidateService</strong></td><td>Verify deployment</td><td>Health check, smoke test</td></tr>
      </tbody></table>
      <h4>3. Rollback</h4>
      <ul>
        <li><strong>Automatic</strong> &mdash; Rollback if deployment fails or CloudWatch alarm triggers</li>
        <li><strong>Manual</strong> &mdash; Stop deployment and roll back via console/CLI</li>
        <li><strong>Blue/Green</strong> &mdash; Instant rollback by routing traffic back to blue</li>
      </ul>
      <h4>4. CodeDeploy Agent</h4>
      <p>Required on EC2 instances. Agent polls CodeDeploy for deployment instructions. Install via SSM or user data.</p>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'CodeDeploy Boto3', content: { title: 'Deployment Management', languages: [
      { id: 'python-cd', label: 'Core Operations',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\ncd = boto3.client('codedeploy')\n\ndef get_deployment_status(deployment_id):\n    """Get detailed deployment status."""\n    response = cd.get_deployment(deploymentId=deployment_id)\n    info = response['deploymentInfo']\n    overview = info.get('deploymentOverview', {})\n    return {\n        'status': info['status'],\n        'succeeded': overview.get('Succeeded', 0),\n        'failed': overview.get('Failed', 0),\n        'in_progress': overview.get('InProgress', 0),\n        'strategy': info.get('deploymentStyle', {}).get('deploymentType', 'IN_PLACE')\n    }\n\ndef rollback_deployment(deployment_id):\n    """Stop and roll back a deployment."""\n    cd.stop_deployment(deploymentId=deployment_id, autoRollbackEnabled=True)\n    logger.warning("Deployment %s stopped and rolling back", deployment_id)`,
        explanations: [
          { line: '8-18', text: 'deploymentOverview shows how many instances succeeded, failed, or are in progress.' },
          { line: '20-23', text: 'stop_deployment with autoRollbackEnabled triggers automatic rollback to previous version.' }
        ] }
    ], defaultLang: 'python-cd', expectedOutput: 'Deployment d-ABC123: Succeeded=3, Failed=0' } },
    { id: 'cli-commands', type: 'command', title: 'CodeDeploy CLI', content: [
      { command: 'aws deploy create-deployment --application-name prod-app --deployment-group-name prod-dg --s3-location bucket=prod-artifacts,key=app.zip,bundleType=zip', category: 'aws-cli', expectedOutput: '{\n  "deploymentId": "d-ABC123DEF"\n}', explanation: 'Create a deployment from an S3 artifact. The deployment group defines the target instances and strategy.' },
      { command: 'aws deploy get-deployment --deployment-id d-ABC123DEF', category: 'aws-cli', expectedOutput: '{\n  "deploymentInfo": {\n    "status": "Succeeded",\n    "deploymentOverview": {"Succeeded": 3, "Failed": 0, "InProgress": 0}\n  }\n}', explanation: 'Check deployment status. Statuses: Created, Queued, InProgress, Succeeded, Failed, Stopped.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'CodeDeploy CLI Lab', mode: 'simulated',
      initialText: 'CodeDeploy Lab. Try:\n  aws deploy list-applications\n  aws deploy list-deployments --application-name prod-app',
      commands: {
        'aws deploy list-applications': { text: '{\n  "applications": ["prod-app", "staging-app"]\n}', type: 'output' },
        'aws deploy list-deployments --application-name prod-app': { text: '{\n  "deployments": ["d-ABC123", "d-DEF456", "d-GHI789"]\n}', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Blue/Green Deployment', content: {
      title: 'Deploy Application with Blue/Green Strategy',
      description: 'Create a CodeDeploy application, write AppSpec, deploy with blue/green strategy, and test rollback.',
      difficulty: 'advanced', duration: '35 min',
      objectives: ['Create application and deployment group', 'Write AppSpec with lifecycle hooks', 'Execute blue/green deployment', 'Test rollback'],
      steps: [
        { title: 'Create AppSpec', instructions: 'Create appspec.yml in your application root with file mappings and lifecycle hooks.', validation: 'appspec.yml created with hooks' },
        { title: 'Create Application', instructions: 'CodeDeploy > Applications > Create.\nPlatform: EC2/On-Premises.', validation: 'Application created' },
        { title: 'Create Blue/Green Deployment Group', instructions: 'Deployment group with Blue/Green type.\nALB target group.\nTraffic rerouting: immediately.\nTerminate blue: 1 hour.', validation: 'Deployment group created' },
        { title: 'Deploy and Monitor', instructions: 'Create deployment > Watch blue/green transition.\nMonitor lifecycle events.', validation: 'Traffic shifted to green, blue waiting for termination' },
        { title: 'Test Rollback', instructions: 'Stop deployment > Roll back.\nTraffic returns to blue instances.', validation: 'Rollback successful, original version serving traffic' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Deployment failed: Script timeout', error: 'LifecycleEvent AfterInstall failed with timeout', cause: 'Script in lifecycle hook took longer than the specified timeout.', fix: 'Increase timeout in appspec.yml. Check script for blocking operations. Add logging to identify where it hangs.' },
      { title: 'CodeDeploy agent not running', error: 'Instance not responding to deployment', cause: 'CodeDeploy agent not installed or not running on the EC2 instance.', fix: 'Install agent: sudo yum install codedeploy-agent. Start: sudo service codedeploy-agent start. Check IAM role has CodeDeploy permissions.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'CodeDeploy Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'Blue/Green vs In-Place deployment?', options: [
        { id: 'a', text: 'Blue/Green: zero downtime + instant rollback. In-Place: updates existing instances, brief downtime' },
        { id: 'b', text: 'They are the same' },
        { id: 'c', text: 'In-Place is always better' },
        { id: 'd', text: 'Blue/Green only works with Lambda' }
      ], correctId: 'a', explanation: 'Blue/Green provisions new instances, deploys, then shifts traffic. Zero downtime. Instant rollback by shifting back. In-Place updates instances one by one with brief per-instance downtime.', difficulty: 'intermediate' },
      { id: 'q2', question: 'What file tells CodeDeploy how to deploy?', options: [
        { id: 'a', text: 'buildspec.yml' }, { id: 'b', text: 'appspec.yml' }, { id: 'c', text: 'deploy.json' }, { id: 'd', text: 'Dockerfile' }
      ], correctId: 'b', explanation: 'appspec.yml (or appspec.json) defines file mappings and lifecycle hooks. buildspec.yml is for CodeBuild.', difficulty: 'beginner' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Deployment Monitor', content: { title: 'Deployment Status Dashboard', description: 'Build a function that monitors all active deployments and flags any failures.', difficulty: 'intermediate',
      starterCode: `import boto3\n\ndef monitor_deployments(app_name):\n    """List recent deployments and their status.\n    Return: [{'id': str, 'status': str, 'succeeded': int, 'failed': int}]\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\n\ndef monitor_deployments(app_name):\n    cd = boto3.client('codedeploy')\n    deploys = cd.list_deployments(applicationName=app_name)['deployments'][:10]\n    results = []\n    for d_id in deploys:\n        info = cd.get_deployment(deploymentId=d_id)['deploymentInfo']\n        ov = info.get('deploymentOverview', {})\n        results.append({'id': d_id, 'status': info['status'], 'succeeded': ov.get('Succeeded', 0), 'failed': ov.get('Failed', 0)})\n    return results`,
      testCases: [{ description: 'Returns deployment list', expectedBehavior: 'Each entry has id, status, succeeded, failed counts' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<ol><li>Delete deployment group</li><li>Delete application</li><li>Terminate green instances if still running</li></ol><pre><code>aws deploy delete-deployment-group --application-name prod-app --deployment-group-name prod-dg\naws deploy delete-application --application-name prod-app</code></pre>` } },
    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'AWS CodeDeploy', nextModule: { title: 'Amazon GuardDuty', href: 'module-43.html' }, message: 'Next: threat detection and security monitoring.' } }
  ]
};
