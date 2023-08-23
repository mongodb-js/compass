import Sinon from 'sinon';
import { expect } from 'chai';
import { AtlasService, throwIfNotOk } from './main';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { once } from 'events';
import preferencesAccess from 'compass-preferences-model';

const wait = promisify(setTimeout);

function getListenerCount(emitter: EventEmitter) {
  return emitter.eventNames().reduce((acc, name) => {
    return acc + emitter.listenerCount(name);
  }, 0);
}

describe('AtlasServiceMain', function () {
  const sandbox = Sinon.createSandbox();

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

  AtlasService['plugin'] = mockOidcPlugin;

  AtlasService['attachOidcPluginLoggerEvents']();

  const fetch = AtlasService['fetch'];
  const ipcMain = AtlasService['ipcMain'];
  const createPlugin = AtlasService['createMongoDBOIDCPlugin'];
  const apiBaseUrl = process.env.COMPASS_ATLAS_SERVICE_BASE_URL;
  const issuer = process.env.COMPASS_OIDC_ISSUER;
  const clientId = process.env.COMPASS_CLIENT_ID;

  beforeEach(function () {
    AtlasService['ipcMain'] = { handle: sandbox.stub() };

    process.env.COMPASS_ATLAS_SERVICE_BASE_URL = 'http://example.com';
    process.env.COMPASS_OIDC_ISSUER = 'http://example.com';
    process.env.COMPASS_CLIENT_ID = '1234abcd';
  });

  afterEach(function () {
    process.env.COMPASS_ATLAS_SERVICE_BASE_URL = apiBaseUrl;
    process.env.COMPASS_OIDC_ISSUER = issuer;
    process.env.COMPASS_CLIENT_ID = clientId;

    AtlasService['fetch'] = fetch;
    AtlasService['ipcMain'] = ipcMain;
    AtlasService['token'] = null;
    AtlasService['initPromise'] = null;
    AtlasService['oidcPluginSyncedFromLoggerState'] = 'initial';
    AtlasService['createMongoDBOIDCPlugin'] = createPlugin;

    sandbox.resetHistory();
  });

  describe('signIn', function () {
    it('should sign in using oidc plugin', async function () {
      const token = await AtlasService.signIn();
      expect(
        mockOidcPlugin.mongoClientOptions.authMechanismProperties
          .REQUEST_TOKEN_CALLBACK
      ).to.have.been.calledOnce;
      expect(token).to.have.property('accessToken', '1234');
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'authenticated'
      );
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
      ).to.have.been.calledOnce;
    });

    it('should throw if COMPASS_OIDC_ISSUER is not set', async function () {
      delete process.env.COMPASS_OIDC_ISSUER;

      try {
        await AtlasService.signIn();
        expect.fail('Expected AtlasService.signIn() to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          'COMPASS_OIDC_ISSUER is required'
        );
      }
    });

    it('should throw if COMPASS_CLIENT_ID is not set', async function () {
      delete process.env.COMPASS_CLIENT_ID;

      try {
        await AtlasService.signIn();
        expect.fail('Expected AtlasService.signIn() to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          'COMPASS_CLIENT_ID is required'
        );
      }
    });
  });

  describe('isAuthenticated', function () {
    it('should return true if token is active', async function () {
      AtlasService['token'] = { accessToken: '1234' };
      AtlasService['fetch'] = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({ active: true });
        },
      }) as any;

      expect(await AtlasService.isAuthenticated()).to.eq(true);
    });

    it('should return false if token is inactive', async function () {
      AtlasService['token'] = { accessToken: '1234' };
      AtlasService['fetch'] = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({ active: false });
        },
      }) as any;

      expect(await AtlasService.isAuthenticated()).to.eq(false);
    });

    it('should return false if there is no token', async function () {
      AtlasService['token'] = null;

      expect(await AtlasService.isAuthenticated()).to.eq(false);
    });

    it('should return false if checking token fails', async function () {
      AtlasService['token'] = { accessToken: '1234' };
      AtlasService['fetch'] = sandbox
        .stub()
        .resolves({ ok: false, status: 500 }) as any;

      expect(await AtlasService.isAuthenticated()).to.eq(false);
    });

    it('should throw if aborted signal is passed', async function () {
      AtlasService['token'] = { accessToken: '1234' };
      const c = new AbortController();
      c.abort(new Error('Aborted'));
      try {
        await AtlasService.isAuthenticated({ signal: c.signal });
        expect.fail('Expected isAuthenticated to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Aborted');
      }
    });

    it('should wait for token refresh if called when expired', async function () {
      AtlasService['token'] = { accessToken: '1234' };
      AtlasService['fetch'] = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({ active: true });
        },
      }) as any;
      AtlasService['oidcPluginLogger'].emit(
        'mongodb-oidc-plugin:refresh-started'
      );
      const [authenticated] = await Promise.all([
        AtlasService.isAuthenticated(),
        (() => {
          AtlasService['oidcPluginLogger'].emit(
            'mongodb-oidc-plugin:refresh-succeeded'
          );
          AtlasService['oidcPluginLogger'].emit(
            'mongodb-oidc-plugin:state-updated'
          );
        })(),
      ]);
      expect(authenticated).to.eq(true);
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
            'Error: too large of a request to send to the ai. Please use a smaller prompt or collection with smaller documents.'
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
        }) as any;

        try {
          await AtlasService[functionName]({
            userInput: 'test',
            collectionName: 'test.test',
            databaseName: 'peanut',
          });
          expect.fail(`Expected ${functionName} to throw`);
        } catch (err) {
          expect(err).to.have.property('message', '500 Internal Server Error');
        }
      });

      it('should throw if COMPASS_ATLAS_SERVICE_BASE_URL is not set', async function () {
        delete process.env.COMPASS_ATLAS_SERVICE_BASE_URL;

        try {
          await AtlasService[functionName]({
            userInput: 'test',
            collectionName: 'test.test',
            databaseName: 'peanut',
          });
          expect.fail('Expected AtlasService.signIn() to throw');
        } catch (err) {
          expect(err).to.have.property(
            'message',
            'No AI Query endpoint to fetch. Please set the environment variable `COMPASS_ATLAS_SERVICE_BASE_URL`'
          );
        }
      });

      it('should wait for token refresh if called when expired', async function () {
        AtlasService['fetch'] = sandbox.stub().resolves({
          ok: true,
          json() {
            return Promise.resolve(responses.success);
          },
        }) as any;
        AtlasService['oidcPluginLogger'].emit(
          'mongodb-oidc-plugin:refresh-started'
        );
        const [res] = await Promise.all([
          AtlasService[functionName]({
            userInput: 'test',
            collectionName: 'test',
            databaseName: 'test',
            sampleDocuments: [],
          }),
          (() => {
            AtlasService['oidcPluginLogger'].emit(
              'mongodb-oidc-plugin:refresh-succeeded'
            );
            AtlasService['oidcPluginLogger'].emit(
              'mongodb-oidc-plugin:state-updated'
            );
          })(),
        ]);
        expect(res).to.deep.eq(responses.success);
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

    it('should throw network error if res is not ok', async function () {
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
        expect(err).to.have.property('message', '500 Whoops');
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
              detail: 'tortillas',
            });
          },
        });
        expect.fail('Expected throwIfNotOk to throw');
      } catch (err) {
        expect(err).to.have.property('name', 'ServerError');
        expect(err).to.have.property('message', 'ExampleCode: tortillas');
      }
    });
  });

  describe('maybeWaitForToken', function () {
    // This test suite should pass by promises resolving quicky, instead of
    // `expect` calls, we are just setting a relatively small timeout to check
    // that
    this.timeout(200);

    it('should resolve without waiting for any events from the oidc-plugin if token is not expired', async function () {
      await AtlasService['maybeWaitForToken']();
    });

    describe('when in the expired state', function () {
      it('should resolve when provided signal aborts', async function () {
        AtlasService['oidcPluginSyncedFromLoggerState'] = 'expired';
        const c = new AbortController();
        await Promise.all([
          AtlasService['maybeWaitForToken']({ signal: c.signal }),
          (async () => {
            await wait(20);
            c.abort();
          })(),
        ]);
      });

      it('should wait for the token refresh success event when in the expired state', async function () {
        await Promise.all([
          AtlasService['maybeWaitForToken'](),
          (async () => {
            await wait(20);
            AtlasService['oidcPluginLogger'].emit(
              'atlas-service-token-refreshed'
            );
          })(),
        ]);
      });

      it('should wait for the token refresh error event when in the expired state', async function () {
        await Promise.all([
          AtlasService['maybeWaitForToken'](),
          (async () => {
            await wait(20);
            AtlasService['oidcPluginLogger'].emit(
              'atlas-service-token-refresh-failed'
            );
          })(),
        ]);
      });

      it('should clean up listeners', async function () {
        const logger = AtlasService['oidcPluginLogger'] as EventEmitter;
        const initialCount = getListenerCount(logger);
        AtlasService['oidcPluginSyncedFromLoggerState'] = 'expired';
        const promise = AtlasService['maybeWaitForToken']();
        const inflightCount = getListenerCount(logger);
        // Sanity check, we added a bunch of listeners
        expect(inflightCount > initialCount).to.eq(true);
        logger.emit('atlas-service-token-refreshed');
        await promise;
        expect(getListenerCount(logger)).to.eq(initialCount);
      });
    });
  });

  describe('oidcPluginLogger', function () {
    describe('on `mongodb-oidc-plugin:refresh-started` event', function () {
      it('should skip refresh attempt when in restoring state', function () {
        AtlasService['oidcPluginSyncedFromLoggerState'] = 'restoring';
        mockOidcPlugin.logger.emit('mongodb-oidc-plugin:refresh-started');
        expect(
          mockOidcPlugin.mongoClientOptions.authMechanismProperties
            .REQUEST_TOKEN_CALLBACK
        ).not.to.have.been.called;
      });

      it('should refresh token in atlas service state', async function () {
        // Checking that multiple events while we are refreshing don't cause
        // multiple calls to REQUEST_TOKEN_CALLBACK
        mockOidcPlugin.logger.emit('mongodb-oidc-plugin:refresh-started');
        expect(AtlasService).to.have.property(
          'oidcPluginSyncedFromLoggerState',
          'expired'
        );
        mockOidcPlugin.logger.emit('mongodb-oidc-plugin:refresh-started');
        mockOidcPlugin.logger.emit('mongodb-oidc-plugin:refresh-started');
        // Make it look like oidc-plugin successfully updated
        mockOidcPlugin.logger.emit('mongodb-oidc-plugin:state-updated');
        mockOidcPlugin.logger.emit('mongodb-oidc-plugin:refresh-succeeded');
        await once(
          AtlasService['oidcPluginLogger'],
          'atlas-service-token-refreshed'
        );
        expect(
          mockOidcPlugin.mongoClientOptions.authMechanismProperties
            .REQUEST_TOKEN_CALLBACK
        ).to.have.been.calledOnce;
        expect(AtlasService).to.have.property(
          'oidcPluginSyncedFromLoggerState',
          'authenticated'
        );
        expect(AtlasService)
          .to.have.property('token')
          .deep.eq({ accessToken: '1234' });
      });
    });
  });

  describe('init', function () {
    it('should set service to unauthenticated state if requesting token throws', async function () {
      mockOidcPlugin.mongoClientOptions.authMechanismProperties.REQUEST_TOKEN_CALLBACK =
        sandbox
          .stub()
          .rejects(new Error('Could not retrieve valid access token'));
      const createPlugin = () => mockOidcPlugin;
      AtlasService['createMongoDBOIDCPlugin'] = createPlugin;
      const initPromise = AtlasService.init();
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'restoring'
      );
      await initPromise;
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'unauthenticated'
      );
    });

    it('should set service to autenticated state if token was returned', async function () {
      mockOidcPlugin.mongoClientOptions.authMechanismProperties.REQUEST_TOKEN_CALLBACK =
        sandbox.stub().resolves({ accessToken: 'token' });
      const createPlugin = () => mockOidcPlugin;
      AtlasService['createMongoDBOIDCPlugin'] = createPlugin;
      const initPromise = AtlasService.init();
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'restoring'
      );
      await initPromise;
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'authenticated'
      );
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
      const plugin = {
        destroy: sandbox.stub().resolves(),
      };
      AtlasService['openExternal'] = sandbox.stub().resolves();
      AtlasService['token'] = { accessToken: '1234' };
      AtlasService['createMongoDBOIDCPlugin'] = (() => {
        return plugin;
      }) as any;
      AtlasService['fetch'] = sandbox.stub().resolves({ ok: true }) as any;
      AtlasService['oidcPluginLogger'] = logger;

      await AtlasService.init();
      expect(getListenerCount(logger)).to.eq(25);

      await AtlasService.signOut();
      expect(getListenerCount(logger)).to.eq(0);
      expect(logger).to.not.eq(AtlasService['oidcPluginLogger']);
      expect(plugin.destroy).to.have.been.calledOnce;
      expect(AtlasService['fetch']).to.have.been.calledOnceWith(
        'http://example.com/v1/revoke?client_id=1234abcd'
      );
      expect(AtlasService['token']).to.eq(null);
      expect(AtlasService['openExternal']).to.have.been.calledOnce;
    });
  });
});
