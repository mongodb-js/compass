import {
  type LoggerAndTelemetry,
  mongoLogId,
} from '@mongodb-js/compass-logging/provider';
import type { SimplifiedSchema } from 'mongodb-schema';
import type { ErrorAwareAtlasHttpApiClient } from './atlas-http-client';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';

type GenerativeAiInput = {
  userInput: string;
  collectionName: string;
  databaseName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
  signal?: AbortSignal;
};

const AI_MAX_REQUEST_SIZE = 10000;
const AI_MIN_SAMPLE_DOCUMENTS = 1;
const USER_AI_URI = (userId: string) => `ai/api/v1/hello/${userId}`;
const AGGREGATION_URI = 'ai/api/v1/mql-aggregation';
const QUERY_URI = 'ai/api/v1/mql-query';

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

function validateAIQueryResponse(response: any): asserts response is AIQuery {
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

  if (typeof query !== 'object' || query === null) {
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

function validateAIAggregationResponse(
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

function validateAIFeatureEnablementResponse(
  response: any
): asserts response is AIFeatureEnablement {
  const { features } = response;
  if (typeof features !== 'object') {
    throw new Error('Unexpected response: expected features to be an object');
  }
}

function hasExtraneousKeys(obj: any, expectedKeys: string[]) {
  return Object.keys(obj).some((key) => !expectedKeys.includes(key));
}

export class AtlasAiClient {
  constructor(
    private atlasApi: ErrorAwareAtlasHttpApiClient,
    private preferences: Pick<
      PreferencesAccess,
      'getUserId' | 'savePreferences'
    >,
    private logger: LoggerAndTelemetry
  ) {}

  async getAIFeatureEnablement(): Promise<AIFeatureEnablement> {
    const userId = this.preferences.getUserId?.();
    if (!userId) {
      throw new Error('No user id found');
    }
    const url = await this.atlasApi.privateUnAuthEndpoint(USER_AI_URI(userId));
    const body = await this.atlasApi.unAuthenticatedFetch(url, {});
    validateAIFeatureEnablementResponse(body);
    return body;
  }

  async setupAIAccess(): Promise<void> {
    try {
      const featureResponse = await this.getAIFeatureEnablement();

      const isAIFeatureEnabled =
        !!featureResponse?.features?.GEN_AI_COMPASS?.enabled;

      this.logger.log.info(
        mongoLogId(1_001_000_293),
        'AtlasService',
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
        mongoLogId(1_001_000_294),
        'AtlasService',
        'Failed to load if the AI feature is enabled',
        { error: (err as Error).stack }
      );
    }
  }

  private getQueryOrAggregationFromUserInput = async <T>(
    uri: string,
    input: GenerativeAiInput,
    validationFn: (res: any) => asserts res is T
  ): Promise<T> => {
    const { signal, ...rest } = input;
    let msgBody = JSON.stringify(rest);
    if (msgBody.length > AI_MAX_REQUEST_SIZE) {
      // When the message body is over the max size, we try
      // to see if with fewer sample documents we can still perform the request.
      // If that fails we throw an error indicating this collection's
      // documents are too large to send to the ai.
      msgBody = JSON.stringify({
        userInput: input.userInput,
        collectionName: input.collectionName,
        databaseName: input.databaseName,
        schema: input.schema,
        sampleDocuments: input.sampleDocuments?.slice(
          0,
          AI_MIN_SAMPLE_DOCUMENTS
        ),
      });
      if (msgBody.length > AI_MAX_REQUEST_SIZE) {
        throw new Error(
          'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
        );
      }
    }

    const url = await this.atlasApi.privateAtlasEndpoint(uri);
    const res = await this.atlasApi.fetchJson<T>(url, {
      signal: signal as NodeFetchAbortSignal,
      method: 'POST',
      body: msgBody,
    });
    validationFn(res);
    return res;
  };

  async getAggregationFromUserInput(input: GenerativeAiInput) {
    return this.getQueryOrAggregationFromUserInput(
      AGGREGATION_URI,
      input,
      validateAIAggregationResponse
    );
  }

  async getQueryFromUserInput(input: GenerativeAiInput) {
    return this.getQueryOrAggregationFromUserInput(
      QUERY_URI,
      input,
      validateAIQueryResponse
    );
  }
}
