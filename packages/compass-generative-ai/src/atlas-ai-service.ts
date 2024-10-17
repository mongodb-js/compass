import type { SimplifiedSchema } from 'mongodb-schema';
import {
  type PreferencesAccess,
  isAIFeatureEnabled,
} from 'compass-preferences-model/provider';
import type {
  AtlasAuthService,
  AtlasService,
} from '@mongodb-js/atlas-service/provider';
import { AtlasServiceError } from '@mongodb-js/atlas-service/renderer';
import type { Document } from 'mongodb';
import type { Logger } from '@mongodb-js/compass-logging';
import { EJSON } from 'bson';

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
const USER_AI_URI = (userId: string) => `unauth/ai/api/v1/hello/${userId}`;
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

export class AtlasAiService {
  private initPromise: Promise<void> | null = null;

  constructor(
    private atlasService: AtlasService,
    private atlasAuthService: AtlasAuthService,
    private preferences: PreferencesAccess,
    private logger: Logger
  ) {
    this.initPromise = this.setupAIAccess();
  }

  private async throwIfAINotEnabled() {
    if (process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN === 'true') {
      return;
    }
    if (!isAIFeatureEnabled(this.preferences.getPreferences())) {
      throw new Error(
        "Compass' AI functionality is not currently enabled. Please try again later."
      );
    }
    // Only throw if we actually have userInfo / logged in. Otherwise allow
    // request to fall through so that we can get a proper network error
    if (
      (await this.atlasAuthService.getUserInfo()).enabledAIFeature === false
    ) {
      throw new Error("Can't use AI before accepting terms and conditions");
    }
  }

  private async getAIFeatureEnablement(): Promise<AIFeatureEnablement> {
    const userId = this.preferences.getPreferencesUser().id;
    const url = this.atlasService.adminApiEndpoint(USER_AI_URI(userId));
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

  private getQueryOrAggregationFromUserInput = async <T>(
    uri: string,
    input: GenerativeAiInput,
    validationFn: (res: any) => asserts res is T
  ): Promise<T> => {
    await this.initPromise;
    await this.throwIfAINotEnabled();

    const { signal, requestId, ...rest } = input;
    const msgBody = buildQueryOrAggregationMessageBody(rest);

    const url = this.atlasService.adminApiEndpoint(uri, requestId);

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

  private validateAIFeatureEnablementResponse(
    response: any
  ): asserts response is AIFeatureEnablement {
    const { features } = response;
    if (typeof features !== 'object') {
      throw new Error('Unexpected response: expected features to be an object');
    }
  }
}
