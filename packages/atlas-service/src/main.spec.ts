import Sinon from 'sinon';
import { expect } from 'chai';
import { CompassAuthService } from './main';
import { throwIfNotOk } from './util';
import { EventEmitter } from 'events';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import type { PreferencesAccess } from 'compass-preferences-model';
import * as util from './util';

function getListenerCount(emitter: EventEmitter) {
  return emitter.eventNames().reduce((acc, name) => {
    return acc + emitter.listenerCount(name);
  }, 0);
}

/**
 * @securityTest Atlas Login Integration Tests
 *
 * The Atlas Login feature is thoroughly tested, including proper authentication token
 * handling and credential revocation upon signout.
 */
describe('CompassAuthServiceMain', function () {
  const sandbox = Sinon.createSandbox();

  const atlasUid = '1234';
  const accessToken = `header.${Buffer.from(
    JSON.stringify({ sub: atlasUid })
  ).toString('base64url')}.signature`;
  const refreshToken = 'abcdRefresh';

  const mockFetch = sandbox.stub().callsFake((url: string) => {
    return {
      'http://example.com/tokens/revoke': {
        ok: true,
      },
    }[url];
  });

  const mockOidcPlugin = {
    logger: CompassAuthService['oidcPluginLogger'],
    serialize: sandbox.stub(),
    destroy: sandbox.stub(),
  };

  let oidcCallback: Sinon.SinonStub;
  let pluginOptions:
    | {
        serializedState?: string;
        customFetch?: (url: string, init?: RequestInit) => Promise<unknown>;
      }
    | undefined;

  const defaultConfig: util.AtlasServiceConfig = {
    ccsBaseUrl: 'ws://example.com',
    multiplexedWsBaseUrls: ['ws://example.com/multiplex'],
    cloudBaseUrl: 'ws://example.com/cloud',
    atlasPrivateApiBaseUrl: 'http://example.com/api/private',
    atlasAdminApiBaseUrl: 'http://example.com/api/atlas',
    atlasLogin: {
      issuer: 'http://example.com',
      clientId: '1234abcd',
    },
    assistantApiBaseUrl: 'http://example.com/assistant',
    userDataBaseUrl: 'http://example.com/ui/userData',
  };

  const fetch = CompassAuthService['fetch'];
  const getUserAgent = CompassAuthService['getUserAgent'];
  const ipcMain = CompassAuthService['ipcMain'];
  const createPlugin = CompassAuthService['createMongoDBOIDCPlugin'];
  const authConfig = CompassAuthService['config'];
  let preferences: PreferencesAccess;

  let getTrackingUserInfoStub: Sinon.SinonStubbedMember<
    typeof util.getTrackingUserInfo
  >;

  beforeEach(async function () {
    getTrackingUserInfoStub = sandbox
      .stub(util, 'getTrackingUserInfo')
      .returns({ auid: atlasUid });
    CompassAuthService['ipcMain'] = {
      handle: sandbox.stub(),
      broadcast: sandbox.stub(),
      createHandle: sandbox.stub(),
    };
    CompassAuthService['fetch'] = mockFetch as any;
    CompassAuthService['httpClient'] = { fetch: mockFetch } as any;

    oidcCallback = sandbox.stub().resolves({ accessToken, refreshToken });
    pluginOptions = undefined;
    CompassAuthService['createMongoDBOIDCPlugin'] = (options: {
      serializedState?: string;
    }) => {
      pluginOptions = options;
      return {
        ...mockOidcPlugin,
        mongoClientOptions: {
          authMechanismProperties: { OIDC_HUMAN_CALLBACK: oidcCallback },
        },
      };
    };

    CompassAuthService['config'] = defaultConfig;

    CompassAuthService['setupPlugin']();
    CompassAuthService['attachOidcPluginLoggerEvents']();

    preferences = await createSandboxFromDefaultPreferences();
    CompassAuthService['preferences'] = preferences;
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  afterEach(async function () {
    CompassAuthService['fetch'] = fetch;
    CompassAuthService['getUserAgent'] = getUserAgent;
    CompassAuthService['ipcMain'] = ipcMain;
    CompassAuthService['initPromise'] = null;
    CompassAuthService['createMongoDBOIDCPlugin'] = createPlugin;
    CompassAuthService['oidcPluginLogger'].removeAllListeners();
    CompassAuthService['signInPromise'] = null;
    CompassAuthService['currentUser'] = null;
    CompassAuthService['config'] = authConfig;

    sandbox.restore();
  });

  describe('signIn', function () {
    it('should sign in using oidc plugin', async function () {
      const atlasUid = 'abcdefgh';
      getTrackingUserInfoStub.returns({ auid: atlasUid });
      const userInfo = await CompassAuthService.signIn();
      expect(oidcCallback).to.have.been.calledOnceWith({
        idpInfo: {
          issuer: defaultConfig.atlasLogin.issuer,
          clientId: defaultConfig.atlasLogin.clientId,
        },
        version: 1,
        timeoutContext: undefined,
      });
      expect(userInfo).to.have.property('sub', '1234');
      expect(preferences.getPreferences().telemetryAtlasUserId).to.equal(
        atlasUid
      );
    });

    it('should track the elapsed sign in time on success', async function () {
      getTrackingUserInfoStub.returns({ auid: 'abcdefgh' });

      const trackedEvents: {
        event: string;
        properties: Record<string, unknown>;
      }[] = [];
      const onTrack = (data: {
        event: string;
        properties: Record<string, unknown>;
      }) => {
        trackedEvents.push(data);
      };
      process.on('compass:track', onTrack);

      const clock = sandbox.useFakeTimers({ now: 1000, toFake: ['Date'] });
      oidcCallback.callsFake(() => {
        clock.tick(5000);
        return Promise.resolve({ accessToken, refreshToken });
      });

      try {
        await CompassAuthService.signIn();
        // track() sends the event on a microtask
        await new Promise((resolve) => setTimeout(resolve, 0));

        const signInSuccess = trackedEvents.filter(({ event }) => {
          return event === 'Atlas Sign In Success';
        });
        expect(signInSuccess).to.have.lengthOf(1);
        expect(signInSuccess[0].properties).to.have.property('duration', 5000);
      } finally {
        process.off('compass:track', onTrack);
        oidcCallback.resolves({ accessToken, refreshToken });
        clock.restore();
      }
    });

    it('should debounce inflight sign in requests', async function () {
      void CompassAuthService.signIn();
      void CompassAuthService.signIn();
      void CompassAuthService.signIn();
      void CompassAuthService.signIn();

      await CompassAuthService.signIn();

      expect(oidcCallback).to.have.been.calledOnce;
    });

    it('should fail with oidc-plugin error first if auth failed', async function () {
      CompassAuthService['fetch'] = sandbox.stub().resolves({
        ok: false,
        json: sandbox.stub().rejects(),
        status: 401,
        statusText: 'Unauthorized',
      });
      const pluginError = Object.assign(
        new Error('Failed to request token for some specific plugin reason'),
        { codeName: 'MongoDBOIDCGenericError' }
      );
      CompassAuthService['plugin'] = {
        mongoClientOptions: {
          authMechanismProperties: {
            OIDC_HUMAN_CALLBACK: sandbox.stub().rejects(pluginError),
          },
        },
      } as any;

      const trackedEvents: {
        event: string;
        properties: Record<string, unknown>;
      }[] = [];
      const onTrack = (data: {
        event: string;
        properties: Record<string, unknown>;
      }) => {
        trackedEvents.push(data);
      };
      process.on('compass:track', onTrack);

      try {
        try {
          await CompassAuthService.signIn();
          expect.fail('Expected AtlasService.signIn to throw');
        } catch (err) {
          expect(err).to.have.property(
            'message',
            'Failed to request token for some specific plugin reason'
          );
        }

        // track() sends the event on a microtask
        await new Promise((resolve) => setTimeout(resolve, 0));

        const signInError = trackedEvents.filter(({ event }) => {
          return event === 'Atlas Sign In Error';
        });
        expect(signInError).to.have.lengthOf(1);
        expect(signInError[0].properties).to.have.property(
          'error',
          'Failed to request token for some specific plugin reason'
        );
        expect(signInError[0].properties).to.have.property(
          'error_code',
          'MongoDBOIDCGenericError'
        );
      } finally {
        process.off('compass:track', onTrack);
      }
    });

    it('should fall back to the error name as error code for non oidc-plugin errors', async function () {
      CompassAuthService['plugin'] = {
        mongoClientOptions: {
          authMechanismProperties: {
            OIDC_HUMAN_CALLBACK: sandbox
              .stub()
              .rejects(new TypeError('Something else went wrong')),
          },
        },
      } as any;

      const trackedEvents: {
        event: string;
        properties: Record<string, unknown>;
      }[] = [];
      const onTrack = (data: {
        event: string;
        properties: Record<string, unknown>;
      }) => {
        trackedEvents.push(data);
      };
      process.on('compass:track', onTrack);

      try {
        await CompassAuthService.signIn().catch(() => {
          // expected, we're only interested in the tracked event
        });

        // track() sends the event on a microtask
        await new Promise((resolve) => setTimeout(resolve, 0));

        const signInError = trackedEvents.filter(({ event }) => {
          return event === 'Atlas Sign In Error';
        });
        expect(signInError).to.have.lengthOf(1);
        expect(signInError[0].properties).to.have.property(
          'error_code',
          'TypeError'
        );
      } finally {
        process.off('compass:track', onTrack);
      }
    });
  });

  describe('isAuthenticated', function () {
    it('should return true if there is a current user', async function () {
      CompassAuthService['currentUser'] = { sub: atlasUid };

      expect(await CompassAuthService.isAuthenticated()).to.eq(true);
    });

    it('should return false if there is no current user', async function () {
      CompassAuthService['currentUser'] = null;

      expect(await CompassAuthService.isAuthenticated()).to.eq(false);
    });

    it('should throw if aborted signal is passed', async function () {
      const c = new AbortController();
      c.abort(new Error('Aborted'));
      try {
        await CompassAuthService.isAuthenticated({ signal: c.signal });
        expect.fail('Expected isAuthenticated to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Aborted');
      }
    });
  });

  describe('restoreCurrentUser', function () {
    it('should restore the current user from the access token', async function () {
      await CompassAuthService['restoreCurrentUser']();

      expect(CompassAuthService['currentUser']).to.have.property(
        'sub',
        atlasUid
      );
      expect(await CompassAuthService.isAuthenticated()).to.eq(true);
    });

    it('should leave the current user unset if no token can be acquired', async function () {
      oidcCallback.rejects(new Error('Auth flows are not allowed'));

      await CompassAuthService['restoreCurrentUser']();

      expect(CompassAuthService['currentUser']).to.eq(null);
      expect(await CompassAuthService.isAuthenticated()).to.eq(false);
    });

    it('should leave the current user unset if the access token cannot be parsed', async function () {
      oidcCallback.resolves({ accessToken: 'not-a-jwt', refreshToken });

      await CompassAuthService['restoreCurrentUser']();

      expect(CompassAuthService['currentUser']).to.eq(null);
      expect(await CompassAuthService.isAuthenticated()).to.eq(false);
    });

    it('should clear a previously signed in user if the token is gone', async function () {
      CompassAuthService['currentUser'] = { sub: atlasUid };
      oidcCallback.resolves({ refreshToken });

      await CompassAuthService['restoreCurrentUser']();

      expect(CompassAuthService['currentUser']).to.eq(null);
    });
  });

  describe('throwIfNotOk', function () {
    it('should not throw if res is ok', async function () {
      await throwIfNotOk({
        ok: true,
        status: 200,
        statusText: 'OK',
        json() {
          return Promise.resolve({});
        },
      });
    });

    it('should throw network error if res is not an atlas error', async function () {
      try {
        await throwIfNotOk({
          ok: false,
          status: 500,
          statusText: 'Whoops',
          json() {
            return Promise.resolve({});
          },
        });
        expect.fail('Expected throwIfNotOk to throw');
      } catch (err) {
        expect(err).to.have.property('name', 'NetworkError');
        expect(err).to.have.property('message', '500: Whoops');
      }
    });

    it('should try to parse AIError from body and throw it', async function () {
      try {
        await throwIfNotOk({
          ok: false,
          status: 500,
          statusText: 'Whoops',
          json() {
            return Promise.resolve({
              errorCode: 'ExampleCode',
              error: 500,
              detail: 'tortillas',
            });
          },
        });
        expect.fail('Expected throwIfNotOk to throw');
      } catch (err) {
        expect(err).to.have.property('name', 'ServerError');
        expect(err).to.have.property('message', 'ExampleCode: tortillas');
        expect(err).to.have.property('detail', 'tortillas');
        expect(err).to.have.property('errorCode', 'ExampleCode');
        expect(err).to.have.property('statusCode', 500);
      }
    });
  });

  describe('init', function () {
    it('should setup the plugin', async function () {
      const setupPluginSpy = sandbox.spy(
        CompassAuthService as any,
        'setupPlugin'
      );
      await CompassAuthService.init(preferences, {} as any);
      expect(setupPluginSpy).to.have.been.calledOnce;
    });

    it('should restore the stored user when the plugin requests a token', async function () {
      CompassAuthService['fetch'] = fetch;
      // `app` is not available outside of electron
      CompassAuthService['getUserAgent'] = () => 'Compass/test';
      const httpClientFetch = sandbox.stub().resolves({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({}),
      });
      // Ensure the mock oidc plugin actually calls the custom fetch
      // - this part is important as we want to test the whole flow
      oidcCallback.callsFake(async () => {
        await pluginOptions?.customFetch?.('http://example.com/oauth/token', {
          method: 'POST',
        });
        return { accessToken, refreshToken };
      });
      const restoreCurrentUserSpy = sandbox.spy(
        CompassAuthService as any,
        'restoreCurrentUser'
      );
      sandbox
        .stub(CompassAuthService['secretStore'], 'getState')
        .resolves('serialized-plugin-state');

      await CompassAuthService.init(preferences, {
        fetch: httpClientFetch,
      } as any);

      expect(pluginOptions).to.have.property(
        'serializedState',
        'serialized-plugin-state'
      );
      expect(restoreCurrentUserSpy).to.have.been.calledOnce;
      expect(httpClientFetch).to.have.been.calledOnce;
      expect(httpClientFetch.firstCall.args[0]).to.eq(
        'http://example.com/oauth/token'
      );
      expect(CompassAuthService['currentUser']).to.have.property(
        'sub',
        atlasUid
      );
      expect(await CompassAuthService.isAuthenticated()).to.equal(true);
    });
  });

  describe('with networkTraffic turned off', function () {
    beforeEach(async function () {
      await preferences.savePreferences({ networkTraffic: false });
    });

    for (const methodName of ['requestOAuthToken', 'signIn', 'revoke']) {
      it(`${methodName} should throw`, async function () {
        try {
          await (CompassAuthService as any)[methodName]({});
          expect.fail(`Expected ${methodName} to throw`);
        } catch (err) {
          expect(err).to.have.property(
            'message',
            'Network traffic is not allowed'
          );
        }
      });
    }
  });

  describe('with enableAtlasSignIn turned off', function () {
    beforeEach(async function () {
      await preferences.savePreferences({ enableAtlasSignIn: false });
    });

    it('signIn should throw', async function () {
      try {
        await CompassAuthService.signIn({});
        expect.fail('Expected signIn to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Atlas sign in is not allowed');
      }
    });

    it('isAuthenticated should return false without making any requests', async function () {
      CompassAuthService['currentUser'] = { sub: atlasUid };
      mockFetch.resetHistory();
      expect(await CompassAuthService.isAuthenticated()).to.eq(false);
      expect(mockFetch).to.not.have.been.called;
    });

    it('maybeGetToken should not return a stored token', async function () {
      expect(await CompassAuthService.maybeGetToken({})).to.eq(undefined);
    });

    it('handleAuthHeaders should not add auth headers even with a usable token', async function () {
      CompassAuthService['currentUser'] = { sub: atlasUid };
      const authHeaders = await CompassAuthService.handleAuthHeaders({
        requestHeaders: {
          'X-Some-Header': 'value',
          'X-Compass-Auth': 'true',
        },
        url: `${defaultConfig.atlasAdminApiBaseUrl}/v2/clusters`,
      });
      expect(authHeaders).to.not.have.property('Authorization');
      expect(authHeaders).to.have.property('X-Some-Header', 'value');
    });

    it('init should not restore the current user from a stored token', async function () {
      CompassAuthService['currentUser'] = null;
      CompassAuthService['initPromise'] = null;
      sandbox
        .stub(CompassAuthService['secretStore'], 'getState')
        .resolves('serialized-state');

      await CompassAuthService.init(preferences, {} as any);

      expect(CompassAuthService['currentUser']).to.eq(null);
    });
  });

  describe('signOut', function () {
    it('should reset service state, revoke tokens, and destroy plugin', async function () {
      const logger = new EventEmitter();
      CompassAuthService['oidcPluginLogger'] = logger;
      CompassAuthService['currentUser'] = {
        sub: '1234',
      };
      await CompassAuthService.init(preferences, {} as any);
      CompassAuthService['config'] = defaultConfig;
      // We expect that the oidc plugin registers a number of listeners
      // upon creation, which should get unregistered when we sign out.
      expect(getListenerCount(logger)).to.be.greaterThan(0);
      // We did all preparations, reset sinon history for easier assertions
      sandbox.resetHistory();

      await CompassAuthService.signOut();
      expect(getListenerCount(logger)).to.eq(0);
      expect(logger).to.not.eq(CompassAuthService['oidcPluginLogger']);
      expect(mockOidcPlugin.destroy).to.have.been.calledOnce;
      expect(CompassAuthService['fetch']).to.have.been.calledOnceWith(
        'http://example.com/tokens/revoke'
      );
      const [, fetchOptions] = (
        CompassAuthService['fetch'] as Sinon.SinonStub
      ).getCall(0).args;
      expect(Object.fromEntries(fetchOptions.body)).to.deep.equal({
        token: refreshToken,
        token_type_hint: 'refresh_token',
        client_id: '1234abcd',
      });
    });

    it('should throw when called before sign in', async function () {
      try {
        await CompassAuthService.signOut();
        expect.fail('Expected signOut to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          "Can't sign out if not signed in yet"
        );
      }
    });
  });

  describe('handleAuthHeaders', function () {
    context('user is signed in', function () {
      const accessToken = 'abcd1234';
      beforeEach(function () {
        CompassAuthService['currentUser'] = {
          sub: '1234',
        };

        oidcCallback.resolves({ accessToken });
      });

      it('should add auth headers for an Atlas Admin API request', async function () {
        const url = `${defaultConfig.atlasAdminApiBaseUrl}/v2/clusters`;
        const authHeaders = await CompassAuthService.handleAuthHeaders({
          requestHeaders: {
            'X-Some-Header': 'value',
            'X-Compass-Auth': 'true',
          },
          url,
        });
        expect(authHeaders).to.have.property(
          'Authorization',
          `Bearer ${accessToken}`
        );
        expect(authHeaders).to.have.property('X-Some-Header', 'value');
        expect(authHeaders).to.not.have.property('X-Compass-Auth');
      });

      it('should not add auth headers if they werent asked for', async function () {
        const url = 'http://example.com/api/private/some-endpoint';
        const oldHeaders = {
          'X-Some-Header': 'value',
        };
        expect(
          await CompassAuthService.handleAuthHeaders({
            requestHeaders: oldHeaders,
            url,
          })
        ).to.deep.equal(oldHeaders);
      });

      describe('prevents token exfiltration', function () {
        const attackerUrls = [
          // Lookalike host (suffix attack).
          'http://example.com.attacker.tld/api/atlas/v2/clusters',
          // Lookalike host (prefix attack).
          'http://attacker-example.com/api/atlas/v2/clusters',
          // Correct origin, path not on the allowlist.
          'http://example.com/api/atlas/v2/clusters/extra',
          // Different protocol on the same host.
          'https://example.com/api/atlas/v2/clusters',
          // URL userinfo spoofing.
          'http://example.com@attacker.tld/api/atlas/v2/clusters',
        ];

        for (const url of attackerUrls) {
          it(`throws when asked to add auth headers for ${url}`, async function () {
            let err: Error | undefined;
            try {
              await CompassAuthService.handleAuthHeaders({
                requestHeaders: {
                  'X-Compass-Auth': 'true',
                },
                url,
              });
            } catch (error) {
              err = error as Error;
            }
            expect(err).to.have.property(
              'message',
              'Invalid authenticated request URL.'
            );
          });
        }
      });
    });

    context('is not signed in', function () {
      beforeEach(function () {
        oidcCallback.rejects(new Error('Failed to request token'));
      });

      it('does not throw when asked to add auth headers when not signed in', async function () {
        const req = {
          url: `${defaultConfig.atlasAdminApiBaseUrl}/v2/clusters`,
        } as Request;
        const headers = await CompassAuthService.handleAuthHeaders({
          requestHeaders: {
            'X-Compass-Auth': 'true',
            'X-Some-Header': 'value',
          },
          url: req.url,
        });
        expect(headers).to.not.have.property('Authorization');
        expect(headers).to.not.have.property('X-Compass-Auth');
        expect(headers).to.have.property('X-Some-Header', 'value');
      });
    });
  });
});
