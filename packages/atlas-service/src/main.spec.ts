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

  const mockFetch = sandbox.stub().callsFake((url: string) => {
    return {
      'http://example.com/v1/userinfo': {
        ok: true,
        json() {
          return { sub: '1234' };
        },
      },
      'http://example.com/v1/revoke?client_id=1234abcd': {
        ok: true,
      },
      'http://example.com/unauth/ai/api/v1/hello/': {
        ok: true,
        json() {
          return { features: {} };
        },
      },
    }[url];
  });

  const mockOidcPlugin = {
    mongoClientOptions: {
      authMechanismProperties: {
        OIDC_HUMAN_CALLBACK: sandbox.stub().resolves({ accessToken: '1234' }),
      },
    },
    logger: CompassAuthService['oidcPluginLogger'],
    serialize: sandbox.stub(),
    destroy: sandbox.stub(),
  };

  const defaultConfig = {
    wsBaseUrl: 'ws://example.com',
    cloudBaseUrl: 'ws://example.com/cloud',
    atlasApiBaseUrl: 'http://example.com/api',
    atlasLogin: {
      issuer: 'http://example.com',
      clientId: '1234abcd',
    },
    authPortalUrl: 'http://example.com',
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
    await preferences.savePreferences({
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: true,
      },
    });
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
        // two times because we need to explicitly request token first to show a
        // proper error message from oidc plugin in case of failed sign in
      ).to.have.been.calledTwice;
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
        // two times because we need to explicitly request token first to show a
        // proper error message from oidc plugin in case of failed sign in
      ).to.have.been.calledTwice;
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
      'getUserInfo',
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
      CompassAuthService['openExternal'] = sandbox.stub().resolves();
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
        'http://example.com/v1/revoke?client_id=1234abcd'
      );
      expect(CompassAuthService['openExternal']).to.have.been.calledOnce;
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
});
