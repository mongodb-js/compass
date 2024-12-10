import type { SimplifiedSchema } from 'mongodb-schema';
import {
  type PreferencesAccess,
  isAIFeatureEnabled,
} from 'compass-preferences-model/provider';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { AtlasServiceError } from '@mongodb-js/atlas-service/renderer';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type { Document } from 'mongodb';
import type { Logger } from '@mongodb-js/compass-logging';
import { EJSON, UUID } from 'bson';
import { signIntoAtlasWithModalPrompt } from './store/atlas-signin-reducer';
import { getStore } from './store/atlas-ai-store';
import { optIntoGenAIWithModalPrompt } from './store/atlas-optin-reducer';

type GenerativeAiInput = {
  userInput: string;
  collectionName: string;
  databaseName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
  signal: AbortSignal;
  requestId: string;
};

// The size/token validation happens on the server, however, we do
// want to ensure we're not uploading massive documents (some folks have documents > 1mb).
const AI_MAX_REQUEST_SIZE = 5120000;
const AI_MIN_SAMPLE_DOCUMENTS = 1;

type AIAggregation = {
  content: {
    aggregation?: {
      pipeline?: string;
    };
  };
};

type AIFeatureEnablement = {
  features: {
    [featureName: string]: {
      enabled: boolean;
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

function buildQueryOrAggregationMessageBody(
  input: Omit<GenerativeAiInput, 'signal' | 'requestId'>
) {
  const sampleDocuments = input.sampleDocuments
    ? EJSON.serialize(input.sampleDocuments, {
        relaxed: false,
      })
    : undefined;

  let msgBody = JSON.stringify({
    ...input,
    sampleDocuments,
  });
  if (msgBody.length > AI_MAX_REQUEST_SIZE && sampleDocuments) {
    // When the message body is over the max size, we try
    // to see if with fewer sample documents we can still perform the request.
    // If that fails we throw an error indicating this collection's
    // documents are too large to send to the ai.
    msgBody = JSON.stringify({
      ...input,
      sampleDocuments: EJSON.serialize(
        input.sampleDocuments?.slice(0, AI_MIN_SAMPLE_DOCUMENTS) || [],
        {
          relaxed: false,
        }
      ),
    });
  }

  if (msgBody.length > AI_MAX_REQUEST_SIZE) {
    throw new Error(
      'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
    );
  }

  return msgBody;
}

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

const aiURLConfig = {
  // There are two different sets of endpoints we use for our requests.
  // Down the line we'd like to only use the admin api, however,
  // we cannot currently call that from the Atlas UI. Pending CLOUDP-251201
  'admin-api': {
    'user-access': (userId: string) => `unauth/ai/api/v1/hello/${userId}`,
    aggregation: 'ai/api/v1/mql-aggregation',
    query: 'ai/api/v1/mql-query',
  },
  cloud: {
    'user-access': (userId: string) => `ai/v1/hello/${userId}`,
    aggregation: (groupId: string) => `ai/v1/groups/${groupId}/mql-aggregation`,
    query: (groupId: string) => `ai/v1/groups/${groupId}/mql-query`,
  },
} as const;
type AIEndpoint = 'user-access' | 'query' | 'aggregation';

export class AtlasAiService {
  private initPromise: Promise<void> | null = null;

  private apiURLPreset: 'admin-api' | 'cloud';
  private atlasService: AtlasService;
  private preferences: PreferencesAccess;
  private logger: Logger;

  constructor({
    apiURLPreset,
    atlasService,
    preferences,
    logger,
  }: {
    apiURLPreset: 'admin-api' | 'cloud';
    atlasService: AtlasService;
    preferences: PreferencesAccess;
    logger: Logger;
  }) {
    this.apiURLPreset = apiURLPreset;
    this.atlasService = atlasService;
    this.preferences = preferences;
    this.logger = logger;

    this.initPromise = this.setupAIAccess();
  }

  private getUrlForEndpoint(
    urlId: AIEndpoint,
    connectionInfo?: ConnectionInfo
  ) {
    if (this.apiURLPreset === 'cloud') {
      if (urlId === 'user-access') {
        return this.atlasService.cloudEndpoint(
          aiURLConfig[this.apiURLPreset][urlId](
            this.preferences.getPreferences().telemetryAtlasUserId ??
              new UUID().toString()
          )
        );
      }

      const atlasMetadata = connectionInfo?.atlasMetadata;
      if (!atlasMetadata) {
        throw new Error(
          "Can't perform generative ai request: atlasMetadata is not available"
        );
      }

      return this.atlasService.cloudEndpoint(
        aiURLConfig[this.apiURLPreset][urlId](atlasMetadata.projectId)
      );
    }
    const urlConfig = aiURLConfig[this.apiURLPreset][urlId];
    const urlPath =
      typeof urlConfig === 'function'
        ? urlConfig(
            this.preferences.getPreferences().telemetryAtlasUserId ??
              new UUID().toString()
          )
        : urlConfig;

    return this.atlasService.adminApiEndpoint(urlPath);
  }

  private throwIfAINotEnabled() {
    if (process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN === 'true') {
      return;
    }
    if (!isAIFeatureEnabled(this.preferences.getPreferences())) {
      throw new Error(
        "Compass' AI functionality is not currently enabled. Please try again later."
      );
    }
  }

  private async getAIFeatureEnablement(): Promise<AIFeatureEnablement> {
    const url = this.getUrlForEndpoint('user-access');

    const res = await this.atlasService.fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    const body = await res.json();
    this.validateAIFeatureEnablementResponse(body);
    return body;
  }

  async setupAIAccess(): Promise<void> {
    try {
      const featureResponse = await this.getAIFeatureEnablement();

      const isAIFeatureEnabled =
        !!featureResponse?.features?.GEN_AI_COMPASS?.enabled;

      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_300),
        'AtlasAIService',
        'Fetched if the AI feature is enabled',
        {
          enabled: isAIFeatureEnabled,
          featureResponse,
        }
      );

      await this.preferences.savePreferences({
        cloudFeatureRolloutAccess: {
          GEN_AI_COMPASS: isAIFeatureEnabled,
        },
      });
    } catch (err) {
      // Default to what's already in Compass when we can't fetch the preference.
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_302),
        'AtlasAIService',
        'Failed to load if the AI feature is enabled',
        { error: (err as Error).stack }
      );
    }
  }

  async ensureAiFeatureAccess({ signal }: { signal?: AbortSignal } = {}) {
    // When the ai feature is attempted to be opened we make sure
    // the user is signed into Atlas and opted in.

    if (this.apiURLPreset === 'cloud') {
      return getStore().dispatch(optIntoGenAIWithModalPrompt({ signal }));
    }
    return getStore().dispatch(signIntoAtlasWithModalPrompt({ signal }));
  }

  private getQueryOrAggregationFromUserInput = async <T>(
    {
      urlId,
      input,
      connectionInfo,
    }: {
      urlId: 'query' | 'aggregation';
      input: GenerativeAiInput;

      connectionInfo?: ConnectionInfo;
    },
    validationFn: (res: any) => asserts res is T
  ): Promise<T> => {
    await this.initPromise;
    this.throwIfAINotEnabled();

    const { signal, requestId, ...rest } = input;
    const msgBody = buildQueryOrAggregationMessageBody(rest);

    const url = `${this.getUrlForEndpoint(
      urlId,
      connectionInfo
    )}?request_id=${encodeURIComponent(requestId)}`;

    this.logger.log.info(
      this.logger.mongoLogId(1_001_000_308),
      'AtlasAIService',
      'Running AI query generation request',
      {
        url,
        userInput: input.userInput,
        collectionName: input.collectionName,
        databaseName: input.databaseName,
        messageBodyLength: msgBody.length,
        requestId,
      }
    );

    const res = await this.atlasService.authenticatedFetch(url, {
      signal,
      method: 'POST',
      body: msgBody,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Sometimes the server will return empty response and calling res.json directly
    // throws and user see "Unexpected end of JSON input" error, which is not helpful.
    // So we will get the text from the response first and then try to parse it.
    // If it fails, we will throw a more helpful error message.
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_310),
        'AtlasAIService',
        'Failed to parse the response from AI API',
        {
          text,
          requestId,
        }
      );
      throw new AtlasServiceError(
        'ServerError',
        500, // Not using res.status as its 200 in this case
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
    validationFn(data);
    return data;
  };

  async getAggregationFromUserInput(
    input: GenerativeAiInput,
    connectionInfo: ConnectionInfo
  ) {
    return this.getQueryOrAggregationFromUserInput(
      {
        connectionInfo,
        urlId: 'aggregation',
        input,
      },
      validateAIAggregationResponse
    );
  }

  async getQueryFromUserInput(
    input: GenerativeAiInput,
    connectionInfo: ConnectionInfo
  ) {
    return this.getQueryOrAggregationFromUserInput(
      {
        urlId: 'query',
        input,
        connectionInfo,
      },
      validateAIQueryResponse
    );
  }

  // Performs a post request to atlas to set the user opt in preference to true.
  async optIntoGenAIFeaturesAtlas() {
    await this.atlasService.authenticatedFetch(
      this.atlasService.cloudEndpoint(
        '/settings/optInDataExplorerGenAIFeatures'
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
    await this.preferences.savePreferences({
      optInDataExplorerGenAIFeatures: true,
    });
  }

  private validateAIFeatureEnablementResponse(
    response: any
  ): asserts response is AIFeatureEnablement {
    const { features } = response;
    if (typeof features !== 'object') {
      throw new Error('Unexpected response: expected features to be an object');
    }
  }
}
