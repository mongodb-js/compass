import type { SimplifiedSchema } from 'mongodb-schema';
import {
  type PreferencesAccess,
  isAIFeatureEnabled,
} from 'compass-preferences-model/provider';
import type {
  AtlasAuthService,
  AtlasService,
} from '@mongodb-js/atlas-service/provider';
import type { Document } from 'mongodb';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';

type GenerativeAiInput = {
  userInput: string;
  collectionName: string;
  databaseName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
  signal: AbortSignal;
  requestId: string;
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

export class AtlasAiService {
  private initPromise: Promise<void> | null = null;

  constructor(
    private atlasService: AtlasService,
    private atlasAuthService: AtlasAuthService,
    private preferences: PreferencesAccess,
    private logger: LoggerAndTelemetry
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
    const url = this.atlasService.privateUnAuthEndpoint(USER_AI_URI(userId));
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
        this.logger.mongoLogId(1_001_000_302),
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
    await this.initPromise;
    await this.throwIfAINotEnabled();
    const { signal, requestId, ...rest } = input;
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

    const url = this.atlasService.privateAtlasEndpoint(uri, requestId);
    const res = await this.atlasService.authenticatedFetch(url, {
      signal,
      method: 'POST',
      body: msgBody,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    const data = await res.json();
    validationFn(data);
    return data;
  };

  async getAggregationFromUserInput(input: GenerativeAiInput) {
    return this.getQueryOrAggregationFromUserInput(
      AGGREGATION_URI,
      input,
      this.validateAIAggregationResponse.bind(this)
    );
  }

  async getQueryFromUserInput(input: GenerativeAiInput) {
    return this.getQueryOrAggregationFromUserInput(
      QUERY_URI,
      input,
      this.validateAIQueryResponse.bind(this)
    );
  }

  private validateAIQueryResponse(response: any): asserts response is AIQuery {
    const { content } = response ?? {};

    if (typeof content !== 'object' || content === null) {
      throw new Error('Unexpected response: expected content to be an object');
    }

    if (this.hasExtraneousKeys(content, ['query', 'aggregation'])) {
      throw new Error(
        'Unexpected keys in response: expected query and aggregation'
      );
    }

    const { query, aggregation } = content;

    if (typeof query !== 'object' || query === null) {
      throw new Error('Unexpected response: expected query to be an object');
    }

    if (
      this.hasExtraneousKeys(query, [
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

  private validateAIAggregationResponse(
    response: any
  ): asserts response is AIAggregation {
    const { content } = response;

    if (typeof content !== 'object' || content === null) {
      throw new Error('Unexpected response: expected content to be an object');
    }

    if (this.hasExtraneousKeys(content, ['aggregation'])) {
      throw new Error('Unexpected keys in response: expected aggregation');
    }

    if (
      content.aggregation &&
      typeof content.aggregation.pipeline !== 'string'
    ) {
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

  private validateAIFeatureEnablementResponse(
    response: any
  ): asserts response is AIFeatureEnablement {
    const { features } = response;
    if (typeof features !== 'object') {
      throw new Error('Unexpected response: expected features to be an object');
    }
  }

  private hasExtraneousKeys(obj: any, expectedKeys: string[]) {
    return Object.keys(obj).some((key) => !expectedKeys.includes(key));
  }
}
