import Sinon from 'sinon';
import { expect } from 'chai';
import { AtlasService, getTrackingUserInfo, throwIfNotOk } from './main';
import { EventEmitter } from 'events';
import preferencesAccess from 'compass-preferences-model';
import type { UserPreferences } from 'compass-preferences-model';
import type { AtlasUserConfigStore } from './user-config-store';
import type { AtlasUserInfo } from './util';

function getListenerCount(emitter: EventEmitter) {
  return emitter.eventNames().reduce((acc, name) => {
    return acc + emitter.listenerCount(name);
  }, 0);
}

describe('AtlasServiceMain', function () {
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

  const mockUserConfigStore = {
    getUserConfig: sandbox.stub().resolves({}),
    updateUserConfig: sandbox.stub().resolves(),
  };

  const mockOidcPlugin = {
    mongoClientOptions: {
      authMechanismProperties: {
        REQUEST_TOKEN_CALLBACK: sandbox
          .stub()
          .resolves({ accessToken: '1234' }),
        REFRESH_TOKEN_CALLBACK: sandbox
          .stub()
          .resolves({ accessToken: '4321' }),
      },
    },
    logger: AtlasService['oidcPluginLogger'],
    serialize: sandbox.stub(),
    destroy: sandbox.stub(),
  };

  const defaultConfig = {
    atlasApiBaseUrl: 'http://example.com',
    atlasApiUnauthBaseUrl: 'http://example.com/unauth',
    atlasLogin: {
      issuer: 'http://example.com',
      clientId: '1234abcd',
    },
    authPortalUrl: 'http://example.com',
  };

  const fetch = AtlasService['fetch'];
  const ipcMain = AtlasService['ipcMain'];
  const createPlugin = AtlasService['createMongoDBOIDCPlugin'];
  const userStore = AtlasService['atlasUserConfigStore'];
  const getActiveCompassUser = AtlasService['getActiveCompassUser'];

  let cloudFeatureRolloutAccess: UserPreferences['cloudFeatureRolloutAccess'];

  beforeEach(async function () {
    AtlasService['ipcMain'] = {
      handle: sandbox.stub(),
      broadcast: sandbox.stub(),
      createHandle: sandbox.stub(),
    };
    AtlasService['fetch'] = mockFetch as any;
    AtlasService['createMongoDBOIDCPlugin'] = () => mockOidcPlugin;
    AtlasService['atlasUserConfigStore'] =
      mockUserConfigStore as unknown as AtlasUserConfigStore;
    AtlasService['getActiveCompassUser'] = () =>
      Promise.resolve({
        id: 'test',
        createdAt: new Date(),
        lastUsed: new Date(),
      });

    AtlasService['config'] = defaultConfig;

    AtlasService['setupPlugin']();
    AtlasService['attachOidcPluginLoggerEvents']();

    cloudFeatureRolloutAccess =
      preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
    await preferencesAccess.savePreferences({
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: true,
      },
    });
  });

  afterEach(async function () {
    AtlasService['fetch'] = fetch;
    AtlasService['atlasUserConfigStore'] = userStore;
    AtlasService['ipcMain'] = ipcMain;
    AtlasService['initPromise'] = null;
    AtlasService['createMongoDBOIDCPlugin'] = createPlugin;
    AtlasService['oidcPluginLogger'].removeAllListeners();
    AtlasService['signInPromise'] = null;
    AtlasService['currentUser'] = null;
    AtlasService['getActiveCompassUser'] = getActiveCompassUser;

    await preferencesAccess.savePreferences({ cloudFeatureRolloutAccess });

    sandbox.resetHistory();
  });

  describe('signIn', function () {
    it('should sign in using oidc plugin', async function () {
      const userInfo = await AtlasService.signIn();
      expect(
        mockOidcPlugin.mongoClientOptions.authMechanismProperties
          .REQUEST_TOKEN_CALLBACK
        // two times because we need to explicitly request token first to show a
        // proper error message from oidc plugin in case of failed sign in
      ).to.have.been.calledTwice;
      expect(userInfo).to.have.property('sub', '1234');
    });

    it('should debounce inflight sign in requests', async function () {
      void AtlasService.signIn();
      void AtlasService.signIn();
      void AtlasService.signIn();
      void AtlasService.signIn();

      await AtlasService.signIn();

      expect(
        mockOidcPlugin.mongoClientOptions.authMechanismProperties
          .REQUEST_TOKEN_CALLBACK
        // two times because we need to explicitly request token first to show a
        // proper error message from oidc plugin in case of failed sign in
      ).to.have.been.calledTwice;
    });

    it('should fail with oidc-plugin error first if auth failed', async function () {
      AtlasService['fetch'] = sandbox.stub().resolves({
        ok: false,
        json: sandbox.stub().rejects(),
        status: 401,
        statusText: 'Unauthorized',
      });
      AtlasService['plugin'] = {
        mongoClientOptions: {
          authMechanismProperties: {
            REQUEST_TOKEN_CALLBACK: sandbox
              .stub()
              .rejects(
                new Error(
                  'Failed to request token for some specific plugin reason'
                )
              ),
            REFRESH_TOKEN_CALLBACK: sandbox.stub().rejects(),
          },
        },
      } as any;

      try {
        await AtlasService.signIn();
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
      AtlasService['fetch'] = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({ active: true });
        },
      }) as any;

      expect(await AtlasService.isAuthenticated()).to.eq(true);
    });

    it('should return false if token is inactive', async function () {
      AtlasService['fetch'] = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({ active: false });
        },
      }) as any;

      expect(await AtlasService.isAuthenticated()).to.eq(false);
    });

    it('should return false if checking token fails', async function () {
      AtlasService['fetch'] = sandbox
        .stub()
        .resolves({ ok: false, status: 500 }) as any;

      expect(await AtlasService.isAuthenticated()).to.eq(false);
    });

    it('should throw if aborted signal is passed', async function () {
      const c = new AbortController();
      c.abort(new Error('Aborted'));
      try {
        await AtlasService.isAuthenticated({ signal: c.signal });
        expect.fail('Expected isAuthenticated to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Aborted');
      }
    });
  });

  const atlasAIServiceTests = [
    {
      functionName: 'getQueryFromUserInput',
      aiEndpoint: 'mql-query',
      responses: {
        success: {
          content: { query: { filter: "{ test: 'pineapple' }" } },
        },
        invalid: [
          {},
          { countent: {} },
          { content: { qooery: {} } },
          { content: { query: { filter: { foo: 1 } } } },
        ],
      },
    },
    {
      functionName: 'getAggregationFromUserInput',
      aiEndpoint: 'mql-aggregation',
      responses: {
        success: {
          content: { aggregation: { pipeline: "[{ test: 'pineapple' }]" } },
        },
        invalid: [
          {},
          { content: { aggregation: {} } },
          { content: { aggrogation: {} } },
          { content: { aggregation: { pipeline: true } } },
        ],
      },
    },
  ] as const;

  for (const { functionName, aiEndpoint, responses } of atlasAIServiceTests) {
    describe(functionName, function () {
      it('makes a post request with the user input to the endpoint in the environment', async function () {
        AtlasService['fetch'] = sandbox.stub().resolves({
          ok: true,
          json() {
            return Promise.resolve(responses.success);
          },
        }) as any;

        const res = await AtlasService[functionName]({
          userInput: 'test',
          signal: new AbortController().signal,
          collectionName: 'jam',
          databaseName: 'peanut',
          schema: { _id: { types: [{ bsonType: 'ObjectId' }] } },
          sampleDocuments: [{ _id: 1234 }],
        });

        const { args } = (
          AtlasService['fetch'] as unknown as Sinon.SinonStub
        ).getCall(0);

        expect(AtlasService['fetch']).to.have.been.calledOnce;
        expect(args[0]).to.eq(`http://example.com/ai/api/v1/${aiEndpoint}`);
        expect(args[1].body).to.eq(
          '{"userInput":"test","collectionName":"jam","databaseName":"peanut","schema":{"_id":{"types":[{"bsonType":"ObjectId"}]}},"sampleDocuments":[{"_id":1234}]}'
        );
        expect(res).to.deep.eq(responses.success);
      });

      it('should fail when response is not matching expected schema', async function () {
        for (const res of responses.invalid) {
          AtlasService['fetch'] = sandbox.stub().resolves({
            ok: true,
            json() {
              return Promise.resolve(res);
            },
          }) as any;
          try {
            await AtlasService[functionName]({
              userInput: 'test',
              collectionName: 'test',
              databaseName: 'peanut',
            });
            expect.fail(`Expected ${functionName} to throw`);
          } catch (err) {
            expect((err as Error).message).to.match(/Unexpected.+?response/);
          }
        }
      });

      it('uses the abort signal in the fetch request', async function () {
        const c = new AbortController();
        c.abort();
        try {
          await AtlasService[functionName]({
            signal: c.signal,
            userInput: 'test',
            collectionName: 'test',
            databaseName: 'peanut',
          });
          expect.fail(`Expected ${functionName} to throw`);
        } catch (err) {
          expect(err).to.have.property('message', 'This operation was aborted');
        }
      });

      it('throws if the request would be too much for the ai', async function () {
        try {
          await AtlasService[functionName]({
            userInput: 'test',
            collectionName: 'test',
            databaseName: 'peanut',
            sampleDocuments: [{ test: '4'.repeat(60000) }],
          });
          expect.fail(`Expected ${functionName} to throw`);
        } catch (err) {
          expect(err).to.have.property(
            'message',
            'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
          );
        }
      });

      it('passes fewer documents if the request would be too much for the ai with all of the documents', async function () {
        AtlasService['fetch'] = sandbox.stub().resolves({
          ok: true,
          json() {
            return Promise.resolve(responses.success);
          },
        }) as any;

        await AtlasService[functionName]({
          userInput: 'test',
          collectionName: 'test.test',
          databaseName: 'peanut',
          sampleDocuments: [
            { a: '1' },
            { a: '2' },
            { a: '3' },
            { a: '4'.repeat(50000) },
          ],
        });

        const { args } = (
          AtlasService['fetch'] as unknown as Sinon.SinonStub
        ).getCall(0);

        expect(AtlasService['fetch']).to.have.been.calledOnce;
        expect(args[1].body).to.eq(
          '{"userInput":"test","collectionName":"test.test","databaseName":"peanut","sampleDocuments":[{"a":"1"}]}'
        );
      });

      it('throws the error', async function () {
        AtlasService['fetch'] = sandbox.stub().resolves({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: sandbox.stub().rejects(new Error('invalid json')),
        }) as any;

        try {
          await AtlasService[functionName]({
            userInput: 'test',
            collectionName: 'test.test',
            databaseName: 'peanut',
          });
          expect.fail(`Expected ${functionName} to throw`);
        } catch (err) {
          expect(err).to.have.property('message', '500: Internal Server Error');
        }
      });
    });
  }

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
    it('should try to restore service state by fetching user info', async function () {
      await AtlasService.init(defaultConfig);
      expect(
        mockOidcPlugin.mongoClientOptions.authMechanismProperties
          .REQUEST_TOKEN_CALLBACK
      ).to.have.been.calledOnce;
      expect(AtlasService['currentUser']).to.have.property('sub', '1234');
    });
  });

  describe('with networkTraffic turned off', function () {
    let networkTraffic: boolean;

    before(async function () {
      networkTraffic = preferencesAccess.getPreferences().networkTraffic;
      await preferencesAccess.savePreferences({ networkTraffic: false });
    });

    after(async function () {
      await preferencesAccess.savePreferences({ networkTraffic });
    });

    for (const methodName of [
      'requestOAuthToken',
      'signIn',
      'getUserInfo',
      'introspect',
      'revoke',
      'getAIFeatureEnablement',
      'getAggregationFromUserInput',
      'getQueryFromUserInput',
    ]) {
      it(`${methodName} should throw`, async function () {
        try {
          await (AtlasService as any)[methodName]({});
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
      AtlasService['openExternal'] = sandbox.stub().resolves();
      AtlasService['oidcPluginLogger'] = logger;
      await AtlasService.init(defaultConfig);
      expect(getListenerCount(logger)).to.eq(25);
      // We did all preparations, reset sinon history for easier assertions
      sandbox.resetHistory();

      await AtlasService.signOut();
      expect(getListenerCount(logger)).to.eq(0);
      expect(logger).to.not.eq(AtlasService['oidcPluginLogger']);
      expect(mockOidcPlugin.destroy).to.have.been.calledOnce;
      expect(AtlasService['fetch']).to.have.been.calledOnceWith(
        'http://example.com/v1/revoke?client_id=1234abcd'
      );
      expect(AtlasService['openExternal']).to.have.been.calledOnce;
    });

    it('should throw when called before sign in', async function () {
      try {
        await AtlasService.signOut();
        expect.fail('Expected signOut to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          "Can't sign out if not signed in yet"
        );
      }
    });
  });

  describe('getTrackingUserInfo', function () {
    it('should return required tracking info from user info', function () {
      expect(
        getTrackingUserInfo({
          sub: '1234',
          primaryEmail: 'test@example.com',
        } as AtlasUserInfo)
      ).to.deep.eq({
        auid: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
      });
    });
  });

  describe('setupAIAccess', function () {
    beforeEach(async function () {
      await preferencesAccess.savePreferences({
        cloudFeatureRolloutAccess: undefined,
      });
    });

    it('should set the cloudFeatureRolloutAccess true when returned true', async function () {
      const fetchStub = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({
            features: {
              GEN_AI_COMPASS: {
                enabled: true,
              },
            },
          });
        },
      });
      AtlasService['fetch'] = fetchStub;

      let currentCloudFeatureRolloutAccess =
        preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
      expect(currentCloudFeatureRolloutAccess).to.equal(undefined);

      await AtlasService.setupAIAccess();

      const { args } = fetchStub.getCall(0);

      expect(AtlasService['fetch']).to.have.been.calledOnce;
      expect(args[0]).to.eq(`http://example.com/unauth/ai/api/v1/hello/test`);

      currentCloudFeatureRolloutAccess =
        preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
      expect(currentCloudFeatureRolloutAccess).to.deep.equal({
        GEN_AI_COMPASS: true,
      });
    });

    it('should set the cloudFeatureRolloutAccess false when returned false', async function () {
      const fetchStub = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({
            features: {
              GEN_AI_COMPASS: {
                enabled: false,
              },
            },
          });
        },
      });
      AtlasService['fetch'] = fetchStub;

      let currentCloudFeatureRolloutAccess =
        preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
      expect(currentCloudFeatureRolloutAccess).to.equal(undefined);

      await AtlasService.setupAIAccess();

      const { args } = fetchStub.getCall(0);

      expect(AtlasService['fetch']).to.have.been.calledOnce;
      expect(args[0]).to.eq(`http://example.com/unauth/ai/api/v1/hello/test`);

      currentCloudFeatureRolloutAccess =
        preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
      expect(currentCloudFeatureRolloutAccess).to.deep.equal({
        GEN_AI_COMPASS: false,
      });
    });

    it('should set the cloudFeatureRolloutAccess false when returned null', async function () {
      const fetchStub = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({
            features: null,
          });
        },
      });
      AtlasService['fetch'] = fetchStub;

      let currentCloudFeatureRolloutAccess =
        preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
      expect(currentCloudFeatureRolloutAccess).to.equal(undefined);

      await AtlasService.setupAIAccess();

      const { args } = fetchStub.getCall(0);

      expect(AtlasService['fetch']).to.have.been.calledOnce;
      expect(args[0]).to.eq(`http://example.com/unauth/ai/api/v1/hello/test`);

      currentCloudFeatureRolloutAccess =
        preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
      expect(currentCloudFeatureRolloutAccess).to.deep.equal({
        GEN_AI_COMPASS: false,
      });
    });

    it('should not set the cloudFeatureRolloutAccess false when returned false', async function () {
      const fetchStub = sandbox.stub().throws(new Error('error'));
      AtlasService['fetch'] = fetchStub;

      let currentCloudFeatureRolloutAccess =
        preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
      expect(currentCloudFeatureRolloutAccess).to.equal(undefined);

      await AtlasService.setupAIAccess();

      const { args } = fetchStub.getCall(0);

      expect(AtlasService['fetch']).to.have.been.calledOnce;
      expect(args[0]).to.eq(`http://example.com/unauth/ai/api/v1/hello/test`);

      currentCloudFeatureRolloutAccess =
        preferencesAccess.getPreferences().cloudFeatureRolloutAccess;
      expect(currentCloudFeatureRolloutAccess).to.deep.equal(undefined);
    });
  });
});
