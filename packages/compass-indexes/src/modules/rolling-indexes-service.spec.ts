import Sinon from 'sinon';
import { RollingIndexesService } from './rolling-indexes-service';
import { expect } from 'chai';

describe('RollingIndexesService', function () {
  const atlasServiceStub = {
    automationAgentRequest: Sinon.stub(),
    automationAgentAwait: Sinon.stub(),
  };
  let service: RollingIndexesService;

  beforeEach(() => {
    service = new RollingIndexesService(atlasServiceStub, {
      current: {
        atlasMetadata: {
          projectId: 'abc',
          metricsType: 'cluster',
          metricsId: '123',
        },
      } as any,
    });
  });

  afterEach(() => {
    atlasServiceStub.automationAgentRequest.reset();
    atlasServiceStub.automationAgentAwait.reset();
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
      });
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
    it('should fail if automation agent returned unexpected result', async function () {
      atlasServiceStub.automationAgentRequest.resolves({ _id: '_id' });

      try {
        await service.createRollingIndex('db.coll', {}, {});
        expect.fail('expected createRollingIndex to throw');
      } catch (err) {
        expect(err).not.to.be.null;
      }
    });
  });
});
