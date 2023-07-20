import Sinon from 'sinon';
import { expect } from 'chai';
import { AtlasService, throwIfNotOk } from './main';

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
          .resolves({ accessToken: '1234' }),
      },
    },
    logger: {} as any,
    serialize: sandbox.stub(),
    destroy: sandbox.stub(),
  };

  AtlasService['plugin'] = mockOidcPlugin;

  const fetch = AtlasService['fetch'];
  const apiBaseUrl = process.env.DEV_AI_QUERY_ENDPOINT;
  const issuer = process.env.COMPASS_OIDC_ISSUER;
  const clientId = process.env.COMPASS_CLIENT_ID;

  before(function () {
    process.env.DEV_AI_QUERY_ENDPOINT = 'http://example.com';
    process.env.COMPASS_OIDC_ISSUER = 'http://example.com';
    process.env.COMPASS_CLIENT_ID = '1234abcd';
  });

  after(function () {
    process.env.DEV_AI_QUERY_ENDPOINT = apiBaseUrl;
    process.env.COMPASS_OIDC_ISSUER = issuer;
    process.env.COMPASS_CLIENT_ID = clientId;
    AtlasService['fetch'] = fetch;
  });

  afterEach(function () {
    AtlasService['token'] = null;
    sandbox.resetHistory();
  });

  it('should sign in using oidc plugin', async function () {
    const token = await AtlasService.signIn();
    expect(
      mockOidcPlugin.mongoClientOptions.authMechanismProperties
        .REQUEST_TOKEN_CALLBACK
    ).to.have.been.calledOnce;
    expect(token).to.have.property('accessToken', '1234');
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
      expect(err).to.have.property('message', 'COMPASS_CLIENT_ID is required');
    }
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
        schema: { _id: { types: [{ bsonType: 'ObjectId' }] } },
        sampleDocuments: [{ _id: 1234 }],
      });

      const { args } = (
        AtlasService['fetch'] as unknown as Sinon.SinonStub
      ).getCall(0);

      expect(AtlasService['fetch']).to.have.been.calledOnce;
      expect(args[0]).to.eq('http://example.com/ai/api/v1/mql-query');
      expect(args[1].body).to.eq(
        '{"userPrompt":"test","collectionName":"jam","schema":{"_id":{"types":[{"bsonType":"ObjectId"}]}},"sampleDocuments":[{"_id":1234}]}'
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
          collectionName: 'test.test',
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
          collectionName: 'test.test',
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
        '{"userPrompt":"test","collectionName":"test.test","sampleDocuments":[{"a":"1"}]}'
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
        });
        expect.fail('Expected getQueryFromUserPrompt to throw');
      } catch (err) {
        expect(err).to.have.property('message', '500 Internal Server Error');
      }
    });

    it('should throw if DEV_AI_QUERY_ENDPOINT is not set', async function () {
      delete process.env.DEV_AI_QUERY_ENDPOINT;

      try {
        await AtlasService.getQueryFromUserPrompt({
          userPrompt: 'test',
          collectionName: 'test.test',
        });
        expect.fail('Expected AtlasService.signIn() to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          'No AI Query endpoint to fetch. Please set the environment variable `DEV_AI_QUERY_ENDPOINT`'
        );
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
              name: 'AIError',
              errorMessage: 'tortillas',
              codeName: 'ExampleCode',
            });
          },
        });
        expect.fail('Expected throwIfNotOk to throw');
      } catch (err) {
        expect(err).to.have.property('name', 'Error');
        expect(err).to.have.property('message', 'ExampleCode: tortillas');
      }
    });
  });
});
