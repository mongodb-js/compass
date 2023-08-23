import { ipcMain, shell } from 'electron';
import { URL, URLSearchParams } from 'url';
import { EventEmitter, once } from 'events';
import keytar from 'keytar';
import type {
  AuthFlowType,
  MongoDBOIDCPlugin,
  MongoDBOIDCPluginOptions,
} from '@mongodb-js/oidc-plugin';
import {
  createMongoDBOIDCPlugin,
  hookLoggerToMongoLogWriter as oidcPluginHookLoggerToMongoLogWriter,
} from '@mongodb-js/oidc-plugin';
import { oidcServerRequestHandler } from '@mongodb-js/devtools-connect';
// TODO(https://github.com/node-fetch/node-fetch/issues/1652): Remove this when
// node-fetch types match the built in AbortSignal from node.
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';
import type { Response } from 'node-fetch';
import fetch from 'node-fetch';
import type { SimplifiedSchema } from 'mongodb-schema';
import type { Document } from 'mongodb';
import {
  validateAIQueryResponse,
  type AIAggregation,
  type AIQuery,
  type IntrospectInfo,
  type Token,
  type UserInfo,
  validateAIAggregationResponse,
} from './util';
import {
  broadcast,
  getStoragePaths,
  ipcExpose,
  throwIfAborted,
} from '@mongodb-js/compass-utils';
import {
  createLoggerAndTelemetry,
  mongoLogId,
} from '@mongodb-js/compass-logging';
import preferences from 'compass-preferences-model';

const { log } = createLoggerAndTelemetry('COMPASS-ATLAS-SERVICE');

const redirectRequestHandler = oidcServerRequestHandler.bind(null, {
  productName: 'Compass',
  productDocsLink: 'https://www.mongodb.com/docs/compass',
});

/**
 * https://www.mongodb.com/docs/atlas/api/atlas-admin-api-ref/#errors
 */
function isServerError(err: any): err is { errorCode: string; detail: string } {
  return Boolean(err.errorCode && err.detail);
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
  (err as any).statusCode = res.status;
  throw err;
}

const AI_MAX_REQUEST_SIZE = 10000;

const AI_MIN_SAMPLE_DOCUMENTS = 1;

type MongoDBOIDCPluginLogger = Required<MongoDBOIDCPluginOptions>['logger'];

type AtlasServiceAuthState =
  // Instance was just created
  | 'initial'
  // Trying to restore state if it was persisted before
  | 'restoring'
  // Successfully got token from oidc-plugin
  | 'authenticated'
  // Token expired (and being refreshed at the moment)
  | 'expired'
  // Encountered an error while requesting token (either on sign in or refresh)
  | 'unauthenticated';

type SecretStore = {
  getItem(key: string): Promise<string | undefined>;
  setItem(key: string, value: string): Promise<void>;
};

const SECRET_STORE_KEY = 'AtlasLoginOIDCPluginState';

const defaultSecretStore: SecretStore = {
  async getItem(key: string) {
    try {
      const { appName } = getStoragePaths() ?? {};
      if (
        process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true' ||
        !appName
      ) {
        throw new Error('Unsupported environment');
      }
      return (await keytar.getPassword(appName, key)) ?? undefined;
    } catch {
      return undefined;
    }
  },
  async setItem(key: string, value: string) {
    try {
      const { appName } = getStoragePaths() ?? {};
      if (
        process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true' ||
        !appName
      ) {
        throw new Error('Unsupported environment');
      }
      return await keytar.setPassword(appName, key, value);
    } catch {
      return;
    }
  },
};

export class AtlasService {
  private constructor() {
    // singleton
  }

  private static initPromise: Promise<void> | null = null;

  /**
   * oidc-plugin logger event flow for plugin creation and token request / refresh:
   *
   *        createPlugin
   *             ↓
   * serialized state provided? → no → no event
   *             ↓
   *            yes → failed to deserialize? → no → `plugin:state-updated`
   *                             ↓
   *                            yes → `plugin:deserialization-failed`
   *
   *
   *              requestToken
   *                   ↓
   *             token expired?
   *                   │
   *              no ←─┴─→ yes ───┐
   *              │               ↓  `tryRefresh` flow can also trigger separately on timeout
   *              │  ┌────────────────────────────────────────┐
   *              │  │        tryRefresh                      │
   *              │  │            ↓                           │
   *              │  │ `plugin:refresh-started`               │
   *              │  │            ↓                           │
   *              │  │  got token from issuer? → no ─┐        │
   *              │  │            ↓                  │        │
   *              │  │           yes                 │        │
   *              │  │            ↓                  │        │
   *              │  │`plugin:refresh-succeeded`     │        │
   *              │  │            ↓                  │        │
   *              │  │    start state update         │        │
   *              │  │            ↓                  │        │
   *              │  │    state update failed → yes ─┤        │
   *              │  │            ↓                  ↓        │
   *              │  │            no  `plugin:refresh-failed` │─┐            ┌────────────────────────────────────────────┐
   *              │  │            ↓                           │ │            │ `plugin:auth-attempt-started`              │
   *              │  │  `plugin:state-updated`                │ │            │        ↓                                   │
   *              │  └────────────────────────────────────────┘ │            │ is attempt successfull? → no               │
   *              ↓               │                             ↓            │        ↓                  ↓                │
   * `plugin:skip-auth-attempt` ←─┘            for flow in getAllowedFlows → │       yes     `plugin:auth-attempt-failed` │
   *              ↓                                                          │        ↓                                   │
   *    `plugin:auth-succeeded` ← yes ← do we have new token set in state? ← │ `plugin:state-updated`                     │
   *                                                 ↓                       │        ↓                                   │
   *                                                 no                      │ `plugin:auth-attempt-succeeded`            │
   *                                                 ↓                       └────────────────────────────────────────────┘
   *                                         `plugin:auth-failed`
   */
  private static oidcPluginLogger: MongoDBOIDCPluginLogger & {
    on(evt: 'atlas-service-token-refreshed', fn: () => void): void;
    on(evt: 'atlas-service-token-refresh-failed', fn: () => void): void;
    on(evt: 'atlas-service-signed-out', fn: () => void): void;
    once(evt: 'atlas-service-token-refreshed', fn: () => void): void;
    once(evt: 'atlas-service-token-refresh-failed', fn: () => void): void;
    once(evt: 'atlas-service-signed-out', fn: () => void): void;
    emit(evt: 'atlas-service-token-refreshed'): void;
    emit(evt: 'atlas-service-token-refresh-failed'): void;
    emit(evt: 'atlas-service-signed-out'): void;
  } & Pick<EventEmitter, 'removeAllListeners'> = new EventEmitter();

  private static oidcPluginSyncedFromLoggerState: AtlasServiceAuthState =
    'initial';

  private static plugin: MongoDBOIDCPlugin | null = null;

  private static token: Token | null = null;

  private static signInPromise: Promise<Token> | null = null;

  private static fetch: typeof fetch = fetch;

  private static secretStore: SecretStore = defaultSecretStore;

  private static ipcMain: Pick<typeof ipcMain, 'handle'> = ipcMain;

  private static get clientId() {
    const clientId =
      process.env.COMPASS_CLIENT_ID_OVERRIDE || process.env.COMPASS_CLIENT_ID;
    if (!clientId) {
      throw new Error('COMPASS_CLIENT_ID is required');
    }
    return clientId;
  }

  private static get issuer() {
    const issuer =
      process.env.COMPASS_OIDC_ISSUER_OVERRIDE ||
      process.env.COMPASS_OIDC_ISSUER;
    if (!issuer) {
      throw new Error('COMPASS_OIDC_ISSUER is required');
    }
    return issuer;
  }

  private static get apiBaseUrl() {
    const apiBaseUrl =
      process.env.COMPASS_ATLAS_SERVICE_BASE_URL_OVERRIDE ||
      process.env.COMPASS_ATLAS_SERVICE_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error(
        'No AI Query endpoint to fetch. Please set the environment variable `COMPASS_ATLAS_SERVICE_BASE_URL`'
      );
    }
    return apiBaseUrl;
  }

  private static openExternal(...args: Parameters<typeof shell.openExternal>) {
    return shell?.openExternal(...args);
  }

  // We use `allowedFlows` plugin option to control whether or not plugin is
  // allowed to start sign in flow or just try refresh and fail if refresh is
  // not possible.
  //  - If we are authenticated, token expired, or we are restoring state, we
  //    only allow token refresh
  //  - Any other state: initial or error, will allow sign in using auth-code
  //    flow in addition to token refresh
  private static getAllowedAuthFlows(): AuthFlowType[] {
    return ['restoring', 'authenticated', 'expired'].includes(
      this.oidcPluginSyncedFromLoggerState
    )
      ? []
      : ['auth-code'];
  }

  private static createMongoDBOIDCPlugin = createMongoDBOIDCPlugin;

  private static setupPlugin(serializedState?: string) {
    this.plugin = this.createMongoDBOIDCPlugin({
      redirectServerRequestHandler(data) {
        if (data.result === 'redirecting') {
          const { res, status, location } = data;
          res.statusCode = status;
          const redirectUrl = new URL(
            'https://account.mongodb.com/account/login'
          );
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

  static init(): Promise<void> {
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
        ],
        this.ipcMain
      );
      this.attachOidcPluginLoggerEvents();
      log.info(
        mongoLogId(1_001_000_210),
        'AtlasService',
        'Atlas service initialized'
      );
      this.oidcPluginSyncedFromLoggerState = 'restoring';
      const serializedState = await this.secretStore.getItem(SECRET_STORE_KEY);
      this.setupPlugin(serializedState);
      // Whether or not we got the state, try refreshing the token. If there was
      // no serialized state returned, this will just put the service in
      // `unauthenticated` state quickly. If there was some state, we need to
      // refresh the token and get the value back from the oidc-plugin to make
      // sure the state between atlas-service and oidc-plugin is in sync
      try {
        log.info(
          mongoLogId(1_001_000_227),
          'AtlasService',
          'Starting token restore attempt'
        );
        this.token = await this.requestOAuthToken();
        log.info(mongoLogId(1_001_000_226), 'AtlasService', 'Token restored');
        this.oidcPluginSyncedFromLoggerState = 'authenticated';
      } catch (err) {
        log.error(
          mongoLogId(1_001_000_225),
          'AtlasService',
          'Failed to restore token',
          { error: (err as Error).stack }
        );
        this.oidcPluginSyncedFromLoggerState = 'unauthenticated';
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
      { clientId: this.clientId, issuer: this.issuer },
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
    // NB: oidc-plugin will emit these log events for all auth states that it
    // keeps and it doesn't provide any information for us to distinguish
    // between them. This is okay to ignore for our case for now as we know that
    // only one auth state is being part of oidc-plugin state
    this.oidcPluginLogger.on('mongodb-oidc-plugin:refresh-started', () => {
      log.info(
        mongoLogId(1_001_000_211),
        'AtlasService',
        'Token refresh started by oidc-plugin'
      );
      void this.refreshToken();
    });
    this.oidcPluginLogger.on('atlas-service-token-refresh-failed', () => {
      broadcast('atlas-service-token-refresh-failed');
    });
    this.oidcPluginLogger.on('atlas-service-token-refreshed', () => {
      broadcast('atlas-service-token-refreshed');
    });
    this.oidcPluginLogger.on('atlas-service-signed-out', () => {
      broadcast('atlas-service-signed-out');
    });
  }

  private static async refreshToken() {
    // In case our call to requestToken started another token refresh instead of
    // just returning token from the plugin state, we short circuit if plugin
    // logged a refresh-started event and this listener got triggered. Only one
    // refresh is allowed to run at a time, and it's either we are refreshing
    // manually, or this method is running
    if (
      ['expired', 'restoring'].includes(this.oidcPluginSyncedFromLoggerState)
    ) {
      return;
    }
    this.oidcPluginSyncedFromLoggerState = 'expired';
    const onRefreshFailed = () => {
      this.token = null;
      this.oidcPluginSyncedFromLoggerState = 'unauthenticated';
      this.oidcPluginLogger.emit('atlas-service-token-refresh-failed');
    };
    log.info(
      mongoLogId(1_001_000_214),
      'AtlasService',
      'Start atlas service token refresh'
    );
    try {
      // We expect only one promise below to resolve, to clean up listeners
      // that never fired we are setting up an abort controller
      const listenerController = new AbortController();
      try {
        // When oidc-plugin starts internal token refresh with the tryRefresh
        // flow, we wait for a certain event sequence before we can safely
        // request new token from the plugin
        await Promise.race([
          // The events we are waiting for are emitted synchronously, so we are
          // subscribing to both at once, even though we can't check the order
          // that way, at least we can guarantee that both expected events
          // happened before we proceed
          Promise.all([
            once(
              this.oidcPluginLogger,
              'mongodb-oidc-plugin:refresh-succeeded',
              { signal: listenerController.signal }
            ),
            once(this.oidcPluginLogger, 'mongodb-oidc-plugin:state-updated', {
              signal: listenerController.signal,
            }),
          ]),
          once(this.oidcPluginLogger, 'mongodb-oidc-plugin:refresh-failed', {
            signal: listenerController.signal,
          }).then(() => {
            throw new Error('Token refresh failed');
          }),
        ]);
      } finally {
        listenerController.abort();
      }
      try {
        log.info(
          mongoLogId(1_001_000_215),
          'AtlasService',
          'Request token refresh from oidc-plugin'
        );
        // Request and refresh token are the same methods in oidc-plugin, what
        // actually controls whether or not sign in flow is allowed is
        // `allowedFlows` property passed to the plugin
        const token = await this.requestOAuthToken();
        log.info(
          mongoLogId(1_001_000_216),
          'AtlasService',
          'Oidc-plugin successfully returned new token'
        );
        this.token = token;
        this.oidcPluginSyncedFromLoggerState = 'authenticated';
        this.oidcPluginLogger.emit('atlas-service-token-refreshed');
      } catch (err) {
        log.error(
          mongoLogId(1_001_000_217),
          'AtlasService',
          'Oidc-plugin failed to return refreshed token',
          { error: (err as Error).stack }
        );
        onRefreshFailed();
      }
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_222),
        'AtlasService',
        'Oidc-plugin failed to refresh token',
        { error: (err as Error).stack }
      );
      onRefreshFailed();
    }
  }

  private static async maybeWaitForToken({
    signal,
  }: { signal?: AbortSignal } = {}) {
    if (signal?.aborted) {
      return;
    }
    // There are two cases where it makes sense to wait for token refresh before
    // proceeding with running atlas service commands:
    //  - In case where we ended up in `expired` state, we know that oidc-plugin
    //    is trying to refresh the token automatically at the moment
    //  - In case of `restoring` saved auth state, we will try to refresh the
    //    token right after restore happened
    if (
      ['expired', 'restoring'].includes(this.oidcPluginSyncedFromLoggerState)
    ) {
      // We expect only one promise below to resolve, to clean up listeners that
      // never fired we are setting up an abort controller
      const listenerController = new AbortController();
      try {
        await Promise.race([
          // We are using our own events here and not oidc-plugin ones because
          // after plugin logged that token was refreshed, we still need to do
          // some additional work to get token from the oidc-plugin
          once(this.oidcPluginLogger, 'atlas-service-token-refreshed', {
            signal: listenerController.signal,
          }),
          once(this.oidcPluginLogger, 'atlas-service-token-refresh-failed', {
            signal: listenerController.signal,
          }),
          signal
            ? once(signal, 'abort', { signal: listenerController.signal })
            : new Promise(() => {
                // This should just never resolve if no signal was passed to
                // this method
              }),
        ]);
      } finally {
        listenerController.abort();
      }
    }
  }

  static async isAuthenticated({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<boolean> {
    throwIfAborted(signal);
    if (!this.token) {
      return false;
    }
    try {
      return (await this.introspect({ signal })).active;
    } catch (err) {
      return false;
    }
  }

  static async signIn({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<Token> {
    if (this.signInPromise) {
      return this.signInPromise;
    }
    try {
      throwIfAborted(signal);
      throwIfNetworkTrafficDisabled();

      this.signInPromise = (async () => {
        log.info(mongoLogId(1_001_000_218), 'AtlasService', 'Starting sign in');

        // We might be refreshing token or restoring state at the moment
        await this.maybeWaitForToken({ signal });

        try {
          this.token = await this.requestOAuthToken({ signal });
          this.oidcPluginSyncedFromLoggerState = 'authenticated';
          log.info(
            mongoLogId(1_001_000_219),
            'AtlasService',
            'Signed in successfully'
          );
          return this.token;
        } catch (err) {
          log.error(
            mongoLogId(1_001_000_220),
            'AtlasService',
            'Failed to sign in',
            { error: (err as Error).stack }
          );
          this.oidcPluginSyncedFromLoggerState = 'unauthenticated';
          throw err;
        }
      })();
      return await this.signInPromise;
    } finally {
      this.signInPromise = null;
    }
  }

  static async signOut(): Promise<void> {
    // Reset and recreate event emitter first so that we don't accidentally
    // react on any old plugin instance events
    this.oidcPluginLogger.removeAllListeners();
    this.oidcPluginLogger = new EventEmitter();
    this.attachOidcPluginLoggerEvents();
    // Destroy old plugin and setup new one
    await this.plugin?.destroy();
    this.setupPlugin();
    // Revoke tokens. Revoking refresh token will also revoke associated access
    // tokens
    // https://developer.okta.com/docs/guides/revoke-tokens/main/#revoke-an-access-token-or-a-refresh-token
    try {
      await this.revoke({ tokenType: 'refresh_token' });
    } catch (err) {
      if (!(err as any).statusCode) {
        throw err;
      }
      // Not much we can do if revoking failed with a network error, practically
      // this is not a failed state for the app, we already cleaned up token
      // from everywhere, so we just ignore this
    }
    // Reset service state
    this.token = null;
    this.oidcPluginSyncedFromLoggerState = 'unauthenticated';
    this.oidcPluginLogger.emit('atlas-service-signed-out');
    // Open Atlas sign out page to end the browser session created for sign in
    void this.openExternal(
      'https://account.mongodb.com/account/login?signedOut=true'
    );
  }

  static async getUserInfo({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<UserInfo> {
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();

    await this.maybeWaitForToken({ signal });

    const res = await this.fetch(`${this.issuer}/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${this.token?.accessToken ?? ''}`,
        Accept: 'application/json',
      },
      signal: signal as NodeFetchAbortSignal | undefined,
    });

    await throwIfNotOk(res);

    return res.json();
  }

  static async introspect({
    signal,
    tokenType,
  }: {
    signal?: AbortSignal;
    tokenType?: 'access_token' | 'refresh_token';
  } = {}) {
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();

    const url = new URL(`${this.issuer}/v1/introspect`);
    url.searchParams.set('client_id', this.clientId);

    await this.maybeWaitForToken({ signal });

    tokenType ??= 'access_token';

    const res = await this.fetch(url.toString(), {
      method: 'POST',
      body: new URLSearchParams([
        [
          'token',
          (tokenType === 'access_token'
            ? this.token?.accessToken
            : this.token?.refreshToken) ?? '',
        ],
        ['token_type_hint', tokenType],
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
    tokenType?: 'access_token' | 'refresh_token';
  } = {}): Promise<void> {
    throwIfAborted(signal);
    throwIfNetworkTrafficDisabled();

    const url = new URL(`${this.issuer}/v1/revoke`);
    url.searchParams.set('client_id', this.clientId);

    await this.maybeWaitForToken({ signal });

    tokenType ??= 'access_token';

    const body = new URLSearchParams([
      [
        'token',
        (tokenType === 'access_token'
          ? this.token?.accessToken
          : this.token?.refreshToken) ?? '',
      ],
      ['token_type_hint', tokenType],
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

    await this.maybeWaitForToken({ signal });

    const res = await this.fetch(
      `${this.apiBaseUrl}/ai/api/v1/mql-aggregation`,
      {
        signal: signal as NodeFetchAbortSignal | undefined,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token?.accessToken ?? ''}`,
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

    await this.maybeWaitForToken({ signal });

    const res = await this.fetch(`${this.apiBaseUrl}/ai/api/v1/mql-query`, {
      signal: signal as NodeFetchAbortSignal | undefined,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token?.accessToken ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: msgBody,
    });

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
