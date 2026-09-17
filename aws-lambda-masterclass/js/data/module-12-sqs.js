/**
 * ============================================================
 * MODULE 12 — Amazon SQS
 * Message queuing, Lambda ESM, visibility timeout, DLQ, batching
 * ============================================================
 */
const MODULE_12_DATA = {
  id: 'sqs-fundamentals',
  moduleId: 'module-12',
  title: 'Amazon SQS — Reliable Message Queuing',
  description: 'Master Amazon SQS for decoupled, reliable serverless architectures. Covers Standard vs FIFO queues, Lambda Event Source Mapping, visibility timeout, dead-letter queues, batch processing, and failure handling.',
  difficulty: 'intermediate',
  duration: '80 min',
  prerequisites: ['Module 08: AWS Lambda', 'Basic pub/sub and async concepts'],
  objectives: [
    'Explain Standard vs FIFO queue differences and when to use each',
    'Configure Lambda Event Source Mapping (ESM) to consume SQS messages',
    'Understand visibility timeout and its relationship to Lambda timeout',
    'Implement partial batch failure responses to handle errors correctly',
    'Configure Dead-Letter Queues (DLQ) to capture failed messages',
    'Design producer and consumer Lambda functions',
    'Monitor queue health with CloudWatch metrics (ApproximateNumberOfMessages, etc.)'
  ],

  sections: [
    {
      id: 'why-sqs',
      type: 'why',
      title: 'Why SQS?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">📨</span>
            <div class="alert-content">
              <div class="alert-title">Decouple, Buffer, and Protect</div>
              <div class="alert-text">SQS decouples producers from consumers. If your downstream service is slow or offline, messages accumulate safely in the queue instead of being lost. It also protects Lambda from being overwhelmed by sudden traffic spikes.</div>
            </div>
          </div>
          <h4>The Core Problem SQS Solves</h4>
          <p>Without SQS: API Gateway → Lambda → Database. If the database is slow, Lambda waits. 10,000 concurrent requests hit Lambda simultaneously. Lambda concurrency limit hit → throttles. Requests lost.</p>
          <p>With SQS: API → Lambda Producer → SQS Queue → Lambda Consumer (controlled concurrency) → Database. The queue absorbs spikes and consumer processes at a safe rate.</p>
          <table>
            <thead><tr><th>Feature</th><th>Standard Queue</th><th>FIFO Queue</th></tr></thead>
            <tbody>
              <tr><td>Throughput</td><td>Unlimited (nearly)</td><td>300 TPS (3,000 with batching)</td></tr>
              <tr><td>Ordering</td><td>Best-effort (not guaranteed)</td><td>Strict FIFO per Message Group</td></tr>
              <tr><td>Delivery</td><td>At-least-once (duplicates possible)</td><td>Exactly-once processing</td></tr>
              <tr><td>Deduplication</td><td>Not supported</td><td>5-minute deduplication window</td></tr>
              <tr><td>Use Case</td><td>Email, notifications, logs, jobs</td><td>Financial transactions, order processing</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Standard Queue Idempotency Warning</div>
              <div class="alert-text">Standard queues deliver messages AT LEAST ONCE. Your consumer Lambda must be idempotent — processing the same message twice should have the same effect as processing it once. Use DynamoDB conditional writes or check for existing records before processing.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'SQS + Lambda Architecture',
      content: {
        title: 'SQS Event Source Mapping — Producer → Queue → Consumer',
        width: 750,
        height: 280,
        nodes: [
          { id: 'api', label: 'API / Event Source', icon: '🌐', x: 10, y: 110, type: 'trigger', description: 'Any event source: API Gateway, another Lambda, EventBridge, S3 events.' },
          { id: 'producer', label: 'Producer Lambda', icon: '⚡', x: 160, y: 110, type: 'compute', description: 'Sends messages to SQS using SendMessage or SendMessageBatch. Decoupled from consumer.', eventPayload: { QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/orders-queue', MessageBody: '{"orderId":"ord-001","userId":"u-123","amount":59.99}', MessageGroupId: 'user-u-123' } },
          { id: 'sqs', label: 'SQS Queue', icon: '📨', x: 340, y: 110, type: 'event', description: 'Messages stored durably (up to 14 days). Lambda ESM polls the queue using long-polling. Visibility timeout hides messages during processing.' },
          { id: 'dlq', label: 'Dead-Letter Queue', icon: '💀', x: 340, y: 230, type: 'storage', description: 'Messages that fail maxReceiveCount times are moved to DLQ. Monitor DLQ depth as a critical alarm — non-zero DLQ means data loss is possible.' },
          { id: 'consumer', label: 'Consumer Lambda', icon: '⚡', x: 540, y: 110, type: 'compute', description: 'Lambda ESM invokes the consumer with a batch of messages. Lambda has 6x concurrency scaling per minute from SQS.', eventPayload: { Records: [{ messageId: 'msg-001', body: '{"orderId":"ord-001"}', receiptHandle: 'AQEB...' }, { messageId: 'msg-002', body: '{"orderId":"ord-002"}', receiptHandle: 'AQEC...' }] } },
          { id: 'dynamo', label: 'Database', icon: '🗄️', x: 660, y: 110, type: 'storage', description: 'Consumer persists processed data.' }
        ],
        edges: [
          { from: 'api', to: 'producer', label: 'Trigger', animated: true },
          { from: 'producer', to: 'sqs', label: 'SendMessage', animated: true },
          { from: 'sqs', to: 'consumer', label: 'Poll + Batch', animated: true },
          { from: 'sqs', to: 'dlq', label: 'Max Retries' },
          { from: 'consumer', to: 'dynamo', label: 'Write', animated: true }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Event Source Mapping (ESM)</h4>
          <p>Lambda ESM is a service-side poller. Lambda's internal service polls SQS using long-polling (up to 20 seconds), retrieves messages in batches, and invokes your function. You don't write polling code.</p>

          <h4>2. Visibility Timeout</h4>
          <div class="alert alert-warning">
            <span class="alert-icon">⏱️</span>
            <div class="alert-content">
              <div class="alert-title">Critical Setting: Visibility Timeout ≥ 6× Lambda Timeout</div>
              <div class="alert-text">When Lambda receives a message, SQS hides it for the visibility timeout period. If Lambda doesn't complete before the timeout expires, SQS makes the message visible again — causing double-processing. Set visibility timeout to at least 6× your Lambda timeout.</div>
            </div>
          </div>

          <h4>3. Batch Processing & Partial Failure</h4>
          <p>Lambda receives a batch (2–10,000 messages). If Lambda throws any exception, ALL messages in the batch are retried — even successfully processed ones. Solutions:</p>
          <ul>
            <li><strong>ReportBatchItemFailures</strong>: Return <code>{"batchItemFailures": [{"itemIdentifier": "msg-id"}]}</code> to tell Lambda only specific messages failed.</li>
            <li><strong>Process individually</strong>: Catch exceptions per message and only add failures to the response.</li>
          </ul>

          <h4>4. Dead-Letter Queue (DLQ)</h4>
          <p>After <code>maxReceiveCount</code> failures, SQS moves the message to the DLQ. This prevents an infinite retry loop from blocking healthy messages. Key practices:</p>
          <ul>
            <li>Always set a DLQ — otherwise messages are permanently lost after max retries</li>
            <li>Set a CloudWatch alarm on DLQ depth > 0</li>
            <li>Review DLQ messages regularly — they indicate bugs in your consumer</li>
          </ul>

          <h4>5. Long Polling</h4>
          <p>Lambda ESM uses long polling (WaitTimeSeconds=20) automatically. This reduces empty receives and costs. For SDK polling in your own code, always set WaitTimeSeconds=20.</p>

          <h4>6. Concurrency Scaling</h4>
          <p>Lambda ESM scales consumers up to 60 additional concurrent instances per minute, up to 1,000. Use reserved concurrency to limit consumer throughput and protect downstream services.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'SQS Producer & Consumer Lambda',
      content: {
        title: 'SQS Producer + Consumer with Partial Batch Failure',
        languages: [
          {
            id: 'python-producer',
            label: 'Producer',
            code: `import json
import boto3
import os
import logging
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize SQS client globally
sqs = boto3.client('sqs')
QUEUE_URL = os.environ['QUEUE_URL']

def lambda_handler(event, context):
    """
    Producer Lambda — sends order messages to SQS queue.
    Invoked synchronously by API Gateway.
    """
    body = json.loads(event.get('body') or '{}')
    orders = body.get('orders', [])

    if not orders:
        return build_response(400, {'error': 'orders list required'})

    if len(orders) == 1:
        # Single message
        order = orders[0]
        response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(order),
            # For FIFO queues only:
            # MessageGroupId=f"user-{order['userId']}",
            # MessageDeduplicationId=str(uuid.uuid4()),
            MessageAttributes={
                'eventType': {
                    'DataType': 'String',
                    'StringValue': 'ORDER_CREATED'
                }
            }
        )
        logger.info("Sent message: %s", response['MessageId'])
        return build_response(202, {'messageId': response['MessageId']})

    # Batch send up to 10 messages at once (cheaper, faster)
    entries = [
        {
            'Id': str(i),                          # Batch item ID (not SQS msg ID)
            'MessageBody': json.dumps(order),
            'MessageAttributes': {
                'eventType': {'DataType': 'String', 'StringValue': 'ORDER_CREATED'}
            }
        }
        for i, order in enumerate(orders[:10])    # SQS batch max = 10
    ]

    response = sqs.send_message_batch(QueueUrl=QUEUE_URL, Entries=entries)

    failed = response.get('Failed', [])
    if failed:
        logger.error("Batch send failures: %s", failed)
        return build_response(207, {
            'sent': len(response.get('Successful', [])),
            'failed': len(failed),
            'failures': failed
        })

    return build_response(202, {'sent': len(entries)})

def build_response(status, body):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(body)
    }`,
            explanations: [
              { line: '12', text: 'QUEUE_URL from env var — never hardcode SQS URLs. The URL contains your account ID and region.' },
              { line: '26', text: 'send_message for single messages. MessageGroupId is required for FIFO queues — groups ensure ordering within the same group.' },
              { line: '43', text: 'send_message_batch sends up to 10 messages in one API call — 10× cheaper and faster than 10 individual sends.' },
              { line: '51', text: 'Batch ID (\'0\', \'1\', ...) is required and must be unique within the batch. Different from the SQS MessageId.' }
            ]
          },
          {
            id: 'python-consumer',
            label: 'Consumer (Partial Failure)',
            code: `import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
orders_table = dynamodb.Table(os.environ['ORDERS_TABLE'])

def lambda_handler(event, context):
    """
    Consumer Lambda — processes SQS messages with partial batch failure support.
    
    Returns batchItemFailures so only FAILED messages are retried,
    not the entire batch.
    """
    batch_item_failures = []

    for record in event['Records']:
        message_id = record['messageId']
        try:
            process_message(record)
            logger.info("Successfully processed: %s", message_id)

        except Exception as err:
            # Report ONLY this message as failed — others won't be retried
            logger.error("Failed to process %s: %s", message_id, str(err), exc_info=True)
            batch_item_failures.append({'itemIdentifier': message_id})

    # Return partial failure report
    # Empty list = all messages succeeded
    # Lambda deletes succeeded messages from queue automatically
    return {'batchItemFailures': batch_item_failures}


def process_message(record):
    """Process a single SQS record."""
    # Parse the message body
    body = json.loads(record['body'])
    order_id = body.get('orderId')
    user_id  = body.get('userId')
    amount   = body.get('amount', 0)

    if not order_id or not user_id:
        # Permanent failure — bad data. Don't retry (raise to move to DLQ after maxReceiveCount)
        raise ValueError(f"Invalid message: missing orderId or userId")

    # Idempotent write — use condition to avoid duplicate processing
    try:
        orders_table.put_item(
            Item={
                'PK': f'USER#{user_id}',
                'SK': f'ORDER#{order_id}',
                'orderId': order_id,
                'userId': user_id,
                'amount': amount,
                'status': 'RECEIVED',
                'sqsMessageId': record['messageId']
            },
            # Only write if item doesn't already exist — idempotency guard
            ConditionExpression='attribute_not_exists(PK)'
        )
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        # Item already exists — message was already processed. This is OK.
        logger.warning("Duplicate message ignored: orderId=%s", order_id)`,
            explanations: [
              { line: '13', text: 'ESM invokes Lambda with event.Records containing a batch of SQS messages. Batch size is configured in the ESM settings (1–10,000).' },
              { line: '25', text: 'Partial batch failure: catch per-message exceptions and add to batch_item_failures. Lambda will only retry failed messages, not the whole batch.' },
              { line: '33', text: 'Return {"batchItemFailures": []} format — required for partial failure to work. ESM must be configured with FunctionResponseTypes: ["ReportBatchItemFailures"].' },
              { line: '56', text: 'ConditionExpression attribute_not_exists(PK) makes the write idempotent — if the order already exists, DynamoDB raises ConditionalCheckFailedException instead of overwriting.' }
            ]
          }
        ],
        defaultLang: 'python-consumer',
        expectedOutput: '{\n  "batchItemFailures": [\n    {"itemIdentifier": "msg-002-bad-data"}\n  ]\n}\n\n-- CloudWatch Log --\nSuccessfully processed: msg-001\nFailed to process msg-002-bad-data: Invalid message'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'SQS CLI Commands',
      content: [
        {
          command: 'aws sqs send-message --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/orders-queue --message-body \'{"orderId":"ord-001","userId":"u-123","amount":59.99}\'',
          category: 'aws-cli',
          expectedOutput: '{\n  "MD5OfMessageBody": "a2b3c4d5e6f7g8h9i0j1",\n  "MessageId": "12345678-1234-1234-1234-123456789012"\n}',
          explanation: 'Sends a single message to an SQS queue. Returns the MessageId (unique per message) and MD5 hash for integrity verification.',
          interviewQ: 'How do you verify a message was not corrupted in transit using SQS?',
          onRun: () => '{\n  "MD5OfMessageBody": "a2b3c4d5e6f7g8h9",\n  "MessageId": "12345678-1234-1234-1234-123456789012"\n}'
        },
        {
          command: 'aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/orders-queue --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible VisibilityTimeout',
          category: 'aws-cli',
          expectedOutput: '{\n  "Attributes": {\n    "ApproximateNumberOfMessages": "42",\n    "ApproximateNumberOfMessagesNotVisible": "8",\n    "VisibilityTimeout": "30"\n  }\n}',
          explanation: 'ApproximateNumberOfMessages = messages available to consume. ApproximateNumberOfMessagesNotVisible = messages currently being processed (hidden by visibility timeout). Monitor both for queue health.',
          commonErrors: [
            { error: 'AWS.SimpleQueueService.NonExistentQueue', cause: 'Queue URL is incorrect or queue was deleted', fix: 'Verify queue URL with "aws sqs list-queues" and check region matches' }
          ],
          interviewQ: 'What does ApproximateNumberOfMessagesNotVisible indicate about your queue consumers?'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'SQS CLI Lab',
        mode: 'simulated',
        initialText: 'SQS CLI Lab. Try:\n  aws sqs list-queues\n  aws sqs get-queue-attributes --queue-url <url> --attribute-names All\n  aws sqs send-message --queue-url <url> --message-body "hello"\n  aws sqs receive-message --queue-url <url>',
        commands: {
          'aws sqs list-queues': {
            text: '{\n  "QueueUrls": [\n    "https://sqs.us-east-1.amazonaws.com/123456789012/orders-queue",\n    "https://sqs.us-east-1.amazonaws.com/123456789012/orders-dlq",\n    "https://sqs.us-east-1.amazonaws.com/123456789012/notifications-queue.fifo"\n  ]\n}',
            type: 'output'
          },
          'aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/orders-queue': {
            text: '{\n  "Messages": [{\n    "MessageId": "12345678-...",\n    "ReceiptHandle": "AQEB...",\n    "MD5OfBody": "a1b2c3...",\n    "Body": "{\\"orderId\\":\\"ord-001\\",\\"userId\\":\\"u-123\\"}"  \n  }]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common SQS Issues',
      content: {
        items: [
          { title: 'Messages processed multiple times', error: 'Duplicate message processing in consumer', cause: 'Standard queue at-least-once delivery, or Lambda timeout exceeds visibility timeout causing re-delivery.', fix: 'Make consumer idempotent (ConditionExpression on DynamoDB). Set visibility timeout = 6× Lambda timeout. Use ReportBatchItemFailures.' },
          { title: 'Messages stuck in DLQ not processing', error: 'DLQ depth increasing, messages not being redriven', cause: 'DLQ messages are not automatically retried. Consumer bug is causing all messages to fail.', fix: 'Fix the consumer bug first. Use SQS Dead-Letter Queue Redrive (console or CLI) to replay DLQ messages back to source queue after fix.' },
          { title: 'Lambda scaling too fast — downstream overwhelmed', error: 'Database or downstream API getting too many requests', cause: 'Lambda ESM scales aggressively — 60 new instances per minute. If downstream has limited capacity, it gets overwhelmed.', fix: 'Set reserved concurrency on consumer Lambda to limit max concurrent executions. Use Batch Size and Maximum Batching Window to control throughput.' },
          { title: 'Messages not appearing in queue', error: 'send_message returns 200 but messages not visible', cause: 'Message may be in flight or delayed by Delivery Delay setting. Queue policy may restrict source.', fix: 'Check ApproximateNumberOfMessagesNotVisible. Set message delay to 0 for immediate delivery. Verify IAM/queue policy allows sqs:SendMessage from the source.' }
        ]
      }
    },

    {
      id: 'quiz-sqs',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon SQS Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your Lambda consumer has a 5-minute (300s) timeout. What should you set the SQS visibility timeout to?',
            options: [
              { id: 'a', text: '300 seconds — match the Lambda timeout exactly' },
              { id: 'b', text: '30 seconds — always use the SQS default' },
              { id: 'c', text: '1800 seconds — set to 6× the Lambda timeout' },
              { id: 'd', text: 'Visibility timeout doesn\'t matter for Lambda ESM' }
            ],
            correctId: 'c',
            explanation: 'Visibility timeout must be at least 6× your Lambda timeout to prevent SQS from making the message visible again while Lambda is still processing it. For a 300s Lambda timeout: 300 × 6 = 1800 seconds. AWS recommends this exact formula.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'Lambda processes a batch of 10 SQS messages. Messages 3 and 7 fail to process. Without batchItemFailures configured, what happens?',
            options: [
              { id: 'a', text: 'Only messages 3 and 7 are retried; 1,2,4,5,6,8,9,10 are deleted' },
              { id: 'b', text: 'All 10 messages are retried because Lambda threw an exception' },
              { id: 'c', text: 'The entire batch is moved to the DLQ immediately' },
              { id: 'd', text: 'Messages are retried with exponential backoff' }
            ],
            correctId: 'b',
            explanation: 'Without ReportBatchItemFailures, if Lambda throws any exception, ALL messages in the batch return to the queue for retry — even the 8 that succeeded. This causes duplicate processing of successfully handled messages. Always implement batchItemFailures for SQS consumers.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'You need to process payment transactions in the exact order they were received. Which SQS queue type should you use?',
            options: [
              { id: 'a', text: 'Standard Queue with MessageDeduplicationId' },
              { id: 'b', text: 'FIFO Queue with MessageGroupId per user/account' },
              { id: 'c', text: 'Standard Queue with SQS delay queue' },
              { id: 'd', text: 'Standard Queue — ordering is guaranteed at high throughput' }
            ],
            correctId: 'b',
            explanation: 'FIFO queues guarantee strict ordering within a MessageGroup. For payments, use MessageGroupId = accountId so all transactions for the same account are processed in order. Standard queues provide best-effort ordering only and can deliver duplicates.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-sqs',
      type: 'challenge',
      title: 'Challenge: SQS Consumer with Partial Batch Failure',
      content: {
        title: 'Implement a Resilient SQS Consumer',
        description: 'Build an SQS consumer Lambda that processes order messages, persists them to DynamoDB, and correctly implements partial batch failure so only truly failed messages are retried.',
        difficulty: 'intermediate',
        requirements: [
          'Iterate over all records in event["Records"]',
          'For each record, parse the JSON body to extract orderId and userId',
          'Write the order to DynamoDB with status="RECEIVED"',
          'If processing fails, add messageId to batchItemFailures list',
          'Return {"batchItemFailures": [...]} — empty list if all succeeded',
          'Make the write idempotent using ConditionExpression'
        ],
        starterCode: `import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('TABLE_NAME', 'Orders'))

def lambda_handler(event, context):
    """
    SQS Consumer with Partial Batch Failure support.
    FunctionResponseTypes must include ReportBatchItemFailures in ESM config.
    """
    batch_item_failures = []

    for record in event.get('Records', []):
        # TODO: Get messageId from record
        # TODO: Parse body as JSON
        # TODO: Process the message (write to DynamoDB)
        # TODO: On failure, append {'itemIdentifier': messageId} to batch_item_failures
        pass

    # TODO: Return batchItemFailures response
    pass`,
        language: 'python',
        hints: [
          'record["messageId"] is the SQS message ID for batchItemFailures',
          'record["body"] is a JSON string — use json.loads()',
          'Use try/except per record, not around the whole loop',
          'Return {"batchItemFailures": batch_item_failures}',
          'DynamoDB idempotency: ConditionExpression="attribute_not_exists(PK)"'
        ],
        testCases: [
          { description: 'Iterates over event["Records"]', keywords: ['Records'], expectedOutput: 'Records' },
          { description: 'Parses record body as JSON', keywords: ['json.loads', 'body'], expectedOutput: 'json.loads' },
          { description: 'Catches exceptions per record', keywords: ['except'], expectedOutput: 'except' },
          { description: 'Appends itemIdentifier on failure', keywords: ['itemIdentifier'], expectedOutput: 'itemIdentifier' },
          { description: 'Returns batchItemFailures dict', keywords: ['batchItemFailures'], expectedOutput: 'batchItemFailures' }
        ]
      }
    },

    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: { title: 'Module 11: Amazon Cognito', url: 'module-11.html' },
        next: { title: 'Module 13: Amazon SNS', url: 'module-13.html' }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_12_DATA;
} else {
  window.MODULE_12_DATA = MODULE_12_DATA;
}
