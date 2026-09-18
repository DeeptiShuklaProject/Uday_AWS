/**
 * ============================================================
 * MODULE 09 — Amazon API Gateway
 * REST APIs, HTTP APIs, Lambda integration, auth, throttling
 * ============================================================
 */
const MODULE_09_DATA = {
  id: 'api-gateway-fundamentals',
  moduleId: 'module-09',
  title: 'Amazon API Gateway — Build & Manage APIs',
  description: 'Learn to build production REST and HTTP APIs with Amazon API Gateway. Covers Lambda proxy integration, authorizers, throttling, CORS, stage variables, and monitoring.',
  difficulty: 'intermediate',
  duration: '90 min',
  prerequisites: ['Module 08: AWS Lambda', 'HTTP fundamentals (GET, POST, PUT, DELETE)'],
  objectives: [
    'Explain the difference between REST API and HTTP API in API Gateway',
    'Configure Lambda Proxy Integration to handle HTTP requests in Lambda',
    'Implement API key authentication and Lambda authorizers',
    'Set up CORS for browser-based clients',
    'Configure usage plans, throttling, and rate limits',
    'Deploy APIs to named stages (dev, staging, prod)',
    'Monitor API health with CloudWatch metrics and X-Ray tracing'
  ],

  sections: [
    // ===== WHY API GATEWAY =====
    {
      id: 'why-api-gateway',
      type: 'why',
      title: 'Why API Gateway?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🌐</span>
            <div class="alert-content">
              <div class="alert-title">The "Front Door" for Serverless APIs</div>
              <div class="alert-text">API Gateway acts as the front door for your Lambda functions. It handles HTTP routing, authentication, throttling, SSL termination, and request/response transformation — so your Lambda doesn't have to.</div>
            </div>
          </div>
          <p>Without API Gateway, you'd need a web server (EC2, ECS) to route HTTP traffic to Lambda functions, manage TLS certificates, enforce rate limits, and handle CORS. API Gateway provides all of this as a managed service.</p>
          <table>
            <thead><tr><th>Feature</th><th>REST API</th><th>HTTP API</th></tr></thead>
            <tbody>
              <tr><td>Latency</td><td>~6ms added</td><td>~1ms added (60% faster)</td></tr>
              <tr><td>Cost</td><td>$3.50 / million requests</td><td>$1.00 / million requests (71% cheaper)</td></tr>
              <tr><td>Lambda Authorizer</td><td>✅ Full control</td><td>✅ Simplified (v2 payload)</td></tr>
              <tr><td>JWT Authorizer</td><td>❌ DIY in Lambda</td><td>✅ Native Cognito/Auth0</td></tr>
              <tr><td>Request Validation</td><td>✅ Schema validation</td><td>❌ Manually in Lambda</td></tr>
              <tr><td>Caching</td><td>✅ Per-stage caching</td><td>❌ Not supported</td></tr>
              <tr><td>Usage Plans</td><td>✅ API keys + quotas</td><td>❌ Not supported</td></tr>
              <tr><td>WebSocket</td><td>✅ Separate WebSocket API</td><td>❌ Not supported</td></tr>
            </tbody>
          </table>
          <div class="alert alert-tip">
            <span class="alert-icon">💡</span>
            <div class="alert-content">
              <div class="alert-title">Which should you choose?</div>
              <div class="alert-text">Choose <strong>HTTP API</strong> for new projects — it's faster, cheaper, and has native JWT auth. Choose <strong>REST API</strong> only if you need request validation, caching, API key usage plans, or WAF integration.</div>
            </div>
          </div>
        `
      }
    },

    // ===== ARCHITECTURE DIAGRAM =====
    {
      id: 'architecture',
      type: 'architecture',
      title: 'API Gateway Architecture',
      content: {
        title: 'API Gateway → Lambda Request Flow',
        width: 750,
        height: 280,
        nodes: [
          { id: 'browser', label: 'Browser/App', icon: '🌍', x: 10, y: 110, type: 'client', description: 'Client sends an HTTP request (GET /products) to the API Gateway endpoint URL.' },
          { id: 'waf', label: 'AWS WAF', icon: '🛡️', x: 155, y: 20, type: 'security', description: 'Optional: AWS WAF inspects requests for SQL injection, XSS, and IP-based rules before they reach API Gateway.' },
          { id: 'apigw', label: 'API Gateway', icon: '🌐', x: 155, y: 110, type: 'trigger', description: 'API Gateway matches the route (GET /products), checks throttle limits, validates the request, runs the authorizer, and constructs the Lambda event.', eventPayload: { httpMethod: 'GET', path: '/products', headers: { Authorization: 'Bearer token...' }, queryStringParameters: { category: 'electronics' } } },
          { id: 'authorizer', label: 'Lambda Auth', icon: '🔐', x: 300, y: 20, type: 'security', description: 'Optional Lambda Authorizer validates the JWT/API key and returns an IAM policy. The result is cached for configurable TTL.' },
          { id: 'lambda', label: 'Lambda', icon: '⚡', x: 430, y: 110, type: 'compute', description: 'Lambda receives the full event object including path, headers, body, and context. For proxy integration, it handles routing internally.', eventPayload: { statusCode: 200, body: '[{"id":"p1","name":"Laptop"}]', headers: { 'Content-Type': 'application/json' } } },
          { id: 'dynamo', label: 'DynamoDB', icon: '🗄️', x: 590, y: 110, type: 'storage', description: 'Lambda queries DynamoDB using the AWS SDK. Results are returned to Lambda, serialized to JSON, and sent back via API Gateway.' },
          { id: 'xray', label: 'X-Ray', icon: '📊', x: 430, y: 210, type: 'monitoring', description: 'AWS X-Ray traces the full request across API Gateway, Lambda, and DynamoDB, showing latency breakdowns and errors.' }
        ],
        edges: [
          { from: 'browser', to: 'apigw', label: 'HTTPS', animated: true },
          { from: 'apigw', to: 'waf', label: 'Inspect' },
          { from: 'apigw', to: 'authorizer', label: 'Auth Check' },
          { from: 'apigw', to: 'lambda', label: 'Proxy Event', animated: true },
          { from: 'lambda', to: 'dynamo', label: 'Query', animated: true },
          { from: 'lambda', to: 'xray', label: 'Trace' }
        ]
      }
    },

    // ===== CORE CONCEPTS =====
    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Lambda Proxy Integration</h4>
          <p>The most common integration mode. API Gateway passes the <strong>entire HTTP request</strong> as a JSON event to your Lambda function. Your Lambda is responsible for parsing the route, query string, body, and returning a response with statusCode, headers, and body.</p>

          <h4>2. Stages</h4>
          <p>A stage is a named reference to a deployment of your API (e.g., <code>dev</code>, <code>staging</code>, <code>prod</code>). Each stage has its own URL, settings, and stage variables. You can configure different Lambda function aliases per stage.</p>

          <h4>3. Resource & Method</h4>
          <p>Resources are URL paths (<code>/users</code>, <code>/users/{id}</code>). Methods are HTTP verbs (GET, POST, PUT, DELETE) attached to resources. Each method has an integration type, request/response mapping, and authorization settings.</p>

          <h4>4. Authorizers</h4>
          <ul>
            <li><strong>No Auth</strong> — Public endpoints</li>
            <li><strong>API Key</strong> — Usage plan-based rate limiting (not secure auth)</li>
            <li><strong>IAM Auth</strong> — SigV4-signed requests for AWS clients</li>
            <li><strong>Lambda Authorizer</strong> — Custom logic: JWT, OAuth, LDAP</li>
            <li><strong>Cognito Authorizer</strong> — Cognito user pool JWT validation</li>
          </ul>

          <h4>5. Throttling</h4>
          <p>API Gateway enforces two levels:</p>
          <ul>
            <li><strong>Account-level</strong>: 10,000 RPS steady, 5,000 burst</li>
            <li><strong>Method-level</strong>: Custom rate + burst via usage plans</li>
          </ul>
          <p>Throttled requests return HTTP 429 Too Many Requests.</p>

          <h4>6. Mapping Templates (REST API only)</h4>
          <p>Velocity Template Language (VTL) templates that transform request/response bodies between API Gateway and Lambda without code changes.</p>
        `
      }
    },

    // ===== LAMBDA HANDLER FOR API GATEWAY =====
    {
      id: 'lambda-code',
      type: 'code',
      title: 'Lambda Handler for API Gateway',
      content: {
        title: 'REST API — Lambda Proxy Integration Handler',
        languages: [
          {
            id: 'python',
            label: 'Python',
            code: `import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client globally (warm start optimization)
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Products')

# Route handler registry — decouples routing from business logic
ROUTES = {}

def route(method, path):
    """Decorator to register route handlers."""
    def decorator(func):
        ROUTES[f"{method}:{path}"] = func
        return func
    return decorator

@route('GET', '/products')
def list_products(event):
    response = table.scan()
    return 200, response['Items']

@route('POST', '/products')
def create_product(event):
    body = json.loads(event.get('body') or '{}')
    if not body.get('name'):
        return 400, {'error': 'name is required'}
    table.put_item(Item=body)
    return 201, body

def lambda_handler(event, context):
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    route_key = f"{method}:{path}"

    logger.info("Route: %s | Request: %s", route_key, context.aws_request_id)

    handler = ROUTES.get(route_key)
    if not handler:
        return build_response(404, {'error': f"Route {route_key} not found"})

    try:
        status, body = handler(event)
        return build_response(status, body)
    except Exception as err:
        logger.error("Route error: %s", str(err), exc_info=True)
        return build_response(500, {'error': 'Internal Server Error'})

def build_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',      # CORS
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
        },
        'body': json.dumps(body, default=str)
    }`,
            explanations: [
              { line: '10-11', text: 'DynamoDB resource initialized OUTSIDE the handler. Reused across warm invocations — avoids re-creating boto3 session and connection pool on every request.' },
              { line: '14-19', text: 'Decorator-based routing registry. Maps "METHOD:/path" keys to handler functions. Keeps lambda_handler clean and handlers unit-testable in isolation.' },
              { line: '26', text: 'event.get("body") returns the raw HTTP request body as a string (or None for GET requests). Always use or "{}") to safely handle no-body requests.' },
              { line: '36-38', text: 'event["httpMethod"] = GET/POST/PUT/DELETE. event["path"] = /products. Build a composite key to look up the handler.' },
              { line: '49-53', text: 'build_response always returns the 3 required fields for API Gateway proxy integration. Access-Control-Allow-Origin: * enables CORS for all origins.' }
            ]
          },
          {
            id: 'nodejs',
            label: 'Node.js',
            code: `const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

const routes = {
  'GET:/products': listProducts,
  'POST:/products': createProduct,
};

async function listProducts(event) {
  const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();
  return [200, result.Items];
}

async function createProduct(event) {
  const body = JSON.parse(event.body || '{}');
  if (!body.name) return [400, { error: 'name is required' }];
  await dynamodb.put({ TableName: TABLE_NAME, Item: body }).promise();
  return [201, body];
}

exports.handler = async (event, context) => {
  const routeKey = \`\${event.httpMethod}:\${event.path}\`;
  const handler = routes[routeKey];
  if (!handler) return buildResponse(404, { error: 'Route not found' });

  try {
    const [status, body] = await handler(event);
    return buildResponse(status, body);
  } catch (err) {
    console.error(err);
    return buildResponse(500, { error: 'Internal Server Error' });
  }
};

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body)
});`
          }
        ],
        defaultLang: 'python',
        expectedOutput: '{\n  "statusCode": 200,\n  "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },\n  "body": "[{\\"id\\":\\"p1\\",\\"name\\":\\"Laptop\\",\\"price\\":999}]"\n}'
      }
    },

    // ===== CLI COMMANDS =====
    {
      id: 'cli-commands',
      type: 'command',
      title: 'API Gateway CLI Commands',
      content: [
        {
          command: 'aws apigateway get-rest-apis --region us-east-1',
          category: 'aws-cli',
          expectedOutput: '{\n  "items": [\n    {\n      "id": "abc123xyz",\n      "name": "products-api",\n      "createdDate": "2026-09-01T10:00:00+00:00",\n      "apiKeySource": "HEADER",\n      "endpointConfiguration": { "types": ["REGIONAL"] }\n    }\n  ]\n}',
          explanation: 'Lists all REST APIs in a region. The "id" field is needed for most other API Gateway CLI commands.',
          interviewQ: 'What is the difference between a regional and edge-optimized API Gateway endpoint?',
          onRun: () => '{\n  "items": [{\n    "id": "abc123xyz",\n    "name": "products-api",\n    "createdDate": "2026-09-01T10:00:00+00:00"\n  }]\n}'
        },
        {
          command: 'aws apigatewayv2 create-api --name "products-http-api" --protocol-type HTTP --target "arn:aws:lambda:us-east-1:123456789012:function:products-fn"',
          category: 'aws-cli',
          expectedOutput: '{\n  "ApiId": "xyz789abc",\n  "ApiEndpoint": "https://xyz789abc.execute-api.us-east-1.amazonaws.com",\n  "Name": "products-http-api",\n  "ProtocolType": "HTTP",\n  "RouteSelectionExpression": "$request.method $request.path"\n}',
          explanation: 'Creates an HTTP API (v2) with a quick-create integration. The --target automatically creates a route $default → Lambda integration. This is the fastest way to expose a Lambda via HTTP.',
          commonErrors: [
            { error: 'AccessDeniedException', cause: 'Missing apigateway:POST permission', fix: 'Attach AmazonAPIGatewayAdministrator policy or specific apigateway:* permissions' }
          ],
          interviewQ: 'When would you use API Gateway HTTP API vs REST API?'
        }
      ]
    },

    // ===== TERMINAL =====
    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'API Gateway CLI Lab',
        mode: 'simulated',
        initialText: 'API Gateway CLI Lab. Try:\n  aws apigateway get-rest-apis\n  aws apigatewayv2 get-apis\n  aws apigateway get-stages --rest-api-id abc123xyz\n  curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/products',
        commands: {
          'aws apigateway get-rest-apis': {
            text: '{\n  "items": [{\n    "id": "abc123xyz",\n    "name": "products-api",\n    "createdDate": "2026-09-01T10:00:00+00:00",\n    "endpointConfiguration": { "types": ["REGIONAL"] }\n  }]\n}',
            type: 'output'
          },
          'aws apigatewayv2 get-apis': {
            text: '{\n  "Items": [{\n    "ApiId": "xyz789abc",\n    "Name": "products-http-api",\n    "ProtocolType": "HTTP",\n    "ApiEndpoint": "https://xyz789abc.execute-api.us-east-1.amazonaws.com"\n  }]\n}',
            type: 'output'
          },
          'aws apigateway get-stages --rest-api-id abc123xyz': {
            text: '{\n  "item": [{\n    "stageName": "prod",\n    "methodSettings": {},\n    "defaultRouteSettings": { "ThrottlingBurstLimit": 5000, "ThrottlingRateLimit": 10000 },\n    "deploymentId": "deploy123"\n  }]\n}',
            type: 'output'
          },
          'curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/products': {
            text: '[{"id":"p1","name":"Laptop","price":999},{"id":"p2","name":"Mouse","price":29}]',
            type: 'success'
          }
        }
      }
    },

    // ===== TROUBLESHOOTING =====
    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common API Gateway Issues',
      content: {
        items: [
          { title: 'CORS Error in Browser', error: 'Access-Control-Allow-Origin header missing', cause: 'Lambda response does not include CORS headers, or the OPTIONS preflight method is not configured.', fix: 'Add "Access-Control-Allow-Origin": "*" to every Lambda response. For REST API, enable CORS on the resource in console or add OPTIONS method with mock integration.' },
          { title: '502 Bad Gateway', error: '{"message": "Internal server error"} with 502', cause: 'Lambda returned an invalid proxy response. The response must have statusCode (int) and body (string).', fix: 'Ensure your Lambda returns: { statusCode: 200, body: JSON.stringify(data) }. statusCode must be an integer, body must be a string.' },
          { title: '403 Forbidden — Missing API Key', error: '{"message": "Forbidden"}', cause: 'API method requires an API key but the x-api-key header is missing.', fix: 'Include x-api-key: <your-api-key> header in the request. Retrieve the key from API Gateway → API Keys.' },
          { title: '429 Too Many Requests', error: '{"message": "Too Many Requests"}', cause: 'Request rate exceeds account limit (10,000 RPS) or usage plan limit.', fix: 'Increase usage plan rate/quota, or implement client-side exponential backoff.' },
          { title: 'Lambda Invocation Error: execution failed', error: 'Lambda integration response has unexpected format', cause: 'Lambda threw an unhandled exception — the response body is the error object, not a proxy response.', fix: 'Wrap your handler in try/catch and always return a properly formatted response object, even on errors.' }
        ]
      }
    },

    // ===== QUIZ =====
    {
      id: 'quiz-api-gw',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'API Gateway Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your browser app gets a CORS error when calling your API Gateway endpoint. Your Lambda and API Gateway are correctly configured. What is the most likely cause?',
            options: [
              { id: 'a', text: 'Lambda timeout is too short' },
              { id: 'b', text: 'Lambda response is missing Access-Control-Allow-Origin header' },
              { id: 'c', text: 'API Gateway does not support CORS' },
              { id: 'd', text: 'The API is not deployed to a stage' }
            ],
            correctId: 'b',
            explanation: 'With Lambda proxy integration, API Gateway passes the Lambda response directly to the browser. If your Lambda does not include the CORS headers in its response object, the browser will block the response. Always include Access-Control-Allow-Origin in every Lambda response.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'A Lambda function is returning 502 from API Gateway even though it runs successfully. What is the most likely cause?',
            options: [
              { id: 'a', text: 'The function execution time exceeded the API Gateway timeout (29 seconds)' },
              { id: 'b', text: 'The Lambda IAM role lacks API Gateway invoke permissions' },
              { id: 'c', text: 'Lambda returned a response missing statusCode or with a non-integer statusCode' },
              { id: 'd', text: 'The API is missing a Usage Plan' }
            ],
            correctId: 'c',
            explanation: 'A 502 Bad Gateway from API Gateway almost always means Lambda returned an invalid proxy integration response. The response MUST have a numeric statusCode field (integer) and body must be a string. If body is an object (not JSON.stringify\'d), API Gateway returns 502.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'You need to add JWT authentication to your HTTP API without writing a Lambda authorizer. What is the best approach?',
            options: [
              { id: 'a', text: 'Use API key authentication' },
              { id: 'b', text: 'Use HTTP API native JWT authorizer with Cognito or Auth0' },
              { id: 'c', text: 'Parse and validate JWT manually in every Lambda function' },
              { id: 'd', text: 'Switch to REST API to get Lambda authorizer support' }
            ],
            correctId: 'b',
            explanation: 'HTTP API (v2) has a built-in JWT authorizer that natively validates tokens from any OIDC/OAuth2 provider (Cognito, Auth0, Okta) without code. You just configure the issuer URL and audience. This is faster and cheaper than a Lambda authorizer.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    // ===== CHALLENGE =====
    {
      id: 'challenge-products-api',
      type: 'challenge',
      title: 'Challenge: Build a Products API Handler',
      content: {
        title: 'Products REST API — Lambda Handler',
        description: 'Build a Lambda handler for a Products REST API that handles GET /products (list) and POST /products (create) with proper CORS headers and error handling.',
        difficulty: 'intermediate',
        requirements: [
          'Handle GET /products — return all products from a mock list',
          'Handle POST /products — parse body and add to products list',
          'Return 405 Method Not Allowed for unsupported methods',
          'Include CORS headers in every response',
          'Return a 400 if POST body is missing the "name" field',
          'Build responses using a helper function'
        ],
        starterCode: `import json

PRODUCTS = [
    {"id": "1", "name": "Laptop", "price": 999},
    {"id": "2", "name": "Mouse", "price": 29}
]

def lambda_handler(event, context):
    # TODO: Implement routing
    method = event.get('httpMethod')
    path = event.get('path')
    pass

def build_response(status_code, body):
    # TODO: Return proper proxy integration response with CORS headers
    pass`,
        language: 'python',
        hints: [
          'Check event["httpMethod"] to determine GET vs POST',
          'For POST, parse event["body"] with json.loads()',
          'build_response must return { statusCode, headers, body } where body is json.dumps()',
          'CORS header: "Access-Control-Allow-Origin": "*"'
        ],
        testCases: [
          { description: 'Returns build_response helper function', keywords: ['build_response'], expectedOutput: 'build_response' },
          { description: 'Handles GET method', keywords: ['GET'], expectedOutput: 'GET' },
          { description: 'Handles POST method', keywords: ['POST'], expectedOutput: 'POST' },
          { description: 'Includes statusCode in response', keywords: ['statusCode'], expectedOutput: 'statusCode' },
          { description: 'Includes CORS headers', keywords: ['Access-Control-Allow-Origin'], expectedOutput: 'Access-Control-Allow-Origin' },
          { description: 'Returns 400 for missing fields', keywords: ['400'], expectedOutput: '400' }
        ]
      }
    },

    // ===== NEXT =====
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 15: AWS Lambda', url: 'module-08.html' }, next: { title: 'Chapter 17: Amazon DynamoDB', url: 'module-10.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_09_DATA;
} else {
  window.MODULE_09_DATA = MODULE_09_DATA;
}
