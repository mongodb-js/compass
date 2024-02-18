import { expect } from 'chai';
import Sinon from 'sinon';
import { AtlasHttpApiClient } from './atlas-http-api-client';

function getHttpApiClient(
  getAuthHeadersFn?: () => Promise<Record<string, string>>
) {
  const config = {
    atlasApiBaseUrl: 'http://example.com/api/private',
    atlasApiUnauthBaseUrl: 'http://api.example.com',
    atlasLogin: {
      clientId: 'some-client-id',
      issuer: 'http://example.com/oauth2/default',
    },
    authPortalUrl: 'http://example.com/account/login',
  };
  return new AtlasHttpApiClient(config, getAuthHeadersFn);
}

describe('AtlasHttpApiClient', function () {
  let sandbox: Sinon.SinonSandbox;
  const initialFetch = global.fetch;
  beforeEach(function () {
    sandbox = Sinon.createSandbox();
  });
  afterEach(function () {
    global.fetch = initialFetch;
    sandbox.restore();
  });

  it('should generate the correct unauthenticated endpoint URL', function () {
    expect(getHttpApiClient().privateUnAuthEndpoint('example-path')).to.equal(
      'http://api.example.com/example-path'
    );
  });

  it('should generate the correct authenticated endpoint URL', function () {
    expect(getHttpApiClient().privateAtlasEndpoint('example-path')).to.equal(
      'http://example.com/api/private/example-path'
    );
  });

  it('should make an unauthenticated fetch request', async function () {
    const url = 'https://api.mongodb.com/example';
    const init = { method: 'GET' };

    const fetchStub = sandbox.stub().resolves({
      status: 200,
      json: () => Promise.resolve({}),
    });
    global.fetch = fetchStub;

    const response = await getHttpApiClient().unAuthenticatedFetch(url, init);
    expect(response.status).to.equal(200);
    const args = fetchStub.firstCall.args;
    expect(args[0]).to.equal(url);
    expect(args[1].method).to.equal('GET');
    expect(args[1].headers).to.not.have.key('Authorization');
  });

  it('should make a fetch request - with authorization headers', async function () {
    const url = 'https://cloud.mongodb.com/example-2';
    const init = { method: 'POST' };

    const fetchStub = sandbox.stub().resolves({
      status: 200,
      json: () => Promise.resolve({}),
    });
    global.fetch = fetchStub;

    const getAuthHeadersFn = sandbox.stub().resolves({
      Authorization: 'Bearer super-secret',
    });

    const response = await getHttpApiClient(getAuthHeadersFn).fetch(url, init);

    expect(response.status).to.equal(200);
    const args = fetchStub.firstCall.args;
    expect(args[0]).to.equal(url);
    expect(args[1].method).to.equal('POST');
    expect(args[1].headers).to.have.property(
      'Authorization',
      'Bearer super-secret'
    );
    expect(getAuthHeadersFn.calledOnce).to.be.true;
  });
});
