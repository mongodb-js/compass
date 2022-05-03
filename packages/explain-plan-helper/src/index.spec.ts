import { ExplainPlan } from './';
import path from 'path';
import { promises as fs } from 'fs';
import { expect } from 'chai';

async function loadExplainFixture(name: string): Promise<ExplainPlan> {
  const filepath = path.join(__dirname, '..', 'test', 'fixtures', name);
  const output = JSON.parse(await fs.readFile(filepath, 'utf8'));
  return new ExplainPlan(output);
}

describe('explain-plan-plan', function () {
  context('Modern explain plans', function () {
    let plan: ExplainPlan;

    describe('Simple collection scans', function () {
      beforeEach(async function () {
        plan = await loadExplainFixture('simple_collscan_3.2.json');
      });

      it('should correctly detect when an explain plan is sharded', async function () {
        plan = await loadExplainFixture('sharded_geo_query_3.2.json');
        expect(plan.isSharded).to.equal(true);
      });

      it('should correctly detect when an explain plan is not sharded', function () {
        expect(plan.isSharded).to.equal(false);
      });

      it('should parse basic fields correctly for 3.2 collection scan plans', function () {
        expect(plan.namespace).to.equal('mongodb.fanclub');
        expect(plan.nReturned).to.equal(1000000);
        expect(plan.executionTimeMillis).to.equal(188);
        expect(plan.totalKeysExamined).to.equal(0);
        expect(plan.totalDocsExamined).to.equal(1000000);
        expect(plan.executionStats).to.be.an('object');
      });

      it('should have the executionStats object', function () {
        expect(plan.executionStats).to.be.an('object');
      });

      it('should detect collection scan', function () {
        expect(plan.isCollectionScan).to.equal(true);
      });

      it('should have empty `usedIndexes`', function () {
        expect(plan.usedIndexes).to.deep.equal([]);
      });

      it('should have `inMemorySort` disabled', function () {
        expect(plan.inMemorySort).to.equal(false);
      });

      it('should not be a covered query', function () {
        expect(plan.isCovered).to.equal(false);
      });
    });

    describe('Simple indexed queries', function () {
      beforeEach(async function () {
        plan = await loadExplainFixture('simple_index_3.2.json');
      });

      it('should parse basic fields correctly for 3.2 indexed scan plans', function () {
        expect(plan.namespace).to.equal('mongodb.fanclub');
        expect(plan.nReturned).to.equal(191665);
        expect(plan.executionTimeMillis).to.equal(135);
        expect(plan.totalKeysExamined).to.equal(191665);
        expect(plan.totalDocsExamined).to.equal(191665);
      });

      it('should have the executionStats object', function () {
        expect(plan.executionStats).to.be.an('object');
      });

      it('should have `isCollectionScan` disabled', function () {
        expect(plan.isCollectionScan).to.equal(false);
      });

      it('should have the correct `usedIndexes` value', function () {
        expect(plan.usedIndexes).to.deep.equal([
          { index: 'age_1', shard: null },
        ]);
      });

      it('should have `inMemorySort` disabled', function () {
        expect(plan.inMemorySort).to.equal(false);
      });

      it('should not be a covered query', function () {
        expect(plan.isCovered).to.equal(false);
      });
    });

    describe('Covered queries', function () {
      beforeEach(async function () {
        plan = await loadExplainFixture('covered_index_3.2.json');
      });

      it('should detect a covered query', function () {
        expect(plan.isCovered).to.equal(true);
      });
    });

    describe('In-memory sorted queries', function () {
      beforeEach(async function () {
        plan = await loadExplainFixture('sort_skip_limit_index_3.2.json');
      });

      it('should detect an in memory sort', function () {
        expect(plan.inMemorySort).to.equal(true);
      });

      it('should not detect collection scan', function () {
        expect(plan.isCollectionScan).to.equal(false);
      });

      it('should return the used index', function () {
        expect(plan.usedIndexes).to.deep.equal([
          { index: 'age_1', shard: null },
        ]);
      });

      it('should not be a covered index', function () {
        expect(plan.isCovered).to.equal(false);
      });
    });
  });

  context('Edge Cases', function () {
    let plan: ExplainPlan;

    describe('IDHACK stage', function () {
      beforeEach(async function () {
        plan = await loadExplainFixture('idhack_stage_3.2.json');
      });

      it('should recognize an IDHACK stage and return the correct index name', function () {
        expect(plan.usedIndexes).to.deep.equal([
          { index: '_id_', shard: null },
        ]);
        expect(plan.isCollectionScan).to.equal(false);
      });
    });

    describe('Multiple Indexes', function () {
      it('should detect multiple different indexes', async function () {
        plan = await loadExplainFixture('sharded_mixed_index_3.2.json');
        expect(plan.usedIndexes).to.deep.equal([
          { index: 'age_1', shard: 'shard02' },
          { index: 'age_1', shard: 'shard03' },
          { index: null, shard: 'shard01' },
        ]);
      });
    });

    describe('Single Sharded Indexes', function () {
      it('should detect IDHACK stage', async function () {
        plan = await loadExplainFixture('sharded_single_index_3.2.json');
        expect(plan.usedIndexes).to.deep.equal([
          { index: '_id_', shard: 'rsmyset' },
        ]);
      });
    });
  });

  context('Stage Helpers', function () {
    let plan: ExplainPlan;

    beforeEach(async function () {
      plan = await loadExplainFixture('simple_index_3.2.json');
    });

    it('should find a stage by name from the root stage', function () {
      const ixscan = plan.findStageByName('IXSCAN');
      expect(ixscan.indexName).to.equal('age_1');
    });

    it('should iterate over shards in a sharded explain plan', async function () {
      plan = await loadExplainFixture('sharded_geo_query_3.2.json');
      const ixscan = plan.findStageByName('IXSCAN');
      expect(ixscan.indexName).to.equal('last_login_-1');
    });

    it('should return all matching stages with findAllStagesByName', async function () {
      plan = await loadExplainFixture('sharded_geo_query_3.2.json');
      const ixscans = plan.findAllStagesByName('IXSCAN');
      expect(ixscans.length).to.equal(3);
    });

    it('should find a stage by name from a provided stage', function () {
      const fetch = plan.findStageByName('FETCH');
      expect(fetch.stage).to.equal('FETCH');
      const ixscan = plan.findStageByName('IXSCAN', fetch);
      expect(ixscan.indexName).to.equal('age_1');
    });

    it('should find a stage if it is the provided root stage', function () {
      const fetch = plan.findStageByName('FETCH');
      expect(fetch.stage).to.equal('FETCH');
      const fetch2 = plan.findStageByName('FETCH', fetch);
      expect(fetch).to.equal(fetch2);
    });

    it('should iterate over stages', function () {
      const it = plan._getStageIterator();
      expect(it.next().value).to.equal(
        plan.executionStats.executionStages
      );
      expect(it.next().value.stage).to.equal('IXSCAN');
      expect(it.next().done).to.equal(true);
    });
  });

  context.only('Aggregations', function () {
    context('SBE plans', function () {
      let plan: ExplainPlan;
      beforeEach(async function () {
        plan = await loadExplainFixture('aggregate_$cursor_sbe.json');
      });

      it('should have the executionStats object', function () {
        expect(plan.executionStats).to.be.an('object');
      });

      it('should detect collection scan', function () {
        expect(plan.isCollectionScan).to.equal(false);
      });

      it('should have `usedIndexes`', function () {
        expect(plan.usedIndexes).to.deep.equal([]);
      });

      it('should have `inMemorySort` disabled', function () {
        expect(plan.inMemorySort).to.equal(false);
      });

      it('should not be a covered query', function () {
        expect(plan.isCovered).to.equal(false);
      });
    });
  });
});
