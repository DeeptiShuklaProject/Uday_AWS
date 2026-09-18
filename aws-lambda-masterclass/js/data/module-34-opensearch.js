/**
 * MODULE 34 — Amazon OpenSearch Service — Search & Analytics
 */
const MODULE_34_DATA = {
  id: 'opensearch-fundamentals', moduleId: 'module-34',
  title: 'Amazon OpenSearch Service — Search & Analytics',
  description: 'Master search and log analytics. Covers domains, indices, Kibana/Dashboards, log aggregation, fine-grained access control, and integration with CloudWatch.',
  difficulty: 'intermediate', duration: '70 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master OpenSearch Service core concepts and architecture', 'Implement OpenSearch Service using Boto3 and AWS CLI', 'Troubleshoot common OpenSearch Service issues', 'Pass certification questions about OpenSearch Service'],
  sections: [
    { id: 'why', type: 'why', title: 'Why OpenSearch Service?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🔍</span><div class="alert-content"><div class="alert-title">Search and Analyze Logs at Scale</div><div class="alert-text">OpenSearch provides managed search and analytics. Index logs from CloudWatch, VPC Flow Logs, CloudTrail. Search with full-text queries. Visualize with dashboards.</div></div></div>
      <table><thead><tr><th>Feature</th><th>OpenSearch</th><th>CloudWatch Logs Insights</th><th>Athena</th></tr></thead><tbody><tr><td><strong>Query Type</strong></td><td>Full-text search + aggregations</td><td>Log Insights QL</td><td>SQL</td></tr><tr><td><strong>Visualization</strong></td><td>Built-in Dashboards (Kibana)</td><td>Basic</td><td>None (use QuickSight)</td></tr><tr><td><strong>Real-time</strong></td><td>Yes (streaming)</td><td>Near real-time</td><td>Batch</td></tr><tr><td><strong>Cost</strong></td><td>Instance hours + storage</td><td>Per query</td><td>Per query + S3</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">OpenSearch Domains Are Expensive — Right-Size Your Cluster</div><div class="alert-text">Running OpenSearch is like running EC2 instances. Start small (t3.small.search for dev) and use UltraWarm for historical data to reduce costs by 80%.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'OpenSearch Service Architecture', content: { title: 'Logs → OpenSearch → Dashboards', width: 750, height: 280,
      nodes: [
          { id: 'logs', label: 'Log Sources', icon: '📋', x: 10, y: 110, type: 'storage', description: 'CloudWatch Logs, S3, Kinesis Firehose, Beats agents.' },
          { id: 'os', label: 'OpenSearch Domain', icon: '🔍', x: 250, y: 110, type: 'compute', description: 'Managed cluster. Hot nodes for active data, UltraWarm for historical.' },
          { id: 'dash', label: 'Dashboards', icon: '📊', x: 500, y: 50, type: 'client', description: 'Kibana-compatible visualizations.' },
          { id: 'alerts', label: 'Alerting', icon: '🚨', x: 500, y: 200, type: 'trigger', description: 'Anomaly detection and alerting on log patterns.' }
      ],
      edges: [
          { from: 'logs', to: 'os', label: 'Index', animated: true },
          { from: 'os', to: 'dash', label: 'Visualize' },
          { from: 'os', to: 'alerts', label: 'Alert' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. Domain Architecture</h4><ul><li><strong>Hot nodes:</strong> SSD-backed, for active indexing and search</li><li><strong>UltraWarm nodes:</strong> S3-backed, 80% cheaper for historical data</li><li><strong>Cold storage:</strong> Cheapest, for rarely accessed data</li></ul><h4>2. Fine-Grained Access Control</h4><p>Control access at the index, document, and field level. Integrate with IAM or internal user database.</p><h4>3. Index Lifecycle</h4><p>Hot → UltraWarm → Cold → Delete. Automate with Index State Management (ISM) policies.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'OpenSearch Service Boto3 Operations', content: { title: 'OpenSearch Service Management', languages: [
      { id: 'python-opensearch', label: 'Core Operations',
        code: `import boto3
import logging
from opensearchpy import OpenSearch

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Connect to OpenSearch domain
os_client = OpenSearch(
    hosts=[{'host': 'search-my-domain.us-east-1.es.amazonaws.com', 'port': 443}],
    http_auth=('admin', 'Admin123!'),
    use_ssl=True
)

def search_logs(index, query_text, size=10):
    """Full-text search across log indices."""
    body = {
        'query': {
            'multi_match': {
                'query': query_text,
                'fields': ['message', 'log', '@message']
            }
        },
        'size': size,
        'sort': [{'@timestamp': {'order': 'desc'}}]
    }
    response = os_client.search(index=index, body=body)
    hits = response['hits']['hits']
    logger.info("Found %d results for: %s", len(hits), query_text)
    return hits`,
        explanations: [
              { line: '9-12', text: 'Connect to the managed OpenSearch domain. Use IAM auth in production instead of basic auth.' },
              { line: '17-25', text: 'multi_match searches across multiple fields. Sort by timestamp descending for latest results first.' }
        ] }
    ], defaultLang: 'python-opensearch', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'OpenSearch Service CLI Commands', content: [
        { command: 'aws opensearch describe-domains --domain-names my-logs', category: 'aws-cli', expectedOutput: '{\n  "DomainStatusList": [{"DomainName": "my-logs", "EngineVersion": "OpenSearch_2.11", "ClusterConfig": {"InstanceType": "r6g.large.search", "InstanceCount": 3}, "Endpoints": {"vpc": "vpc-search-my-logs.us-east-1.es.amazonaws.com"}}]\n}', explanation: 'Shows domain config, instance types, and endpoint.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'OpenSearch Service CLI Lab', mode: 'simulated',
      initialText: 'OpenSearch CLI Lab. Try:\n  aws opensearch list-domain-names\n  aws opensearch describe-domains --domain-names my-logs',
      commands: {
          'aws opensearch list-domain-names': { text: '{\n  "DomainNames": [{"DomainName": "my-logs", "EngineType": "OpenSearch"}, {"DomainName": "app-search", "EngineType": "OpenSearch"}]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'Cluster status RED', error: 'Cluster health: RED', cause: 'One or more primary shards are unassigned. Usually: disk full or node failure.', fix: 'Check disk usage. Add nodes or increase storage. Delete old indices.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'OpenSearch Service Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Best use case for UltraWarm nodes?', options: [
              { id: 'a', text: 'Active indexing' },
              { id: 'b', text: 'Historical data that is rarely queried' },
              { id: 'c', text: 'Real-time search' },
              { id: 'd', text: 'Dashboard queries' }
            ], correctId: 'b', explanation: 'UltraWarm is S3-backed, 80% cheaper than hot nodes. Perfect for log data older than 7-30 days.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Log Search Dashboard', content: { title: 'Log Search Dashboard', description: 'Query OpenSearch for error logs and return summary.', difficulty: 'intermediate',
      requirements: [
          'Search for ERROR level logs',
          'Aggregate by service name',
          'Return top 10 error sources'
      ],
      starterCode: `from opensearchpy import OpenSearch\n\ndef lambda_handler(event, context):\n    # TODO: Connect to OpenSearch\n    # TODO: Search for errors\n    pass`,
      language: 'python', hints: [
          'os_client.search(index="logs-*", body={"query": {"match": {"level": "ERROR"}}})'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 33: Amazon ElastiCache', url: 'module-33.html' }, next: { title: 'Chapter 35: AWS Organizations', url: 'module-31.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_34_DATA; } else { window.MODULE_34_DATA = MODULE_34_DATA; }
