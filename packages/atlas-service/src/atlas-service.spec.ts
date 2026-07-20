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

  describe('Atlas Admin API cluster endpoints', function () {
    function stubJsonResponse(body: unknown) {
      const fetchStub = sandbox.stub().resolves({
        status: 200,
        ok: true,
        json: () => Promise.resolve(body),
      });
      global.fetch = fetchStub;
      return fetchStub;
    }

    // Sets up sequential fetch responses so we can drive the group-listing
    // request followed by one per-group connection-strings request.
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

    describe('getProjectAndClusterId', function () {
      it('should match an srv connection string', async function () {
        const fetchStub = stubSequentialJsonResponses([
          // listGroupIds -> /v2/clusters
          {
            results: [
              { groupId: 'g1', name: 'c1' },
              { groupId: 'g2', name: 'c2' },
            ],
            totalCount: 2,
          },
          // listConnectionStrings('g1')
          {
            results: [
              {
                name: 'c1',
                connectionStrings: {
                  standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
                },
              },
            ],
            totalCount: 1,
          },
          // listConnectionStrings('g2')
          {
            results: [
              {
                name: 'c2',
                connectionStrings: {
                  standardSrv: 'mongodb+srv://c2.bbbbb.mongodb.net',
                },
              },
            ],
            totalCount: 1,
          },
        ]);

        const res = await atlasService.getProjectNameAndClusterId(
          'mongodb+srv://user:pass@c2.bbbbb.mongodb.net/test?retryWrites=true'
        );

        expect(res).to.deep.equal({ projectId: 'g2', clusterName: 'c2' });
        expect(fetchStub.getCall(0).args[0]).to.equal(
          'http://example.com/api/atlas/v2/clusters?pageNum=1&itemsPerPage=100'
        );
        expect(fetchStub.getCall(1).args[0]).to.equal(
          'http://example.com/api/atlas/v2/groups/g1/clusters?pageNum=1&itemsPerPage=100'
        );
      });

      it('should match a standard connection string on its first host', async function () {
        const fetchStub = stubSequentialJsonResponses([
          { results: [{ groupId: 'g1', name: 'c1' }], totalCount: 1 },
          {
            results: [
              {
                name: 'c1',
                connectionStrings: {
                  standard:
                    'mongodb://a.host.mongodb.net:27017,b.host.mongodb.net:27017,c.host.mongodb.net:27017/?ssl=true',
                },
              },
            ],
            totalCount: 1,
          },
        ]);

        const res = await atlasService.getProjectNameAndClusterId(
          'mongodb://user:pass@a.host.mongodb.net:27017,z.other.mongodb.net:27017/test'
        );

        expect(res).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
        expect(fetchStub.calledTwice).to.be.true;
      });

      it('should stop fetching connection strings once a match is found', async function () {
        const fetchStub = stubSequentialJsonResponses([
          {
            results: [
              { groupId: 'g1', name: 'c1' },
              { groupId: 'g2', name: 'c2' },
            ],
            totalCount: 2,
          },
          {
            results: [
              {
                name: 'c1',
                connectionStrings: {
                  standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
                },
              },
            ],
            totalCount: 1,
          },
        ]);

        const res = await atlasService.getProjectNameAndClusterId(
          'mongodb+srv://c1.aaaaa.mongodb.net'
        );

        expect(res).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
        // Only two calls: listGroupIds + listConnectionStrings('g1'). g2 is
        // never fetched because g1 already matched.
        expect(fetchStub.calledTwice).to.be.true;
      });

      it('should not match a standard string against an srv string', async function () {
        stubSequentialJsonResponses([
          { results: [{ groupId: 'g1', name: 'c1' }], totalCount: 1 },
          {
            results: [
              {
                name: 'c1',
                connectionStrings: {
                  standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
                },
              },
            ],
            totalCount: 1,
          },
        ]);

        const res = await atlasService.getProjectNameAndClusterId(
          'mongodb://c1.aaaaa.mongodb.net:27017'
        );

        expect(res).to.equal(undefined);
      });

      it('should return undefined when no cluster matches', async function () {
        stubSequentialJsonResponses([
          { results: [{ groupId: 'g1', name: 'c1' }], totalCount: 1 },
          {
            results: [
              {
                name: 'c1',
                connectionStrings: {
                  standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
                },
              },
            ],
            totalCount: 1,
          },
        ]);

        const res = await atlasService.getProjectNameAndClusterId(
          'mongodb+srv://other.zzzzz.mongodb.net'
        );

        expect(res).to.equal(undefined);
      });

      it('should return undefined for an invalid connection string', async function () {
        const fetchStub = stubSequentialJsonResponses([]);

        const res = await atlasService.getProjectNameAndClusterId('not-a-uri');

        expect(res).to.equal(undefined);
        expect(fetchStub.called).to.be.false;
      });
    });

    it('listGroupIds should hit the clusters endpoint and dedupe group ids', async function () {
      const fetchStub = stubJsonResponse({
        results: [
          { groupId: 'g1', name: 'c1' },
          { groupId: 'g1', name: 'c2' },
          { groupId: 'g2', name: 'c3' },
        ],
        totalCount: 3,
      });

      const res = await atlasService.listGroupIds();

      expect(res).to.deep.equal(['g1', 'g2']);
      expect(fetchStub.firstCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/clusters?pageNum=1&itemsPerPage=100'
      );
    });

    it('listGroupIds should page through results and dedupe across pages', async function () {
      const firstPage = {
        results: Array.from({ length: 100 }, (_, i) => ({
          groupId: i < 50 ? 'g1' : 'g2',
          name: `c${i}`,
        })),
        totalCount: 101,
      };
      const secondPage = {
        results: [{ groupId: 'g2', name: 'cLast' }],
        totalCount: 101,
      };
      const fetchStub = stubSequentialJsonResponses([firstPage, secondPage]);

      const res = await atlasService.listGroupIds();

      expect(res).to.deep.equal(['g1', 'g2']);
      expect(fetchStub.calledTwice).to.be.true;
      expect(fetchStub.secondCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/clusters?pageNum=2&itemsPerPage=100'
      );
    });

    it('listConnectionStrings should page through results', async function () {
      const firstPage = {
        results: Array.from({ length: 100 }, (_, i) => ({
          name: `c${i}`,
          connectionStrings: {
            standardSrv: `mongodb+srv://c${i}.host.mongodb.net`,
          },
        })),
        totalCount: 101,
      };
      const secondPage = {
        results: [
          {
            name: 'cLast',
            connectionStrings: {
              standardSrv: 'mongodb+srv://clast.host.mongodb.net',
            },
          },
        ],
        totalCount: 101,
      };
      const fetchStub = stubSequentialJsonResponses([firstPage, secondPage]);

      const res = await atlasService.listConnectionStrings('abc123');

      expect(res).to.have.lengthOf(101);
      expect(res[100]).to.deep.equal({
        clusterName: 'cLast',
        connectionStrings: ['mongodb+srv://clast.host.mongodb.net'],
      });
      expect(fetchStub.secondCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/clusters?pageNum=2&itemsPerPage=100'
      );
    });

    it('listConnectionStrings should encode the groupId and flatten connection strings', async function () {
      const fetchStub = stubJsonResponse({
        results: [
          {
            name: 'c1',
            connectionStrings: {
              standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
              standard: 'mongodb://c1.aaaaa.mongodb.net:27017',
            },
          },
        ],
        totalCount: 1,
      });

      const res = await atlasService.listConnectionStrings('abc123');

      expect(res).to.deep.equal([
        {
          clusterName: 'c1',
          connectionStrings: [
            'mongodb+srv://c1.aaaaa.mongodb.net',
            'mongodb://c1.aaaaa.mongodb.net:27017',
          ],
        },
      ]);
      expect(fetchStub.firstCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/clusters?pageNum=1&itemsPerPage=100'
      );
    });

    it('getClusterState should hit the single cluster endpoint and return the computed state', async function () {
      const fetchStub = stubJsonResponse({
        name: 'c1',
        paused: false,
        stateName: 'IDLE',
      });

      const res = await atlasService.getClusterState('abc123', 'c1');

      expect(res).to.equal('IDLE');
      expect(fetchStub.firstCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/clusters/c1'
      );
    });

    it('getClusterState should compute PAUSED / PROVISIONING / DELETING from the response', async function () {
      stubJsonResponse({ name: 'c1', paused: true, stateName: 'IDLE' });
      expect(await atlasService.getClusterState('abc123', 'c1')).to.equal(
        'PAUSED'
      );

      stubJsonResponse({ name: 'c1', paused: false, stateName: 'CREATING' });
      expect(await atlasService.getClusterState('abc123', 'c1')).to.equal(
        'PROVISIONING'
      );

      stubJsonResponse({ name: 'c1', paused: false, stateName: 'DELETING' });
      expect(await atlasService.getClusterState('abc123', 'c1')).to.equal(
        'DELETING'
      );

      stubJsonResponse({ name: 'c1', paused: false, stateName: 'UPDATING' });
      expect(await atlasService.getClusterState('abc123', 'c1')).to.equal(
        'UPDATING'
      );

      stubJsonResponse({ name: 'c1', paused: false, stateName: 'REPAIRING' });
      expect(await atlasService.getClusterState('abc123', 'c1')).to.equal(
        'REPAIRING'
      );
    });

    it('getClusterState should map a 404 to NOT_FOUND', async function () {
      global.fetch = sandbox.stub().resolves({
        status: 404,
        ok: false,
        statusText: 'Not Found',
        json: () => Promise.resolve(undefined),
      });

      expect(await atlasService.getClusterState('abc123', 'missing')).to.equal(
        'NOT_FOUND'
      );
    });

    it('getProjectIPAccessList should hit the access list endpoint', async function () {
      const fetchStub = stubJsonResponse({
        results: [{ cidrBlock: '0.0.0.0/0' }],
        totalCount: 1,
      });

      const res = await atlasService.getProjectIPAccessList('abc123');

      expect(res).to.deep.equal([{ cidrBlock: '0.0.0.0/0' }]);
      expect(fetchStub.firstCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/accessList?pageNum=1&itemsPerPage=100'
      );
    });

    it('getProjectIPAccessList should page through all entries', async function () {
      const firstPage = {
        results: Array.from({ length: 100 }, (_, i) => ({
          cidrBlock: `10.0.0.${i}/32`,
        })),
        totalCount: 101,
      };
      const secondPage = {
        results: [{ ipAddress: '1.2.3.4' }],
        totalCount: 101,
      };
      const fetchStub = stubSequentialJsonResponses([firstPage, secondPage]);

      const res = await atlasService.getProjectIPAccessList('abc123');

      expect(res).to.have.lengthOf(101);
      expect(res[100]).to.deep.equal({ ipAddress: '1.2.3.4' });
      expect(fetchStub.secondCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/accessList?pageNum=2&itemsPerPage=100'
      );
    });

    it('should throw when the cluster response is malformed', async function () {
      stubJsonResponse({ name: 'c1' });

      try {
        await atlasService.getClusterState('abc123', 'c1');
        expect.fail('Expected getClusterState to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          'Got unexpected backend response for Atlas Admin API cluster request'
        );
      }
    });
  });
});
