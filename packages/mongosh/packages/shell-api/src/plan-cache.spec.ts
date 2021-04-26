import { expect } from 'chai';
import PlanCache from './plan-cache';
import { ALL_PLATFORMS, ALL_TOPOLOGIES, ServerVersions } from './enums';
import { signatures, toShellResult } from './index';
import { StubbedInstance, stubInterface } from 'ts-sinon';
import Collection from './collection';
import AggregationCursor from './aggregation-cursor';

describe('PlanCache', () => {
  describe('help', () => {
    const apiClass = new PlanCache({} as any);
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
  });
  describe('signatures', () => {
    it('type', () => {
      expect(signatures.PlanCache.type).to.equal('PlanCache');
    });
    it('attributes', () => {
      expect(signatures.PlanCache.attributes.list).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { attributes: {}, type: 'unknown' },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ['4.4.0', ServerVersions.latest]
      });
    });
    it('hasAsyncChild', () => {
      expect(signatures.PlanCache.hasAsyncChild).to.equal(true);
    });
  });
  describe('Metadata', () => {
    describe('toShellResult', () => {
      const planCache = new PlanCache({ _name: 'collname' } as any);
      it('value', async() => {
        expect((await toShellResult(planCache)).printable).to.equal('PlanCache for collection collname.');
      });
      it('type', async() => {
        expect((await toShellResult(planCache)).type).to.equal('PlanCache');
      });
    });
  });
  describe('commands', () => {
    let planCache: PlanCache;
    let collection: StubbedInstance<Collection>;
    let aggCursor: StubbedInstance<AggregationCursor>;

    beforeEach(() => {
      collection = stubInterface<Collection>();
      planCache = new PlanCache(collection);
    });
    describe('clear', () => {
      it('calls collection.runCommand on the planCache with options', async() => {
        await planCache.clear();
        expect(collection.runCommand).to.have.been.calledWith('planCacheClear');
      });

      it('returns whatever collection.runCommand returns', async() => {
        const expectedResult = { ok: 1 };
        collection.runCommand.resolves(expectedResult);
        const result = await planCache.clear();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if collection.runCommand rejects', async() => {
        const expectedError = new Error();
        collection.runCommand.rejects(expectedError);
        const catchedError = await planCache.clear()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('clearPlansByQuery', () => {
      it('calls collection.runCommand on the planCache with options', async() => {
        const expectedResult = { ok: 1 };
        collection.runCommand.resolves(expectedResult);
        const res = await planCache.clearPlansByQuery({ query: 1 }, { projection: 1 }, { sort: 1 });
        expect(collection.runCommand).to.have.been.calledWith('planCacheClear', {
          query: { query: 1 },
          projection: { projection: 1 },
          sort: { sort: 1 }
        });
        expect(res).to.deep.equal(expectedResult);
      });

      it('calls collection.runCommand on the planCache without extra options', async() => {
        const expectedResult = { ok: 1 };
        collection.runCommand.resolves(expectedResult);
        const res = await planCache.clearPlansByQuery({ query: 1 });
        expect(collection.runCommand).to.have.been.calledWith('planCacheClear', {
          query: { query: 1 }
        });
        expect(res).to.deep.equal(expectedResult);
      });

      it('throws if collection.runCommand rejects', async() => {
        const expectedError = new Error();
        collection.runCommand.rejects(expectedError);
        const catchedError = await planCache.clearPlansByQuery({})
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('list', () => {
      beforeEach(() => {
        aggCursor = stubInterface<AggregationCursor>();
        aggCursor.toArray.resolves([{ r1: 1 }, { r2: 2 }, { r3: 3 }]);
        collection.aggregate.resolves(aggCursor);
      });
      it('calls collection.aggregate on the planCache with options', async() => {
        const res = await planCache.list([{ stage1: 1 }, { stage2: 2 }]);
        expect(collection.aggregate).to.have.been.calledWith([
          { $planCacheStats: {} },
          { stage1: 1 },
          { stage2: 2 }
        ]);
        expect(res).to.deep.equal([{ r1: 1 }, { r2: 2 }, { r3: 3 }]);
      });

      it('calls collection.aggregate on the planCache without extra options', async() => {
        const res = await planCache.list();
        expect(collection.aggregate).to.have.been.calledWith([
          { $planCacheStats: {} }
        ]);
        expect(res).to.deep.equal([{ r1: 1 }, { r2: 2 }, { r3: 3 }]);
      });

      it('throws if collection.aggregate rejects', async() => {
        const expectedError = new Error();
        collection.aggregate.rejects(expectedError);
        const catchedError = await planCache.list()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
  });
});
