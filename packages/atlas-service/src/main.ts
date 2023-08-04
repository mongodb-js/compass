import { shell } from 'electron';
import { URL, URLSearchParams } from 'url';
import { EventEmitter, once } from 'events';
import type { MongoDBOIDCPluginOptions } from '@mongodb-js/oidc-plugin';
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
import { broadcast, ipcExpose } from './util';
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

const MAX_REQUEST_SIZE = 10000;

const MIN_SAMPLE_DOCUMENTS = 1;

type MongoDBOIDCPluginLogger = Required<MongoDBOIDCPluginOptions>['logger'];

export class AtlasService {
  private constructor() {
    // singleton
  }

  private static calledOnce = false;

  private static oidcPluginLogger: MongoDBOIDCPluginLogger & {
    on(evt: 'atlas-service-token-refreshed', fn: () => void): void;
    on(evt: 'atlas-service-token-refresh-failed', fn: () => void): void;
    emit(evt: 'atlas-service-token-refreshed'): void;
    emit(evt: 'atlas-service-token-refresh-failed'): void;
  } = new EventEmitter();

  private static oidcPluginSyncedFromLoggerState:
    | 'initial'
    | 'authenticated'
    | 'expired'
    | 'error' = 'initial';

  private static plugin = createMongoDBOIDCPlugin({
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
    logger: this.oidcPluginLogger,
  });

  private static token: Token | null = null;

  private static signInPromise: Promise<Token> | null = null;

  private static fetch: typeof fetch = fetch;

  private static refreshing = false;

  private static get clientId() {
    if (!process.env.COMPASS_CLIENT_ID) {
      throw new Error('COMPASS_CLIENT_ID is required');
    }
    return process.env.COMPASS_CLIENT_ID;
  }

  private static get issuer() {
    if (!process.env.COMPASS_OIDC_ISSUER) {
      throw new Error('COMPASS_OIDC_ISSUER is required');
    }
    return process.env.COMPASS_OIDC_ISSUER;
  }

  private static get apiBaseUrl() {
    if (!process.env.COMPASS_ATLAS_SERVICE_BASE_URL) {
      throw new Error(
        'No AI Query endpoint to fetch. Please set the environment variable `COMPASS_ATLAS_SERVICE_BASE_URL`'
      );
    }
    return process.env.COMPASS_ATLAS_SERVICE_BASE_URL;
  }

  static init() {
    if (this.calledOnce) {
      return;
    }
    this.calledOnce = true;
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

  private static async refreshToken() {
    // In case our call to REFRESH_TOKEN_CALLBACK somehow started another
    // token refresh instead of just returning token from the plugin state, we
    // short circuit if plugin logged a refresh-succeeded event and this
    // listener got triggered
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
      // We expect only one promise below to resolve, to clean up listeners that
      // never fired we are setting up an abort controller
      const listenerController = new AbortController();
      try {
        await Promise.race([
          // When oidc-plugin logged that token was refreshed, the token is not
          // actually refreshed yet in the plugin state and so calling `REFRESH_TOKEN_CALLBACK`
          // causes weird behavior that actually opens the browser again, to work
          // around that we wait for the state update event in addition. We can't
          // guarantee that this event will be emitted for our particular state as
          // this is not something oidc-plugin exposes, but we can ignore this for
          // now as only one auth state is created in this instance of oidc-plugin
          once(this.oidcPluginLogger, 'mongodb-oidc-plugin:state-updated', {
            signal: listenerController.signal,
          }),
          // At the same time refresh can still fail at this stage, so to avoid
          // refresh being stuck, we also wait for refresh-failed event and throw
          // if it happens to avoid calling `REFRESH_TOKEN_CALLBACK`
          once(this.oidcPluginLogger, 'mongodb-oidc-plugin:refresh-failed', {
            signal: listenerController.signal,
          }).then(() => {
            throw new Error('Refresh failed');
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
        const token =
          await this.plugin.mongoClientOptions.authMechanismProperties
            // WARN: in the oidc plugin refresh callback is actually the same
            // method as sign in, so calling it here means that potentially
            // this can start an actual sign in flow for the user instead of
            // just trying to refresh the token
            .REFRESH_TOKEN_CALLBACK(
              { clientId: this.clientId, issuer: this.issuer },
              {
                // Required driver specific stuff
                version: 0,
              }
            );
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
    // In cases where we ended up in expired state, we know that oidc-plugin
    // is trying to refresh the token automatically, we can wait for this process
    // to finish before proceeding with a request
    if (this.oidcPluginSyncedFromLoggerState === 'expired') {
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
    if (signal?.aborted) {
      const err = signal.reason ?? new Error('This operation was aborted.');
      throw err;
    }
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
      if (signal?.aborted) {
        const err = signal.reason ?? new Error('This operation was aborted.');
        throw err;
      }

      this.signInPromise = (async () => {
        log.info(mongoLogId(1_001_000_218), 'AtlasService', 'Starting sign in');
        try {
          this.token =
            await this.plugin.mongoClientOptions.authMechanismProperties.REQUEST_TOKEN_CALLBACK(
              { clientId: this.clientId, issuer: this.issuer },
              {
                // Required driver specific stuff
                version: 0,
                // This seems to be just an abort signal? We probably can make it
                // explicit when adding a proper interface for this
                timeoutContext: signal,
              }
            );
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
    if (signal?.aborted) {
      const err = signal.reason ?? new Error('This operation was aborted.');
      throw err;
    }
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
    if (signal?.aborted) {
      const err = signal.reason ?? new Error('This operation was aborted.');
      throw err;
    }

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
    if (signal?.aborted) {
      const err = signal.reason ?? new Error('This operation was aborted.');
      throw err;
    }

    let msgBody = JSON.stringify({
      userInput,
      collectionName,
      databaseName,
      schema,
      sampleDocuments,
    });
    if (msgBody.length > MAX_REQUEST_SIZE) {
      // When the message body is over the max size, we try
      // to see if with fewer sample documents we can still perform the request.
      // If that fails we throw an error indicating this collection's
      // documents are too large to send to the ai.
      msgBody = JSON.stringify({
        userInput,
        collectionName,
        databaseName,
        schema,
        sampleDocuments: sampleDocuments?.slice(0, MIN_SAMPLE_DOCUMENTS),
      });
      // Why this is not happening on the backend?
      if (msgBody.length > MAX_REQUEST_SIZE) {
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
}
