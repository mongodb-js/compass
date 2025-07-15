import { shell, app } from 'electron';
import { URL, URLSearchParams } from 'url';
import type {
  AuthFlowType,
  MongoDBOIDCPlugin,
  MongoDBOIDCPluginOptions,
} from '@mongodb-js/oidc-plugin';
import {
  throwIfNotOk,
  throwIfNetworkTrafficDisabled,
  getTrackingUserInfo,
} from './util';
import {
  createMongoDBOIDCPlugin,
  hookLoggerToMongoLogWriter as oidcPluginHookLoggerToMongoLogWriter,
} from '@mongodb-js/oidc-plugin';
import { oidcServerRequestHandler } from '@mongodb-js/devtools-connect';
import type { Agent } from 'https';
import type { IntrospectInfo, AtlasUserInfo, AtlasServiceConfig } from './util';
import { throwIfAborted } from '@mongodb-js/compass-utils';
import type { HadronIpcMain } from 'hadron-ipc';
import { ipcMain } from 'hadron-ipc';
import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import { SecretStore } from './secret-store';
import { OidcPluginLogger } from './oidc-plugin-logger';
import { spawn } from 'child_process';
import { getAtlasConfig } from './util';
import { createIpcTrack } from '@mongodb-js/compass-telemetry';
import type { RequestInit, Response } from '@mongodb-js/devtools-proxy-support';

const { log } = createLogger('COMPASS-ATLAS-SERVICE');
const track = createIpcTrack();

const redirectRequestHandler = oidcServerRequestHandler.bind(null, {
  productName: 'Compass',
  productDocsLink: 'https://www.mongodb.com/docs/compass',
});

const TOKEN_TYPE_TO_HINT = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
} as const;

interface CompassAuthHTTPClient {
  agent: Agent | undefined;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
}

export class CompassAuthService {
  private constructor() {
    // singleton
  }

  private static initPromise: Promise<void> | null = null;

  private static httpClient: CompassAuthHTTPClient;

  private static oidcPluginLogger = new OidcPluginLogger();

  private static plugin: MongoDBOIDCPlugin | null = null;

  private static currentUser: AtlasUserInfo | null = null;

  private static signInPromise: Promise<AtlasUserInfo> | null = null;

  private static fetch = async (
    url: string,
    init: RequestInit = {}
  ): Promise<Response> => {
    await this.initPromise;
    this.throwIfNetworkTrafficDisabled();
    throwIfAborted(init.signal ?? undefined);
    log.info(
      mongoLogId(1_001_000_299),
      'AtlasService',
      'Making an unauthenticated fetch',
      { url }
    );
    try {
      const res = await this.httpClient.fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          'User-Agent': `${app.getName()}/${app.getVersion()}`,
        },
      });
      await throwIfNotOk(res);
      return res;
    } catch (err) {
      log.info(mongoLogId(1_001_000_301), 'AtlasService', 'Fetch errored', {
        url,
        err,
      });
      throw err;
    }
  };

  private static secretStore = new SecretStore();

  private static ipcMain:
    | Pick<HadronIpcMain, 'createHandle' | 'handle' | 'broadcast'>
    | undefined = ipcMain;

  private static preferences: PreferencesAccess;
  private static config: AtlasServiceConfig;

  private static openExternal(url: string) {
    const { browserCommandForOIDCAuth } = this.preferences.getPreferences();
    if (browserCommandForOIDCAuth) {
      // NB: While it's possible to pass `openBrowser.command` option directly
      // to oidc-plugin properties, it's not possible to do dynamically. To
      // avoid recreating oidc-plugin every time user changes
      // `browserCommandForOIDCAuth` preference (which will cause loosing
      // internal plugin auth state), we copy oidc-plugin `openBrowser.command`
      // option handling to our openExternal method
      const child = spawn(browserCommandForOIDCAuth, [url], {
        shell: true,
        stdio: 'ignore',
        detached: true,
      });
      child.unref();
      return child;
    }
    return shell.openExternal(url);
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
      customFetch: this.httpClient
        .fetch as unknown as MongoDBOIDCPluginOptions['customFetch'],
    });
    oidcPluginHookLoggerToMongoLogWriter(
      this.oidcPluginLogger,
      log.unbound,
      'AtlasService'
    );
  }

  static init(
    preferences: PreferencesAccess,
    httpClient: CompassAuthHTTPClient
  ): Promise<void> {
    this.httpClient = httpClient;
    this.preferences = preferences;
    this.config = getAtlasConfig(preferences);
    return (this.initPromise ??= (async () => {
      if (this.ipcMain) {
        this.ipcMain.createHandle('AtlasService', this, [
          'getUserInfo',
          'introspect',
          'isAuthenticated',
          'signIn',
          'signOut',
          'maybeGetToken',
        ]);
      }
      this.attachOidcPluginLoggerEvents();
      log.info(
        mongoLogId(1_001_000_210),
        'AtlasService',
        'Atlas service initialized',
        { config: this.config }
      );
      const serializedState = await this.secretStore.getState();
      this.setupPlugin(serializedState);
    })());
  }

  private static throwIfNetworkTrafficDisabled() {
    throwIfNetworkTrafficDisabled(this.preferences);
  }

  private static requestOAuthToken({ signal }: { signal?: AbortSignal } = {}) {
    throwIfAborted(signal);
    this.throwIfNetworkTrafficDisabled();

    if (!this.plugin) {
      throw new Error(
        'Trying to use the oidc-plugin before service is initialised'
      );
    }

    return this.plugin.mongoClientOptions.authMechanismProperties.OIDC_HUMAN_CALLBACK(
      {
        idpInfo: {
          clientId: this.config.atlasLogin.clientId,
          issuer: this.config.atlasLogin.issuer,
        },
        // Required driver specific stuff
        version: 1,
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
      this.ipcMain?.broadcast('atlas-service-token-refresh-failed');
    });
    this.oidcPluginLogger.on('mongodb-oidc-plugin:refresh-succeeded', () => {
      this.oidcPluginLogger.emit('atlas-service-token-refreshed');
      this.ipcMain?.broadcast('atlas-service-token-refreshed');
    });
    this.oidcPluginLogger.on('atlas-service-signed-out', () => {
      this.ipcMain?.broadcast('atlas-service-signed-out');
    });
  }

  static async isAuthenticated({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<boolean> {
    throwIfAborted(signal);
    try {
      return (await this.introspect({ signal })).active;
    } catch {
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
        this.throwIfNetworkTrafficDisabled();

        log.info(mongoLogId(1_001_000_218), 'AtlasService', 'Starting sign in');

        try {
          // We first request oauth token just so we can get a proper auth error
          // from oidc-plugin. If we only run getUserInfo, the only thing users
          // will see is "401 unauthorized" as the reason for sign in failure
          await this.requestOAuthToken({ signal });
          const userInfo = await this.getUserInfo({ signal });
          log.info(
            mongoLogId(1_001_000_219),
            'AtlasService',
            'Signed in successfully'
          );
          const { auid } = getTrackingUserInfo(userInfo);
          track('Atlas Sign In Success', { auid });
          await this.preferences.savePreferences({
            telemetryAtlasUserId: auid,
          });
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
  static async maybeGetToken({
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
    this.throwIfNetworkTrafficDisabled();

    this.currentUser ??= await (async () => {
      const token = await this.maybeGetToken({ signal });

      const res = await this.fetch(
        `${this.config.atlasLogin.issuer}/v1/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token ?? ''}`,
            Accept: 'application/json',
          },
          signal: signal,
        }
      );

      await throwIfNotOk(res);

      return (await res.json()) as AtlasUserInfo;
    })();
    return this.currentUser;
  }

  static async introspect({
    signal,
    tokenType,
  }: {
    signal?: AbortSignal;
    tokenType?: 'accessToken' | 'refreshToken';
  } = {}) {
    throwIfAborted(signal);
    this.throwIfNetworkTrafficDisabled();

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
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: signal,
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
    this.throwIfNetworkTrafficDisabled();

    const url = new URL(`${this.config.atlasLogin.issuer}/v1/revoke`);
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
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: signal,
    });

    await throwIfNotOk(res);
  }

  static async onExit() {
    // Haven't even created the oidc-plugin yet, nothing to store
    if (!this.plugin) {
      return;
    }
    try {
      await this.secretStore.setState(await this.plugin.serialize());
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
