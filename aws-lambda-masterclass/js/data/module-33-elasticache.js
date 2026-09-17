/**
 * MODULE 33 — Amazon ElastiCache — In-Memory Caching
 */
const MODULE_33_DATA = {
  id: 'elasticache-fundamentals', moduleId: 'module-33',
  title: 'Amazon ElastiCache — In-Memory Caching',
  description: 'Master in-memory data stores. Covers Redis and Memcached, cluster mode, replication groups, caching strategies, session stores, and cache invalidation.',
  difficulty: 'intermediate', duration: '70 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master ElastiCache core concepts and architecture', 'Implement ElastiCache using Boto3 and AWS CLI', 'Troubleshoot common ElastiCache issues', 'Pass certification questions about ElastiCache'],
  sections: [
    { id: 'why', type: 'why', title: 'Why ElastiCache?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">⚡</span><div class="alert-content"><div class="alert-title">Sub-Millisecond Latency — Cache Your Database Queries</div><div class="alert-text">ElastiCache provides managed Redis or Memcached. Cache database queries, session data, and computed results. Reduce DB load by 90%+ and get microsecond response times.</div></div></div>
      <table><thead><tr><th>Feature</th><th>Redis</th><th>Memcached</th></tr></thead><tbody><tr><td><strong>Data Structures</strong></td><td>Strings, Lists, Sets, Hashes, Sorted Sets</td><td>Key-value only</td></tr><tr><td><strong>Persistence</strong></td><td>Yes (AOF, RDB)</td><td>No (volatile)</td></tr><tr><td><strong>Replication</strong></td><td>Up to 5 read replicas</td><td>None</td></tr><tr><td><strong>Clustering</strong></td><td>Cluster mode (up to 500 shards)</td><td>Auto-discovery</td></tr><tr><td><strong>Use Case</strong></td><td>Sessions, leaderboards, queues, pub/sub</td><td>Simple caching</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">ElastiCache Runs Inside Your VPC — Not Publicly Accessible</div><div class="alert-text">ElastiCache nodes have private IPs only. They cannot be accessed from the internet. Your application must be in the same VPC (or peered VPC) to connect.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'ElastiCache Architecture', content: { title: 'Cache: App → ElastiCache → Database', width: 750, height: 280,
      nodes: [
          { id: 'app', label: 'Application', icon: '🖥️', x: 10, y: 110, type: 'compute', description: 'Lambda, ECS, or EC2 application.' },
          { id: 'cache', label: 'ElastiCache Redis', icon: '⚡', x: 250, y: 50, type: 'storage', description: 'In-memory cache. Sub-millisecond reads. Cache frequently accessed data.' },
          { id: 'db', label: 'RDS / DynamoDB', icon: '🗄️', x: 250, y: 200, type: 'storage', description: 'Primary database. Cache miss triggers DB read.' },
          { id: 'primary', label: 'Primary Node', icon: '📝', x: 480, y: 50, type: 'compute', description: 'Handles reads and writes.' },
          { id: 'replica', label: 'Read Replica', icon: '📖', x: 480, y: 200, type: 'compute', description: 'Async replication. Handles read-heavy traffic.' }
      ],
      edges: [
          { from: 'app', to: 'cache', label: 'Cache Hit (fast)', animated: true },
          { from: 'app', to: 'db', label: 'Cache Miss' },
          { from: 'cache', to: 'primary', label: 'Read/Write' },
          { from: 'primary', to: 'replica', label: 'Replicate', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. Caching Strategies</h4><table><thead><tr><th>Strategy</th><th>How</th><th>Use Case</th></tr></thead><tbody><tr><td><strong>Cache-Aside (Lazy)</strong></td><td>App checks cache → miss → read DB → populate cache</td><td>Most common. Simple to implement.</td></tr><tr><td><strong>Write-Through</strong></td><td>App writes to cache AND DB simultaneously</td><td>Strong consistency needed.</td></tr><tr><td><strong>Write-Behind</strong></td><td>App writes to cache → async write to DB</td><td>Write-heavy workloads.</td></tr></tbody></table><h4>2. Redis Cluster Mode</h4><ul><li><strong>Disabled:</strong> 1 primary + up to 5 replicas. All data on one node. Max ~100GB.</li><li><strong>Enabled:</strong> Data partitioned across shards (up to 500). Each shard has 1 primary + replicas. Scales to TB.</li></ul><h4>3. TTL (Time-To-Live)</h4><p>Set expiration on cache keys. Critical to prevent stale data. Typical: 60s for real-time, 300s for near-real-time, 3600s for static data.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'ElastiCache Boto3 Operations', content: { title: 'ElastiCache Management', languages: [
      { id: 'python-elasticache', label: 'Core Operations',
        code: `import boto3
import redis
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Connect to ElastiCache Redis
r = redis.Redis(host='my-cluster.cache.amazonaws.com', port=6379, decode_responses=True)

def cache_aside_get(key, db_query_fn, ttl=300):
    """Cache-aside pattern: check cache first, then DB."""
    # Try cache
    cached = r.get(key)
    if cached:
        logger.info("Cache HIT: %s", key)
        return json.loads(cached)
    
    # Cache miss — query database
    logger.info("Cache MISS: %s", key)
    result = db_query_fn()
    
    # Populate cache with TTL
    r.setex(key, ttl, json.dumps(result))
    return result


def invalidate_cache(key):
    """Delete a cached key (on data update)."""
    r.delete(key)
    logger.info("Cache invalidated: %s", key)`,
        explanations: [
              { line: '10', text: 'Connect to ElastiCache Redis endpoint. This must be in the same VPC as your application.' },
              { line: '15-25', text: 'Cache-aside pattern: check cache first (fast), on miss query DB (slow), then populate cache with TTL.' }
        ] }
    ], defaultLang: 'python-elasticache', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'ElastiCache CLI Commands', content: [
        { command: 'aws elasticache describe-cache-clusters --show-cache-node-info', category: 'aws-cli', expectedOutput: '{\n  "CacheClusters": [{"CacheClusterId": "my-redis", "Engine": "redis", "CacheNodeType": "cache.r6g.large", "NumCacheNodes": 1, "CacheNodes": [{"Endpoint": {"Address": "my-redis.cache.amazonaws.com", "Port": 6379}}]}]\n}', explanation: 'Shows cluster info including endpoint address and port.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'ElastiCache CLI Lab', mode: 'simulated',
      initialText: 'ElastiCache CLI Lab. Try:\n  aws elasticache describe-cache-clusters --show-cache-node-info\n  aws elasticache describe-replication-groups',
      commands: {
          'aws elasticache describe-cache-clusters --show-cache-node-info': { text: '{\n  "CacheClusters": [{"CacheClusterId": "my-redis", "Engine": "redis", "EngineVersion": "7.0", "CacheNodeType": "cache.r6g.large", "CacheClusterStatus": "available"}]\n}', type: 'output' },
          'aws elasticache describe-replication-groups': { text: '{\n  "ReplicationGroups": [{"ReplicationGroupId": "my-redis-rg", "Status": "available", "ClusterEnabled": false, "NodeGroups": [{"PrimaryEndpoint": {"Address": "my-redis-rg.cache.amazonaws.com", "Port": 6379}}]}]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'Cannot connect to Redis', error: 'Connection timed out', cause: 'Security group doesn\'t allow port 6379, or app is in different VPC.', fix: 'Add inbound rule for port 6379 from app security group. Ensure same VPC or VPC peering.' },
          { title: 'Cache eviction too frequent', error: 'Keys being evicted despite TTL not expired', cause: 'Memory full. Redis evicts using LRU policy.', fix: 'Increase node size or add shards. Monitor with ElastiCache metrics: CurrItems, BytesUsedForCache.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'ElastiCache Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Cache-aside pattern: what happens on cache miss?', options: [
              { id: 'a', text: 'Return empty' },
              { id: 'b', text: 'Query DB, populate cache, return result' },
              { id: 'c', text: 'Wait for cache refresh' },
              { id: 'd', text: 'Retry cache' }
            ], correctId: 'b', explanation: 'On miss: query DB → store in cache with TTL → return. Next request hits cache.', difficulty: 'beginner' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Cache Hit Rate Monitor', content: { title: 'Cache Hit Rate Monitor', description: 'Monitor ElastiCache metrics and report cache hit rate.', difficulty: 'intermediate',
      requirements: [
          'Get CacheHits and CacheMisses CloudWatch metrics',
          'Calculate hit rate',
          'Alert if below 80%'
      ],
      starterCode: `import boto3\ncw = boto3.client('cloudwatch')\n\ndef lambda_handler(event, context):\n    # TODO: Get ElastiCache metrics\n    # TODO: Calculate hit rate\n    pass`,
      language: 'python', hints: [
          'cw.get_metric_statistics(Namespace="AWS/ElastiCache", MetricName="CacheHits")',
          'hit_rate = hits / (hits + misses) * 100'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Module 32: AWS PrivateLink', url: 'module-32.html' }, next: { title: 'Module 34: Amazon OpenSearch', url: 'module-34.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_33_DATA; } else { window.MODULE_33_DATA = MODULE_33_DATA; }
