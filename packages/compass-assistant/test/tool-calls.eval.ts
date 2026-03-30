/* eslint-disable no-console */
/**
 * Tool Call Evaluation Suite for Compass Assistant.
 *
 * Evaluates whether the assistant generates the correct MCP tool calls
 * (right tool name, right arguments, right order) in response to user prompts.
 *
 * Run with: npm run eval:tool-calls
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { ToolSet, ToolCallPart } from 'ai';
import { MongoClient } from 'mongodb';
import {
  ToolsController,
  type ToolGroup,
} from '@mongodb-js/compass-generative-ai/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { startTestServer } from '@mongodb-js/compass-test-server';
import {
  toolCallEvalCases,
  type CompassAssistantCustomInput,
} from './eval-cases/tool-call-cases';
import type { ConnectionConfig, EvalTaskConfig } from './tool-call-eval-types';
import { buildContextPrompt } from '../src/prompts';
import { runConversationEval } from 'mongodb-assistant-eval/eval';
import type {
  ConversationEvalCaseInputWithCustom,
  ConversationTaskOutput,
  BraintrustConversationEvalCaseWithCustom,
} from 'mongodb-assistant-eval/eval';
import { ToolCallScorers } from 'mongodb-assistant-eval/scorers';
import { seedServer } from './fixtures/databases/seed-server';
import { seedDatabases } from './fixtures/databases';
import { strict as assert } from 'assert';

import { EVAL_CLUSTER_UID, EVAL_MODEL, instructions } from './eval-config';

const EVAL_WORKSPACE_TYPE = 'Collections' as const;
const EVAL_WORKSPACE_TAB_ID = 'eval-workspace-tab';
const EVAL_PROJECT_NAME = 'Compass Tool Calls';
const EVAL_EXPERIMENT_NAME = `tool-calls-${Date.now()}`;

const DEFAULT_EVAL_TASK_CONFIG: EvalTaskConfig = {
  apiConfig: {
    baseURL: 'https://eval.knowledge-dev.mongodb.com/api/v1/',
    apiKey: '',
    requestOrigin: 'compass-eval-suite',
    userAgent: 'mongodb-compass/x.x.x',
  },
  connectionConfig: {
    connectionId: EVAL_CLUSTER_UID,
    connectionString: '',
    connectOptions: {
      productDocsLink: 'https://www.mongodb.com/docs/compass/',
      productName: 'MongoDB Compass Eval',
    },
  },
};

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
  if (!toolsController.server) {
    throw new Error('Failed to start ToolsController server for eval tools');
  }
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

/**
 * Converts AI SDK ToolCallParts to the OpenAI ChatCompletionMessageToolCall
 * format that the AEL's ToolCallScorers expect on ConversationTaskOutput.messages.
 */
function toolCallPartsToAssistantMessages(
  toolCalls: ToolCallPart[]
): ConversationTaskOutput['messages'] {
  return toolCalls.map((tc) => ({
    role: 'assistant' as const,
    content: '',
    toolCalls: [
      {
        id: tc.toolCallId,
        type: 'function' as const,
        function: {
          name: tc.toolName,
          arguments: JSON.stringify(tc.input ?? {}),
        },
      },
    ],
  }));
}

function makeToolCallEvalCases(): BraintrustConversationEvalCaseWithCustom<CompassAssistantCustomInput>[] {
  return toolCallEvalCases
    .filter((c) => !c.skip)
    .map((c) => ({
      name: c.name,
      input: {
        messages: c.input.messages,
        custom: c.input.custom,
      },
      expected: {
        outputMessages: c.expected.outputMessages,
      },
      tags: c.tags,
      metadata: c.metadata ?? {},
    }));
}

function createToolCallAssistantTask(config: EvalTaskConfig) {
  const { apiConfig, connectionConfig } = config;

  return async function makeToolCallAssistantCall(
    input: ConversationEvalCaseInputWithCustom<CompassAssistantCustomInput>
  ): Promise<ConversationTaskOutput> {
    await ensureToolsInitialized();

    // custom is always provided by every eval case
    const custom = input.custom;
    assert(custom, 'custom is required');

    const openai = createOpenAI({
      baseURL: apiConfig.baseURL,
      apiKey: apiConfig.apiKey,
      headers: {
        'X-Request-Origin': apiConfig.requestOrigin,
        'User-Agent': apiConfig.userAgent,
      },
    });

    const tools = getToolsForCase({
      input: custom,
      connectionConfig,
    });

    const contextPrompt = buildContextPromptText({
      custom,
      connectionString: connectionConfig.connectionString,
    });

    const result = streamText({
      model: openai.responses(EVAL_MODEL),
      system: contextPrompt,
      prompt: input.messages
        .map(
          (m) =>
            `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`
        )
        .join('\n\n'),
      tools,
      providerOptions: {
        openai: {
          instructions,
          store: false,
        },
      },
    });

    const text = await result.text;
    const toolCalls = await result.toolCalls;

    return {
      messages: toolCallPartsToAssistantMessages(toolCalls),
      assistantMessageContent: text,
      allowedQuery: true,
    };
  };
}

async function main() {
  const cluster = await startTestServer();
  cluster.unref();
  const client = new MongoClient(cluster.connectionString);
  await client.connect();
  await seedServer(client, seedDatabases);

  const config: EvalTaskConfig = {
    ...DEFAULT_EVAL_TASK_CONFIG,
    connectionConfig: {
      ...DEFAULT_EVAL_TASK_CONFIG.connectionConfig,
      connectionString: cluster.connectionString,
    },
  };

  try {
    await runConversationEval<CompassAssistantCustomInput>({
      projectName: EVAL_PROJECT_NAME,
      experimentName: EVAL_EXPERIMENT_NAME,
      evalCases: makeToolCallEvalCases(),
      task: createToolCallAssistantTask(config),
      scorers: [ToolCallScorers],
    });
  } finally {
    await toolsController.stopServer();
    await client.close();
    await cluster.close();
    // FIXME(COMPASS-10486): We need to have this otherwise the process hangs.
    // It'd be better if we could exit gracefully without this,
    // but I'm not sure how to do that.
    process.exit(0);
  }
}

void main();
