/* eslint-disable no-console */
/**
 * Tool Call Evaluation Suite for Compass Assistant.
 *
 * Evaluates whether the assistant generates the correct MCP tool calls
 * (right tool name, right arguments, right order) in response to user prompts.
 *
 * Phase 1: Tool calls are captured but NOT executed against a database.
 * Phase 2 (future): Tool calls execute against a seeded local MongoDB.
 *
 * Run with: npm run eval:tool-calls
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { Eval } from 'braintrust';
import type { EvalCase } from 'braintrust';
import type { ToolSet, ToolCallPart } from 'ai';
import {
  ToolsController,
  type ToolGroup,
} from '@mongodb-js/compass-generative-ai/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';

import {
  toolCallEvalCases,
  type CompassAssistantCustomInput,
  type ExpectedOutputMessage,
} from './eval-cases/tool-call-cases';

import { ToolCallScorers } from './scorers/tool-call-scorers';

import {
  buildConversationInstructionsPrompt,
  buildContextPrompt,
} from '../src/prompts';

type ToolCallEvalInput = {
  messages: { role: 'user'; content: string }[];
  custom: CompassAssistantCustomInput;
  instructions: string;
};

type ToolCallTaskOutput = {
  toolCalls: ToolCallPart[];
  text: string;
};

type ToolCallEvalExpected = {
  outputMessages: ExpectedOutputMessage[];
};

type ToolCallBraintrustCase = EvalCase<
  ToolCallEvalInput,
  ToolCallEvalExpected,
  unknown
> & {
  name: string;
};

type ConnectionConfig = {
  connectionId: string;
  connectionString: string;
  connectOptions: {
    productDocsLink: string;
    productName: string;
  };
};

// ---------------------------------------------------------------------------
// ToolsController setup — uses the real MCP server from compass-generative-ai
// ---------------------------------------------------------------------------

const logger = createNoopLogger('EVAL-TOOLS-CONTROLLER');

const toolsController = new ToolsController({
  logger,
  getTelemetryAnonymousId: () => 'eval-anonymous-id',
});

let toolsInitialized = false;

/**
 * Starts the MCP server so db-read tools are registered and available.
 * Called once on first eval case.
 */
async function ensureToolsInitialized(): Promise<void> {
  if (toolsInitialized) return;
  await toolsController.startServer();
  toolsInitialized = true;
}

/**
 * Configures the ToolsController for an eval case and returns the active tools.
 * Stateless from the caller's perspective: config in, tools out.
 */
function getToolsForCase({
  input,
  connectionConfig,
}: {
  input: CompassAssistantCustomInput;
  connectionConfig: ConnectionConfig;
}): ToolSet {
  const toolGroups = new Set<ToolGroup>(['db-read']);

  if (input.currentQuery) {
    toolGroups.add('querybar');
  }
  if (input.currentPipeline) {
    toolGroups.add('aggregation-builder');
  }

  toolsController.setActiveTools(toolGroups);
  toolsController.setContext({
    connections: [connectionConfig],
    query: input.currentQuery ? JSON.stringify(input.currentQuery) : undefined,
    pipeline: input.currentPipeline
      ? JSON.stringify(input.currentPipeline)
      : undefined,
  });

  return toolsController.getActiveTools();
}

// ---------------------------------------------------------------------------
// Data function — convert eval cases to Braintrust format
// ---------------------------------------------------------------------------

const EVAL_TARGET = 'MongoDB Compass';
const EVAL_MODEL = 'mongodb-chat-latest';
const EVAL_WORKSPACE_TYPE = 'Collections' as const;
const EVAL_WORKSPACE_TAB_ID = 'eval-workspace-tab';

const instructions = buildConversationInstructionsPrompt({
  target: EVAL_TARGET,
});

function buildContextPromptText({
  custom,
  connectionString,
}: {
  custom: CompassAssistantCustomInput;
  connectionString: string;
}): string {
  const contextMessage = buildContextPrompt({
    activeWorkspace: {
      type: EVAL_WORKSPACE_TYPE,
      namespace: `${custom.databaseName}.${custom.collectionName}`,
      connectionId: custom.clusterUid,
      id: EVAL_WORKSPACE_TAB_ID,
    },
    activeConnection: {
      connectionOptions: { connectionString },
    },
    activeCollectionMetadata: null,
    activeCollectionSubTab: custom.currentQuery
      ? 'Documents'
      : custom.currentPipeline
      ? 'Aggregations'
      : null,
    enableGenAIToolCalling: true,
  });

  const firstPart = contextMessage.parts[0];
  return firstPart.type === 'text' ? firstPart.text : '';
}

function makeToolCallEvalCases(): ToolCallBraintrustCase[] {
  return toolCallEvalCases
    .filter((c) => !c.skip)
    .map((c) => ({
      name: c.name,
      input: {
        messages: c.input.messages,
        custom: c.input.custom,
        instructions,
      },
      expected: {
        outputMessages: c.expected.outputMessages,
      },
      tags: c.tags,
      metadata: {},
    }));
}

// ---------------------------------------------------------------------------
// Task function — call the assistant and capture tool calls
// ---------------------------------------------------------------------------

type AssistantApiConfig = {
  baseURL: string;
  apiKey: string;
  requestOrigin: string;
  userAgent: string;
};

type EvalTaskConfig = {
  apiConfig: AssistantApiConfig;
  connectionConfig: ConnectionConfig;
};

const DEFAULT_EVAL_TASK_CONFIG: EvalTaskConfig = {
  apiConfig: {
    baseURL: 'https://eval.knowledge-dev.mongodb.com/api/v1/',
    apiKey: '',
    requestOrigin: 'compass-eval-suite',
    userAgent: 'mongodb-compass/x.x.x',
  },
  connectionConfig: {
    connectionId: 'eval-test-cluster',
    connectionString: 'mongodb://localhost:27017',
    connectOptions: {
      productDocsLink: 'https://www.mongodb.com/docs/compass/',
      productName: 'MongoDB Compass Eval',
    },
  },
};

function createToolCallAssistantTask(
  config: EvalTaskConfig = DEFAULT_EVAL_TASK_CONFIG
) {
  const { apiConfig, connectionConfig } = config;

  return async function makeToolCallAssistantCall(
    input: ToolCallEvalInput
  ): Promise<ToolCallTaskOutput> {
    // Initialize the MCP server on first call
    await ensureToolsInitialized();

    const openai = createOpenAI({
      baseURL: apiConfig.baseURL,
      apiKey: apiConfig.apiKey,
      headers: {
        'X-Request-Origin': apiConfig.requestOrigin,
        'User-Agent': apiConfig.userAgent,
      },
    });

    // Configure and get tools for this eval case — same path as the Compass assistant
    const tools = getToolsForCase({
      input: input.custom,
      connectionConfig,
    });

    // Build context prompt using the connection string from config
    const contextPrompt = buildContextPromptText({
      custom: input.custom,
      connectionString: connectionConfig.connectionString,
    });

    // Build messages matching the real assistant flow:
    // system context prompt + user message(s)
    const messages = [
      { role: 'system' as const, content: contextPrompt },
      ...input.messages,
    ];

    const result = streamText({
      model: openai.responses(EVAL_MODEL),
      messages,
      tools,
      providerOptions: {
        openai: {
          instructions: input.instructions,
          store: false,
        },
      },
    });

    const text = await result.text;
    const toolCalls = await result.toolCalls;

    return {
      toolCalls,
      text,
    };
  };
}

// ---------------------------------------------------------------------------
// Eval entry point
// ---------------------------------------------------------------------------

void Eval<ToolCallEvalInput, ToolCallTaskOutput, ToolCallEvalExpected>(
  'Compass Tool Calls',
  {
    data: makeToolCallEvalCases,
    task: createToolCallAssistantTask(),
    scores: ToolCallScorers,
  }
);
