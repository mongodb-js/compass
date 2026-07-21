import { expect } from 'chai';
import Sinon from 'sinon';

import { AtlasClusterService } from './atlas-cluster-service';

// Minimal error shape matching what AtlasService.authenticatedFetch throws on a
// non-ok response; the cluster service only reads `statusCode`.
class FakeAtlasServiceError extends Error {
  statusCode: number;
  constructor(statusCode: number) {
    super(`ServerError: ${statusCode}`);
    this.statusCode = statusCode;
  }
}

describe('AtlasClusterService', function () {
  let sandbox: Sinon.SinonSandbox;
  let atlasServiceStub: {
    adminApiEndpoint: Sinon.SinonStub;
    authenticatedFetch: Sinon.SinonStub;
  };
  let service: AtlasClusterService;

  // Queue up JSON bodies to be returned by successive authenticatedFetch calls.
  function stubSequentialJsonResponses(bodies: unknown[]) {
    bodies.forEach((body, i) => {
      atlasServiceStub.authenticatedFetch.onCall(i).resolves({
        json: () => Promise.resolve(body),
      });
    });
  }

  // Builds a single paginated response body for the given results array.
  function page<T>(results: T[]): { results: T[]; totalCount: number } {
    return { results, totalCount: results.length };
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
    service = new AtlasClusterService(atlasServiceStub);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('pagination', function () {
    it('should page through results until a partial page is returned', async function () {
      stubSequentialJsonResponses([
        page(Array.from({ length: 100 }, (_, i) => ({ groupId: `g${i}` }))),
        page([{ groupId: 'g100' }]),
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

      const res = await service.getProjectNameAndClusterId(
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

      const res = await service.getProjectNameAndClusterId(
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

      const res = await service.getProjectNameAndClusterId(
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

      const res = await service.getProjectNameAndClusterId(
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

      const res = await service.getProjectNameAndClusterId(
        'mongodb+srv://other.zzzzz.mongodb.net'
      );

      expect(res).to.equal(undefined);
    });

    it('should return undefined for an invalid connection string', async function () {
      const res = await service.getProjectNameAndClusterId('not-a-uri');

      expect(res).to.equal(undefined);
      expect(atlasServiceStub.authenticatedFetch.called).to.be.false;
    });
  });

  describe('getClusterState', function () {
    function stubClusterResponse(body: unknown) {
      atlasServiceStub.authenticatedFetch.resolves({
        json: () => Promise.resolve(body),
      });
    }

    it('should hit the single cluster endpoint and return the computed state', async function () {
      stubClusterResponse({ name: 'c1', paused: false, stateName: 'IDLE' });

      const res = await service.getClusterState('abc123', 'c1');

      expect(res).to.equal('IDLE');
      expect(atlasServiceStub.authenticatedFetch.firstCall.args[0]).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/clusters/c1'
      );
    });

    it('should compute PAUSED / PROVISIONING from the response', async function () {
      stubClusterResponse({ name: 'c1', paused: true, stateName: 'IDLE' });
      expect(await service.getClusterState('abc123', 'c1')).to.equal('PAUSED');

      atlasServiceStub.authenticatedFetch.resetBehavior();
      stubClusterResponse({ name: 'c1', paused: false, stateName: 'CREATING' });
      expect(await service.getClusterState('abc123', 'c1')).to.equal(
        'PROVISIONING'
      );
    });

    it('should map a 404 to NOT_FOUND', async function () {
      atlasServiceStub.authenticatedFetch.rejects(
        new FakeAtlasServiceError(404)
      );

      expect(await service.getClusterState('abc123', 'missing')).to.equal(
        'NOT_FOUND'
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

      expect(await service.getClusterState('abc123', 'c1')).to.equal(
        'DELETING'
      );
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
