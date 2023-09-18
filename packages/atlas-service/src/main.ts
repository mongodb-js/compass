import { ipcMain, shell, app } from 'electron';
import { URL, URLSearchParams } from 'url';
import { createHash } from 'crypto';
import type { AuthFlowType, MongoDBOIDCPlugin } from '@mongodb-js/oidc-plugin';
import type { AtlasServiceError } from './renderer';
import {
  createMongoDBOIDCPlugin,
  hookLoggerToMongoLogWriter as oidcPluginHookLoggerToMongoLogWriter,
} from '@mongodb-js/oidc-plugin';
import { oidcServerRequestHandler } from '@mongodb-js/devtools-connect';
// TODO(https://github.com/node-fetch/node-fetch/issues/1652): Remove this when
// node-fetch types match the built in AbortSignal from node.
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';
import nodeFetch from 'node-fetch';
import type { SimplifiedSchema } from 'mongodb-schema';
import type { Document } from 'mongodb';
import type {
  AtlasUserConfig,
  AIAggregation,
  AIFeatureEnablement,
  AIQuery,
  IntrospectInfo,
  AtlasUserInfo,
} from './util';
import {
  validateAIQueryResponse,
  validateAIAggregationResponse,
  validateAIFeatureEnablementResponse,
} from './util';
import {
  broadcast,
  ipcExpose,
  throwIfAborted,
} from '@mongodb-js/compass-utils';
import {
  createLoggerAndTelemetry,
  mongoLogId,
} from '@mongodb-js/compass-logging';
import preferences from 'compass-preferences-model';
import { SecretStore, SECRET_STORE_KEY } from './secret-store';
import { AtlasUserConfigStore } from './user-config-store';
import { OidcPluginLogger } from './oidc-plugin-logger';
import { getActiveUser } from 'compass-preferences-model';

const { log, track } = createLoggerAndTelemetry('COMPASS-ATLAS-SERVICE');

const redirectRequestHandler = oidcServerRequestHandler.bind(null, {
  productName: 'Compass',
  productDocsLink: 'https://www.mongodb.com/docs/compass',
});

/**
 * https://www.mongodb.com/docs/atlas/api/atlas-admin-api-ref/#errors
 */
function isServerError(
  err: any
): err is { error: number; errorCode: string; detail: string } {
  return Boolean(err.error && err.errorCode && err.detail);
}

function throwIfNetworkTrafficDisabled() {
  if (!preferences.getPreferences().networkTraffic) {
    throw new Error('Network traffic is not allowed');
  }
}

export async function throwIfNotOk(
  res: Pick<Response, 'ok' | 'status' | 'statusText' | 'json'>
) {
  if (res.ok) {
    return;
  }

  let serverErrorName = 'NetworkError';
  let serverErrorMessage = `${res.status} ${res.statusText}`;
  // We try to parse the response to see if the server returned any information
  // we can show a user.
  try {
    const messageJSON = await res.json();
    if (isServerError(messageJSON)) {
      serverErrorName = 'ServerError';
      serverErrorMessage = `${messageJSON.errorCode}: ${messageJSON.detail}`;
    }
  } catch (err) {
    // no-op, use the default status and statusText in the message.
  }

  const err = new Error(serverErrorMessage);
  err.name = serverErrorName;
  (err as AtlasServiceError).statusCode = res.status;
  throw err;
}

function throwIfAINotEnabled(atlasService: typeof AtlasService) {
  if (
    !preferences.getPreferences().cloudFeatureRolloutAccess?.GEN_AI_COMPASS ||
    !preferences.getPreferences().enableAIFeatures
  ) {
    throw new Error(
      "Compass' AI functionality is not currently enabled. Please try again later."
    );
  }
  // Only throw if we actually have userInfo / logged in. Otherwise allow
  // request to fall through so that we can get a proper network error
  if (atlasService['currentUser']?.enabledAIFeature === false) {
    throw new Error("Can't use AI before accepting terms and conditions");
  }
}

const AI_MAX_REQUEST_SIZE = 10000;

const AI_MIN_SAMPLE_DOCUMENTS = 1;

const TOKEN_TYPE_TO_HINT = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
} as const;

export function getTrackingUserInfo(userInfo: AtlasUserInfo) {
  return {
    // AUID is shared Cloud user identificator that can be tracked through
    // various MongoDB properties
    auid: createHash('sha256').update(userInfo.sub, 'utf8').digest('hex'),
  };
}

export type AtlasServiceConfig = {
  atlasApiBaseUrl: string;
  atlasLogin: {
    clientId: string;
    issuer: string;
  };
  authPortalUrl: string;
};

export class AtlasService {
  private constructor() {
    // singleton
  }

  private static initPromise: Promise<void> | null = null;

  private static oidcPluginLogger = new OidcPluginLogger();

  private static plugin: MongoDBOIDCPlugin | null = null;

  private static currentUser: AtlasUserInfo | null = null;

  private static getActiveCompassUser: typeof getActiveUser = getActiveUser;

  private static signInPromise: Promise<AtlasUserInfo> | null = null;

  private static fetch = (
    url: RequestInfo,
    init: RequestInit = {}
  ): Promise<Response> => {
    return nodeFetch(url, {
      ...init,
      headers: {
        ...init.headers,
        'User-Agent': `${app.getName()}/${app.getVersion()}`,
      },
    });
  };

  private static secretStore = new SecretStore();

  private static atlasUserConfigStore = new AtlasUserConfigStore();

  private static ipcMain: Pick<typeof ipcMain, 'handle'> = ipcMain;

  private static config: AtlasServiceConfig;

  private static openExternal(...args: Parameters<typeof shell.openExternal>) {
    return shell?.openExternal(...args);
  }

  private static getAllowedAuthFlows(): AuthFlowType[] {
    if (!this.signInPromise) {
      throw new Error(
        'Auth flows are not allowed when sign in is not triggered by user'
      );
    }
    return ['auth-code'];
  }

  private static createMongoDBOIDCPlugin = createMongoDBOIDCPlugin;

  private static setupPlugin(serializedState?: string) {
    this.plugin = this.createMongoDBOIDCPlugin({
      redirectServerRequestHandler: (data) => {
        if (data.result === 'redirecting') {
          const { res, status, location } = data;
          res.statusCode = status;
          const redirectUrl = new URL(this.config.authPortalUrl);
          redirectUrl.searchParams.set('fromURI', location);
          res.setHeader('Location', redirectUrl.toString());
          res.end();
          return;
        }

        redirectRequestHandler(data);
      },
      openBrowser: async ({ url }) => {
        await this.openExternal(url);
      },
      allowedFlows: this.getAllowedAuthFlows.bind(this),
      logger: this.oidcPluginLogger,
      serializedState,
    });
    oidcPluginHookLoggerToMongoLogWriter(
      this.oidcPluginLogger,
      log.unbound,
      'AtlasService'
    );
  }

  static init(config: AtlasServiceConfig): Promise<void> {
    this.config = config;
    return (this.initPromise ??= (async () => {
      ipcExpose(
        'AtlasService',
        this,
        [
          'getUserInfo',
          'introspect',
          'isAuthenticated',
          'signIn',
          'signOut',
          'getAggregationFromUserInput',
          'getQueryFromUserInput',
          'updateAtlasUserConfig',
        ],
        this.ipcMain
      );
      this.attachOidcPluginLoggerEvents();
      log.info(
        mongoLogId(1_001_000_210),
        'AtlasService',
        'Atlas service initialized',
        { config: this.config }
      );
      const serializedState = await this.secretStore.getItem(SECRET_STORE_KEY);
      this.setupPlugin(serializedState);
      await this.setupAIAccess();
      // Whether or not we got the state, try requesting user info. If there was
      // no serialized state returned, this will just fail quickly. If there was
      // some state, we will prepare the service state for user interactions by
      // forcing oidc-plugin to do token refresh if expired and setting user
      try {
        await this.getUserInfo();
        log.info(mongoLogId(1_001_000_226), 'AtlasService', 'State restored');
      } catch (err) {
        log.error(
          mongoLogId(1_001_000_225),
          'AtlasService',
          'Failed to restore state',
          { error: (err as Error).stack }
        );
      }
    })());
  }

  private static async requestOAuthToken({
    signal,
  }: { signal?: AbortSignal } = {}) {
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();

    if (!this.plugin) {
      throw new Error(
        'Trying to use the oidc-plugin before service is initialised'
      );
    }

    return this.plugin.mongoClientOptions.authMechanismProperties.REQUEST_TOKEN_CALLBACK(
      {
        clientId: this.config.atlasLogin.clientId,
        issuer: this.config.atlasLogin.issuer,
      },
      {
        // Required driver specific stuff
        version: 0,
        // While called timeoutContext, this is actually an abort signal that
        // plugin will listen to, not a timeout
        timeoutContext: signal,
      }
    );
  }

  private static attachOidcPluginLoggerEvents() {
    this.oidcPluginLogger.on('mongodb-oidc-plugin:refresh-failed', () => {
      this.currentUser = null;
      this.oidcPluginLogger.emit('atlas-service-token-refresh-failed');
      broadcast('atlas-service-token-refresh-failed');
    });
    this.oidcPluginLogger.on('mongodb-oidc-plugin:refresh-succeeded', () => {
      this.oidcPluginLogger.emit('atlas-service-token-refreshed');
      broadcast('atlas-service-token-refreshed');
    });
    this.oidcPluginLogger.on('atlas-service-signed-out', () => {
      broadcast('atlas-service-signed-out');
    });
    this.oidcPluginLogger.on(
      'atlas-service-user-config-changed',
      (newConfig) => {
        broadcast('atlas-service-user-config-changed', newConfig);
      }
    );
  }

  static async isAuthenticated({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<boolean> {
    throwIfAborted(signal);
    try {
      return (await this.introspect({ signal })).active;
    } catch (err) {
      return false;
    }
  }

  static async signIn({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<AtlasUserInfo> {
    if (this.signInPromise) {
      return this.signInPromise;
    }
    try {
      this.signInPromise = (async () => {
        throwIfAborted(signal);
        throwIfNetworkTrafficDisabled();

        log.info(mongoLogId(1_001_000_218), 'AtlasService', 'Starting sign in');

        try {
          log.info(
            mongoLogId(1_001_000_219),
            'AtlasService',
            'Signed in successfully'
          );
          const userInfo = await this.getUserInfo({ signal });
          track('Atlas Sign In Success', getTrackingUserInfo(userInfo));
          return userInfo;
        } catch (err) {
          track('Atlas Sign In Error', {
            error: (err as Error).message,
          });
          log.error(
            mongoLogId(1_001_000_220),
            'AtlasService',
            'Failed to sign in',
            { error: (err as Error).stack }
          );
          throw err;
        }
      })();
      return await this.signInPromise;
    } finally {
      this.signInPromise = null;
    }
  }

  static async signOut(): Promise<void> {
    if (!this.currentUser) {
      throw new Error("Can't sign out if not signed in yet");
    }
    // Reset and recreate event emitter first so that we don't accidentally
    // react on any old plugin instance events
    this.oidcPluginLogger.removeAllListeners();
    this.oidcPluginLogger = new OidcPluginLogger();
    this.attachOidcPluginLoggerEvents();
    // Destroy old plugin and setup new one
    await this.plugin?.destroy();
    this.setupPlugin();
    // Revoke tokens. Revoking refresh token will also revoke associated access
    // tokens
    // https://developer.okta.com/docs/guides/revoke-tokens/main/#revoke-an-access-token-or-a-refresh-token
    try {
      await this.revoke({ tokenType: 'refreshToken' });
    } catch (err) {
      if (!(err as any).statusCode) {
        throw err;
      }
      // Not much we can do if revoking failed with a network error, practically
      // this is not a failed state for the app, we already cleaned up token
      // from everywhere, so we just ignore this
    }
    // Keep a copy of current user info for tracking
    const userInfo = this.currentUser;
    // Reset service state
    this.currentUser = null;
    this.oidcPluginLogger.emit('atlas-service-signed-out');
    // Open Atlas sign out page to end the browser session created for sign in
    const signOutUrl = new URL(this.config.authPortalUrl);
    signOutUrl.searchParams.set('signedOut', 'true');
    void this.openExternal(signOutUrl.toString());
    track('Atlas Sign Out', getTrackingUserInfo(userInfo));
  }

  // For every case where we request token, if requesting token fails we still
  // want to send request to the backend to get a properly formatted backend
  // error instead of oidc-plugin errors
  private static async maybeGetToken({
    tokenType,
    signal,
  }: {
    tokenType?: 'accessToken' | 'refreshToken';
    signal?: AbortSignal;
  }): Promise<string | undefined> {
    try {
      tokenType ??= 'accessToken';
      const token = await this.requestOAuthToken({ signal });
      return token[tokenType];
    } catch {
      // noop, just return undefined
    }
  }

  static async getUserInfo({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<AtlasUserInfo> {
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();

    this.currentUser ??= await (async () => {
      const token = await this.maybeGetToken({ signal });

      const res = await this.fetch(
        `${this.config.atlasLogin.issuer}/v1/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token ?? ''}`,
            Accept: 'application/json',
          },
          signal: signal as NodeFetchAbortSignal | undefined,
        }
      );

      await throwIfNotOk(res);

      const userInfo = (await res.json()) as AtlasUserInfo;

      const userConfig = await this.atlasUserConfigStore.getUserConfig(
        userInfo.sub
      );

      return { ...userInfo, ...userConfig };
    })();
    return this.currentUser;
  }

  static async updateAtlasUserConfig({
    config,
  }: {
    config: Partial<AtlasUserConfig>;
  }) {
    if (!this.currentUser) {
      throw new Error("Can't update user config when not logged in");
    }
    const newConfig = await this.atlasUserConfigStore.updateUserConfig(
      this.currentUser.sub,
      config
    );
    this.currentUser = {
      ...this.currentUser,
      ...newConfig,
    };
    this.oidcPluginLogger.emit('atlas-service-user-config-changed', newConfig);
  }

  static async introspect({
    signal,
    tokenType,
  }: {
    signal?: AbortSignal;
    tokenType?: 'accessToken' | 'refreshToken';
  } = {}) {
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();

    const url = new URL(`${this.config.atlasLogin.issuer}/v1/introspect`);
    url.searchParams.set('client_id', this.config.atlasLogin.clientId);

    tokenType ??= 'accessToken';

    const token = await this.maybeGetToken({ signal, tokenType });

    const res = await this.fetch(url.toString(), {
      method: 'POST',
      body: new URLSearchParams([
        ['token', token ?? ''],
        ['token_type_hint', TOKEN_TYPE_TO_HINT[tokenType]],
      ]),
      headers: {
        Accept: 'application/json',
      },
      signal: signal as NodeFetchAbortSignal | undefined,
    });

    await throwIfNotOk(res);

    return res.json() as Promise<IntrospectInfo>;
  }

  static async revoke({
    signal,
    tokenType,
  }: {
    signal?: AbortSignal;
    tokenType?: 'accessToken' | 'refreshToken';
  } = {}): Promise<void> {
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();

    const url = new URL(`${this.config.atlasLogin.issuer}/v1/revoke`);
    url.searchParams.set('client_id', this.config.atlasLogin.clientId);

    tokenType ??= 'accessToken';

    const token = await this.maybeGetToken({ signal, tokenType });

    const body = new URLSearchParams([
      ['token', token ?? ''],
      ['token_type_hint', TOKEN_TYPE_TO_HINT[tokenType]],
    ]);

    const res = await this.fetch(url.toString(), {
      method: 'POST',
      body,
      headers: {
        Accept: 'application/json',
      },
      signal: signal as NodeFetchAbortSignal | undefined,
    });

    await throwIfNotOk(res);
  }

  static async getAIFeatureEnablement(): Promise<AIFeatureEnablement> {
    throwIfNetworkTrafficDisabled();

    const userId = (await this.getActiveCompassUser()).id;

    const res = await this.fetch(
      `${this.config.atlasApiBaseUrl}/unauth/ai/api/v1/hello/${userId}`
    );

    await throwIfNotOk(res);

    const body = await res.json();

    validateAIFeatureEnablementResponse(body);

    return body;
  }

  static async setupAIAccess(): Promise<void> {
    log.info(
      mongoLogId(1_001_000_227),
      'AtlasService',
      'Fetching if the AI feature is enabled'
    );

    try {
      throwIfNetworkTrafficDisabled();

      const featureResponse = await this.getAIFeatureEnablement();

      const isAIFeatureEnabled =
        !!featureResponse?.features?.GEN_AI_COMPASS?.enabled;

      log.info(
        mongoLogId(1_001_000_229),
        'AtlasService',
        'Fetched if the AI feature is enabled',
        {
          enabled: isAIFeatureEnabled,
        }
      );

      await preferences.savePreferences({
        cloudFeatureRolloutAccess: {
          GEN_AI_COMPASS: isAIFeatureEnabled,
        },
      });
    } catch (err) {
      // Default to what's already in Compass when we can't fetch the preference.
      log.error(
        mongoLogId(1_001_000_244),
        'AtlasService',
        'Failed to load if the AI feature is enabled',
        { error: (err as Error).stack }
      );
    }
  }

  static async getAggregationFromUserInput({
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
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();
    throwIfAINotEnabled(this);

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
          'Error: too large of a request to send to the ai. Please use a smaller prompt or collection with smaller documents.'
        );
      }
    }

    const token = await this.maybeGetToken({ signal });

    const res = await this.fetch(
      `${this.config.atlasApiBaseUrl}/ai/api/v1/mql-aggregation`,
      {
        signal: signal as NodeFetchAbortSignal | undefined,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: msgBody,
      }
    );

    await throwIfNotOk(res);

    const body = await res.json();

    validateAIAggregationResponse(body);

    return body;
  }

  static async getQueryFromUserInput({
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
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();
    throwIfAINotEnabled(this);

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
          'Error: too large of a request to send to the ai. Please use a smaller prompt or collection with smaller documents.'
        );
      }
    }

    const token = await this.maybeGetToken({ signal });

    const res = await this.fetch(
      `${this.config.atlasApiBaseUrl}/ai/api/v1/mql-query`,
      {
        signal: signal as NodeFetchAbortSignal | undefined,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: msgBody,
      }
    );

    await throwIfNotOk(res);

    const body = await res.json();

    validateAIQueryResponse(body);

    return body;
  }

  static async onExit() {
    // Haven't even created the oidc-plugin yet, nothing to store
    if (!this.plugin) {
      return;
    }
    try {
      await this.secretStore.setItem(
        SECRET_STORE_KEY,
        await this.plugin.serialize()
      );
    } catch (err) {
      log.warn(
        mongoLogId(1_001_000_221),
        'AtlasService',
        'Failed to save auth state',
        { erroe: (err as Error).stack }
      );
    }
  }
}
