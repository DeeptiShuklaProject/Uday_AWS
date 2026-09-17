/**
 * MODULE 37 — Amazon Bedrock & GenAI — Foundation Models
 */
const MODULE_37_DATA = {
  id: 'bedrock-runtime-fundamentals', moduleId: 'module-37',
  title: 'Amazon Bedrock & GenAI — Foundation Models',
  description: 'Master generative AI on AWS. Covers foundation models (Claude, Titan, Llama), InvokeModel API, knowledge bases, RAG, agents, guardrails, and prompt engineering.',
  difficulty: 'advanced', duration: '75 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master Bedrock & GenAI core concepts and architecture', 'Implement Bedrock & GenAI using Boto3 and AWS CLI', 'Troubleshoot common Bedrock & GenAI issues', 'Pass certification questions about Bedrock & GenAI'],
  sections: [
    { id: 'why', type: 'why', title: 'Why Bedrock & GenAI?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🤖</span><div class="alert-content"><div class="alert-title">Build Generative AI Applications with Foundation Models</div><div class="alert-text">Amazon Bedrock provides API access to leading foundation models (Claude, Titan, Llama, Stable Diffusion) without managing infrastructure. Add GenAI to your apps with a single API call.</div></div></div>
      <table><thead><tr><th>Feature</th><th>Bedrock</th><th>SageMaker</th><th>OpenAI API</th></tr></thead><tbody><tr><td><strong>Model Choice</strong></td><td>Claude, Titan, Llama, Mistral</td><td>Custom + hosted</td><td>GPT-4, o1</td></tr><tr><td><strong>Infrastructure</strong></td><td>Fully managed</td><td>You manage instances</td><td>Fully managed</td></tr><tr><td><strong>Data Privacy</strong></td><td>Data stays in AWS, not used for training</td><td>Your control</td><td>Shared infra</td></tr><tr><td><strong>Integration</strong></td><td>AWS native (IAM, VPC, CloudWatch)</td><td>AWS native</td><td>External API</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Bedrock Charges Per Token — Monitor Usage</div><div class="alert-text">Each InvokeModel call is charged per input + output token. Claude 3 Sonnet: $3/1M input tokens, $15/1M output tokens. Use Provisioned Throughput for predictable costs at scale.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Bedrock & GenAI Architecture', content: { title: 'Bedrock: App → InvokeModel → Foundation Model', width: 750, height: 280,
      nodes: [
          { id: 'app', label: 'Application', icon: '🖥️', x: 10, y: 110, type: 'compute', description: 'Your app calls Bedrock InvokeModel API.' },
          { id: 'br', label: 'Amazon Bedrock', icon: '🤖', x: 250, y: 110, type: 'trigger', description: 'Fully managed. Routes to the selected foundation model.' },
          { id: 'claude', label: 'Claude (Anthropic)', icon: '🧠', x: 500, y: 30, type: 'compute', description: 'Best for reasoning, analysis, coding.' },
          { id: 'titan', label: 'Titan (AWS)', icon: '📝', x: 500, y: 110, type: 'compute', description: 'AWS-native text and embedding models.' },
          { id: 'kb', label: 'Knowledge Base', icon: '📚', x: 500, y: 220, type: 'storage', description: 'RAG: S3 docs → vector embeddings → OpenSearch. Grounds model responses in your data.' }
      ],
      edges: [
          { from: 'app', to: 'br', label: 'InvokeModel', animated: true },
          { from: 'br', to: 'claude', label: 'Route' },
          { from: 'br', to: 'titan', label: 'Route' },
          { from: 'br', to: 'kb', label: 'RAG Query', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. InvokeModel API</h4><pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">bedrock.invoke_model(
    modelId="anthropic.claude-3-sonnet-20240229-v1:0",
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "messages": [{"role": "user", "content": "Explain VPCs"}],
        "max_tokens": 1024
    })
)</pre><h4>2. Knowledge Bases (RAG)</h4><p>Upload documents to S3 → Bedrock creates vector embeddings → stored in OpenSearch. When querying, Bedrock retrieves relevant chunks and feeds them to the model as context.</p><h4>3. Guardrails</h4><p>Content filters and topic restrictions. Block harmful content, PII, or off-topic responses. Apply to any model.</p><h4>4. Agents</h4><p>Agents use foundation models to reason and take actions. Define action groups (Lambda functions) and knowledge bases. The agent decides which actions to call based on the user's request.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'Bedrock & GenAI Boto3 Operations', content: { title: 'Bedrock & GenAI Management', languages: [
      { id: 'python-bedrock-runtime', label: 'Core Operations',
        code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
br = boto3.client('bedrock-runtime')

def invoke_claude(prompt, max_tokens=1024):
    """Invoke Claude 3 Sonnet via Bedrock."""
    response = br.invoke_model(
        modelId='anthropic.claude-3-sonnet-20240229-v1:0',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': max_tokens,
            'temperature': 0.7
        }),
        contentType='application/json'
    )
    result = json.loads(response['body'].read())
    text = result['content'][0]['text']
    tokens_in = result['usage']['input_tokens']
    tokens_out = result['usage']['output_tokens']
    logger.info("Claude response: %d input, %d output tokens", tokens_in, tokens_out)
    return text


def invoke_titan_embedding(text):
    """Generate text embeddings using Titan."""
    response = br.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        body=json.dumps({'inputText': text}),
        contentType='application/json'
    )
    result = json.loads(response['body'].read())
    embedding = result['embedding']
    logger.info("Embedding dimension: %d", len(embedding))
    return embedding`,
        explanations: [
              { line: '11-19', text: 'invoke_model with Claude. Each model has a different body format. Claude uses the Messages API with anthropic_version.' },
              { line: '21-24', text: 'Parse the response body. Usage tracks token counts for cost monitoring.' },
              { line: '31-37', text: 'Titan Embeddings for RAG. Convert text to vector embeddings for similarity search.' }
        ] }
    ], defaultLang: 'python-bedrock-runtime', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'Bedrock & GenAI CLI Commands', content: [
        { command: 'aws bedrock list-foundation-models --query "modelSummaries[?providerName==\'Anthropic\'].modelId"', category: 'aws-cli', expectedOutput: '[
  "anthropic.claude-3-haiku-20240307-v1:0",
  "anthropic.claude-3-sonnet-20240229-v1:0",
  "anthropic.claude-3-opus-20240229-v1:0"
]', explanation: 'Lists available Anthropic models. Must request model access in the Console first.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'Bedrock & GenAI CLI Lab', mode: 'simulated',
      initialText: 'Bedrock CLI Lab. Try:\n  aws bedrock list-foundation-models --by-provider Anthropic\n  aws bedrock-agent list-knowledge-bases',
      commands: {
          'aws bedrock list-foundation-models --by-provider Anthropic': { text: '{\n  "modelSummaries": [\n    {"modelId": "anthropic.claude-3-sonnet-20240229-v1:0", "modelName": "Claude 3 Sonnet"},\n    {"modelId": "anthropic.claude-3-haiku-20240307-v1:0", "modelName": "Claude 3 Haiku"}\n  ]\n}', type: 'output' },
          'aws bedrock-agent list-knowledge-bases': { text: '{\n  "knowledgeBaseSummaries": [{"name": "product-docs", "status": "ACTIVE", "knowledgeBaseId": "KB123"}]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'AccessDeniedException for InvokeModel', error: 'AccessDeniedException: not authorized for model', cause: 'Model access not enabled, or IAM policy missing bedrock:InvokeModel.', fix: 'Request model access in Bedrock Console → Model access. Add bedrock:InvokeModel to IAM policy.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'Bedrock & GenAI Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'What is RAG in the context of Bedrock?', options: [
              { id: 'a', text: 'Random Access Generation' },
              { id: 'b', text: 'Retrieval-Augmented Generation — ground model responses in your documents' },
              { id: 'c', text: 'Rapid AI Growth' },
              { id: 'd', text: 'Runtime Agent Gateway' }
            ], correctId: 'b', explanation: 'RAG retrieves relevant documents from a knowledge base and provides them as context to the model, reducing hallucinations and grounding answers in your data.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Bedrock Chat Interface', content: { title: 'Bedrock Chat Interface', description: 'Build a Lambda that accepts a user message and returns a Claude response.', difficulty: 'intermediate',
      requirements: [
          'Accept user_message from event',
          'Invoke Claude via Bedrock',
          'Return the response text',
          'Log token usage'
      ],
      starterCode: `import boto3\nimport json\n\nbr = boto3.client('bedrock-runtime')\n\ndef lambda_handler(event, context):\n    # TODO: Get message from event\n    # TODO: Invoke Claude\n    # TODO: Return response\n    pass`,
      language: 'python', hints: [
          'event["user_message"]',
          'br.invoke_model(modelId="anthropic.claude-3-sonnet...", body=...)',
          'json.loads(response["body"].read())["content"][0]["text"]'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Module 36: AWS IAM Identity Center', url: 'module-36.html' }, next: { title: 'Course Complete!', url: '../index.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_37_DATA; } else { window.MODULE_37_DATA = MODULE_37_DATA; }
