import { expect } from 'chai';
import Sinon from 'sinon';
import { AtlasService } from './atlas-service';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { CompassAtlasAuthService } from './compass-atlas-auth-service';
import type { AtlasServiceConfig } from './util';

const ATLAS_CONFIG: AtlasServiceConfig = {
  ccsBaseUrl: 'ws://example.com',
  multiplexedWsBaseUrls: ['ws://example.com/multiplex'],
  cloudBaseUrl: 'ws://example.com/cloud',
  atlasPrivateApiBaseUrl: 'http://example.com/api/private',
  atlasAdminApiBaseUrl: 'http://example.com/api/atlas',
  atlasLogin: {
    clientId: 'some-client-id',
    issuer: 'http://example.com/oauth2/default',
  },
  authPortalUrl: 'http://example.com/account/login',
  assistantApiBaseUrl: 'http://example.com/assistant',
  userDataBaseUrl: 'http://example.com/ui/userData',
};

function getAtlasService(preferences: PreferencesAccess) {
  const authService = new CompassAtlasAuthService();

  const atlasService = new AtlasService(
    authService,
    preferences,
    createNoopLogger(),
    undefined,
    ATLAS_CONFIG
  );
  return atlasService;
}

describe('AtlasService', function () {
  let atlasService: AtlasService;
  let preferences: PreferencesAccess;
  let sandbox: Sinon.SinonSandbox;
  const initialFetch = global.fetch;

  beforeEach(async function () {
    sandbox = Sinon.createSandbox();
    preferences = await createSandboxFromDefaultPreferences();
    atlasService = getAtlasService(preferences);
  });

  afterEach(function () {
    global.fetch = initialFetch;
    sandbox.restore();
  });

  it('should throw when network traffic is disabled', async function () {
    await preferences.savePreferences({ networkTraffic: false });
    try {
      await atlasService.fetch('https://example.com');
      expect.fail('Expected to throw when network traffic is disabled');
    } catch (err) {
      expect(err).to.have.property('message', 'Network traffic is not allowed');
    }
  });

  it('should throw the error when server throws', async function () {
    const fetchStub = sandbox.stub().resolves({
      status: 500,
      ok: false,
      statusText: 'Internal Server Error',
      json: sandbox.stub().rejects(new Error('invalid json')),
    });
    global.fetch = fetchStub;

    try {
      await atlasService.fetch('https://example.com');
      expect.fail('Expected fetch to throw');
    } catch (err) {
      expect(err).to.have.property('message', '500: Internal Server Error');
    }
  });

  it('should use the abort signal in the fetch request', async function () {
    const c = new AbortController();
    c.abort();

    try {
      await atlasService.fetch('https://example.com', {
        signal: c.signal,
      });
      expect.fail('Expected fetch to throw as the signal was aborted');
    } catch (err) {
      expect(err).to.have.property('message', 'This operation was aborted');
    }
  });

  it('should fetch data from unAuthenticatedFetch', async function () {
    const expectedData = { data: 'test' };
    const fetchStub = sandbox.stub().resolves({
      status: 200,
      ok: true,
      json: () => Promise.resolve(expectedData),
    });
    global.fetch = fetchStub;
    const response = await atlasService.fetch('https://example.com');
    const data = await response.json();

    expect(fetchStub.calledOnce).to.be.true;
    expect(data).to.deep.equal(expectedData);
  });

  it('should fetch data from fetch', async function () {
    const expectedData = { data: 'test' };
    const fetchStub = sandbox.stub().resolves({
      status: 200,
      ok: true,
      json: () => Promise.resolve(expectedData),
    });
    global.fetch = fetchStub;
    const atlasService = getAtlasService(preferences);
    const response = await atlasService.authenticatedFetch(
      'https://example.com'
    );
    const data = await response.json();

    expect(fetchStub.calledOnce).to.be.true;
    expect(data).to.deep.equal(expectedData);

    expect(fetchStub.firstCall.args[1].headers).to.have.property(
      'X-Compass-Auth',
      'true'
    );
  });

  it('should set CSRF headers when available', async function () {
    const fetchStub = sandbox.stub().resolves({ status: 200, ok: true });
    global.fetch = fetchStub;
    document.head.append(
      (() => {
        const el = document.createElement('meta');
        el.setAttribute('name', 'csrf-token');
        el.setAttribute('content', 'token');
        return el;
      })()
    );
    document.head.append(
      (() => {
        const el = document.createElement('meta');
        el.setAttribute('name', 'CSRF-TIME');
        el.setAttribute('content', 'time');
        return el;
      })()
    );
    await atlasService.fetch('/foo/bar', { method: 'POST' });
    expect(fetchStub.firstCall.lastArg.headers).to.deep.eq({
      'X-CSRF-Time': 'time',
      'X-CSRF-Token': 'token',
    });
  });

  describe('fetchAllPages', function () {
    function stubSequentialJsonResponses(bodies: unknown[]) {
      const fetchStub = sandbox.stub();
      bodies.forEach((body, i) => {
        fetchStub.onCall(i).resolves({
          status: 200,
          ok: true,
          json: () => Promise.resolve(body),
        });
      });
      global.fetch = fetchStub;
      return fetchStub;
    }

    it('should return the results of a single page', async function () {
      const fetchStub = stubSequentialJsonResponses([
        { results: [{ id: 'a' }, { id: 'b' }], totalCount: 2 },
      ]);

      const res = await atlasService.fetchAllPages<{ id: string }>(
        ({ pageNum, itemsPerPage }) =>
          atlasService.adminApiEndpoint(
            `/v2/things?pageNum=${pageNum}&itemsPerPage=${itemsPerPage}`
          )
      );

      expect(res).to.deep.equal([{ id: 'a' }, { id: 'b' }]);
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.firstCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/things?pageNum=1&itemsPerPage=100'
      );
    });

    it('should page through results until a partial page is returned', async function () {
      const firstPage = {
        results: Array.from({ length: 100 }, (_, i) => ({ id: `a${i}` })),
        totalCount: 101,
      };
      const secondPage = { results: [{ id: 'last' }], totalCount: 101 };
      const fetchStub = stubSequentialJsonResponses([firstPage, secondPage]);

      const res = await atlasService.fetchAllPages<{ id: string }>(
        ({ pageNum, itemsPerPage }) =>
          atlasService.adminApiEndpoint(
            `/v2/things?pageNum=${pageNum}&itemsPerPage=${itemsPerPage}`
          )
      );

      expect(res).to.have.lengthOf(101);
      expect(res[100]).to.deep.equal({ id: 'last' });
      expect(fetchStub.calledTwice).to.be.true;
      expect(fetchStub.secondCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/things?pageNum=2&itemsPerPage=100'
      );
    });

    it('should authenticate the request', async function () {
      const fetchStub = stubSequentialJsonResponses([
        { results: [], totalCount: 0 },
      ]);

      await atlasService.fetchAllPages(() =>
        atlasService.adminApiEndpoint('/v2/things')
      );

      expect(fetchStub.firstCall.args[1].headers).to.have.property(
        'X-Compass-Auth',
        'true'
      );
    });
  });
});
