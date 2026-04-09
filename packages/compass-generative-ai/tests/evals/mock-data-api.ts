import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { MockDataEvalCaseInput, MockDataTaskOutput } from './types';
import {
  mockDataSchemaToolSchema,
  MOCK_DATA_SCHEMA_PROMPT,
  formatSchemaForPrompt,
  splitSchemaIntoChunks,
  mergeChunkResponses,
  needsBatching,
  type MockDataSchemaToolOutput,
  type RawSchema,
} from '../../src/mock-data-generator';

const openai = createOpenAI({
  baseURL:
    process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE ??
    'https://eval.knowledge-dev.mongodb.com/api/v1',
  apiKey: '',
  headers: {
    'X-Request-Origin': 'compass-gen-ai-braintrust',
    'User-Agent': 'mongodb-compass/x.x.x',
  },
});

const modelName = process.env.MOCK_DATA_EVAL_MODEL ?? 'mongodb-slim-2';

const mockDataTool = tool({
  description:
    'Generate faker.js mappings for MongoDB schema fields to create realistic mock data',
  inputSchema: mockDataSchemaToolSchema,
  strict: true,
});

async function generateSchemaForChunk(
  databaseName: string,
  collectionName: string,
  schema: RawSchema,
  validationRules?: Record<string, unknown> | null
): Promise<MockDataSchemaToolOutput> {
  const userPrompt = formatSchemaForPrompt(
    databaseName,
    collectionName,
    schema,
    validationRules
  );

  const response = streamText({
    model: openai.responses(modelName),
    messages: [{ role: 'user', content: userPrompt }],
    tools: { mockDataSchema: mockDataTool },
    toolChoice: { type: 'tool', toolName: 'mockDataSchema' },
    providerOptions: {
      openai: {
        instructions: MOCK_DATA_SCHEMA_PROMPT,
        store: false,
      },
    },
  });

  const toolCalls = await response.toolCalls;

  if (!toolCalls || toolCalls.length === 0) {
    throw new Error('LLM did not return a mockDataSchema tool call');
  }

  return toolCalls[0].input as MockDataSchemaToolOutput;
}

export async function makeMockDataCall(
  input: MockDataEvalCaseInput
): Promise<MockDataTaskOutput> {
  const { databaseName, collectionName, schema, validationRules } = input;

  if (!needsBatching(schema)) {
    return generateSchemaForChunk(
      databaseName,
      collectionName,
      schema,
      validationRules
    );
  }

  const chunks = splitSchemaIntoChunks(schema);
  const chunkResponses: MockDataSchemaToolOutput[] = [];

  for (const chunk of chunks) {
    const response = await generateSchemaForChunk(
      databaseName,
      collectionName,
      chunk,
      validationRules
    );
    chunkResponses.push(response);
  }

  return mergeChunkResponses(chunkResponses);
}
