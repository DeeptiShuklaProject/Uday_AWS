/**
 * MODULE 41 — AWS X-Ray — Distributed Tracing
 */
const MODULE_41_DATA = {
  id: 'xray-fundamentals', moduleId: 'module-41',
  title: 'AWS X-Ray — Distributed Tracing',
  description: 'Master observability. Covers X-Ray segments, subsegments, traces, service maps, sampling rules, annotations, metadata, and integration with Lambda, API Gateway, and ECS.',
  difficulty: 'intermediate', duration: '60 min',
  prerequisites: ['Module 08: AWS Lambda', 'Module 05: Amazon CloudWatch'],
  objectives: ['Enable X-Ray tracing on Lambda and API Gateway', 'Read and interpret service maps and trace details', 'Configure sampling rules for production', 'Add custom annotations and metadata', 'Debug latency issues using trace analysis', 'Integrate X-Ray with ECS and EC2 applications'],
  sections: [
    { id: 'why', type: 'why', title: 'Why X-Ray?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#128269;</span><div class="alert-content"><div class="alert-title">See Inside Your Distributed Application</div><div class="alert-text">When a request travels through API Gateway &rarr; Lambda &rarr; DynamoDB &rarr; SNS, which service is slow? X-Ray traces the entire request path, showing latency per service. Essential for microservices debugging.</div></div></div>
      <h4>X-Ray Core Components</h4>
      <table><thead><tr><th>Component</th><th>What It Is</th><th>Analogy</th></tr></thead><tbody>
        <tr><td><strong>Trace</strong></td><td>End-to-end request journey</td><td>A delivery tracking number</td></tr>
        <tr><td><strong>Segment</strong></td><td>Work done by one service</td><td>One stop in the delivery</td></tr>
        <tr><td><strong>Subsegment</strong></td><td>Downstream calls from a service</td><td>Sub-tasks at one stop</td></tr>
        <tr><td><strong>Service Map</strong></td><td>Visual graph of all services</td><td>Delivery route map</td></tr>
        <tr><td><strong>Annotations</strong></td><td>Indexed key-value pairs (searchable)</td><td>Labels on the package</td></tr>
      </tbody></table>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'X-Ray Architecture', content: { title: 'Trace: API Gateway &rarr; Lambda &rarr; DynamoDB', width: 750, height: 240,
      nodes: [
        { id: 'client', label: 'Client', icon: '&#128100;', x: 10, y: 100, type: 'client', description: 'Client request. X-Ray injects a trace ID header.' },
        { id: 'apigw', label: 'API Gateway', icon: '&#127760;', x: 160, y: 100, type: 'network', description: 'Segment: API Gateway processing time, integration latency.' },
        { id: 'lambda', label: 'Lambda', icon: '&#9889;', x: 330, y: 100, type: 'compute', description: 'Segment: initialization (cold start), invocation, overhead. Subsegments for SDK calls.' },
        { id: 'ddb', label: 'DynamoDB', icon: '&#128451;', x: 500, y: 50, type: 'storage', description: 'Subsegment: DynamoDB call latency, consumed capacity.' },
        { id: 'sns', label: 'SNS', icon: '&#128276;', x: 500, y: 170, type: 'network', description: 'Subsegment: SNS publish latency.' },
        { id: 'xray', label: 'X-Ray Service', icon: '&#128269;', x: 670, y: 100, type: 'monitoring', description: 'Collects all segments, assembles traces, builds service map.' }
      ],
      edges: [
        { from: 'client', to: 'apigw', label: 'HTTP', animated: true },
        { from: 'apigw', to: 'lambda', label: 'Invoke', animated: true },
        { from: 'lambda', to: 'ddb', label: 'Query' },
        { from: 'lambda', to: 'sns', label: 'Publish' },
        { from: 'apigw', to: 'xray', label: 'Segment' },
        { from: 'lambda', to: 'xray', label: 'Segment' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Sampling Rules</h4>
      <p>X-Ray does NOT trace every request (that would be too expensive). Default sampling: 1 request/second + 5% of additional requests.</p>
      <table><thead><tr><th>Parameter</th><th>Default</th><th>Purpose</th></tr></thead><tbody>
        <tr><td><strong>Reservoir</strong></td><td>1/second</td><td>Fixed rate of traced requests</td></tr>
        <tr><td><strong>Rate</strong></td><td>0.05 (5%)</td><td>Percentage of additional requests</td></tr>
      </tbody></table>
      <h4>2. Annotations vs Metadata</h4>
      <table><thead><tr><th>Feature</th><th>Annotations</th><th>Metadata</th></tr></thead><tbody>
        <tr><td><strong>Searchable</strong></td><td>Yes (indexed)</td><td>No</td></tr>
        <tr><td><strong>Use for</strong></td><td>Filtering traces (user_id, order_id)</td><td>Debug data (request body, config)</td></tr>
        <tr><td><strong>Limit</strong></td><td>50 per trace</td><td>No practical limit</td></tr>
      </tbody></table>
      <h4>3. Cold Start Detection</h4>
      <p>X-Ray shows Lambda cold starts as the "Initialization" subsegment. If initialization is 2+ seconds, it indicates a cold start. Warm invocations skip this segment.</p>
      <h4>4. Integration Methods</h4>
      <ul>
        <li><strong>Lambda</strong> &mdash; Enable "Active tracing" in configuration. Automatic.</li>
        <li><strong>API Gateway</strong> &mdash; Enable X-Ray in stage settings.</li>
        <li><strong>ECS</strong> &mdash; Run X-Ray daemon as sidecar container.</li>
        <li><strong>EC2</strong> &mdash; Install X-Ray daemon + instrument SDK.</li>
      </ul>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'X-Ray SDK', content: { title: 'Instrumenting Python with X-Ray', languages: [
      { id: 'python-xray', label: 'X-Ray Integration',
        code: `from aws_xray_sdk.core import xray_recorder\nfrom aws_xray_sdk.core import patch_all\nimport boto3\nimport json\n\n# Patch all supported libraries (boto3, requests, etc.)\npatch_all()\n\ndef lambda_handler(event, context):\n    # Add searchable annotation\n    xray_recorder.put_annotation('user_id', event.get('user_id', 'anonymous'))\n    xray_recorder.put_annotation('operation', 'get_order')\n    \n    # Add non-searchable metadata\n    xray_recorder.put_metadata('request', event)\n    \n    # Custom subsegment for business logic\n    with xray_recorder.in_subsegment('process_order') as subseg:\n        subseg.put_annotation('order_id', 'ORD-001')\n        # DynamoDB call — automatically traced by patch_all()\n        dynamodb = boto3.resource('dynamodb')\n        table = dynamodb.Table('orders')\n        result = table.get_item(Key={'id': event.get('order_id')})\n    \n    return {'statusCode': 200, 'body': json.dumps(result.get('Item', {}))}`,
        explanations: [
          { line: '6', text: 'patch_all() instruments boto3, requests, httplib, etc. All downstream calls appear as subsegments automatically.' },
          { line: '10-11', text: 'Annotations are indexed — you can search traces by user_id or operation in the X-Ray console.' },
          { line: '17-22', text: 'Custom subsegments let you measure specific business logic blocks, not just SDK calls.' }
        ] }
    ], defaultLang: 'python-xray', expectedOutput: 'Trace visible in X-Ray console with all subsegments' } },
    { id: 'cli-commands', type: 'command', title: 'X-Ray CLI', content: [
      { command: 'aws xray get-service-graph --start-time $(date -d "1 hour ago" +%s) --end-time $(date +%s)', category: 'aws-cli', expectedOutput: '{\n  "Services": [\n    {"Name": "prod-api", "Type": "AWS::ApiGateway::Stage", "Edges": [{"ReferenceId": 1}]},\n    {"Name": "prod-process-order", "Type": "AWS::Lambda::Function"}\n  ]\n}', explanation: 'Get the service graph showing all traced services and their connections in the last hour.' },
      { command: 'aws xray get-trace-summaries --start-time $(date -d "1 hour ago" +%s) --end-time $(date +%s) --filter-expression "annotation.user_id = \\"U123\\""', category: 'aws-cli', expectedOutput: '{\n  "TraceSummaries": [{"Id": "1-abc-def", "Duration": 0.234, "HasError": false}]\n}', explanation: 'Search traces by annotation. Only annotations (not metadata) are searchable.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'X-Ray CLI Lab', mode: 'simulated',
      initialText: 'X-Ray Lab. Try:\n  aws xray get-service-graph --start-time 1700000000 --end-time 1700003600',
      commands: {
        'aws xray get-service-graph --start-time 1700000000 --end-time 1700003600': { text: '{\n  "Services": [\n    {"Name": "prod-api", "Type": "AWS::ApiGateway::Stage", "ResponseTimeHistogram": [{"Value": 0.05, "Count": 1000}]},\n    {"Name": "prod-process-order", "Type": "AWS::Lambda::Function", "ResponseTimeHistogram": [{"Value": 0.12, "Count": 800}]},\n    {"Name": "orders", "Type": "AWS::DynamoDB::Table", "ResponseTimeHistogram": [{"Value": 0.005, "Count": 800}]}\n  ]\n}', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Trace a Serverless API', content: {
      title: 'Enable X-Ray on API Gateway + Lambda and Debug Latency',
      description: 'Enable distributed tracing on your serverless API, generate traffic, identify latency bottlenecks in the service map, and trace individual requests.',
      difficulty: 'intermediate', duration: '30 min',
      objectives: ['Enable X-Ray on API Gateway', 'Enable active tracing on Lambda', 'View service map', 'Trace individual requests'],
      steps: [
        { title: 'Enable X-Ray on API Gateway', instructions: 'API Gateway > Stages > prod > Logs/Tracing.\n\nEnable X-Ray Tracing checkbox.\nSave Changes.', validation: 'X-Ray tracing enabled on stage' },
        { title: 'Enable X-Ray on Lambda', instructions: 'Lambda > Configuration > Monitoring.\n\nEnable Active tracing.', validation: 'Active tracing shows enabled' },
        { title: 'Generate Traffic', instructions: 'Send 20+ requests:\n\nfor i in {1..20}; do\n  curl -s https://api-id.execute-api.region.amazonaws.com/prod/items\ndone', validation: 'Requests completed' },
        { title: 'Analyze Service Map', instructions: 'X-Ray Console > Service map.\n\nView the end-to-end flow.\nClick each node to see latency distribution.', validation: 'Service map shows API GW > Lambda > DynamoDB with latency per hop' },
        { title: 'Investigate a Trace', instructions: 'Click a trace in the trace list.\n\nView segments and subsegments.\nIdentify the slowest segment.', validation: 'Individual trace shows timing for each service' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'No traces appearing', error: 'X-Ray console shows no data', cause: 'X-Ray not enabled on the service, or IAM role missing xray:PutTraceSegments permission.', fix: 'Verify X-Ray is enabled on both API Gateway stage and Lambda function. Check Lambda execution role has AWSXRayDaemonWriteAccess managed policy.' },
      { title: 'Missing subsegments for SDK calls', error: 'Only Lambda segment visible, no DynamoDB subsegments', cause: 'X-Ray SDK not imported or patch_all() not called.', fix: 'Add aws-xray-sdk to Lambda layer or deployment package. Call patch_all() at module level (outside handler).' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'X-Ray Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'What is the difference between X-Ray annotations and metadata?', options: [
        { id: 'a', text: 'Annotations are searchable/indexed; metadata is not' },
        { id: 'b', text: 'Metadata is searchable; annotations are not' },
        { id: 'c', text: 'They are the same thing' },
        { id: 'd', text: 'Annotations are for errors only' }
      ], correctId: 'a', explanation: 'Annotations are indexed key-value pairs — you can filter traces by annotation values. Metadata is not indexed — use it for debug data you want to see but not search.', difficulty: 'intermediate' },
      { id: 'q2', question: 'What does patch_all() do in the X-Ray SDK?', options: [
        { id: 'a', text: 'Patches security vulnerabilities' },
        { id: 'b', text: 'Instruments all supported libraries to create subsegments automatically' },
        { id: 'c', text: 'Enables sampling' },
        { id: 'd', text: 'Connects to X-Ray daemon' }
      ], correctId: 'b', explanation: 'patch_all() monkey-patches supported libraries (boto3, requests, httplib, mysql, etc.) so that every call they make is automatically recorded as a subsegment in the trace.', difficulty: 'intermediate' },
      { id: 'q3', question: 'Default X-Ray sampling rate?', options: [
        { id: 'a', text: '100% of requests' },
        { id: 'b', text: '1 request/second + 5% of additional' },
        { id: 'c', text: '10% of all requests' },
        { id: 'd', text: '1 request/minute' }
      ], correctId: 'b', explanation: 'Default: reservoir of 1 request per second, then 5% of additional requests. This balances visibility with cost. Custom sampling rules can adjust this.', difficulty: 'beginner' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Latency Analyzer', content: { title: 'X-Ray Latency Report', description: 'Build a function that identifies the slowest service in the X-Ray service graph.', difficulty: 'advanced',
      starterCode: `import boto3\nimport time\n\ndef find_bottleneck(hours_back=1):\n    """Find the slowest service in X-Ray traces.\n    Return: {'service': name, 'avg_latency_ms': float}\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\nimport time\n\ndef find_bottleneck(hours_back=1):\n    xray = boto3.client('xray')\n    now = time.time()\n    start = now - (hours_back * 3600)\n    graph = xray.get_service_graph(StartTime=start, EndTime=now)\n    slowest = {'service': None, 'avg_latency_ms': 0}\n    for svc in graph['Services']:\n        if svc.get('ResponseTimeHistogram'):\n            avg = sum(h['Value'] * h['Count'] for h in svc['ResponseTimeHistogram']) / max(sum(h['Count'] for h in svc['ResponseTimeHistogram']), 1)\n            if avg > slowest['avg_latency_ms']:\n                slowest = {'service': svc['Name'], 'avg_latency_ms': round(avg * 1000, 2)}\n    return slowest`,
      testCases: [{ description: 'Returns the slowest service', expectedBehavior: 'Output has service name and avg_latency_ms' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<ol><li>Disable X-Ray on API Gateway stage</li><li>Disable active tracing on Lambda</li><li>X-Ray data auto-expires after 30 days</li></ol>` } },
    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'AWS X-Ray', nextModule: { title: 'AWS CodeDeploy', href: 'module-42.html' }, message: 'Next: automated deployment strategies with CodeDeploy.' } }
  ]
};
