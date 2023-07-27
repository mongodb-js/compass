import Sinon from 'sinon';
import { expect } from 'chai';
import { AtlasService, throwIfNotOk } from './main';
import { promisify } from 'util';
import { once } from 'events';

const wait = promisify(setTimeout);

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
  const apiBaseUrl = process.env.COMPASS_ATLAS_SERVICE_BASE_URL;
  const issuer = process.env.COMPASS_OIDC_ISSUER;
  const clientId = process.env.COMPASS_CLIENT_ID;

  beforeEach(function () {
    process.env.COMPASS_ATLAS_SERVICE_BASE_URL = 'http://example.com';
    process.env.COMPASS_OIDC_ISSUER = 'http://example.com';
    process.env.COMPASS_CLIENT_ID = '1234abcd';
  });

  afterEach(function () {
    process.env.COMPASS_ATLAS_SERVICE_BASE_URL = apiBaseUrl;
    process.env.COMPASS_OIDC_ISSUER = issuer;
    process.env.COMPASS_CLIENT_ID = clientId;

    AtlasService['fetch'] = fetch;
    AtlasService['token'] = null;
    AtlasService['oidcPluginSyncedFromLoggerState'] = 'initial';

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
      AtlasService['oidcPluginSyncedFromLoggerState'] = 'expired';
      const [authenticated] = await Promise.all([
        AtlasService.isAuthenticated(),
        (async () => {
          await wait(20);
          AtlasService['oidcPluginLogger'].emit(
            'mongodb-oidc-plugin:refresh-succeeded'
          );
        })(),
      ]);
      expect(authenticated).to.eq(true);
    });
  });

  describe('getQueryFromUserPrompt', function () {
    it('makes a post request with the user prompt to the endpoint in the environment', async function () {
      AtlasService['fetch'] = sandbox.stub().resolves({
        ok: true,
        json() {
          return Promise.resolve({
            content: { query: { find: { test: 'pineapple' } } },
          });
        },
      }) as any;

      const res = await AtlasService.getQueryFromUserPrompt({
        userPrompt: 'test',
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
      expect(args[0]).to.eq('http://example.com/ai/api/v1/mql-query');
      expect(args[1].body).to.eq(
        '{"userPrompt":"test","collectionName":"jam","databaseName":"peanut","schema":{"_id":{"types":[{"bsonType":"ObjectId"}]}},"sampleDocuments":[{"_id":1234}]}'
      );
      expect(res).to.have.nested.property(
        'content.query.find.test',
        'pineapple'
      );
    });

    it('uses the abort signal in the fetch request', async function () {
      const c = new AbortController();
      c.abort();
      try {
        await AtlasService.getQueryFromUserPrompt({
          signal: c.signal,
          userPrompt: 'test',
          collectionName: 'test',
          databaseName: 'peanut',
        });
        expect.fail('Expected getQueryFromUserPrompt to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'This operation was aborted');
      }
    });

    it('throws if the request would be too much for the ai', async function () {
      try {
        await AtlasService.getQueryFromUserPrompt({
          userPrompt: 'test',
          collectionName: 'test',
          databaseName: 'peanut',
          sampleDocuments: [{ test: '4'.repeat(60000) }],
        });
        expect.fail('Expected getQueryFromUserPrompt to throw');
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
          return Promise.resolve({});
        },
      }) as any;

      await AtlasService.getQueryFromUserPrompt({
        userPrompt: 'test',
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
        '{"userPrompt":"test","collectionName":"test.test","databaseName":"peanut","sampleDocuments":[{"a":"1"}]}'
      );
    });

    it('throws the error', async function () {
      AtlasService['fetch'] = sandbox.stub().resolves({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }) as any;

      try {
        await AtlasService.getQueryFromUserPrompt({
          userPrompt: 'test',
          collectionName: 'test.test',
          databaseName: 'peanut',
        });
        expect.fail('Expected getQueryFromUserPrompt to throw');
      } catch (err) {
        expect(err).to.have.property('message', '500 Internal Server Error');
      }
    });

    it('should throw if COMPASS_ATLAS_SERVICE_BASE_URL is not set', async function () {
      delete process.env.COMPASS_ATLAS_SERVICE_BASE_URL;

      try {
        await AtlasService.getQueryFromUserPrompt({
          userPrompt: 'test',
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
          return Promise.resolve({ test: 1 });
        },
      }) as any;
      AtlasService['oidcPluginSyncedFromLoggerState'] = 'expired';
      const [query] = await Promise.all([
        AtlasService.getQueryFromUserPrompt({
          userPrompt: 'test',
          collectionName: 'test.test',
          sampleDocuments: [],
        }),
        (async () => {
          await wait(20);
          AtlasService['oidcPluginLogger'].emit(
            'mongodb-oidc-plugin:refresh-succeeded'
          );
        })(),
      ]);
      expect(query).to.deep.eq({ test: 1 });
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
    });
  });

  describe('oidcPluginLogger', function () {
    it('should set AtlasService state to expired on `mongodb-oidc-plugin:refresh-started` event', function () {
      AtlasService['oidcPluginLogger'].emit(
        'mongodb-oidc-plugin:refresh-started'
      );
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'expired'
      );
    });

    it('should set AtlasService state to error on `mongodb-oidc-plugin:refresh-failed` event', function () {
      AtlasService['oidcPluginLogger'].emit(
        'mongodb-oidc-plugin:refresh-failed' as any
      );
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'error'
      );
    });

    it('should refresh token in atlas service state on `mongodb-oidc-plugin:refresh-succeeded` event', async function () {
      // Checking that multiple events while we are refreshing don't cause
      // multiple calls to REFRESH_TOKEN_CALLBACK
      mockOidcPlugin.logger.emit('mongodb-oidc-plugin:refresh-succeeded');
      mockOidcPlugin.logger.emit('mongodb-oidc-plugin:refresh-succeeded');
      mockOidcPlugin.logger.emit('mongodb-oidc-plugin:refresh-succeeded');
      // Checking that refresh-succeeded doesn't update the service state as we
      // are just starting the refresh actually
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'initial'
      );
      await once(
        AtlasService['oidcPluginLogger'],
        'atlas-service-token-refreshed'
      );
      expect(
        mockOidcPlugin.mongoClientOptions.authMechanismProperties
          .REFRESH_TOKEN_CALLBACK
      ).to.have.been.calledOnce;
      expect(AtlasService).to.have.property(
        'oidcPluginSyncedFromLoggerState',
        'authenticated'
      );
      expect(AtlasService)
        .to.have.property('token')
        .deep.eq({ accessToken: '4321' });
    });
  });
});
