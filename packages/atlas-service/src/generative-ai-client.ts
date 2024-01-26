import {
  type LoggerAndTelemetry,
  mongoLogId,
} from '@mongodb-js/compass-logging';
import type { SimplifiedSchema } from 'mongodb-schema';
import type { AtlasHttpApiClient } from './atlas-http-api-client';
import type { AIFeatureEnablement, AIAggregation, AIQuery } from './util';
import { hasExtraneousKeys, validateAIQueryResponse } from './util';
import {
  isAIFeatureEnabled,
  type PreferencesAccess,
} from 'compass-preferences-model';

const AI_MAX_REQUEST_SIZE = 10000;

const AI_MIN_SAMPLE_DOCUMENTS = 1;

export class GenerativeAiClient {
  constructor(
    private atlasApiClient: AtlasHttpApiClient,
    private preferences: Pick<
      PreferencesAccess,
      'getUserId' | 'savePreferences'
    >,
    private logger: LoggerAndTelemetry
  ) {}

  private throwIfAINotEnabled() {
    if (!isAIFeatureEnabled(this.preferences.getPreferences())) {
      throw new Error(
        "Compass' AI functionality is not currently enabled. Please try again later."
      );
    }
    // Only throw if we actually have userInfo / logged in. Otherwise allow
    // request to fall through so that we can get a proper network error
    if (this.atlasApiClient.getCurrentUser()?.enabledAIFeature === false) {
      throw new Error("Can't use AI before accepting terms and conditions");
    }
  }

  async getAIFeatureEnablement(): Promise<AIFeatureEnablement> {
    const userId = await this.preferences.getUserId();
    const body =
      await this.atlasApiClient.unAuthenticatedFetchJson<AIFeatureEnablement>(
        this.atlasApiClient.privateUnAuthEndpoint(`/ai/api/v1/hello/${userId}`)
      );

    if (typeof body?.features !== 'object') {
      throw new Error('Unexpected response: expected features to be an object');
    }

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

  async getAggregationFromUserInput({
    signal,
    userInput,
    collectionName,
    databaseName,
    schema,
    sampleDocuments,
  }: {
    userInput: string;
    collectionName: string;
    databaseName: string;
    schema?: SimplifiedSchema;
    sampleDocuments?: Document[];
    signal?: AbortSignal;
  }): Promise<AIAggregation> {
    this.throwIfAINotEnabled();

    let msgBody = JSON.stringify({
      userInput,
      collectionName,
      databaseName,
      schema,
      sampleDocuments,
    });
    if (msgBody.length > AI_MAX_REQUEST_SIZE) {
      // When the message body is over the max size, we try
      // to see if with fewer sample documents we can still perform the request.
      // If that fails we throw an error indicating this collection's
      // documents are too large to send to the ai.
      msgBody = JSON.stringify({
        userInput,
        collectionName,
        databaseName,
        schema,
        sampleDocuments: sampleDocuments?.slice(0, AI_MIN_SAMPLE_DOCUMENTS),
      });
      if (msgBody.length > AI_MAX_REQUEST_SIZE) {
        throw new Error(
          'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
        );
      }
    }

    const res = await this.atlasApiClient.fetchJson<AIAggregation>(
      this.atlasApiClient.privateAtlasEndpoint('ai/api/v1/mql-aggregation'),
      {
        signal: signal,
        method: 'POST',
        body: msgBody,
      }
    );

    const { content } = res;

    if (typeof content !== 'object' || content === null) {
      throw new Error('Unexpected response: expected content to be an object');
    }

    if (hasExtraneousKeys(content, ['aggregation'])) {
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

    return res;
  }

  async getQueryFromUserInput({
    signal,
    userInput,
    collectionName,
    databaseName,
    schema,
    sampleDocuments,
  }: {
    userInput: string;
    collectionName: string;
    databaseName: string;
    schema?: SimplifiedSchema;
    sampleDocuments?: Document[];
    signal?: AbortSignal;
  }): Promise<AIQuery> {
    this.throwIfAINotEnabled();

    let msgBody = JSON.stringify({
      userInput,
      collectionName,
      databaseName,
      schema,
      sampleDocuments,
    });
    if (msgBody.length > AI_MAX_REQUEST_SIZE) {
      // When the message body is over the max size, we try
      // to see if with fewer sample documents we can still perform the request.
      // If that fails we throw an error indicating this collection's
      // documents are too large to send to the ai.
      msgBody = JSON.stringify({
        userInput,
        collectionName,
        databaseName,
        schema,
        sampleDocuments: sampleDocuments?.slice(0, AI_MIN_SAMPLE_DOCUMENTS),
      });
      if (msgBody.length > AI_MAX_REQUEST_SIZE) {
        throw new Error(
          'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
        );
      }
    }

    const res = await this.fetchJson<AIQuery>(
      `${this.config.atlasApiBaseUrl}/ai/api/v1/mql-query`,
      {
        signal: signal as NodeFetchAbortSignal | undefined,
        method: 'POST',
        body: msgBody,
      }
    );

    validateAIQueryResponse(res);

    return res;
  }
}
