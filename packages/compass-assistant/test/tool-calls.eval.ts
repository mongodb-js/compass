/* eslint-disable no-console */
/**
 * Tool Call Evaluation Suite for Compass Assistant.
 *
 * Evaluates whether the assistant generates the correct MCP tool calls
 * (right tool name, right arguments, right order) in response to user prompts.
 *
 * Run with: npm run eval:tool-calls
 */

import { strict as assert } from 'node:assert';
import { createOpenAI } from '@ai-sdk/openai';
import { isStepCount, streamText, wrapLanguageModel } from 'ai';
import type { StepResult, ToolSet } from 'ai';
import { MongoClient } from 'mongodb';
import {
  ToolsController,
  type ToolGroup,
} from '@mongodb-js/compass-generative-ai/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { defaultPreferencesInstance } from '@mongodb-js/compass-preferences-model';
import type { AtlasAdminApiService } from '@mongodb-js/atlas-admin-api/provider';
import { startTestServer } from '@mongodb-js/compass-test-server';
import { runConversationEval } from 'mongodb-assistant-eval/eval';
import type {
  ConversationEvalCaseInputWithCustom,
  ConversationTaskOutput,
  BraintrustConversationEvalCaseWithCustom,
} from 'mongodb-assistant-eval/eval';
import { buildContextPrompt } from '../src/prompts';
import { createSkillsMiddleware } from '../src/docs-provider-transport';
import {
  toolCallEvalCases,
  type CompassAssistantCustomInput,
} from './eval-cases/tool-call-cases';
import type { ConnectionConfig, EvalTaskConfig } from './tool-call-eval-types';
import { CompassToolCallScorers } from './tool-call-scorers';
import { seedServer } from './fixtures/databases/seed-server';
import { seedDatabases } from './fixtures/databases';

import { EVAL_CLUSTER_UID, EVAL_MODEL, instructions } from './eval-config';

const EVAL_WORKSPACE_TYPE = 'Collections' as const;
const EVAL_WORKSPACE_TAB_ID = 'eval-workspace-tab';
const EVAL_PROJECT_NAME = 'Compass Tool Calls';
const EVAL_REQUEST_TIMEOUT_MS = 90_000;
const EVAL_REQUEST_RETRIES = 1;
const EVAL_MAX_STEPS = 4;
const EVAL_EXPERIMENT_NAME = `tool-calls-${EVAL_MODEL}-${Date.now()}`;

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
  track: createNoopTrack(),
  enableMCPTelemetry: false,
  preferences: defaultPreferencesInstance,
  atlasAdminApi: {} as AtlasAdminApiService,
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

/** Configures the ToolsController for an eval case and returns its tools. */
function getToolsForCase({
  input,
  connectionConfig,
}: {
  input: CompassAssistantCustomInput;
  connectionConfig: ConnectionConfig;
}): ToolSet {
  if (input.toolsDisabled) {
    return {};
  }

  const toolGroups = new Set<ToolGroup>(['db-read']);

  if (input.currentQuery) {
    toolGroups.add('querybar');
  }
  if (input.currentPipeline) {
    toolGroups.add('aggregation-builder');
  }

  toolsController.setActiveTools(toolGroups);
  toolsController.setContext({
    enableMCPTelemetry: false,
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
    enableGenAIToolCalling: !custom.toolsDisabled,
  });

  const firstPart = contextMessage.parts[0];
  return firstPart.type === 'text' ? firstPart.text : '';
}

/**
 * Converts the calls of one step to the OpenAI message format that the AEL's
 * ToolCallScorers expect on ConversationTaskOutput.messages: an assistant
 * message with the calls, followed by a tool message per call. The tool messages
 * keep the calls of different steps apart, otherwise the scorers treat all of
 * them as made in parallel. Skills run on the server, so they come first.
 */
function stepToMessages(
  step: number,
  skillNames: string[],
  { toolCalls, toolResults }: StepResult<ToolSet>
): ConversationTaskOutput['messages'] {
  const calls = [
    ...skillNames.map((skillName, index) => ({
      id: `skill-${step}-${index}`,
      name: 'skill',
      input: { skillName },
      output: null,
    })),
    ...toolCalls.map((tc) => ({
      id: tc.toolCallId,
      name: tc.toolName,
      input: tc.input ?? {},
      output:
        toolResults.find((r) => r.toolCallId === tc.toolCallId)?.output ?? null,
    })),
  ];
  if (calls.length === 0) {
    return [];
  }
  return [
    {
      role: 'assistant' as const,
      content: '',
      toolCalls: calls.map((call) => ({
        id: call.id,
        type: 'function' as const,
        function: {
          name: call.name,
          arguments: JSON.stringify(call.input),
        },
      })),
    },
    ...calls.map((call) => ({
      role: 'tool' as const,
      toolCallId: call.id,
      name: call.name,
      content: JSON.stringify(call.output),
    })),
  ];
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

function toJsonValue(result: unknown): unknown {
  return JSON.parse(JSON.stringify(result ?? null));
}

let toolExecutions: Promise<unknown> = Promise.resolve();

/**
 * In the app, tool calls wait for the user's approval and the chat UI tells the
 * tools controller which connection each call belongs to. Do both here so that
 * tool calls run and their results go back to the model.
 */
function withAutoApproval(
  tools: ToolSet,
  custom: CompassAssistantCustomInput,
  connectionId: string
): ToolSet {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => {
      const { execute } = tool;
      if (!execute) {
        return [name, tool];
      }
      return [
        name,
        {
          ...tool,
          needsApproval: false,
          execute: (args, options) => {
            // The controller holds one current query and pipeline, shared by
            // cases that run at the same time, so answer from this case's own.
            if (name === 'get-current-query') {
              return toJsonValue({
                query: custom.currentQuery
                  ? JSON.stringify(custom.currentQuery)
                  : undefined,
              });
            }
            if (name === 'get-current-pipeline') {
              return toJsonValue({
                pipeline: custom.currentPipeline
                  ? JSON.stringify(custom.currentPipeline)
                  : undefined,
              });
            }
            toolsController.setConnectionIdForToolCall({
              toolCallId: options.toolCallId,
              connectionId,
            });
            const run = toolExecutions.then(() => execute(args, options));
            toolExecutions = run.catch(() => undefined);
            return run.then(toJsonValue);
          },
        },
      ];
    })
  );
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

    const caseTools = getToolsForCase({
      input: custom,
      connectionConfig,
    });

    const contextPrompt = buildContextPromptText({
      custom,
      connectionString: connectionConfig.connectionString,
    });

    const prompt = input.messages
      .map(
        (m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`
      )
      .join('\n\n');

    // With a `<tool>` tag the model repeats the tagged tool at every step, so
    // those prompts stay at one step.
    const maxSteps = /<tool>/.test(prompt) ? 1 : EVAL_MAX_STEPS;
    const tools =
      maxSteps > 1
        ? withAutoApproval(caseTools, custom, connectionConfig.connectionId)
        : caseTools;

    // Like the app, take the server-side `skill` calls out of the stream. The AI
    // SDK would treat them as unresolved tool calls and start another step,
    // which makes the model load the same skill again and again.
    const stepSkills: string[] = [];
    const skillsByStep: string[][] = [];
    const model = wrapLanguageModel({
      model: openai.responses(EVAL_MODEL),
      middleware: createSkillsMiddleware((skillName) =>
        stepSkills.push(skillName)
      ),
    });

    const result = streamText({
      model,
      onStepEnd: () => {
        skillsByStep.push(stepSkills.splice(0));
      },
      system: contextPrompt,
      prompt,
      tools,
      stopWhen: isStepCount(maxSteps),
      maxRetries: EVAL_REQUEST_RETRIES,
      streamRetries: EVAL_REQUEST_RETRIES,
      timeout: { stepMs: EVAL_REQUEST_TIMEOUT_MS },
      providerOptions: {
        openai: {
          instructions,
          store: false,
        },
      },
    });
    const [text, steps] = await Promise.all([result.text, result.steps]);
    // An error event from the endpoint (e.g. "Response timeout") ends the step
    // with empty text and no tool calls, which would score as a real answer.
    if (steps.at(-1)?.finishReason === 'error') {
      throw new Error('Eval request ended with an error event');
    }
    const outputMessages = steps.flatMap((step, index) =>
      stepToMessages(index, skillsByStep[index] ?? [], step)
    );

    return {
      messages: outputMessages,
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
      scorers: [CompassToolCallScorers],
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
