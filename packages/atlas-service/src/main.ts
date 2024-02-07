import { shell, app } from 'electron';
import { URL, URLSearchParams } from 'url';
import { createHash } from 'crypto';
import type { AuthFlowType, MongoDBOIDCPlugin } from '@mongodb-js/oidc-plugin';
import {
  createMongoDBOIDCPlugin,
  hookLoggerToMongoLogWriter as oidcPluginHookLoggerToMongoLogWriter,
} from '@mongodb-js/oidc-plugin';
import { oidcServerRequestHandler } from '@mongodb-js/devtools-connect';
// TODO(https://github.com/node-fetch/node-fetch/issues/1652): Remove this when
// node-fetch types match the built in AbortSignal from node.
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';
import type { RequestInfo, RequestInit } from 'node-fetch';
import nodeFetch from 'node-fetch';
import type { IntrospectInfo, AtlasUserInfo } from './util';
import type { AtlasUserConfig } from './user-config-store';
import { throwIfAborted } from '@mongodb-js/compass-utils';
import type { HadronIpcMain } from 'hadron-ipc';
import { ipcMain } from 'hadron-ipc';
import {
  createLoggerAndTelemetry,
  mongoLogId,
} from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import { SecretStore } from './secret-store';
import { AtlasUserConfigStore } from './user-config-store';
import { OidcPluginLogger } from './oidc-plugin-logger';
import { spawn } from 'child_process';
import {
  type AtlasHttpApiClient,
  ErrorAwareAtlasHttpApiClient,
} from './renderer/atlas-http-client';

const { log, track } = createLoggerAndTelemetry('COMPASS-ATLAS-SERVICE');

const redirectRequestHandler = oidcServerRequestHandler.bind(null, {
  productName: 'Compass',
  productDocsLink: 'https://www.mongodb.com/docs/compass',
});

function throwIfNetworkTrafficDisabled(preferences: PreferencesAccess) {
  if (!preferences.getPreferences().networkTraffic) {
    throw new Error('Network traffic is not allowed');
  }
}

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
  atlasApiUnauthBaseUrl: string;
  atlasLogin: {
    clientId: string;
    issuer: string;
  };
  authPortalUrl: string;
};

export class CompassAtlasHttpApiClient implements AtlasHttpApiClient {
  private static instance: CompassAtlasHttpApiClient | null = null;
  private ipcMain:
    | Pick<HadronIpcMain, 'createHandle' | 'handle' | 'broadcast'>
    | undefined = ipcMain;
  private constructor(
    private config: AtlasServiceConfig,
    private preferences: PreferencesAccess
  ) {}

  public static getInstance(
    config: AtlasServiceConfig,
    preferences: PreferencesAccess
  ) {
    if (!this.instance) {
      this.instance = new this(config, preferences);
      if (this.instance.ipcMain) {
        this.instance.ipcMain.createHandle(
          'CompassAtlasHttpApiClient',
          this.instance,
          [
            'oauthEndpoint',
            'privateUnAuthEndpoint',
            'privateAtlasEndpoint',
            'fetch',
            'unAuthenticatedFetch',
          ]
        );
      }
    }
    return this.instance;
  }

  public async oauthEndpoint({ path }: { path: string }) {
    return `${this.config.atlasLogin.issuer}/${path}`;
  }
  public async privateUnAuthEndpoint({ path }: { path: string }) {
    return `${this.config.atlasApiUnauthBaseUrl}/${path}`;
  }
  public async privateAtlasEndpoint({ path }: { path: string }) {
    return `${this.config.atlasApiBaseUrl}/${path}`;
  }
  public async unAuthenticatedFetch({
    url,
    init,
  }: {
    url: RequestInfo;
    init: RequestInit;
  }) {
    throwIfNetworkTrafficDisabled(this.preferences);
    throwIfAborted(init.signal as AbortSignal);
    return await nodeFetch(url, {
      ...init,
      headers: {
        'User-Agent': `${app.getName()}/${app.getVersion()}`,
        ...init.headers,
      },
    });
  }
  public async fetch({ url, init }: { url: RequestInfo; init: RequestInit }) {
    const token = await AtlasService.maybeGetToken({
      signal: init.signal as AbortSignal,
    });
    return await this.unAuthenticatedFetch({
      url,
      init: {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${token ?? ''}`,
        },
      },
    });
  }
}

export class AtlasService {
  private constructor() {
    // singleton
  }

  private static initPromise: Promise<void> | null = null;

  private static oidcPluginLogger = new OidcPluginLogger();

  private static plugin: MongoDBOIDCPlugin | null = null;

  private static currentUser: AtlasUserInfo | null = null;

  private static signInPromise: Promise<AtlasUserInfo> | null = null;

  private static secretStore = new SecretStore();

  private static atlasUserConfigStore = new AtlasUserConfigStore();

  private static ipcMain:
    | Pick<HadronIpcMain, 'createHandle' | 'handle' | 'broadcast'>
    | undefined = ipcMain;

  private static preferences: PreferencesAccess;
  private static config: AtlasServiceConfig;

  private static httpClient: ErrorAwareAtlasHttpApiClient;

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
    });
    oidcPluginHookLoggerToMongoLogWriter(
      this.oidcPluginLogger,
      log.unbound,
      'AtlasService'
    );
  }

  static init(
    config: AtlasServiceConfig,
    {
      preferences,
    }: {
      preferences: PreferencesAccess;
    }
  ): Promise<void> {
    this.preferences = preferences;
    this.config = config;
    this.httpClient = new ErrorAwareAtlasHttpApiClient(
      CompassAtlasHttpApiClient.getInstance(config, preferences)
    );
    return (this.initPromise ??= (async () => {
      if (this.ipcMain) {
        this.ipcMain.createHandle('AtlasService', this, [
          'signIn',
          'signOut',
          'isAuthenticated',
          'getCurrentUser',
          'updateAtlasUserConfig',
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
      // Whether or not we got the state, try requesting user info. If there was
      // no serialized state returned, this will just fail quickly. If there was
      // some state, we will prepare the service state for user interactions by
      // forcing oidc-plugin to do token refresh if expired and setting user
      try {
        await this.getCurrentUser();
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
    throwIfNetworkTrafficDisabled(this.preferences);

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
      this.ipcMain?.broadcast('atlas-service-token-refresh-failed');
    });
    this.oidcPluginLogger.on('mongodb-oidc-plugin:refresh-succeeded', () => {
      this.oidcPluginLogger.emit('atlas-service-token-refreshed');
      this.ipcMain?.broadcast('atlas-service-token-refreshed');
    });
    this.oidcPluginLogger.on('atlas-service-signed-out', () => {
      this.ipcMain?.broadcast('atlas-service-signed-out');
    });
    this.oidcPluginLogger.on(
      'atlas-service-user-config-changed',
      (newConfig) => {
        this.ipcMain?.broadcast('atlas-service-user-config-changed', newConfig);
      }
    );
  }

  public static async isAuthenticated({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<boolean> {
    throwIfAborted(signal);
    try {
      return (await this.introspect({ signal })).active;
    } catch (err) {
      return false;
    }
  }

  public static async signIn({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<AtlasUserInfo> {
    if (this.signInPromise) {
      return this.signInPromise;
    }
    try {
      this.signInPromise = (async () => {
        throwIfAborted(signal);

        log.info(mongoLogId(1_001_000_218), 'AtlasService', 'Starting sign in');

        try {
          // We first request oauth token just so we can get a proper auth error
          // from oidc-plugin. If we only run getCurrentUser, the only thing users
          // will see is "401 unauthorized" as the reason for sign in failure
          await this.requestOAuthToken({ signal });
          const userInfo = await this.getCurrentUser({ signal });
          log.info(
            mongoLogId(1_001_000_219),
            'AtlasService',
            'Signed in successfully'
          );
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

  public static async signOut(): Promise<void> {
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

  public static async getCurrentUser({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<AtlasUserInfo> {
    throwIfAborted(signal);
    this.currentUser ??= await (async () => {
      const userInfo = await this.httpClient.fetchJson<AtlasUserInfo>(
        await this.httpClient.oauthEndpoint('v1/userinfo'),
        {
          signal: signal as NodeFetchAbortSignal | undefined,
        }
      );

      const userConfig = await this.atlasUserConfigStore.getUserConfig(
        userInfo.sub
      );

      return { ...userInfo, ...userConfig };
    })();
    return this.currentUser;
  }

  public static async updateAtlasUserConfig({
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

  private static async introspect({
    signal,
    tokenType,
  }: {
    signal?: AbortSignal;
    tokenType?: 'accessToken' | 'refreshToken';
  } = {}) {
    throwIfAborted(signal);

    const url = new URL(await this.httpClient.oauthEndpoint('v1/introspect'));
    url.searchParams.set('client_id', this.config.atlasLogin.clientId);

    tokenType ??= 'accessToken';

    const token = await this.maybeGetToken({ signal, tokenType });

    return await this.httpClient.unAuthenticatedFetchJson<IntrospectInfo>(
      url.toString(),
      {
        method: 'POST',
        body: new URLSearchParams([
          ['token', token ?? ''],
          ['token_type_hint', TOKEN_TYPE_TO_HINT[tokenType]],
        ]),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: signal as NodeFetchAbortSignal | undefined,
      }
    );
  }

  private static async revoke({
    signal,
    tokenType,
  }: {
    signal?: AbortSignal;
    tokenType?: 'accessToken' | 'refreshToken';
  } = {}): Promise<void> {
    throwIfAborted(signal);

    const url = new URL(await this.httpClient.oauthEndpoint('v1/revoke'));
    url.searchParams.set('client_id', this.config.atlasLogin.clientId);

    tokenType ??= 'accessToken';

    const token = await this.maybeGetToken({ signal, tokenType });

    await this.httpClient.unAuthenticatedFetchJson(url.toString(), {
      method: 'POST',
      body: new URLSearchParams([
        ['token', token ?? ''],
        ['token_type_hint', TOKEN_TYPE_TO_HINT[tokenType]],
      ]),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: signal as NodeFetchAbortSignal | undefined,
    });
  }

  public static async onExit() {
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
