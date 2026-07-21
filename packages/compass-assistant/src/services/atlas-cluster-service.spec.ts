import { expect } from 'chai';
import Sinon from 'sinon';
import {
  AtlasServiceError,
  type AtlasService,
} from '@mongodb-js/atlas-service/provider';
import { AtlasClusterService } from './atlas-cluster-service';

type AtlasServiceStub = Pick<
  AtlasService,
  'adminApiEndpoint' | 'authenticatedFetch' | 'fetchAllPages'
>;

describe('AtlasClusterService', function () {
  let sandbox: Sinon.SinonSandbox;
  let atlasServiceStub: {
    adminApiEndpoint: Sinon.SinonStub;
    authenticatedFetch: Sinon.SinonStub;
    fetchAllPages: Sinon.SinonStub;
  };
  let service: AtlasClusterService;

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    atlasServiceStub = {
      adminApiEndpoint: sandbox
        .stub()
        .callsFake((path = '') => `http://example.com/api/atlas${path}`),
      authenticatedFetch: sandbox.stub(),
      fetchAllPages: sandbox.stub(),
    };
    service = new AtlasClusterService(
      atlasServiceStub as unknown as AtlasServiceStub
    );
  });

  afterEach(function () {
    sandbox.restore();
  });

  // Invokes the buildEndpoint callback captured by a fetchAllPages call so we
  // can assert against the concrete admin-API URL it produces.
  function endpointForCall(callIndex: number) {
    const buildEndpoint = atlasServiceStub.fetchAllPages.getCall(callIndex)
      .args[0] as (pagination: {
      pageNum?: number;
      itemsPerPage?: number;
    }) => string;
    return buildEndpoint({ pageNum: 1, itemsPerPage: 100 });
  }

  describe('listGroupIds', function () {
    it('should hit the clusters endpoint and dedupe group ids', async function () {
      atlasServiceStub.fetchAllPages.resolves([
        { groupId: 'g1' },
        { groupId: 'g1' },
        { groupId: 'g2' },
      ]);

      const res = await service.listGroupIds();

      expect(res).to.deep.equal(['g1', 'g2']);
      expect(endpointForCall(0)).to.equal(
        'http://example.com/api/atlas/v2/clusters?pageNum=1&itemsPerPage=100'
      );
    });
  });

  describe('listConnectionStrings', function () {
    it('should encode the groupId and flatten connection strings', async function () {
      atlasServiceStub.fetchAllPages.resolves([
        {
          name: 'c1',
          connectionStrings: {
            standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
            standard: 'mongodb://c1.aaaaa.mongodb.net:27017',
          },
        },
      ]);

      const res = await service.listConnectionStrings('abc 123');

      expect(res).to.deep.equal([
        {
          clusterName: 'c1',
          connectionStrings: [
            'mongodb+srv://c1.aaaaa.mongodb.net',
            'mongodb://c1.aaaaa.mongodb.net:27017',
          ],
        },
      ]);
      expect(endpointForCall(0)).to.equal(
        'http://example.com/api/atlas/v2/groups/abc%20123/clusters?pageNum=1&itemsPerPage=100'
      );
    });
  });

  describe('getProjectNameAndClusterId', function () {
    it('should match an srv connection string', async function () {
      atlasServiceStub.fetchAllPages
        .onCall(0)
        .resolves([{ groupId: 'g1' }, { groupId: 'g2' }]);
      atlasServiceStub.fetchAllPages.onCall(1).resolves([
        {
          name: 'c1',
          connectionStrings: {
            standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
          },
        },
      ]);
      atlasServiceStub.fetchAllPages.onCall(2).resolves([
        {
          name: 'c2',
          connectionStrings: {
            standardSrv: 'mongodb+srv://c2.bbbbb.mongodb.net',
          },
        },
      ]);

      const res = await service.getProjectNameAndClusterId(
        'mongodb+srv://user:pass@c2.bbbbb.mongodb.net/test?retryWrites=true'
      );

      expect(res).to.deep.equal({ projectId: 'g2', clusterName: 'c2' });
    });

    it('should match a standard connection string on its first host', async function () {
      atlasServiceStub.fetchAllPages.onCall(0).resolves([{ groupId: 'g1' }]);
      atlasServiceStub.fetchAllPages.onCall(1).resolves([
        {
          name: 'c1',
          connectionStrings: {
            standard:
              'mongodb://a.host.mongodb.net:27017,b.host.mongodb.net:27017/?ssl=true',
          },
        },
      ]);

      const res = await service.getProjectNameAndClusterId(
        'mongodb://user:pass@a.host.mongodb.net:27017,z.other.mongodb.net:27017/test'
      );

      expect(res).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
    });

    it('should stop fetching connection strings once a match is found', async function () {
      atlasServiceStub.fetchAllPages
        .onCall(0)
        .resolves([{ groupId: 'g1' }, { groupId: 'g2' }]);
      atlasServiceStub.fetchAllPages.onCall(1).resolves([
        {
          name: 'c1',
          connectionStrings: {
            standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
          },
        },
      ]);

      const res = await service.getProjectNameAndClusterId(
        'mongodb+srv://c1.aaaaa.mongodb.net'
      );

      expect(res).to.deep.equal({ projectId: 'g1', clusterName: 'c1' });
      // listGroupIds + listConnectionStrings('g1') only; g2 never fetched.
      expect(atlasServiceStub.fetchAllPages.calledTwice).to.be.true;
    });

    it('should not match a standard string against an srv string', async function () {
      atlasServiceStub.fetchAllPages.onCall(0).resolves([{ groupId: 'g1' }]);
      atlasServiceStub.fetchAllPages.onCall(1).resolves([
        {
          name: 'c1',
          connectionStrings: {
            standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
          },
        },
      ]);

      const res = await service.getProjectNameAndClusterId(
        'mongodb://c1.aaaaa.mongodb.net:27017'
      );

      expect(res).to.equal(undefined);
    });

    it('should return undefined when no cluster matches', async function () {
      atlasServiceStub.fetchAllPages.onCall(0).resolves([{ groupId: 'g1' }]);
      atlasServiceStub.fetchAllPages.onCall(1).resolves([
        {
          name: 'c1',
          connectionStrings: {
            standardSrv: 'mongodb+srv://c1.aaaaa.mongodb.net',
          },
        },
      ]);

      const res = await service.getProjectNameAndClusterId(
        'mongodb+srv://other.zzzzz.mongodb.net'
      );

      expect(res).to.equal(undefined);
    });

    it('should return undefined for an invalid connection string', async function () {
      const res = await service.getProjectNameAndClusterId('not-a-uri');

      expect(res).to.equal(undefined);
      expect(atlasServiceStub.fetchAllPages.called).to.be.false;
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
        new AtlasServiceError('ServerError', 404, 'Not Found', 'NOT_FOUND')
      );

      expect(await service.getClusterState('abc123', 'missing')).to.equal(
        'NOT_FOUND'
      );
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

    it('should throw when stateName is not a known cluster state', async function () {
      stubClusterResponse({ name: 'c1', paused: false, stateName: 'BOGUS' });

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
  });

  describe('getProjectIPAccessList', function () {
    it('should hit the access list endpoint and return the entries', async function () {
      atlasServiceStub.fetchAllPages.resolves([{ cidrBlock: '0.0.0.0/0' }]);

      const res = await service.getProjectIPAccessList('abc123');

      expect(res).to.deep.equal([{ cidrBlock: '0.0.0.0/0' }]);
      expect(endpointForCall(0)).to.equal(
        'http://example.com/api/atlas/v2/groups/abc123/accessList?pageNum=1&itemsPerPage=100'
      );
    });
  });
});
