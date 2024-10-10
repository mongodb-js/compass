import Sinon from 'sinon';
import { RollingIndexesService } from './rolling-indexes-service';
import { expect } from 'chai';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';

describe('RollingIndexesService', function () {
  let atlasServiceStub: Sinon.SinonStubbedInstance<AtlasService>;
  let service: RollingIndexesService;

  beforeEach(() => {
    atlasServiceStub = {
      automationAgentRequest: Sinon.stub(),
      automationAgentAwait: Sinon.stub(),
      authenticatedFetch: Sinon.stub(),
      cloudEndpoint: Sinon.stub().callsFake((str) => str),
    } as any;

    service = new RollingIndexesService(atlasServiceStub as any, {
      current: {
        atlasMetadata: {
          projectId: 'abc',
          metricsType: 'cluster',
          metricsId: '123',
        },
      } as any,
    });
  });

  describe('listRollingIndexes', function () {
    it('should succeed if automation agent reutrned all responses as expected and filter only the rolling indexes', async function () {
      atlasServiceStub.automationAgentRequest.resolves({
        _id: '_id',
        requestType: 'requestType',
      });
      atlasServiceStub.automationAgentAwait.resolves({
        response: [
          { indexName: 'abc', status: 'rolling build' },
          { indexName: 'cba', status: 'exists' },
        ],
      } as any);
      const res = await service.listRollingIndexes('db.coll');
      expect(res).to.deep.eq([{ indexName: 'abc', status: 'rolling build' }]);
    });

    it('should fail if automation agent backend returned unexpected result', async function () {
      atlasServiceStub.automationAgentRequest.resolves(undefined);

      try {
        await service.listRollingIndexes('db.coll');
        expect.fail('expected listRollingIndexes to throw');
      } catch (err) {
        expect(err).not.to.be.null;
      }
    });
  });

  describe('createRollingIndex', function () {
    it('should send the request to the kinda automation agent endpoint with the matching body and path params', async function () {
      await service.createRollingIndex('db.coll', {}, {});

      expect(atlasServiceStub.authenticatedFetch).to.have.been.calledOnce;

      const { args } = atlasServiceStub.authenticatedFetch.getCall(0);

      expect(args[0]).to.eq('/explorer/v1/groups/abc/clusters/123/index');
      expect(args[1]).to.have.property('method', 'POST');
      expect(args[1]).to.have.property(
        'body',
        '{"clusterId":"123","db":"db","collection":"coll","keys":"{}","options":"","collationOptions":""}'
      );
    });
  });
});
