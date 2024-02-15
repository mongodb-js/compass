import { expect } from 'chai';
import Sinon from 'sinon';
import { AtlasHttpApiClient } from './atlas-http-api-client';

describe('AtlasHttpApiClient', function () {
  let atlasHttpApiClient: AtlasHttpApiClient;
  const initialFetch = global.fetch;
  beforeEach(function () {
    atlasHttpApiClient = new AtlasHttpApiClient({
      atlasApiBaseUrl: 'http://example.com/api/private',
      atlasApiUnauthBaseUrl: 'http://api.example.com',
      atlasLogin: {
        clientId: 'some-client-id',
        issuer: 'http://example.com/oauth2/default',
      },
      authPortalUrl: 'http://example.com/account/login',
    });
  });
  afterEach(function () {
    global.fetch = initialFetch;
  });

  it('should create an instance of AtlasHttpApiClient', function () {
    expect(atlasHttpApiClient).to.be.instanceOf(AtlasHttpApiClient);
  });

  it('should generate the correct unauthenticated endpoint URL', function () {
    expect(atlasHttpApiClient.privateUnAuthEndpoint('example-path')).to.equal(
      'http://api.example.com/example-path'
    );
  });

  it('should generate the correct authenticated endpoint URL', function () {
    expect(atlasHttpApiClient.privateAtlasEndpoint('example-path')).to.equal(
      'http://example.com/api/private/example-path'
    );
  });

  it('should make an unauthenticated fetch request', async function () {
    const url = 'https://api.mongodb.com/example';
    const init = { method: 'GET' };

    const fetchStub = Sinon.stub().resolves({
      status: 200,
      json: () => Promise.resolve({}),
    });
    global.fetch = fetchStub;

    const response = await atlasHttpApiClient.unAuthenticatedFetch(url, init);
    expect(response.status).to.equal(200);
    const args = fetchStub.firstCall.args;
    expect(args[0]).to.equal(url);
    expect(args[1].method).to.equal('GET');
    expect(args[1].headers).to.not.have.key('Authorization');
    expect(args[1].headers).to.have.key('User-Agent');
  });

  it('should make a fetch request - with Authorization header', async function () {
    const url = 'https://cloud.mongodb.com/example-2';
    const init = { method: 'POST' };

    const fetchStub = Sinon.stub().resolves({
      status: 200,
      json: () => Promise.resolve({}),
    });
    global.fetch = fetchStub;

    atlasHttpApiClient['atlasLoginServiceRenderer'].getToken = () =>
      Promise.resolve('super-secret');
    const response = await atlasHttpApiClient.fetch(url, init);
    expect(response.status).to.equal(200);
    const args = fetchStub.firstCall.args;
    expect(args[0]).to.equal(url);
    expect(args[1].method).to.equal('POST');
    expect(args[1].headers).to.have.property(
      'Authorization',
      'Bearer super-secret'
    );
  });

  it('should make a fetch request - without Authorization header', async function () {
    const url = 'https://cloud.mongodb.com/example-2';
    const init = { method: 'POST' };

    const fetchStub = Sinon.stub().resolves({
      status: 200,
      json: () => Promise.resolve({}),
    });
    global.fetch = fetchStub;

    const response = await atlasHttpApiClient.fetch(url, init);
    expect(response.status).to.equal(200);
    const args = fetchStub.firstCall.args;
    expect(args[0]).to.equal(url);
    expect(args[1].method).to.equal('POST');
    expect(args[1].headers).to.not.have.key('Authorization');
  });
});
