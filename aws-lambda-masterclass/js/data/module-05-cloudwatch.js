/**
 * ============================================================
 * MODULE 05 — Amazon CloudWatch
 * Monitoring, metrics, alarms, logs, dashboards
 * ============================================================
 */
const MODULE_05_DATA = {
  id: 'cloudwatch-fundamentals',
  moduleId: 'module-05',
  title: 'Amazon CloudWatch — Monitoring & Observability',
  description: 'Master AWS observability. Covers metrics, custom metrics, alarms, Log Groups/Streams, Metric Filters, Logs Insights queries, dashboards, and anomaly detection.',
  difficulty: 'intermediate',
  duration: '80 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 03: Amazon EC2'],
  objectives: [
    'Navigate CloudWatch metrics and understand namespaces, dimensions, and statistics',
    'Create CloudWatch Alarms with SNS notifications for production alerting',
    'Publish custom metrics from Lambda and EC2 applications',
    'Query CloudWatch Logs Insights for operational debugging',
    'Build operational dashboards with widgets for key metrics',
    'Use Metric Filters to extract metrics from log patterns',
    'Implement composite alarms for complex alerting logic'
  ],

  sections: [
    {
      id: 'why-cloudwatch',
      type: 'why',
      title: 'Why CloudWatch?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">📊</span>
            <div class="alert-content">
              <div class="alert-title">You Can't Fix What You Can't See</div>
              <div class="alert-text">CloudWatch is the central nervous system of AWS. Every service emits metrics and logs to CloudWatch automatically. Without monitoring, you're flying blind — outages, performance degradation, and cost overruns go undetected until customers complain.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Component</th><th>Purpose</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td><strong>Metrics</strong></td><td>Time-series numerical data</td><td>CPUUtilization, Invocations, 4XXError</td></tr>
              <tr><td><strong>Alarms</strong></td><td>Watch metrics and trigger actions</td><td>CPU > 80% for 5 min → notify SNS</td></tr>
              <tr><td><strong>Logs</strong></td><td>Centralized log collection</td><td>Lambda execution logs, VPC Flow Logs</td></tr>
              <tr><td><strong>Logs Insights</strong></td><td>SQL-like log queries</td><td>Find all ERROR logs in last 1 hour</td></tr>
              <tr><td><strong>Dashboards</strong></td><td>Visual operational displays</td><td>Real-time application health view</td></tr>
              <tr><td><strong>Events/EventBridge</strong></td><td>React to state changes</td><td>EC2 instance stopped → notify team</td></tr>
            </tbody>
          </table>
          <div class="alert alert-tip">
            <span class="alert-icon">💡</span>
            <div class="alert-content">
              <div class="alert-title">Free Tier: 10 Custom Metrics, 5 GB Log Data, 3 Dashboards</div>
              <div class="alert-text">CloudWatch free tier is generous for small workloads. But custom metrics ($0.30/metric/month) and Log data ingestion ($0.50/GB) add up quickly at scale. Use Embedded Metric Format (EMF) for cost-efficient custom metrics.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'CloudWatch Architecture',
      content: {
        title: 'CloudWatch Observability Pipeline',
        width: 750,
        height: 260,
        nodes: [
          { id: 'lambda', label: 'Lambda', icon: '⚡', x: 10, y: 60, type: 'compute', description: 'Lambda auto-publishes: Invocations, Duration, Errors, Throttles, ConcurrentExecutions. Logs go to /aws/lambda/<fn-name>.' },
          { id: 'ec2', label: 'EC2', icon: '🖥️', x: 10, y: 170, type: 'compute', description: 'EC2 auto-publishes: CPUUtilization, NetworkIn/Out, DiskReadOps. Install CloudWatch Agent for memory, disk, custom metrics.' },
          { id: 'metrics', label: 'CloudWatch Metrics', icon: '📊', x: 220, y: 60, type: 'event', description: 'Time-series data organized by Namespace (AWS/Lambda), MetricName, Dimensions (FunctionName). Stored for 15 months at decreasing resolution.' },
          { id: 'logs', label: 'CloudWatch Logs', icon: '📝', x: 220, y: 170, type: 'storage', description: 'Log Groups → Log Streams. Retention: configurable (1 day to 10 years or never expire). Query with Logs Insights.' },
          { id: 'alarm', label: 'Alarm', icon: '🚨', x: 420, y: 60, type: 'security', description: 'Monitors a metric against a threshold. States: OK, ALARM, INSUFFICIENT_DATA. Actions: SNS, Auto Scaling, EC2 action.' },
          { id: 'dashboard', label: 'Dashboard', icon: '📈', x: 420, y: 170, type: 'trigger', description: 'Custom dashboards with metric widgets, log widgets, and text widgets. Auto-refresh. Shareable.' },
          { id: 'sns', label: 'SNS → PagerDuty', icon: '📱', x: 600, y: 60, type: 'event', description: 'Alarm triggers SNS topic which fans out to email, SMS, PagerDuty, Slack, or Lambda.' },
          { id: 'insights', label: 'Logs Insights', icon: '🔍', x: 600, y: 170, type: 'trigger', description: 'SQL-like query language for log analysis. Fast — scans TB of logs in seconds.' }
        ],
        edges: [
          { from: 'lambda', to: 'metrics', label: 'Auto-publish', animated: true },
          { from: 'lambda', to: 'logs', label: 'stdout/stderr', animated: true },
          { from: 'ec2', to: 'metrics', label: 'Auto-publish', animated: true },
          { from: 'ec2', to: 'logs', label: 'CW Agent', animated: true },
          { from: 'metrics', to: 'alarm', label: 'Threshold', animated: true },
          { from: 'metrics', to: 'dashboard', label: 'Widget' },
          { from: 'alarm', to: 'sns', label: 'Notify', animated: true },
          { from: 'logs', to: 'insights', label: 'Query' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Metric Anatomy</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">Namespace:  AWS/Lambda
MetricName: Duration
Dimensions: FunctionName=MyFunc, Resource=MyFunc:$LATEST
Statistics: Average, Sum, Min, Max, p99
Period:     60 seconds (1-minute resolution)</pre>

          <h4>2. Alarm Configuration</h4>
          <ul>
            <li><strong>Threshold</strong>: Static value or anomaly detection band</li>
            <li><strong>Evaluation Periods</strong>: "3 out of 5 data points breaching" = reduces noise</li>
            <li><strong>Actions</strong>: SNS topic, Auto Scaling policy, EC2 stop/terminate</li>
            <li><strong>Composite Alarm</strong>: AND/OR logic across multiple alarms (e.g., CPU high AND memory high)</li>
          </ul>

          <h4>3. Logs Insights Query Language</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);"># Find coldest Lambda cold starts
fields @timestamp, @duration, @billedDuration
| filter @type = "REPORT"
| filter @initDuration > 0
| sort @initDuration desc
| limit 20

# Count errors per function in last 1 hour
fields @message
| filter @message like /ERROR/
| stats count(*) as errorCount by @logStream
| sort errorCount desc</pre>

          <h4>4. Custom Metrics</h4>
          <p>Two methods:</p>
          <ul>
            <li><strong>PutMetricData API</strong>: Explicitly publish metrics. $0.30/metric/month.</li>
            <li><strong>Embedded Metric Format (EMF)</strong>: Print structured JSON to stdout. CloudWatch extracts metrics automatically. Same cost but easier in Lambda.</li>
          </ul>

          <h4>5. Metric Resolution</h4>
          <table>
            <thead><tr><th>Resolution</th><th>Retention</th></tr></thead>
            <tbody>
              <tr><td>1-second (high-res)</td><td>3 hours</td></tr>
              <tr><td>60-second</td><td>15 days</td></tr>
              <tr><td>5-minute</td><td>63 days</td></tr>
              <tr><td>1-hour</td><td>455 days (15 months)</td></tr>
            </tbody>
          </table>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'CloudWatch Boto3 Operations',
      content: {
        title: 'Custom Metrics, Alarms & Log Queries',
        languages: [
          {
            id: 'python-cw',
            label: 'Custom Metrics & Alarms',
            code: `import boto3
import json
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cw = boto3.client('cloudwatch')

def publish_custom_metric(metric_name, value, unit, dimensions):
    """Publish a custom CloudWatch metric."""
    cw.put_metric_data(
        Namespace='MyApp/Orders',
        MetricData=[{
            'MetricName': metric_name,
            'Value': value,
            'Unit': unit,                # Count, Seconds, Bytes, etc.
            'Timestamp': datetime.utcnow(),
            'Dimensions': [
                {'Name': k, 'Value': v}
                for k, v in dimensions.items()
            ]
        }]
    )
    logger.info("Published metric: %s = %s %s", metric_name, value, unit)


def create_alarm(alarm_name, metric_name, threshold, sns_arn):
    """Create a CloudWatch alarm."""
    cw.put_metric_alarm(
        AlarmName=alarm_name,
        Namespace='MyApp/Orders',
        MetricName=metric_name,
        Statistic='Sum',
        Period=300,                       # 5 minutes
        EvaluationPeriods=3,             # Must breach 3 of 3 periods
        DatapointsToAlarm=3,
        Threshold=threshold,
        ComparisonOperator='GreaterThanThreshold',
        AlarmActions=[sns_arn],          # Notify on ALARM
        OKActions=[sns_arn],             # Notify on recovery
        TreatMissingData='notBreaching', # Missing data = OK (safe default)
        Tags=[{'Key': 'Team', 'Value': 'Platform'}]
    )
    logger.info("Created alarm: %s (threshold: %s)", alarm_name, threshold)


# EMF — Embedded Metric Format (print to stdout, CW extracts metrics)
def log_emf_metric(order_id, processing_time_ms, order_value):
    """
    Embedded Metric Format: print structured JSON → CloudWatch
    extracts metrics automatically. No PutMetricData API call needed.
    """
    emf = {
        "_aws": {
            "Timestamp": int(datetime.utcnow().timestamp() * 1000),
            "CloudWatchMetrics": [{
                "Namespace": "MyApp/Orders",
                "Dimensions": [["Environment", "Region"]],
                "Metrics": [
                    {"Name": "ProcessingTime", "Unit": "Milliseconds"},
                    {"Name": "OrderValue", "Unit": "None"}
                ]
            }]
        },
        "Environment": "production",
        "Region": "us-east-1",
        "ProcessingTime": processing_time_ms,
        "OrderValue": order_value,
        "orderId": order_id  # Non-metric field — just logged
    }
    print(json.dumps(emf))  # CloudWatch extracts metrics from stdout`,
            explanations: [
              { line: '13', text: 'put_metric_data publishes to a custom Namespace. Dimensions are key-value pairs that identify the metric source (e.g., Environment=prod).' },
              { line: '36', text: 'EvaluationPeriods=3 with DatapointsToAlarm=3 means ALL 3 periods must breach. Use "2 of 3" for critical alarms to reduce noise.' },
              { line: '43', text: 'TreatMissingData=notBreaching means "no data = OK." Use "breaching" if missing data itself indicates a problem.' },
              { line: '53-70', text: 'Embedded Metric Format: print JSON with _aws metadata to stdout. CloudWatch Logs automatically extracts metrics — no API calls, lower latency, same cost.' }
            ]
          }
        ],
        defaultLang: 'python-cw',
        expectedOutput: 'Published metric: OrderProcessingTime = 245 Milliseconds\nCreated alarm: HighOrderErrors (threshold: 10)'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'CloudWatch CLI Commands',
      content: [
        {
          command: 'aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Duration --dimensions Name=FunctionName,Value=MyFunction --start-time 2026-09-15T00:00:00Z --end-time 2026-09-16T00:00:00Z --period 3600 --statistics Average Maximum p99',
          category: 'aws-cli',
          expectedOutput: '{\n  "Datapoints": [\n    {"Timestamp": "2026-09-15T10:00:00Z", "Average": 245.3, "Maximum": 1523.0, "ExtendedStatistics": {"p99": 890.0}},\n    {"Timestamp": "2026-09-15T11:00:00Z", "Average": 198.7, "Maximum": 987.0, "ExtendedStatistics": {"p99": 650.0}}\n  ]\n}',
          explanation: 'Gets Lambda Duration metrics with 1-hour periods. Track Average for typical performance, p99 for tail latency, and Maximum for worst case. Use these to right-size Lambda memory.',
          interviewQ: 'Why is p99 latency more important than average latency for production monitoring?'
        },
        {
          command: 'aws logs start-query --log-group-name /aws/lambda/MyFunction --start-time 1726358400 --end-time 1726444800 --query-string "fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 25"',
          category: 'aws-cli',
          expectedOutput: '{\n  "queryId": "12345678-1234-1234-1234-123456789012"\n}',
          explanation: 'Starts an async Logs Insights query. Use get-query-results with the queryId to retrieve results. Start/end times are Unix epoch seconds. Logs Insights scans at ~$0.005/GB.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'CloudWatch CLI Lab',
        mode: 'simulated',
        initialText: 'CloudWatch CLI Lab. Try:\n  aws cloudwatch list-metrics --namespace AWS/Lambda --metric-name Errors\n  aws cloudwatch describe-alarms --state-value ALARM\n  aws logs describe-log-groups --log-group-name-prefix /aws/lambda/',
        commands: {
          'aws cloudwatch list-metrics --namespace AWS/Lambda --metric-name Errors': {
            text: '{\n  "Metrics": [\n    {"Namespace": "AWS/Lambda", "MetricName": "Errors", "Dimensions": [{"Name": "FunctionName", "Value": "OrderProcessor"}]},\n    {"Namespace": "AWS/Lambda", "MetricName": "Errors", "Dimensions": [{"Name": "FunctionName", "Value": "AuthHandler"}]}\n  ]\n}',
            type: 'output'
          },
          'aws cloudwatch describe-alarms --state-value ALARM': {
            text: '{\n  "MetricAlarms": [{\n    "AlarmName": "HighErrorRate-OrderProcessor",\n    "StateValue": "ALARM",\n    "MetricName": "Errors",\n    "Namespace": "AWS/Lambda",\n    "Threshold": 5.0,\n    "StateUpdatedTimestamp": "2026-09-15T14:30:00Z"\n  }]\n}',
            type: 'output'
          },
          'aws logs describe-log-groups --log-group-name-prefix /aws/lambda/': {
            text: '{\n  "logGroups": [\n    {"logGroupName": "/aws/lambda/OrderProcessor", "storedBytes": 15728640, "retentionInDays": 30},\n    {"logGroupName": "/aws/lambda/AuthHandler", "storedBytes": 5242880, "retentionInDays": 14}\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common CloudWatch Issues',
      content: {
        items: [
          { title: 'Lambda metrics not appearing', error: 'No metrics visible for a Lambda function in CloudWatch', cause: 'Lambda was never invoked (no data points to publish). Or you\'re looking in the wrong region. Metrics appear after the first invocation.', fix: 'Invoke the function at least once. Verify you\'re in the correct region. Metrics may take 1-2 minutes to appear after invocation.' },
          { title: 'Alarm stuck in INSUFFICIENT_DATA', error: 'Alarm shows INSUFFICIENT_DATA state indefinitely', cause: 'No metric data points match the specified dimensions, or the period is longer than the data retention for that resolution.', fix: 'Verify the metric exists (list-metrics). Check dimensions match exactly (case-sensitive). Set TreatMissingData=notBreaching if gaps are expected.' },
          { title: 'CloudWatch Logs costs too high', error: 'Log ingestion costs exceeding budget', cause: 'Log retention set to "Never Expire" (default). High-volume functions logging at DEBUG level. No log filtering.', fix: 'Set retention policies (30 days for dev, 90 days for prod). Lower Lambda log level to INFO/WARN. Use Log Subscription Filters to send specific patterns to cheaper storage (S3/Kinesis Firehose).' },
          { title: 'Custom metric not showing in console', error: 'put_metric_data succeeds but metric not visible', cause: 'Custom metrics take 2-5 minutes to appear. Or the Namespace spelling doesn\'t match what you\'re searching for (case-sensitive).', fix: 'Wait 5 minutes. Verify the exact Namespace string. Use list-metrics to confirm: aws cloudwatch list-metrics --namespace "MyApp/Orders"' }
        ]
      }
    },

    {
      id: 'quiz-cw',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon CloudWatch Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You set a CloudWatch Alarm with EvaluationPeriods=5, DatapointsToAlarm=3, Period=60. When does the alarm trigger?',
            options: [
              { id: 'a', text: 'When the threshold is breached for 5 consecutive minutes' },
              { id: 'b', text: 'When 3 out of 5 consecutive 1-minute data points breach the threshold' },
              { id: 'c', text: 'When the metric breaches for 3 seconds' },
              { id: 'd', text: 'When the average of 5 periods exceeds the threshold' }
            ],
            correctId: 'b',
            explanation: '3 out of 5 means: within any 5 consecutive 1-minute evaluation periods, if 3 or more data points breach the threshold, the alarm transitions to ALARM state. This "M out of N" pattern reduces false positives from momentary spikes.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'EC2 reports CPUUtilization automatically. But you need memory utilization. How do you get it?',
            options: [
              { id: 'a', text: 'Enable detailed monitoring — it includes memory metrics' },
              { id: 'b', text: 'Install the CloudWatch Agent on the instance to collect and publish memory metrics' },
              { id: 'c', text: 'Memory utilization is not available in AWS' },
              { id: 'd', text: 'Use EC2 Systems Manager to automatically publish memory metrics' }
            ],
            correctId: 'b',
            explanation: 'EC2 hypervisor can only see CPU, network, and disk I/O from outside the instance. Memory and disk space require an agent INSIDE the OS. Install the CloudWatch Agent (unified agent) to collect memory, disk, and custom app metrics.',
            difficulty: 'beginner'
          },
          {
            id: 'q3',
            question: 'What is the advantage of Embedded Metric Format (EMF) over PutMetricData for Lambda custom metrics?',
            options: [
              { id: 'a', text: 'EMF is cheaper — no per-metric cost' },
              { id: 'b', text: 'EMF avoids an API call (prints to stdout) so it has lower latency and doesn\'t increase Lambda duration' },
              { id: 'c', text: 'EMF supports more metric types than PutMetricData' },
              { id: 'd', text: 'EMF bypasses IAM permissions' }
            ],
            correctId: 'b',
            explanation: 'EMF writes structured JSON to stdout. CloudWatch Logs agent extracts metrics asynchronously. No additional API call during Lambda execution = lower latency and no added duration. PutMetricData is an API call that adds ~50-100ms to execution time. Cost is the same for both.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    {
      id: 'challenge-cw',
      type: 'challenge',
      title: 'Challenge: Production Alarm Builder',
      content: {
        title: 'Build a Production Monitoring Alarm',
        description: 'Write a function that creates a CloudWatch alarm for Lambda error rate monitoring. The alarm should trigger when errors exceed a threshold and notify an SNS topic.',
        difficulty: 'intermediate',
        requirements: [
          'Create an alarm for AWS/Lambda Errors metric',
          'Use FunctionName dimension for a specific Lambda function',
          'Set threshold, period (5 min), and evaluation periods (3 of 3)',
          'Configure both AlarmActions and OKActions with an SNS topic ARN',
          'Set TreatMissingData to "notBreaching"',
          'Log the alarm creation with its name and threshold'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cw = boto3.client('cloudwatch')

def create_lambda_error_alarm(function_name, threshold, sns_topic_arn):
    """Create a CloudWatch alarm for Lambda function errors."""

    # TODO: Define alarm name
    # TODO: Call put_metric_alarm with correct parameters
    # TODO: Log success

    pass`,
        language: 'python',
        hints: [
          'alarm_name = f"Lambda-Errors-{function_name}"',
          'Namespace="AWS/Lambda", MetricName="Errors"',
          'Dimensions=[{"Name": "FunctionName", "Value": function_name}]',
          'Statistic="Sum", Period=300, EvaluationPeriods=3',
          'ComparisonOperator="GreaterThanThreshold"'
        ],
        testCases: [
          { description: 'Calls put_metric_alarm', keywords: ['put_metric_alarm'], expectedOutput: 'put_metric_alarm' },
          { description: 'Uses AWS/Lambda namespace', keywords: ['AWS/Lambda'], expectedOutput: 'AWS/Lambda' },
          { description: 'Sets Errors metric', keywords: ['Errors'], expectedOutput: 'Errors' },
          { description: 'Configures SNS alarm actions', keywords: ['AlarmActions'], expectedOutput: 'AlarmActions' },
          { description: 'Sets TreatMissingData', keywords: ['notBreaching'], expectedOutput: 'notBreaching' }
        ]
      }
    },

    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 07: Amazon CloudFront', url: 'module-29.html' }, next: { title: 'Chapter 09: AWS CloudTrail', url: 'module-26.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_05_DATA;
} else {
  window.MODULE_05_DATA = MODULE_05_DATA;
}
