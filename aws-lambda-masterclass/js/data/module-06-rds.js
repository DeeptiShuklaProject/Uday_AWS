/**
 * ============================================================
 * MODULE 06 — Amazon RDS
 * Relational databases, Multi-AZ, Read Replicas, Aurora, backups
 * ============================================================
 */
const MODULE_06_DATA = {
  id: 'rds-fundamentals',
  moduleId: 'module-06',
  title: 'Amazon RDS — Relational Database Service',
  description: 'Deploy and manage production relational databases. Covers engine types (MySQL, PostgreSQL, Aurora), Multi-AZ deployments, Read Replicas, automated backups, Parameter Groups, and Lambda integration.',
  difficulty: 'intermediate',
  duration: '85 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 04: Amazon VPC', 'Basic SQL knowledge'],
  objectives: [
    'Choose the right RDS engine for your workload (Aurora vs standard)',
    'Configure Multi-AZ for high availability with automatic failover',
    'Implement Read Replicas for read-heavy workloads',
    'Manage automated backups, snapshots, and point-in-time recovery',
    'Connect Lambda to RDS using RDS Proxy for connection pooling',
    'Secure RDS with encryption, VPC isolation, and IAM authentication',
    'Monitor RDS performance with Enhanced Monitoring and Performance Insights'
  ],

  sections: [
    {
      id: 'why-rds',
      type: 'why',
      title: 'Why RDS?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🗄️</span>
            <div class="alert-content">
              <div class="alert-title">Managed Databases — Don't Be a DBA</div>
              <div class="alert-text">RDS automates the undifferentiated heavy lifting: patching, backups, failover, scaling, and replication. You get a production-grade database in minutes instead of weeks. Focus on your schema and queries, not on managing database servers.</div>
            </div>
          </div>
          <h4>Engine Comparison</h4>
          <table>
            <thead><tr><th>Engine</th><th>Performance</th><th>Storage</th><th>Cost</th><th>Best For</th></tr></thead>
            <tbody>
              <tr><td><strong>Aurora MySQL</strong></td><td>5x MySQL perf</td><td>Up to 128 TB, auto-grows</td><td>~20% more than RDS MySQL</td><td>Production apps needing MySQL compatibility + scale</td></tr>
              <tr><td><strong>Aurora PostgreSQL</strong></td><td>3x PostgreSQL perf</td><td>Up to 128 TB, auto-grows</td><td>~20% more than RDS PostgreSQL</td><td>Complex queries, GIS, full-text search</td></tr>
              <tr><td><strong>RDS MySQL</strong></td><td>Standard</td><td>Up to 64 TB</td><td>Lower</td><td>Simple web apps, WordPress</td></tr>
              <tr><td><strong>RDS PostgreSQL</strong></td><td>Standard</td><td>Up to 64 TB</td><td>Lower</td><td>When 100% PostgreSQL compatibility needed</td></tr>
              <tr><td><strong>Aurora Serverless v2</strong></td><td>Scales automatically</td><td>Up to 128 TB</td><td>Pay per ACU-second</td><td>Variable/unpredictable workloads</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Lambda + RDS = Connection Exhaustion Risk</div>
              <div class="alert-text">Each Lambda invocation opens a new database connection. With 1000 concurrent Lambdas, you'll exhaust the RDS connection limit (typically 150-3000). Always use RDS Proxy between Lambda and RDS for connection pooling.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'RDS High Availability Architecture',
      content: {
        title: 'Multi-AZ RDS with Read Replicas & RDS Proxy',
        width: 750,
        height: 300,
        nodes: [
          { id: 'app', label: 'Application / Lambda', icon: '⚡', x: 10, y: 130, type: 'compute', description: 'Application writes and reads to the database. Lambda should always connect through RDS Proxy.' },
          { id: 'proxy', label: 'RDS Proxy', icon: '🔄', x: 170, y: 130, type: 'trigger', description: 'Connection pooler for RDS. Maintains a warm pool of connections. Multiplexes many Lambda connections through few DB connections. Handles failover transparently.' },
          { id: 'primary', label: 'Primary (AZ-a)', icon: '🗄️', x: 350, y: 80, type: 'storage', description: 'Primary RDS instance handles all writes and reads. Synchronously replicates to standby for Multi-AZ.' },
          { id: 'standby', label: 'Standby (AZ-b)', icon: '🗄️', x: 350, y: 220, type: 'storage', description: 'Multi-AZ standby receives synchronous replication. Not readable. Automatic failover in ~60 seconds if primary fails. DNS endpoint stays the same.' },
          { id: 'replica', label: 'Read Replica', icon: '📖', x: 540, y: 80, type: 'storage', description: 'Asynchronous replication from primary. Readable. Use for read-heavy queries, reports, analytics. Can be cross-region for DR. Can be promoted to standalone.' },
          { id: 'backup', label: 'Automated Backup', icon: '💾', x: 540, y: 220, type: 'storage', description: 'Daily automated snapshots + transaction logs. Point-in-time recovery to any second in the retention period (up to 35 days). Stored in S3 (managed by AWS).' }
        ],
        edges: [
          { from: 'app', to: 'proxy', label: 'Connect', animated: true },
          { from: 'proxy', to: 'primary', label: 'Pool', animated: true },
          { from: 'primary', to: 'standby', label: 'Sync Replication' },
          { from: 'primary', to: 'replica', label: 'Async Replication' },
          { from: 'primary', to: 'backup', label: 'Daily + Logs' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Multi-AZ vs Read Replicas</h4>
          <table>
            <thead><tr><th>Feature</th><th>Multi-AZ</th><th>Read Replica</th></tr></thead>
            <tbody>
              <tr><td>Purpose</td><td>High availability (failover)</td><td>Read scalability</td></tr>
              <tr><td>Replication</td><td>Synchronous</td><td>Asynchronous</td></tr>
              <tr><td>Readable?</td><td>No (standby only)</td><td>Yes — serves read queries</td></tr>
              <tr><td>Failover</td><td>Automatic (~60s), same DNS</td><td>Manual promotion</td></tr>
              <tr><td>Cross-Region</td><td>No (same region only)</td><td>Yes — cross-region supported</td></tr>
              <tr><td>Cost</td><td>2x (standby instance)</td><td>Per replica instance</td></tr>
            </tbody>
          </table>

          <h4>2. RDS Proxy (Critical for Lambda)</h4>
          <p>RDS Proxy sits between your application and the database:</p>
          <ul>
            <li>Maintains a pool of warm connections to RDS</li>
            <li>Multiplexes thousands of Lambda connections through a small pool</li>
            <li>Handles failover transparently — no connection string changes</li>
            <li>Supports IAM authentication — no passwords in code</li>
          </ul>

          <h4>3. Backup & Recovery</h4>
          <ul>
            <li><strong>Automated Backups</strong>: Daily snapshots + continuous transaction log backup. Retention: 0-35 days. Point-in-time recovery to any second.</li>
            <li><strong>Manual Snapshots</strong>: User-initiated. Persist until explicitly deleted. Share cross-account or cross-region.</li>
            <li><strong>Restore</strong>: Restores create a NEW RDS instance — you cannot restore in-place.</li>
          </ul>

          <h4>4. Encryption</h4>
          <ul>
            <li>At rest: KMS encryption of storage, snapshots, replicas, and logs. Must be enabled at creation — cannot encrypt an existing unencrypted DB.</li>
            <li>In transit: SSL/TLS. Force with <code>rds.force_ssl=1</code> parameter.</li>
          </ul>

          <h4>5. Parameter Groups & Option Groups</h4>
          <ul>
            <li><strong>DB Parameter Group</strong>: Database engine configuration (max_connections, query_cache_size, log_slow_queries). Like my.cnf for MySQL.</li>
            <li><strong>DB Option Group</strong>: Engine-specific features (Oracle APEX, MySQL memcached plugin).</li>
          </ul>

          <h4>6. Aurora Serverless v2</h4>
          <p>Scales in ACU (Aurora Capacity Units) increments of 0.5. Scales from 0.5 ACU to 128 ACU in seconds. Pay only for capacity used. Ideal for dev/test (scale to near-zero) and variable production workloads.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'Lambda + RDS Proxy',
      content: {
        title: 'Connect Lambda to RDS via RDS Proxy',
        languages: [
          {
            id: 'python-rds',
            label: 'Lambda + RDS Proxy',
            code: `import boto3
import json
import os
import logging
import pymysql

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# RDS Proxy endpoint — NOT the direct RDS endpoint
PROXY_ENDPOINT = os.environ['RDS_PROXY_ENDPOINT']
DB_NAME = os.environ['DB_NAME']
DB_USER = os.environ['DB_USER']
REGION  = os.environ.get('AWS_REGION', 'us-east-1')

# Global connection — reuse across warm invocations
connection = None

def get_connection():
    """
    Get or reuse a database connection.
    Uses IAM authentication — no passwords in code or env vars.
    """
    global connection
    if connection and connection.open:
        return connection

    # Generate IAM auth token (temporary password, 15-min validity)
    rds_client = boto3.client('rds')
    token = rds_client.generate_db_auth_token(
        DBHostname=PROXY_ENDPOINT,
        Port=3306,
        DBUsername=DB_USER,
        Region=REGION
    )

    connection = pymysql.connect(
        host=PROXY_ENDPOINT,
        user=DB_USER,
        password=token,           # IAM auth token as password
        database=DB_NAME,
        port=3306,
        connect_timeout=5,
        ssl={'ca': '/opt/rds-combined-ca-bundle.pem'},  # SSL required
        cursorclass=pymysql.cursors.DictCursor
    )
    logger.info("Connected to RDS via Proxy: %s", PROXY_ENDPOINT)
    return connection


def lambda_handler(event, context):
    """Query RDS through RDS Proxy with connection reuse."""
    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC LIMIT 10",
                (event.get('userId'),)
            )
            orders = cursor.fetchall()

        return {
            'statusCode': 200,
            'body': json.dumps(orders, default=str)
        }

    except pymysql.err.OperationalError as e:
        logger.error("Database error: %s", str(e))
        # Reset connection on error — next invocation will reconnect
        connection = None
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Database connection error'})
        }`,
            explanations: [
              { line: '11', text: 'CRITICAL: Use the RDS Proxy endpoint, not the direct RDS endpoint. Proxy handles connection pooling and failover.' },
              { line: '17', text: 'Global connection variable — reused across warm Lambda invocations (same execution environment). Saves ~100ms connection setup time.' },
              { line: '28-34', text: 'IAM authentication: generate_db_auth_token creates a temporary password (15 min). No static passwords. Requires IAM policy with rds-db:connect.' },
              { line: '42', text: 'SSL is required when using IAM auth tokens. The CA bundle verifies the RDS/Proxy certificate.' },
              { line: '69-71', text: 'Reset connection on error so the next warm invocation gets a fresh connection. Stale connections cause cascading failures.' }
            ]
          }
        ],
        defaultLang: 'python-rds',
        expectedOutput: '{\n  "statusCode": 200,\n  "body": "[{\\"orderId\\": \\"ord-001\\", \\"userId\\": \\"u-123\\", \\"amount\\": 59.99, \\"created_at\\": \\"2026-09-15 10:30:00\\"}]"\n}'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'RDS CLI Commands',
      content: [
        {
          command: 'aws rds describe-db-instances --query "DBInstances[].[DBInstanceIdentifier,Engine,DBInstanceClass,MultiAZ,DBInstanceStatus]" --output table',
          category: 'aws-cli',
          expectedOutput: '------------------------------------------------------------\n| prod-orders-db | aurora-mysql | db.r6g.large | True | available |\n| dev-users-db   | postgres     | db.t3.micro  | False | available |\n------------------------------------------------------------',
          explanation: 'Lists all RDS instances with engine, class, Multi-AZ status. Use this to verify HA configuration and right-sizing.',
          interviewQ: 'When should you choose Aurora over standard RDS MySQL?'
        },
        {
          command: 'aws rds create-db-snapshot --db-instance-identifier prod-orders-db --db-snapshot-identifier prod-orders-backup-20260916',
          category: 'aws-cli',
          expectedOutput: '{\n  "DBSnapshot": {\n    "DBSnapshotIdentifier": "prod-orders-backup-20260916",\n    "DBInstanceIdentifier": "prod-orders-db",\n    "Status": "creating",\n    "Engine": "aurora-mysql",\n    "Encrypted": true\n  }\n}',
          explanation: 'Creates a manual snapshot. Unlike automated backups, manual snapshots persist until you delete them. Use before major changes (schema migrations, upgrades).',
          commonErrors: [
            { error: 'DBSnapshotAlreadyExists', cause: 'Snapshot identifier must be unique', fix: 'Use a unique name with timestamp: prod-orders-backup-$(date +%Y%m%d%H%M)' }
          ]
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'RDS CLI Lab',
        mode: 'simulated',
        initialText: 'RDS CLI Lab. Try:\n  aws rds describe-db-instances\n  aws rds describe-db-clusters\n  aws rds describe-db-snapshots --db-instance-identifier prod-orders-db',
        commands: {
          'aws rds describe-db-instances': {
            text: '{\n  "DBInstances": [{\n    "DBInstanceIdentifier": "prod-orders-db",\n    "Engine": "aurora-mysql",\n    "DBInstanceClass": "db.r6g.large",\n    "MultiAZ": true,\n    "DBInstanceStatus": "available",\n    "Endpoint": {"Address": "prod-orders-db.cluster-abc123.us-east-1.rds.amazonaws.com", "Port": 3306},\n    "StorageEncrypted": true,\n    "BackupRetentionPeriod": 14\n  }]\n}',
            type: 'output'
          },
          'aws rds describe-db-clusters': {
            text: '{\n  "DBClusters": [{\n    "DBClusterIdentifier": "prod-orders-cluster",\n    "Engine": "aurora-mysql",\n    "Status": "available",\n    "ReaderEndpoint": "prod-orders-db.cluster-ro-abc123.us-east-1.rds.amazonaws.com",\n    "DBClusterMembers": [\n      {"DBInstanceIdentifier": "prod-orders-db", "IsClusterWriter": true},\n      {"DBInstanceIdentifier": "prod-orders-db-reader", "IsClusterWriter": false}\n    ]\n  }]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common RDS Issues',
      content: {
        items: [
          { title: 'Lambda "Too many connections" error', error: 'OperationalError: (1040, "Too many connections")', cause: 'Each Lambda invocation opens a new connection. 1000 concurrent Lambdas = 1000 connections. RDS max_connections is typically 150-3000 depending on instance class.', fix: 'Use RDS Proxy (connection pooling). Set reserved concurrency on Lambda to limit max connections. Reuse connections across warm invocations (global variable).' },
          { title: 'RDS Multi-AZ failover causing errors', error: 'Application errors during maintenance window or AZ failure', cause: 'Multi-AZ failover takes ~60 seconds. During failover, DNS switches to the standby but cached DNS entries point to the old primary.', fix: 'Use RDS Proxy (handles failover transparently). Set DNS TTL to 30 seconds in your application. Implement connection retry logic with exponential backoff.' },
          { title: 'Read Replica lag increasing', error: 'Read Replica shows increasing replication lag (seconds behind primary)', cause: 'Write-heavy workload on primary exceeds replica\'s apply capacity. Long-running queries on replica block replication.', fix: 'Scale up the replica instance class. Use Aurora (parallel replication). Avoid long-running queries on replicas. Monitor ReplicaLag CloudWatch metric.' },
          { title: 'Cannot connect to RDS from Lambda', error: 'Lambda times out when connecting to RDS', cause: 'Lambda is in a VPC but the Security Group or subnet configuration doesn\'t allow outbound access to the RDS port (3306/5432).', fix: 'Verify: 1) Lambda SG allows outbound on port 3306/5432. 2) RDS SG allows inbound from Lambda SG. 3) Lambda is in a subnet that can reach RDS (same VPC). 4) Lambda has VPC config with correct subnets and SGs.' }
        ]
      }
    },

    {
      id: 'quiz-rds',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon RDS Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your production RDS instance in us-east-1a fails due to an AZ outage. You have Multi-AZ enabled. What happens?',
            options: [
              { id: 'a', text: 'RDS automatically fails over to the standby in us-east-1b. DNS endpoint stays the same. Downtime: ~60 seconds.' },
              { id: 'b', text: 'You must manually promote the standby using the AWS Console' },
              { id: 'c', text: 'RDS restores from the latest automated backup in another AZ' },
              { id: 'd', text: 'You must create a new RDS instance and restore from backup' }
            ],
            correctId: 'a',
            explanation: 'Multi-AZ is automatic failover. AWS detects the failure, updates the DNS CNAME to point to the standby, and the standby becomes the new primary. ~60 seconds downtime. No manual intervention needed. The database endpoint URL does not change.',
            difficulty: 'beginner'
          },
          {
            id: 'q2',
            question: 'Why should Lambda functions connect to RDS through RDS Proxy instead of directly?',
            options: [
              { id: 'a', text: 'RDS Proxy is faster than direct connections' },
              { id: 'b', text: 'RDS Proxy provides connection pooling, preventing Lambda from exhausting database connections' },
              { id: 'c', text: 'RDS Proxy is required for IAM authentication' },
              { id: 'd', text: 'Direct connections from Lambda are not supported' }
            ],
            correctId: 'b',
            explanation: 'Lambda scales to thousands of concurrent invocations. Each opens a database connection. RDS typically supports 150-3000 max connections. RDS Proxy maintains a warm connection pool and multiplexes many Lambda connections through few DB connections, preventing "Too many connections" errors.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'You need disaster recovery for an Aurora database across regions. What approach should you use?',
            options: [
              { id: 'a', text: 'Multi-AZ — it automatically replicates cross-region' },
              { id: 'b', text: 'Aurora Global Database — provides cross-region replication with <1 second lag and fast cross-region failover' },
              { id: 'c', text: 'Manually copy snapshots to another region daily' },
              { id: 'd', text: 'Use DynamoDB Global Tables instead' }
            ],
            correctId: 'b',
            explanation: 'Aurora Global Database replicates an entire Aurora cluster to up to 5 secondary regions with typically <1 second replication lag. Cross-region failover promotes a secondary region in under 1 minute. Multi-AZ only works within a single region.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    {
      id: 'challenge-rds',
      type: 'challenge',
      title: 'Challenge: RDS Connection Manager',
      content: {
        title: 'Build a Reusable RDS Connection Manager',
        description: 'Write a Lambda-compatible RDS connection manager that uses IAM authentication, connection reuse across warm invocations, and proper error handling with connection reset.',
        difficulty: 'intermediate',
        requirements: [
          'Use boto3 rds client to generate IAM auth token',
          'Store connection in a global variable for warm-start reuse',
          'Check if existing connection is still open before reusing',
          'Set SSL and connect_timeout for production safety',
          'Reset connection to None on OperationalError',
          'Log successful connections and errors'
        ],
        starterCode: `import boto3
import os
import logging
import pymysql

logger = logging.getLogger()
logger.setLevel(logging.INFO)

PROXY_ENDPOINT = os.environ.get('RDS_PROXY_ENDPOINT', 'proxy.rds.amazonaws.com')
DB_NAME = os.environ.get('DB_NAME', 'mydb')
DB_USER = os.environ.get('DB_USER', 'lambda_user')

connection = None

def get_connection():
    """Get or reuse database connection with IAM auth."""
    global connection
    # TODO: Check if connection exists and is open
    # TODO: Generate IAM auth token
    # TODO: Create new pymysql connection
    # TODO: Return connection
    pass

def lambda_handler(event, context):
    # TODO: Get connection, execute query, handle errors
    pass`,
        language: 'python',
        hints: [
          'Check: if connection and connection.open: return connection',
          'rds_client.generate_db_auth_token(DBHostname=..., Port=3306, DBUsername=...)',
          'pymysql.connect(host=..., user=..., password=token, database=..., ssl={...})',
          'Wrap in try/except pymysql.err.OperationalError, reset connection = None on error',
          'Use cursorclass=pymysql.cursors.DictCursor for JSON-friendly results'
        ],
        testCases: [
          { description: 'Generates IAM auth token', keywords: ['generate_db_auth_token'], expectedOutput: 'auth_token' },
          { description: 'Reuses warm connection', keywords: ['connection', 'open'], expectedOutput: 'open' },
          { description: 'Uses pymysql.connect', keywords: ['pymysql.connect'], expectedOutput: 'connect' },
          { description: 'Resets connection on error', keywords: ['None', 'OperationalError'], expectedOutput: 'None' },
          { description: 'Returns JSON response', keywords: ['statusCode', 'body'], expectedOutput: 'statusCode' }
        ]
      }
    },

    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: { title: 'Module 05: Amazon CloudWatch', url: 'module-05.html' },
        next: { title: 'Module 07: Amazon Route 53', url: 'module-07.html' }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_06_DATA;
} else {
  window.MODULE_06_DATA = MODULE_06_DATA;
}
