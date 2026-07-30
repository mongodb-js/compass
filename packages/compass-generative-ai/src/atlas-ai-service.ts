import type { SimplifiedSchema } from 'mongodb-schema';
import {
  type PreferencesAccess,
  isAIFeatureEnabled,
} from 'compass-preferences-model/provider';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { Document } from 'mongodb';
import type { Logger } from '@mongodb-js/compass-logging';
import {
  mockDataSchemaToolSchema,
  type MockDataSchemaToolOutput,
  type MockDataSchemaRawField,
  type RawSchema,
  MOCK_DATA_SCHEMA_PROMPT,
  formatSchemaForPrompt,
  splitSchemaIntoChunks,
  mergeChunkResponses,
  validateSchemaSize,
  needsBatching,
} from './mock-data-generator';
import { getStore } from './store/atlas-ai-store';
import { optIntoGenAIWithModalPrompt } from './store/atlas-optin-reducer';
import {
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
} from './atlas-ai-errors';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, type LanguageModel } from 'ai';
import type { AiQueryPrompt } from './utils/gen-ai-prompt';
import {
  buildAggregateQueryPrompt,
  buildFindQueryPrompt,
} from './utils/gen-ai-prompt';
import { parseXmlToJsonResponse } from './utils/parse-xml-response';
import { getAiQueryResponse } from './utils/gen-ai-response';
import { AI_MODEL_SLIM_VERSION } from './model-version';

const mockDataTool = tool({
  description:
    'Generate faker.js mappings for MongoDB schema fields to create realistic mock data',
  inputSchema: mockDataSchemaToolSchema,
  strict: true,
});

export type GenerativeAiInput = {
  userInput: string;
  collectionName: string;
  databaseName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
  signal: AbortSignal;
  requestId: string;
  enableStorage: boolean;
};

type AIAggregation = {
  content: {
    aggregation?: {
      pipeline?: string;
    };
  };
};

type AIQuery = {
  content: {
    query: Record<
      'filter' | 'project' | 'collation' | 'sort' | 'skip' | 'limit',
      string
    >;
    aggregation?: { pipeline: string };
  };
};

function hasExtraneousKeys(obj: any, expectedKeys: string[]) {
  return Object.keys(obj).some((key) => !expectedKeys.includes(key));
}

export function validateAIQueryResponse(
  response: any
): asserts response is AIQuery {
  const { content } = response ?? {};

  if (typeof content !== 'object' || content === null) {
    throw new Error('Unexpected response: expected content to be an object');
  }

  if (hasExtraneousKeys(content, ['query', 'aggregation'])) {
    throw new Error(
      'Unexpected keys in response: expected query and aggregation'
    );
  }

  const { query, aggregation } = content;

  if (!query && !aggregation) {
    throw new Error(
      'Unexpected response: expected query or aggregation, got none'
    );
  }

  if (query && typeof query !== 'object') {
    throw new Error('Unexpected response: expected query to be an object');
  }

  if (
    hasExtraneousKeys(query, [
      'filter',
      'project',
      'collation',
      'sort',
      'skip',
      'limit',
    ])
  ) {
    throw new Error(
      'Unexpected keys in response: expected filter, project, collation, sort, skip, limit, aggregation'
    );
  }

  for (const field of [
    'filter',
    'project',
    'collation',
    'sort',
    'skip',
    'limit',
  ]) {
    if (query[field] && typeof query[field] !== 'string') {
      throw new Error(
        `Unexpected response: expected field ${field} to be a string, got ${JSON.stringify(
          query[field],
          null,
          2
        )}`
      );
    }
  }

  if (aggregation && typeof aggregation.pipeline !== 'string') {
    throw new Error(
      `Unexpected response: expected aggregation pipeline to be a string, got ${JSON.stringify(
        aggregation,
        null,
        2
      )}`
    );
  }
}

export function validateAIAggregationResponse(
  response: any
): asserts response is AIAggregation {
  const { content } = response;

  if (typeof content !== 'object' || content === null) {
    throw new Error('Unexpected response: expected content to be an object');
  }

  if (hasExtraneousKeys(content, ['aggregation'])) {
    throw new Error('Unexpected keys in response: expected aggregation');
  }

  if (content.aggregation && typeof content.aggregation.pipeline !== 'string') {
    // Compared to queries where we will always get the `query` field, for
    // aggregations backend deletes the whole `aggregation` key if pipeline is
    // empty, so we only validate `pipeline` key if `aggregation` key is present
    throw new Error(
      `Unexpected response: expected aggregation to be a string, got ${String(
        content.aggregation.pipeline
      )}`
    );
  }
}

export type { MockDataSchemaRawField, MockDataSchemaToolOutput };
export { mockDataSchemaToolSchema };

export interface MockDataSchemaRequest {
  collectionName: string;
  databaseName: string;
  schema: Record<string, MockDataSchemaRawField>;
  validationRules?: Record<string, unknown> | null;
  includeSampleValues?: boolean;
  requestId: string;
  signal: AbortSignal;
}

async function getHashedActiveUserId(
  preferences: PreferencesAccess,
  logger: Logger
): Promise<string> {
  const { currentUserId, telemetryAnonymousId, telemetryAtlasUserId } =
    preferences.getPreferences();
  const userId = currentUserId ?? telemetryAnonymousId ?? telemetryAtlasUserId;
  if (!userId) {
    return 'unknown';
  }
  try {
    const data = new TextEncoder().encode(userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  } catch (e) {
    logger.log.warn(
      logger.mongoLogId(1_001_000_385),
      'AtlasAiService',
      'Failed to hash user id for AI request',
      {
        error: (e as Error).message,
      }
    );
    return 'unknown';
  }
}

export class AtlasAiService {
  private apiURLPreset: 'private-api' | 'cloud';
  private atlasService: AtlasService;
  private preferences: PreferencesAccess;
  private logger: Logger;

  private nlqAiModel: LanguageModel;
  private mockDataAiModel: LanguageModel;

  constructor({
    apiURLPreset,
    atlasService,
    preferences,
    logger,
  }: {
    apiURLPreset: 'private-api' | 'cloud';
    atlasService: AtlasService;
    preferences: PreferencesAccess;
    logger: Logger;
  }) {
    this.apiURLPreset = apiURLPreset;
    this.atlasService = atlasService;
    this.preferences = preferences;
    this.logger = logger;

    const PLACEHOLDER_BASE_URL =
      'http://PLACEHOLDER_BASE_URL_TO_BE_REPLACED.invalid';

    this.nlqAiModel = createOpenAI({
      apiKey: '',
      baseURL: PLACEHOLDER_BASE_URL,
      fetch: (url, init) => {
        // The `baseUrl` can be dynamically changed, but `createOpenAI`
        // doesn't allow us to change it after initial call. Instead
        // we're going to update it every time the fetch call happens
        const uri = String(url).replace(
          PLACEHOLDER_BASE_URL,
          this.atlasService.assistantApiEndpoint()
        );
        return this.atlasService.fetch(uri, init);
      },
    }).responses(AI_MODEL_SLIM_VERSION);

    this.mockDataAiModel = createOpenAI({
      apiKey: '',
      baseURL: PLACEHOLDER_BASE_URL,
      fetch: (url, init) => {
        const uri = String(url).replace(
          PLACEHOLDER_BASE_URL,
          this.atlasService.assistantApiEndpoint()
        );
        return this.atlasService.fetch(uri, init);
      },
    }).responses(AI_MODEL_SLIM_VERSION);
  }

  private throwIfAINotEnabled() {
    if (process.env.COMPASS_E2E_SKIP_AI_OPT_IN === 'true') {
      return;
    }
    if (!isAIFeatureEnabled(this.preferences.getPreferences())) {
      throw new Error(
        "Compass' AI functionality is not currently enabled. Please try again later."
      );
    }
  }

  async ensureAiFeatureAccess({ signal }: { signal?: AbortSignal } = {}) {
    return getStore().dispatch(
      optIntoGenAIWithModalPrompt({
        signal,
        isCloudOptIn: this.apiURLPreset === 'cloud',
      })
    );
  }

  async getAggregationFromUserInput(input: GenerativeAiInput) {
    const message = buildAggregateQueryPrompt({
      ...input,
      analyticsId: await getHashedActiveUserId(this.preferences, this.logger),
    });
    return this.generateQueryUsingChatbot(
      message,
      validateAIAggregationResponse,
      { signal: input.signal, type: 'aggregate' }
    );
  }

  async getQueryFromUserInput(input: GenerativeAiInput) {
    const message = buildFindQueryPrompt({
      ...input,
      analyticsId: await getHashedActiveUserId(this.preferences, this.logger),
    });
    return this.generateQueryUsingChatbot(message, validateAIQueryResponse, {
      signal: input.signal,
      type: 'find',
    });
  }

  /**
   * Generates mock data schema mappings using the Knowledge Server's AI.
   * Uses tool calling with the mockDataSchema tool to get structured output.
   * For large schemas, automatically batches requests into smaller chunks.
   */
  async getMockDataSchema(
    input: MockDataSchemaRequest,
    connectionInfo: ConnectionInfo
  ): Promise<MockDataSchemaToolOutput> {
    this.throwIfAINotEnabled();

    // Mock data schema generation requires cloud API (atlas metadata)
    if (!connectionInfo.atlasMetadata) {
      throw new AtlasAiServiceInvalidInputError(
        "Can't perform generative ai request: mock-data-schema requires Atlas connection"
      );
    }

    const { collectionName, databaseName, signal } = input;
    let schema: RawSchema = input.schema;

    // Strip sample values if not requested
    if (!input.includeSampleValues) {
      const newSchema: RawSchema = Object.create(null);
      for (const [k, v] of Object.entries(schema)) {
        newSchema[k] = { type: v.type };
      }
      schema = newSchema;
    }

    this.logger.log.info(
      this.logger.mongoLogId(1_001_000_419),
      'AtlasAiService',
      'Running mock data schema generation via Knowledge Server',
      {
        namespace: `${databaseName}.${collectionName}`,
        requestId: input.requestId,
        fieldCount: Object.keys(schema).length,
      }
    );

    // Validate schema size and check if batching is needed
    try {
      validateSchemaSize(schema);
    } catch {
      throw new AtlasAiServiceInvalidInputError(
        'The provided schema is too large to process. Please reduce the schema size and try again.'
      );
    }

    if (!needsBatching(schema)) {
      // Small schema: single LLM call
      return this.generateSchemaForSingleChunk(
        databaseName,
        collectionName,
        schema,
        input.validationRules,
        input.requestId,
        signal
      );
    }

    // Large schema: batch into chunks and merge results in parallel
    const chunks = splitSchemaIntoChunks(schema);
    const chunkResponses = await Promise.all(
      chunks.map((chunk) =>
        this.generateSchemaForSingleChunk(
          databaseName,
          collectionName,
          chunk,
          input.validationRules,
          input.requestId,
          signal
        )
      )
    );

    return mergeChunkResponses(chunkResponses);
  }

  /**
   * Generates mock data schema for a single chunk of fields using streamText with tool calling.
   */
  private async generateSchemaForSingleChunk(
    databaseName: string,
    collectionName: string,
    schema: RawSchema,
    validationRules: Record<string, unknown> | null | undefined,
    requestId: string,
    signal: AbortSignal
  ): Promise<MockDataSchemaToolOutput> {
    const userPrompt = formatSchemaForPrompt(
      databaseName,
      collectionName,
      schema,
      validationRules
    );

    const response = streamText({
      model: this.mockDataAiModel,
      messages: [{ role: 'user', content: userPrompt }],
      tools: { mockDataSchema: mockDataTool },
      toolChoice: { type: 'tool', toolName: 'mockDataSchema' },
      providerOptions: {
        openai: {
          instructions: MOCK_DATA_SCHEMA_PROMPT,
          store: false,
        },
      },
      headers: {
        'X-Client-Request-Id': requestId,
        'X-Assistant-Entrypoint': 'mock-data-generator',
      },
      abortSignal: signal,
    });

    // Consume the stream and extract the tool call result
    const toolCalls = await response.toolCalls;

    if (!toolCalls || toolCalls.length === 0) {
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_311),
        'AtlasAiService',
        'Mock data schema generation did not return tool call',
        {
          namespace: `${databaseName}.${collectionName}`,
        }
      );
      throw new AtlasAiServiceApiResponseParseError(
        'AI did not return expected mock data schema tool call'
      );
    }

    const toolResult = toolCalls[0];
    if (
      toolResult.type !== 'tool-call' ||
      toolResult.toolName !== 'mockDataSchema'
    ) {
      throw new AtlasAiServiceApiResponseParseError(
        `Unexpected tool called: ${
          toolResult.type === 'tool-call' ? toolResult.toolName : 'unknown'
        }`
      );
    }

    // toolResult.input contains the validated schema from the tool call
    return toolResult.input as MockDataSchemaToolOutput;
  }

  async optIntoGenAIFeatures() {
    if (this.apiURLPreset === 'cloud') {
      // Performs a post request to Atlas to set the user opt in preference to true.
      await this.atlasService.fetch(
        this.atlasService.cloudEndpoint(
          'settings/optInDataExplorerGenAIFeatures'
        ),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams([['value', 'true']]),
        }
      );
    }
    await this.preferences.savePreferences({
      optInGenAIFeatures: true,
    });
  }

  private async generateQueryUsingChatbot<T>(
    message: AiQueryPrompt,
    validateFn: (res: any) => asserts res is T,
    options: { signal: AbortSignal; type: 'find' | 'aggregate' }
  ): Promise<T> {
    this.throwIfAINotEnabled();
    const response = await getAiQueryResponse(
      this.nlqAiModel,
      message,
      options.signal
    );
    const parsedResponse = parseXmlToJsonResponse(response, {
      logger: this.logger,
      type: options.type,
    });
    validateFn(parsedResponse);
    return parsedResponse;
  }
}
