/**
 * ============================================================
 * MODULE 37 — Amazon Bedrock & GenAI — Foundation Models
 * ============================================================
 */
const MODULE_37_DATA = {
  id: 'bedrock-runtime-fundamentals',
  moduleId: 'module-37',
  title: 'Amazon Bedrock & GenAI — Foundation Models',
  description: 'Master generative AI on AWS. Covers foundation models (Claude, Titan, Llama), InvokeModel API, knowledge bases, RAG, agents, guardrails, and prompt engineering.',
  difficulty: 'advanced',
  duration: '75 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 02: Amazon S3'],
  objectives: [
    'Understand Amazon Bedrock architecture and supported foundation models',
    'Call InvokeModel API with Claude, Titan, and Llama models',
    'Build Knowledge Bases for Retrieval-Augmented Generation (RAG)',
    'Configure Guardrails for content filtering and safety',
    'Create Bedrock Agents with action groups and knowledge bases',
    'Monitor token usage and optimize costs'
  ],

  sections: [
    {
      id: 'why-bedrock',
      type: 'why',
      title: 'Why Bedrock?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🤖</span>
            <div class="alert-content">
              <div class="alert-title">Build Generative AI Applications with Foundation Models</div>
              <div class="alert-text">Amazon Bedrock provides API access to leading foundation models (Claude, Titan, Llama, Stable Diffusion) without managing infrastructure. Add GenAI to your apps with a single API call.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Feature</th><th>Bedrock</th><th>SageMaker</th><th>OpenAI API</th></tr></thead>
            <tbody>
              <tr><td><strong>Model Choice</strong></td><td>Claude, Titan, Llama, Mistral</td><td>Custom + hosted</td><td>GPT-4, o1</td></tr>
              <tr><td><strong>Infrastructure</strong></td><td>Fully managed</td><td>You manage instances</td><td>Fully managed</td></tr>
              <tr><td><strong>Data Privacy</strong></td><td>Data stays in AWS, not used for training</td><td>Your control</td><td>Shared infra</td></tr>
              <tr><td><strong>Integration</strong></td><td>AWS native (IAM, VPC, CloudWatch)</td><td>AWS native</td><td>External API</td></tr>
              <tr><td><strong>Fine-Tuning</strong></td><td>Supported (Titan, Llama)</td><td>Full control</td><td>Limited</td></tr>
              <tr><td><strong>Pricing</strong></td><td>Per token (input + output)</td><td>Instance hours</td><td>Per token</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Bedrock Charges Per Token — Monitor Usage</div>
              <div class="alert-text">Each InvokeModel call is charged per input + output token. Claude 3 Sonnet: ~$3/1M input tokens, ~$15/1M output tokens. Use Provisioned Throughput for predictable costs at scale. Always log token counts.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Bedrock Architecture',
      content: {
        title: 'App → Bedrock InvokeModel → Foundation Model',
        width: 750,
        height: 300,
        nodes: [
          { id: 'app', label: 'Application', icon: '🖥️', x: 10, y: 130, type: 'compute', description: 'Your app (Lambda, ECS, EC2) calls the Bedrock InvokeModel API with a prompt and model ID.' },
          { id: 'br', label: 'Amazon Bedrock', icon: '🤖', x: 220, y: 130, type: 'trigger', description: 'Fully managed service. Routes requests to the selected foundation model. Handles scaling, security, and billing.' },
          { id: 'claude', label: 'Claude (Anthropic)', icon: '🧠', x: 450, y: 20, type: 'compute', description: 'Best for reasoning, analysis, coding, and instruction following. Models: Haiku (fast), Sonnet (balanced), Opus (most capable).' },
          { id: 'titan', label: 'Titan (AWS)', icon: '📝', x: 450, y: 130, type: 'compute', description: 'AWS-native models. Titan Text for generation, Titan Embeddings for RAG vector embeddings, Titan Image for image generation.' },
          { id: 'llama', label: 'Llama (Meta)', icon: '🦙', x: 450, y: 240, type: 'compute', description: 'Open-source models from Meta. Good for general tasks. Available for fine-tuning on your data.' },
          { id: 'kb', label: 'Knowledge Base', icon: '📚', x: 220, y: 260, type: 'storage', description: 'RAG pipeline: S3 documents → chunked → embedded → stored in OpenSearch. Bedrock retrieves relevant chunks during queries to ground model responses.' }
        ],
        edges: [
          { from: 'app', to: 'br', label: 'InvokeModel', animated: true },
          { from: 'br', to: 'claude', label: 'Route' },
          { from: 'br', to: 'titan', label: 'Route' },
          { from: 'br', to: 'llama', label: 'Route' },
          { from: 'app', to: 'kb', label: 'RetrieveAndGenerate' },
          { from: 'kb', to: 'br', label: 'Context + Query', animated: true }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. InvokeModel API</h4>
          <p>The core API call. Each model provider has a different request/response format:</p>
          <table>
            <thead><tr><th>Provider</th><th>Model</th><th>Body Format</th></tr></thead>
            <tbody>
              <tr><td><strong>Anthropic</strong></td><td>Claude 3 Sonnet/Haiku/Opus</td><td>Messages API with anthropic_version header</td></tr>
              <tr><td><strong>AWS</strong></td><td>Titan Text / Embeddings</td><td>inputText field</td></tr>
              <tr><td><strong>Meta</strong></td><td>Llama 3</td><td>prompt field with special tokens</td></tr>
              <tr><td><strong>Mistral</strong></td><td>Mistral / Mixtral</td><td>prompt field</td></tr>
              <tr><td><strong>Stability AI</strong></td><td>Stable Diffusion XL</td><td>text_prompts array (image generation)</td></tr>
            </tbody>
          </table>

          <h4>2. Knowledge Bases (RAG)</h4>
          <p><strong>Retrieval-Augmented Generation</strong> grounds model responses in your documents:</p>
          <ul>
            <li><strong>Step 1:</strong> Upload documents to S3 (PDF, TXT, HTML, MD, DOCX)</li>
            <li><strong>Step 2:</strong> Bedrock chunks documents and creates vector embeddings using Titan Embeddings</li>
            <li><strong>Step 3:</strong> Embeddings stored in OpenSearch Serverless (vector database)</li>
            <li><strong>Step 4:</strong> At query time, Bedrock retrieves relevant chunks and passes them as context to the FM</li>
          </ul>
          <p>This reduces hallucinations and ensures answers are grounded in your actual data.</p>

          <h4>3. Guardrails</h4>
          <table>
            <thead><tr><th>Feature</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td><strong>Content Filters</strong></td><td>Block hate, violence, sexual content, insults (configurable threshold)</td></tr>
              <tr><td><strong>Denied Topics</strong></td><td>Block responses about specific topics (e.g., competitor products)</td></tr>
              <tr><td><strong>Word Filters</strong></td><td>Block specific words or phrases in input/output</td></tr>
              <tr><td><strong>PII Filters</strong></td><td>Detect and redact PII (SSN, email, phone) in responses</td></tr>
              <tr><td><strong>Contextual Grounding</strong></td><td>Ensure responses are grounded in provided context (RAG)</td></tr>
            </tbody>
          </table>

          <h4>4. Bedrock Agents</h4>
          <p>Agents use foundation models to <strong>reason about tasks and take actions</strong>:</p>
          <ul>
            <li>Define <strong>action groups</strong> — Lambda functions the agent can call</li>
            <li>Attach <strong>knowledge bases</strong> — for information retrieval</li>
            <li>The agent uses <strong>ReAct (Reasoning + Acting)</strong> to decide what to do</li>
            <li>Supports <strong>multi-step orchestration</strong> — agent calls multiple tools in sequence</li>
          </ul>

          <h4>5. Token Pricing (Key Models)</h4>
          <table>
            <thead><tr><th>Model</th><th>Input (per 1M tokens)</th><th>Output (per 1M tokens)</th></tr></thead>
            <tbody>
              <tr><td><strong>Claude 3 Haiku</strong></td><td>$0.25</td><td>$1.25</td></tr>
              <tr><td><strong>Claude 3 Sonnet</strong></td><td>$3.00</td><td>$15.00</td></tr>
              <tr><td><strong>Claude 3 Opus</strong></td><td>$15.00</td><td>$75.00</td></tr>
              <tr><td><strong>Titan Text Lite</strong></td><td>$0.15</td><td>$0.20</td></tr>
              <tr><td><strong>Llama 3 70B</strong></td><td>$2.65</td><td>$3.50</td></tr>
            </tbody>
          </table>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'Bedrock Boto3 Operations',
      content: {
        title: 'InvokeModel & Knowledge Bases',
        languages: [
          {
            id: 'python-bedrock',
            label: 'Claude + Titan Embeddings',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock = boto3.client('bedrock-runtime')
bedrock_agent = boto3.client('bedrock-agent-runtime')

def invoke_claude(prompt, max_tokens=1024, temperature=0.7):
    """Invoke Claude 3 Sonnet via Bedrock."""
    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-sonnet-20240229-v1:0',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': max_tokens,
            'temperature': temperature
        }),
        contentType='application/json'
    )
    result = json.loads(response['body'].read())
    text = result['content'][0]['text']
    tokens_in = result['usage']['input_tokens']
    tokens_out = result['usage']['output_tokens']
    logger.info("Claude: %d input + %d output tokens", tokens_in, tokens_out)
    return {'text': text, 'input_tokens': tokens_in, 'output_tokens': tokens_out}


def invoke_titan_embedding(text):
    """Generate vector embeddings using Titan Embeddings V2."""
    response = bedrock.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        body=json.dumps({'inputText': text}),
        contentType='application/json'
    )
    result = json.loads(response['body'].read())
    embedding = result['embedding']
    logger.info("Embedding dimension: %d", len(embedding))
    return embedding


def retrieve_and_generate(knowledge_base_id, query, model_arn):
    """RAG: Retrieve from knowledge base and generate response."""
    response = bedrock_agent.retrieve_and_generate(
        input={'text': query},
        retrieveAndGenerateConfiguration={
            'type': 'KNOWLEDGE_BASE',
            'knowledgeBaseConfiguration': {
                'knowledgeBaseId': knowledge_base_id,
                'modelArn': model_arn
            }
        }
    )
    answer = response['output']['text']
    citations = response.get('citations', [])
    logger.info("RAG response with %d citations", len(citations))
    return {'answer': answer, 'citations': citations}`,
            explanations: [
              { line: '13-22', text: 'invoke_model with Claude. Each provider has a different body format. Claude requires anthropic_version and uses the Messages API. Temperature controls randomness (0 = deterministic, 1 = creative).' },
              { line: '23-27', text: 'Parse the response. Usage object tracks input/output token counts — essential for cost monitoring. Log these in production to track spending.' },
              { line: '33-37', text: 'Titan Embeddings converts text to a 1024-dimension vector. Use these embeddings for similarity search in OpenSearch or other vector databases for RAG.' },
              { line: '45-56', text: 'retrieve_and_generate is the RAG API. It retrieves relevant chunks from a knowledge base, adds them as context, and generates a grounded response. Citations trace which source documents were used.' }
            ]
          }
        ],
        defaultLang: 'python-bedrock',
        expectedOutput: 'Claude: 15 input + 245 output tokens\nEmbedding dimension: 1024\nRAG response with 3 citations'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'Bedrock CLI Commands',
      content: [
        {
          command: 'aws bedrock list-foundation-models --by-provider Anthropic --query "modelSummaries[].{id:modelId,name:modelName}"',
          category: 'aws-cli',
          expectedOutput: '[\n  {"id": "anthropic.claude-3-haiku-20240307-v1:0", "name": "Claude 3 Haiku"},\n  {"id": "anthropic.claude-3-sonnet-20240229-v1:0", "name": "Claude 3 Sonnet"},\n  {"id": "anthropic.claude-3-opus-20240229-v1:0", "name": "Claude 3 Opus"}\n]',
          explanation: 'Lists available Anthropic models. You must request model access in the Bedrock Console first before you can invoke them.',
          interviewQ: 'What is the difference between Claude 3 Haiku, Sonnet, and Opus?'
        },
        {
          command: 'aws bedrock-agent list-knowledge-bases',
          category: 'aws-cli',
          expectedOutput: '{\n  "knowledgeBaseSummaries": [{\n    "knowledgeBaseId": "KB123",\n    "name": "product-docs",\n    "status": "ACTIVE",\n    "updatedAt": "2026-09-15T10:00:00Z"\n  }]\n}',
          explanation: 'Lists all knowledge bases. Each KB has a data source (S3), vector store (OpenSearch Serverless), and embedding model (Titan).'
        },
        {
          command: 'aws bedrock get-model-invocation-logging-configuration',
          category: 'aws-cli',
          expectedOutput: '{\n  "loggingConfig": {\n    "cloudWatchConfig": {"logGroupName": "/aws/bedrock/model-invocation-logs"},\n    "s3Config": {"bucketName": "bedrock-logs-bucket"}\n  }\n}',
          explanation: 'Check if model invocation logging is enabled. Essential for auditing prompts, responses, and tracking costs.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'Bedrock CLI Lab',
        mode: 'simulated',
        initialText: 'Bedrock CLI Lab. Try:\n  aws bedrock list-foundation-models --by-provider Anthropic\n  aws bedrock-agent list-knowledge-bases\n  aws bedrock list-custom-models',
        commands: {
          'aws bedrock list-foundation-models --by-provider Anthropic': {
            text: '{\n  "modelSummaries": [\n    {"modelId": "anthropic.claude-3-haiku-20240307-v1:0", "modelName": "Claude 3 Haiku", "providerName": "Anthropic", "inputModalities": ["TEXT"], "outputModalities": ["TEXT"]},\n    {"modelId": "anthropic.claude-3-sonnet-20240229-v1:0", "modelName": "Claude 3 Sonnet", "providerName": "Anthropic", "inputModalities": ["TEXT", "IMAGE"], "outputModalities": ["TEXT"]},\n    {"modelId": "anthropic.claude-3-opus-20240229-v1:0", "modelName": "Claude 3 Opus", "providerName": "Anthropic", "inputModalities": ["TEXT", "IMAGE"], "outputModalities": ["TEXT"]}\n  ]\n}',
            type: 'output'
          },
          'aws bedrock-agent list-knowledge-bases': {
            text: '{\n  "knowledgeBaseSummaries": [\n    {"knowledgeBaseId": "KB123", "name": "product-docs", "status": "ACTIVE", "description": "Product documentation for RAG"},\n    {"knowledgeBaseId": "KB456", "name": "support-articles", "status": "ACTIVE", "description": "Customer support knowledge base"}\n  ]\n}',
            type: 'output'
          },
          'aws bedrock list-custom-models': {
            text: '{\n  "modelSummaries": [\n    {"modelName": "fine-tuned-support", "modelArn": "arn:aws:bedrock:us-east-1:123456789012:custom-model/fine-tuned-support", "baseModelId": "amazon.titan-text-lite-v1"}\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common Bedrock Issues',
      content: {
        items: [
          {
            title: 'AccessDeniedException for InvokeModel',
            error: 'AccessDeniedException: User is not authorized to perform bedrock:InvokeModel',
            cause: 'Two possible causes: (1) Model access not enabled in the Bedrock Console, or (2) IAM policy missing bedrock:InvokeModel permission.',
            fix: 'Step 1: Go to Bedrock Console → Model access → Request access for the desired models. Step 2: Add bedrock:InvokeModel to your IAM policy with Resource: * or the specific model ARN.'
          },
          {
            title: 'ThrottlingException: Rate exceeded',
            error: 'ThrottlingException: Too many requests',
            cause: 'On-demand Bedrock has per-model rate limits (tokens per minute and requests per minute). High-volume apps can hit these limits.',
            fix: 'Implement exponential backoff with retries. For sustained high throughput, purchase Provisioned Throughput (dedicated capacity). Monitor with CloudWatch metrics: InvocationCount, InvocationThrottles.'
          },
          {
            title: 'ModelNotReadyException',
            error: 'ModelNotReadyException: Model is not ready for inference',
            cause: 'The model is still being provisioned or the custom/fine-tuned model has not finished training.',
            fix: 'Wait and retry. For custom models, check the training job status: aws bedrock get-model-customization-job. Provisioned throughput models take 5-30 minutes to become active.'
          },
          {
            title: 'Knowledge Base returns irrelevant results',
            error: 'RAG responses are not grounded in the correct documents',
            cause: 'Poor chunking strategy, wrong embedding model, or documents not synced after update.',
            fix: 'Re-sync the data source: aws bedrock-agent start-ingestion-job. Adjust chunk size (300-500 tokens recommended). Ensure documents are in supported formats (PDF, TXT, HTML, MD, DOCX).'
          }
        ]
      }
    },

    {
      id: 'quiz',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon Bedrock & GenAI Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'What is RAG (Retrieval-Augmented Generation) in the context of Amazon Bedrock?',
            options: [
              { id: 'a', text: 'A technique to generate random data for testing' },
              { id: 'b', text: 'Retrieving relevant documents from a knowledge base to ground model responses in your data' },
              { id: 'c', text: 'A model training technique that uses reinforcement learning' },
              { id: 'd', text: 'An API for generating images from text prompts' }
            ],
            correctId: 'b',
            explanation: 'RAG retrieves relevant document chunks from a knowledge base (S3 → embeddings → vector DB) and provides them as context to the foundation model. This reduces hallucinations and grounds answers in your actual data, without needing to fine-tune the model.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'Your Bedrock application costs are increasing. Claude 3 Opus costs $15/$75 per million tokens. What is the MOST cost-effective optimization?',
            options: [
              { id: 'a', text: 'Switch all requests to Claude 3 Haiku ($0.25/$1.25 per million tokens)' },
              { id: 'b', text: 'Use Haiku for simple queries and Sonnet for complex reasoning, with smart routing' },
              { id: 'c', text: 'Reduce max_tokens to 10 on all requests' },
              { id: 'd', text: 'Disable logging to save costs' }
            ],
            correctId: 'b',
            explanation: 'Smart model routing: use the cheapest model that can handle each task. Haiku for classification, extraction, simple Q&A. Sonnet for analysis and coding. Opus only for the most complex reasoning. This can reduce costs 80%+ vs using Opus for everything.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'What is the purpose of Bedrock Guardrails?',
            options: [
              { id: 'a', text: 'Manage IAM permissions for Bedrock' },
              { id: 'b', text: 'Filter content, block topics, redact PII, and ensure response safety' },
              { id: 'c', text: 'Automatically scale Bedrock infrastructure' },
              { id: 'd', text: 'Monitor Bedrock costs and usage' }
            ],
            correctId: 'b',
            explanation: 'Guardrails provide content filters (hate, violence, sexual), denied topics, word filters, PII detection/redaction, and contextual grounding checks. They can be applied to any model and work on both input prompts and output responses.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge',
      type: 'challenge',
      title: 'Challenge: Build a RAG Chatbot',
      content: {
        title: 'Build a RAG-Powered Chatbot with Bedrock',
        description: 'Write a Lambda function that uses Bedrock Knowledge Bases to answer questions grounded in your documents, with citation tracking.',
        difficulty: 'advanced',
        requirements: [
          'Accept a user question from the event payload',
          'Use retrieve_and_generate to query the knowledge base',
          'Extract the answer text and source citations',
          'Log token usage for cost monitoring',
          'Return a structured response with answer and citations'
        ],
        starterCode: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock_agent = boto3.client('bedrock-agent-runtime')

KNOWLEDGE_BASE_ID = 'YOUR_KB_ID'
MODEL_ARN = 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'

def lambda_handler(event, context):
    question = event.get('question', '')
    
    # TODO: Call retrieve_and_generate with the knowledge base
    # TODO: Extract answer and citations
    # TODO: Log the response
    # TODO: Return structured response
    
    pass`,
        language: 'python',
        hints: [
          'bedrock_agent.retrieve_and_generate(input={"text": question}, retrieveAndGenerateConfiguration={...})',
          'response["output"]["text"] contains the answer',
          'response["citations"] contains source references with S3 URIs',
          'Each citation has retrievedReferences with location and content'
        ],
        testCases: [
          { description: 'Calls retrieve_and_generate', keywords: ['retrieve_and_generate'], expectedOutput: 'RAG query' },
          { description: 'Returns citations', keywords: ['citations'], expectedOutput: 'sources' },
          { description: 'Handles errors', keywords: ['try', 'except'], expectedOutput: 'error handling' }
        ]
      }
    },

    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 36: AWS IAM Identity Center', url: 'module-36.html' }, next: { title: 'Course Complete! 🎓', url: '../index.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_37_DATA; } else { window.MODULE_37_DATA = MODULE_37_DATA; }
