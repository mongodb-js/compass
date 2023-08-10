import { shell } from 'electron';
import { URL, URLSearchParams } from 'url';
import { EventEmitter, once } from 'events';
import keytar from 'keytar';
import type {
  AuthFlowType,
  MongoDBOIDCPlugin,
  MongoDBOIDCPluginOptions,
} from '@mongodb-js/oidc-plugin';
import { createMongoDBOIDCPlugin } from '@mongodb-js/oidc-plugin';
import { oidcServerRequestHandler } from '@mongodb-js/devtools-connect';
// TODO(https://github.com/node-fetch/node-fetch/issues/1652): Remove this when
// node-fetch types match the built in AbortSignal from node.
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';
import type { Response } from 'node-fetch';
import fetch from 'node-fetch';
import type { SimplifiedSchema } from 'mongodb-schema';
import type { Document } from 'mongodb';
import type { AIQuery, IntrospectInfo, Token, UserInfo } from './util';
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
  | 'error';

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
      return Promise.resolve(undefined);
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
      return Promise.resolve();
    }
  },
};

export class AtlasService {
  private constructor() {
    // singleton
  }

  private static initPromise: Promise<void> | null = null;

  private static oidcPluginLogger: MongoDBOIDCPluginLogger & {
    on(evt: 'atlas-service-token-refreshed', fn: () => void): void;
    on(evt: 'atlas-service-token-refresh-failed', fn: () => void): void;
    emit(evt: 'atlas-service-token-refreshed'): void;
    emit(evt: 'atlas-service-token-refresh-failed'): void;
  } = new EventEmitter();

  private static oidcPluginSyncedFromLoggerState: AtlasServiceAuthState =
    'initial';

  private static plugin: MongoDBOIDCPlugin;

  private static token: Token | null = null;

  private static signInPromise: Promise<Token> | null = null;

  private static fetch: typeof fetch = fetch;

  private static secretStore: SecretStore = defaultSecretStore;

  private static refreshing = false;

  private static get clientId() {
    const clientId =
      process.env.COMPASS_CLIENT_ID_OVERRIDE || process.env.COMPASS_CLIENT_ID;

    if (!clientId) {
      throw new Error('COMPASS_CLIENT_ID is required');
    }
    return process.env.COMPASS_CLIENT_ID;
  }

  private static get issuer() {
    const issuer =
      process.env.COMPASS_OIDC_ISSUER_OVERRIDE ||
      process.env.COMPASS_OIDC_ISSUER;

    if (!issuer) {
      throw new Error('COMPASS_OIDC_ISSUER is required');
    }
    return process.env.COMPASS_OIDC_ISSUER;
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
    return process.env.COMPASS_ATLAS_SERVICE_BASE_URL;
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

  static init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = (async () => {
      ipcExpose('AtlasService', this, [
        'getUserInfo',
        'introspect',
        'isAuthenticated',
        'signIn',
        'getQueryFromUserInput',
      ]);
      this.attachOidcPluginLoggerEvents();
      log.info(
        mongoLogId(1_001_000_210),
        'AtlasService',
        'Atlas service initialized'
      );
      this.oidcPluginSyncedFromLoggerState = 'restoring';
      const serializedState = await this.secretStore.getItem(SECRET_STORE_KEY);
      this.plugin = createMongoDBOIDCPlugin({
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
        async openBrowser({ url }) {
          await shell.openExternal(url);
        },
        allowedFlows: this.getAllowedAuthFlows.bind(this),
        logger: this.oidcPluginLogger,
        serializedState,
      });
      // If we got serialisedState from store, we will try to refresh the token
      // right away to sync token state from the oidc-plugin to AtlasService
      if (serializedState) {
        await this.refreshToken({
          // In case where we refresh token after plugin state deserialisation
          // happened we don't expect plugin refresh events to be emitted, and
          // so we skip waiting for them. Everything else in this flow is
          // exactly as if we were handling refresh-success event from
          // oidc-plugin
          waitForOIDCPluginStateUpdateEvents: false,
        });
      } else {
        // If no serialised state was found, set service back to initial state
        // so that the sign in flow is allowed again
        this.oidcPluginSyncedFromLoggerState = 'initial';
      }
    })();
    return this.initPromise;
  }

  private static requestOAuthToken({ signal }: { signal?: AbortSignal } = {}) {
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
      this.oidcPluginSyncedFromLoggerState = 'expired';
    });
    this.oidcPluginLogger.on(
      'mongodb-oidc-plugin:refresh-failed',
      ({ error }) => {
        log.error(
          mongoLogId(1_001_000_212),
          'AtlasService',
          'Oidc-plugin failed to refresh token',
          { error }
        );
        this.token = null;
        this.oidcPluginSyncedFromLoggerState = 'error';
        this.oidcPluginLogger.emit('atlas-service-token-refresh-failed');
      }
    );
    // NB: oidc-plugin only has a logger interface to listen to state updates,
    // it also doesn't expose renewed tokens or any other state in any usable
    // way from those events or otherwise, so to get the renewed token we listen
    // to the refresh-succeeded event and then kick off the "refresh"
    // programmatically to be able to get the actual tokens back and sync them
    // to the service state
    this.oidcPluginLogger.on('mongodb-oidc-plugin:refresh-succeeded', () => {
      log.info(
        mongoLogId(1_001_000_213),
        'AtlasService',
        'Oidc-plugin refreshed token successfully'
      );
      void this.refreshToken();
    });
    this.oidcPluginLogger.on('atlas-service-token-refresh-failed', () => {
      broadcast('atlas-service-token-refresh-failed');
    });
    this.oidcPluginLogger.on('atlas-service-token-refreshed', () => {
      broadcast('atlas-service-token-refreshed');
    });
  }

  private static async refreshToken({
    waitForOIDCPluginStateUpdateEvents = true,
  } = {}) {
    // In case our call to requestToken started another token refresh instead of
    // just returning token from the plugin state, we short circuit if plugin
    // logged a refresh-succeeded event and this listener got triggered
    if (this.refreshing) {
      return;
    }
    this.refreshing = true;
    log.info(
      mongoLogId(1_001_000_214),
      'AtlasService',
      'Start atlas service token refresh'
    );
    try {
      if (waitForOIDCPluginStateUpdateEvents) {
        // We expect only one promise below to resolve, to clean up listeners
        // that never fired we are setting up an abort controller
        const listenerController = new AbortController();
        try {
          await Promise.race([
            // When oidc-plugin logged that token was refreshed, the token is
            // not actually refreshed yet in the plugin state and so calling
            // `REFRESH_TOKEN_CALLBACK` causes weird behavior that actually
            // opens the browser again, to work around that we wait for the
            // state update event in addition. We can't guarantee that this
            // event will be emitted for our particular state as this is not
            // something oidc-plugin exposes, but we can ignore this for now as
            // only one auth state is created in this instance of oidc-plugin
            once(this.oidcPluginLogger, 'mongodb-oidc-plugin:state-updated', {
              signal: listenerController.signal,
            }),
            // At the same time refresh can still fail at this stage, so to
            // avoid refresh being stuck, we also wait for refresh-failed event
            // and throw if it happens to avoid calling `REFRESH_TOKEN_CALLBACK`
            once(this.oidcPluginLogger, 'mongodb-oidc-plugin:refresh-failed', {
              signal: listenerController.signal,
            }).then(() => {
              throw new Error('Refresh failed');
            }),
          ]);
        } finally {
          listenerController.abort();
        }
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
        // REFRESH_TOKEN_CALLBACK call failed for some reason
        this.token = null;
        this.oidcPluginSyncedFromLoggerState = 'error';
        this.oidcPluginLogger.emit('atlas-service-token-refresh-failed');
      }
    } catch {
      // encountered 'mongodb-oidc-plugin:refresh-failed' event, do nothing, we
      // already have a listener for this event
    } finally {
      this.refreshing = false;
    }
  }

  private static async maybeWaitForToken({
    signal,
  }: { signal?: AbortSignal } = {}) {
    if (signal?.aborted) {
      return;
    }
    // In cases where we ended up in expired state, we know that oidc-plugin is
    // trying to refresh the token automatically, we can wait for this process
    // to finish before proceeding with a request
    if (
      ['expired', 'restoring'].includes(this.oidcPluginSyncedFromLoggerState)
    ) {
      // We expect only one promise below to resolve, to clean up listeners that
      // never fired we are setting up an abort controller
      const listenerController = new AbortController();
      try {
        await Promise.race([
          // We are using our own events here and not oidc plugin ones because
          // after plugin logged that token was refreshed, we still need to run
          // REFRESH_TOKEN_CALLBACK to get the actual token value in the state
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

      this.signInPromise = (async () => {
        log.info(mongoLogId(1_001_000_218), 'AtlasService', 'Starting sign in');
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
          this.oidcPluginSyncedFromLoggerState = 'error';
          throw err;
        }
      })();
      return await this.signInPromise;
    } finally {
      this.signInPromise = null;
    }
  }

  static async getUserInfo({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<UserInfo> {
    throwIfAborted(signal);
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

  static async introspect({ signal }: { signal?: AbortSignal } = {}) {
    throwIfAborted(signal);

    const url = new URL(`${this.issuer}/v1/introspect`);
    url.searchParams.set('client_id', this.clientId);

    await this.maybeWaitForToken({ signal });

    const res = await this.fetch(url.toString(), {
      method: 'POST',
      body: new URLSearchParams([
        ['token', this.token?.accessToken ?? ''],
        ['token_hint', 'access_token'],
      ]),
      headers: {
        Accept: 'application/json',
      },
      signal: signal as NodeFetchAbortSignal | undefined,
    });

    await throwIfNotOk(res);

    return res.json() as Promise<IntrospectInfo>;
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
  }) {
    throwIfAborted(signal);

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
      // Why this is not happening on the backend?
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

    return res.json() as Promise<AIQuery>;
  }

  static async onExit() {
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
