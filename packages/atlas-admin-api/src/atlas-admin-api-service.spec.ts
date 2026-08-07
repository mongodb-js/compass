import { expect } from 'chai';
import Sinon from 'sinon';

import { AtlasAdminApiService } from './atlas-admin-api-service';
import { ATLAS_ADMIN_API_DEFAULT_VERSION } from './version';

// Minimal error shape matching what AtlasService.authenticatedFetch throws on a
// non-ok response; the cluster service only reads `statusCode`.
class FakeAtlasServiceError extends Error {
  statusCode: number;
  constructor(statusCode: number) {
    super(`ServerError: ${statusCode}`);
    this.statusCode = statusCode;
  }
}

describe('AtlasAdminApiService', function () {
  let sandbox: Sinon.SinonSandbox;
  let atlasServiceStub: {
    adminApiEndpoint: Sinon.SinonStub;
    authenticatedFetch: Sinon.SinonStub;
  };
  let service: AtlasAdminApiService;

  // Queue up JSON bodies to be returned by successive authenticatedFetch calls.
  function stubSequentialJsonResponses(bodies: unknown[]) {
    bodies.forEach((body, i) => {
      atlasServiceStub.authenticatedFetch.onCall(i).resolves({
        json: () => Promise.resolve(body),
      });
    });
  }

  // Builds a single paginated response body for the given results array. The
  // Atlas API returns totalCount as the grand total across all pages, so
  // callers spanning multiple pages should pass it explicitly.
  function page<T>(
    results: T[],
    totalCount: number = results.length
  ): { results: T[]; totalCount: number } {
    return { results, totalCount };
  }

  function fetchUrl(callIndex: number): string {
    return atlasServiceStub.authenticatedFetch.getCall(callIndex).args[0];
  }

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    atlasServiceStub = {
      adminApiEndpoint: sandbox
        .stub()
        .callsFake((path = '') => `http://example.com/api/atlas${path}`),
      authenticatedFetch: sandbox.stub(),
    };
    service = new AtlasAdminApiService(atlasServiceStub);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('pagination', function () {
    it('should page through results until a partial page is returned', async function () {
      stubSequentialJsonResponses([
        page(
          Array.from({ length: 100 }, (_, i) => ({ groupId: `g${i}` })),
          101
        ),
        page([{ groupId: 'g100' }], 101),
      ]);

      const res = await service.listGroupIds();

      expect(res).to.have.lengthOf(101);
      expect(atlasServiceStub.authenticatedFetch.calledTwice).to.be.true;
      expect(fetchUrl(0)).to.equal(
        'http://example.com/api/atlas/v2/clusters?pageNum=1&itemsPerPage=100'
      );
      expect(fetchUrl(1)).to.equal(
        'http://example.com/api/atlas/v2/clusters?pageNum=2&itemsPerPage=100'
      );
    });

    it('should authenticate the request', async function () {
      stubSequentialJsonResponses([page([])]);

      await service.listGroupIds();

      expect(atlasServiceStub.authenticatedFetch.firstCall.args[1]).to.include({
        method: 'GET',
      });
    });

    it('should send the versioned Accept header', async function () {
      stubSequentialJsonResponses([page([])]);

      await service.listGroupIds();

      // Without this the Atlas Admin API rejects the request with
      // INVALID_VERSION_DATE.
      expect(
        atlasServiceStub.authenticatedFetch.firstCall.args[1].headers
      ).to.deep.equal({
        Accept: `application/vnd.atlas.${ATLAS_ADMIN_API_DEFAULT_VERSION}+json`,
      });
    });

    it('should let an endpoint override the version', async function () {
      stubSequentialJsonResponses([page([])]);

      await service.getProjectIPAccessList('abc123', {
        version: '2024-08-05',
      });

      expect(
        atlasServiceStub.authenticatedFetch.firstCall.args[1].headers
      ).to.deep.equal({
        Accept: 'application/vnd.atlas.2024-08-05+json',
      });
    });

    it('should throw on a malformed paginated response', async function () {
      stubSequentialJsonResponses([{ notResults: true }]);

      try {
        await service.listGroupIds();
        expect.fail('Expected listGroupIds to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          'Got unexpected backend response for Atlas Admin API paginated request'
        );
      }
    });
  });

  describe('listGroupIds', function () {
    it('should hit the clusters endpoint and dedupe group ids', async function () {
      stubSequentialJsonResponses([
        page([{ groupId: 'g1' }, { groupId: 'g1' }, { groupId: 'g2' }]),
      ]);

      const res = await service.listGroupIds();

      expect(res).to.deep.equal(['g1', 'g2']);
      expect(fetchUrl(0)).to.equal(
        'http://example.com/api/atlas/v2/clusters?pageNum=1&itemsPerPage=100'
      );
    });
  });

  describe('listConnectionStrings', function () {
    it('should encode the groupId and flatten connection strings', async function () {
      stubSequentialJsonResponses([
        page([
          {
            name: 'c1',
            connectionStrings: {
              standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
              standard: 'mongodb://c1.aaaaa.mongodb.net:27017',
            },
          },
        ]),
      ]);

      const res = await service.listConnectionStrings('abc123');

      expect(res).to.deep.equal([
        {
          clusterName: 'c1',
          connectionStrings: [
            'mongodb+srv://c1.aaaaa.mongodb.net',
            'mongodb://c1.aaaaa.mongodb.net:27017',
          ],
        },
      ]);
      expect(fetchUrl(0)).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/clusters?pageNum=1&itemsPerPage=100'
      );
    });
  });

  describe('getProjectNameAndClusterId', function () {
    it('should match an srv connection string', async function () {
      stubSequentialJsonResponses([
        page([{ groupId: 'g1' }, { groupId: 'g2' }]),
        page([
          {
            name: 'c1',
            connectionStrings: {
              standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
            },
          },
        ]),
        page([
          {
            name: 'c2',
            connectionStrings: {
              standardSrv: 'mongodb+srv://c2.bbbbb.mongodb.net',
            },
          },
        ]),
      ]);

      const res = await service.getProjectIdAndClusterName(
        'mongodb+srv://user:pass@c2.bbbbb.mongodb.net/test?retryWrites=true'
      );

      expect(res).to.deep.equal({ projectId: 'g2', clusterName: 'c2' });
    });

    it('should match a standard connection string on its first host', async function () {
      stubSequentialJsonResponses([
        page([{ groupId: 'g1' }]),
        page([
          {
            name: 'c1',
            connectionStrings: {
              standard:
                'mongodb://a.host.mongodb.net:27017,b.host.mongodb.net:27017/?ssl=true',
            },
          },
        ]),
      ]);

      const res = await service.getProjectIdAndClusterName(
        'mongodb://user:pass@a.host.mongodb.net:27017,z.other.mongodb.net:27017/test'
      );

      expect(res).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
    });

    it('should stop fetching connection strings once a match is found', async function () {
      stubSequentialJsonResponses([
        page([{ groupId: 'g1' }, { groupId: 'g2' }]),
        page([
          {
            name: 'c1',
            connectionStrings: {
              standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
            },
          },
        ]),
      ]);

      const res = await service.getProjectIdAndClusterName(
        'mongodb+srv://c1.aaaaa.mongodb.net'
      );

      expect(res).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
      // listGroupIds + listConnectionStrings('g1') only; g2 never fetched.
      expect(atlasServiceStub.authenticatedFetch.calledTwice).to.be.true;
    });

    it('should not match a standard string against an srv string', async function () {
      stubSequentialJsonResponses([
        page([{ groupId: 'g1' }]),
        page([
          {
            name: 'c1',
            connectionStrings: {
              standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
            },
          },
        ]),
      ]);

      const res = await service.getProjectIdAndClusterName(
        'mongodb://c1.aaaaa.mongodb.net:27017'
      );

      expect(res).to.equal(undefined);
    });

    it('should return undefined when no cluster matches', async function () {
      stubSequentialJsonResponses([
        page([{ groupId: 'g1' }]),
        page([
          {
            name: 'c1',
            connectionStrings: {
              standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
            },
          },
        ]),
      ]);

      const res = await service.getProjectIdAndClusterName(
        'mongodb+srv://other.zzzzz.mongodb.net'
      );

      expect(res).to.equal(undefined);
    });

    it('should return undefined for an invalid connection string', async function () {
      const res = await service.getProjectIdAndClusterName('not-a-uri');

      expect(res).to.equal(undefined);
      expect(atlasServiceStub.authenticatedFetch.called).to.be.false;
    });
  });

  describe('getProjectIdAndClusterName caching', function () {
    function stubSingleMatch() {
      stubSequentialJsonResponses([
        page([{ groupId: 'g1' }]),
        page([
          {
            name: 'c1',
            connectionStrings: {
              standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
            },
          },
        ]),
      ]);
    }

    it('should not re-fetch for a connection string it already resolved', async function () {
      stubSingleMatch();

      const first = await service.getProjectIdAndClusterName(
        'mongodb+srv://c1.aaaaa.mongodb.net'
      );
      const callsAfterFirst = atlasServiceStub.authenticatedFetch.callCount;
      const second = await service.getProjectIdAndClusterName(
        'mongodb+srv://c1.aaaaa.mongodb.net'
      );

      expect(second).to.deep.equal(first);
      expect(atlasServiceStub.authenticatedFetch.callCount).to.equal(
        callsAfterFirst
      );
    });

    it('should share a single lookup between concurrent callers', async function () {
      stubSingleMatch();

      const [first, second] = await Promise.all([
        service.getProjectIdAndClusterName(
          'mongodb+srv://c1.aaaaa.mongodb.net'
        ),
        service.getProjectIdAndClusterName(
          'mongodb+srv://c1.aaaaa.mongodb.net'
        ),
      ]);

      expect(first).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
      expect(second).to.deep.equal(first);
      // listGroupIds + listConnectionStrings('g1'), not doubled.
      expect(atlasServiceStub.authenticatedFetch.callCount).to.equal(2);
    });

    // `onCall(i)` indices are absolute, so re-arming the stub for a second
    // round of requests needs the call history cleared as well.
    function rearmSingleMatch() {
      atlasServiceStub.authenticatedFetch.resetBehavior();
      atlasServiceStub.authenticatedFetch.resetHistory();
      stubSingleMatch();
    }

    it('should re-fetch after clearCache', async function () {
      stubSingleMatch();

      await service.getProjectIdAndClusterName(
        'mongodb+srv://c1.aaaaa.mongodb.net'
      );

      service.clearCache();
      rearmSingleMatch();

      const res = await service.getProjectIdAndClusterName(
        'mongodb+srv://c1.aaaaa.mongodb.net'
      );

      expect(res).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
      expect(atlasServiceStub.authenticatedFetch.callCount).to.equal(2);
    });

    it('should not cache a lookup that found no cluster', async function () {
      stubSingleMatch();

      const first = await service.getProjectIdAndClusterName(
        'mongodb+srv://other.zzzzz.mongodb.net'
      );

      rearmSingleMatch();

      const second = await service.getProjectIdAndClusterName(
        'mongodb+srv://other.zzzzz.mongodb.net'
      );

      expect(first).to.equal(undefined);
      expect(second).to.equal(undefined);
      // Re-queried rather than replaying the cached miss.
      expect(atlasServiceStub.authenticatedFetch.callCount).to.equal(2);
    });

    it('should not cache a lookup that failed', async function () {
      atlasServiceStub.authenticatedFetch.rejects(
        new FakeAtlasServiceError(500)
      );

      try {
        await service.getProjectIdAndClusterName(
          'mongodb+srv://c1.aaaaa.mongodb.net'
        );
        expect.fail('Expected getProjectIdAndClusterName to throw');
      } catch (err) {
        expect(err).to.have.property('statusCode', 500);
      }

      rearmSingleMatch();

      const res = await service.getProjectIdAndClusterName(
        'mongodb+srv://c1.aaaaa.mongodb.net'
      );

      expect(res).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
    });
  });

  describe('getClusterState', function () {
    function stubClusterResponse(body: unknown) {
      atlasServiceStub.authenticatedFetch.resolves({
        json: () => Promise.resolve(body),
      });
    }

    it('should hit the single cluster endpoint and return the state', async function () {
      stubClusterResponse({ name: 'c1', paused: false, stateName: 'IDLE' });

      const res = await service.getClusterState('abc123', 'c1');

      expect(res).to.deep.equal({ state: 'IDLE', paused: false });
      expect(atlasServiceStub.authenticatedFetch.firstCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/clusters/c1'
      );
    });

    it('should rethrow non-404 errors', async function () {
      atlasServiceStub.authenticatedFetch.rejects(
        new FakeAtlasServiceError(500)
      );

      try {
        await service.getClusterState('abc123', 'c1');
        expect.fail('Expected getClusterState to throw');
      } catch (err) {
        expect(err).to.have.property('statusCode', 500);
      }
    });

    it('should throw when the cluster response is malformed', async function () {
      stubClusterResponse({ name: 'c1' });

      try {
        await service.getClusterState('abc123', 'c1');
        expect.fail('Expected getClusterState to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          'Got unexpected backend response for Atlas Admin API cluster request'
        );
      }
    });

    it('should pass through a state that is not explicitly mapped', async function () {
      stubClusterResponse({ name: 'c1', paused: false, stateName: 'DELETING' });

      expect(await service.getClusterState('abc123', 'c1')).to.deep.equal({
        state: 'DELETING',
        paused: false,
      });
    });
  });

  describe('getProjectIPAccessList', function () {
    it('should hit the access list endpoint and return the entries', async function () {
      stubSequentialJsonResponses([page([{ cidrBlock: '0.0.0.0/0' }])]);

      const res = await service.getProjectIPAccessList('abc123');

      expect(res).to.deep.equal([{ cidrBlock: '0.0.0.0/0' }]);
      expect(fetchUrl(0)).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/accessList?pageNum=1&itemsPerPage=100'
      );
    });
  });
});
