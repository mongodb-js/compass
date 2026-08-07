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
      'http://example.com/tokens/introspect': {
        ok: true,
      },
      'http://example.com/tokens/revoke': {
        ok: true,
      },
    }[url];
  });

  const mockOidcPlugin = {
    mongoClientOptions: {
      authMechanismProperties: {
        OIDC_HUMAN_CALLBACK: sandbox
          .stub()
          .resolves({ accessToken, refreshToken }),
      },
    },
    logger: CompassAuthService['oidcPluginLogger'],
    serialize: sandbox.stub(),
    destroy: sandbox.stub(),
  };

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
  const ipcMain = CompassAuthService['ipcMain'];
  const createPlugin = CompassAuthService['createMongoDBOIDCPlugin'];
  const authConfig = CompassAuthService['config'];
  let preferences: PreferencesAccess;

  let getTrackingUserInfoStub: Sinon.SinonStubbedMember<
    typeof util.getTrackingUserInfo
  >;

  before(function () {
    getTrackingUserInfoStub = sandbox.stub(util, 'getTrackingUserInfo');
  });

  beforeEach(async function () {
    CompassAuthService['ipcMain'] = {
      handle: sandbox.stub(),
      broadcast: sandbox.stub(),
      createHandle: sandbox.stub(),
    };
    CompassAuthService['fetch'] = mockFetch as any;
    CompassAuthService['httpClient'] = { fetch: mockFetch } as any;
    CompassAuthService['createMongoDBOIDCPlugin'] = () => mockOidcPlugin;

    CompassAuthService['config'] = defaultConfig;

    CompassAuthService['setupPlugin']();
    CompassAuthService['attachOidcPluginLoggerEvents']();

    preferences = await createSandboxFromDefaultPreferences();
    CompassAuthService['preferences'] = preferences;
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  afterEach(async function () {
    CompassAuthService['fetch'] = fetch;
    CompassAuthService['ipcMain'] = ipcMain;
    CompassAuthService['initPromise'] = null;
    CompassAuthService['createMongoDBOIDCPlugin'] = createPlugin;
    CompassAuthService['oidcPluginLogger'].removeAllListeners();
    CompassAuthService['signInPromise'] = null;
    CompassAuthService['currentUser'] = null;
    CompassAuthService['config'] = authConfig;

    sandbox.resetHistory();
  });

  after(function () {
    sandbox.restore();
  });

  describe('signIn', function () {
    it('should sign in using oidc plugin', async function () {
      const atlasUid = 'abcdefgh';
      getTrackingUserInfoStub.returns({ auid: atlasUid });
      const userInfo = await CompassAuthService.signIn();
      expect(
        mockOidcPlugin.mongoClientOptions.authMechanismProperties
          .OIDC_HUMAN_CALLBACK
      ).to.have.been.calledOnceWith({
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

    it('should debounce inflight sign in requests', async function () {
      void CompassAuthService.signIn();
      void CompassAuthService.signIn();
      void CompassAuthService.signIn();
      void CompassAuthService.signIn();

      await CompassAuthService.signIn();

      expect(
        mockOidcPlugin.mongoClientOptions.authMechanismProperties
          .OIDC_HUMAN_CALLBACK
      ).to.have.been.calledOnce;
    });

    it('should fail with oidc-plugin error first if auth failed', async function () {
      CompassAuthService['fetch'] = sandbox.stub().resolves({
        ok: false,
        json: sandbox.stub().rejects(),
        status: 401,
        statusText: 'Unauthorized',
      });
      CompassAuthService['plugin'] = {
        mongoClientOptions: {
          authMechanismProperties: {
            OIDC_HUMAN_CALLBACK: sandbox
              .stub()
              .rejects(
                new Error(
                  'Failed to request token for some specific plugin reason'
                )
              ),
          },
        },
      } as any;

      try {
        await CompassAuthService.signIn();
        expect.fail('Expected AtlasService.signIn to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          'Failed to request token for some specific plugin reason'
        );
      }
    });
  });

  describe('isAuthenticated', function () {
    it('should return true if token is active', async function () {
      CompassAuthService['fetch'] = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({ active: true });
        },
      }) as any;

      expect(await CompassAuthService.isAuthenticated()).to.eq(true);
    });

    it('should return false if token is inactive', async function () {
      CompassAuthService['fetch'] = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({ active: false });
        },
      }) as any;

      expect(await CompassAuthService.isAuthenticated()).to.eq(false);
    });

    it('should return false if checking token fails', async function () {
      CompassAuthService['fetch'] = sandbox
        .stub()
        .resolves({ ok: false, status: 500 }) as any;

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
  });

  describe('with networkTraffic turned off', function () {
    beforeEach(async function () {
      await preferences.savePreferences({ networkTraffic: false });
    });

    for (const methodName of [
      'requestOAuthToken',
      'signIn',
      'introspect',
      'revoke',
    ]) {
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

  describe('signOut', function () {
    it('should reset service state, revoke tokens, and destroy plugin', async function () {
      const logger = new EventEmitter();
      CompassAuthService['oidcPluginLogger'] = logger;
      CompassAuthService['currentUser'] = {
        sub: '1234',
      } as any;
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
        } as any;

        CompassAuthService['plugin'] = {
          mongoClientOptions: {
            authMechanismProperties: {
              OIDC_HUMAN_CALLBACK: sandbox
                .stub()
                .resolves({ accessToken: accessToken }),
            },
          },
        } as any;
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
        CompassAuthService['plugin'] = {
          mongoClientOptions: {
            authMechanismProperties: {
              OIDC_HUMAN_CALLBACK: sandbox
                .stub()
                .rejects(new Error('Failed to request token')),
            },
          },
        } as any;
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
