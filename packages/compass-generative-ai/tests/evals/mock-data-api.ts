import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { MockDataInputFieldSchema } from './types';
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

const mockDataTool = tool({
  description:
    'Generate faker.js mappings for MongoDB schema fields to create realistic mock data',
  inputSchema: mockDataSchemaToolSchema,
  strict: true,
});

async function generateSchemaForChunk(
  schema: RawSchema
): Promise<MockDataSchemaToolOutput> {
  const userPrompt = formatSchemaForPrompt('foo', 'bar', schema);

  const response = streamText({
    model: openai.responses('mongodb-slim-2.1-mini'),
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

  const firstToolCall = toolCalls?.[0];

  if (
    !firstToolCall ||
    firstToolCall.type !== 'tool-call' ||
    firstToolCall.toolName !== 'mockDataSchema'
  ) {
    throw new Error('LLM did not return a mockDataSchema tool call');
  }

  return firstToolCall.input as MockDataSchemaToolOutput;
}

export async function generateSchemaForEval(
  providedSchema: MockDataInputFieldSchema
): Promise<MockDataSchemaToolOutput> {
  if (!needsBatching(providedSchema)) {
    return generateSchemaForChunk(providedSchema);
  }

  const chunks = splitSchemaIntoChunks(providedSchema);
  const chunkResponses: MockDataSchemaToolOutput[] = [];

  for (const chunk of chunks) {
    const response = await generateSchemaForChunk(chunk);
    chunkResponses.push(response);
  }

  return mergeChunkResponses(chunkResponses);
}
