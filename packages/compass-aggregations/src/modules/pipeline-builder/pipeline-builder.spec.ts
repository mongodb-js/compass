import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';
import { DEFAULT_PIPELINE, PipelineBuilder } from './pipeline-builder';

import { pipelines } from './test/fixtures';
import { mockDataService } from './test/data-service';

describe('PipelineBuilder', function () {
  describe('default pipeline with empty object', function () {

    let builder: PipelineBuilder;

    beforeEach(function () {
      builder = new PipelineBuilder(
        undefined,
        {} as { dataService: DataService }
      );
    });

    it('generates stage', function () {
      expect(builder.stages.length).to.equal(1);
      const stage = builder.stages[0];
      expect(stage.disabled).to.be.false;
      expect(stage.syntaxError?.message).to.be.equal('A pipeline stage specification object must contain exactly one field.');
      expect(stage.operator).to.be.null;
      expect(stage.value).to.be.null;
    });

    it('throws error when generating pipeline from stages', function () {
      try {
        builder.getPipelineFromStages();
      } catch (e) {
        expect(e).to.be.instanceOf(SyntaxError);
        expect(e.message).to.equal('A pipeline stage specification object must contain exactly one field.');
      }
    });

    it('throws error when generating pipeline from source', function () {
      try {
        builder.getPipelineFromSource();
      } catch (e) {
        expect(e).to.be.instanceOf(SyntaxError);
        expect(e.message).to.equal('A pipeline stage specification object must contain exactly one field.');
      }
    });

    it('changes the source of pipeline', function () {
      const newPipeline = `[
  {
    $count: 'hello'
  },
  // {$limit: 20}
]`;
      builder.changeSource(newPipeline);

      const stages = builder.stages;
      expect(stages.length).to.equal(2);
      expect(stages[0].disabled).to.be.false;
      expect(stages[0].syntaxError).to.be.null;
      expect(stages[0].operator).to.equal('$count');
      expect(stages[0].value).to.equal(`"hello"`);

      expect(stages[1].disabled).to.be.true;
      expect(stages[1].syntaxError).to.be.null;
      expect(stages[1].operator).to.equal('$limit');
      expect(stages[1].value).to.equal(`20`);
    });

    it('resets the builder to default pipeline', function () {
      builder.changeSource(`[{$limit: 20}]`);
      expect(builder.source).to.not.be.null;
      builder.reset();
      expect(builder.source).to.equal(DEFAULT_PIPELINE);
    });
  });

  describe('Generates expected stages', function () {
    pipelines.forEach(({ text, stages: expectedStages, useCase }) => {
      it(useCase, function () {
        const builder = new PipelineBuilder(
          text,
          {} as { dataService: DataService }
        );
        const actualStages = builder.stages.map(({ disabled, syntaxError, operator, value }) => ({
          disabled,
          syntaxError: syntaxError?.message,
          operator,
          value,
        }));
        expect(expectedStages).to.deep.equal(actualStages);
      });
    });
  });

  describe('Generates same pipeline from stages and from source', function () {
    pipelines.forEach(({ text, useCase }) => {
      it(useCase, function () {
        const builder = new PipelineBuilder(
          text,
          {} as { dataService: DataService }
        );
        expect(builder.getPipelineFromSource()).to.deep.equal(
          builder.getPipelineFromStages()
        );
      });
    });
  });

  describe('Stage Operations', function () {

    let builder: PipelineBuilder;
    const pipeline = `[
  {$match: {name: 'hello'}},
  // {$limit: 20},
  {$sort: {name: -1}}
]`;

    beforeEach(function () {
      builder = new PipelineBuilder(pipeline,
        {} as { dataService: DataService }
      );
    });

    it('returns a stage by index', function () {
      expect(builder.stages.length).to.equal(3);

      let stage = builder.getStage(0);
      expect(stage?.disabled).to.be.false;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$match');

      stage = builder.getStage(1);
      expect(stage?.disabled).to.be.true;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$limit');

      stage = builder.getStage(2);
      expect(stage?.disabled).to.be.false;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$sort');
    });

    it('adds a new stage after a specified index', function () {
      builder.addStage(1);

      expect(builder.stages.length).to.equal(4);

      let stage = builder.getStage(2);
      expect(stage?.disabled).to.be.false;
      expect(stage?.operator).to.be.null;
      expect(stage?.value).to.be.null;
      expect(stage?.syntaxError?.message).to.be.equal('A pipeline stage specification object must contain exactly one field.');

      // Does not impact a stage before or after it
      stage = builder.getStage(1);
      expect(stage?.disabled).to.be.true;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$limit');

      stage = builder.getStage(3);
      expect(stage?.disabled).to.be.false;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$sort');
    });

    it('removes a stage', function () {
      builder.removeStage(0);

      expect(builder.stages.length).to.equal(2);

      let stage = builder.getStage(0);
      expect(stage?.disabled).to.be.true;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$limit');

      stage = builder.getStage(1);
      expect(stage?.disabled).to.be.false;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$sort');
    });

    it('moves a stage', function () {
      builder.moveStage(1, 2);

      expect(builder.stages.length).to.equal(3);

      let stage = builder.getStage(0);
      expect(stage?.disabled).to.be.false;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$match');

      stage = builder.getStage(1);
      expect(stage?.disabled).to.be.false;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$sort');

      stage = builder.getStage(2);
      expect(stage?.disabled).to.be.true;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$limit');
    });

    it('adds, moves and removes stage', function () {

      builder.addStage(0); // $match, null, $limit, $sort
      builder.moveStage(0, 1); // null, $match, $limit, $sort
      builder.removeStage(3); // null, $match, $limit

      expect(builder.stages.length).to.equal(3);

      let stage = builder.getStage(0);
      expect(stage?.disabled).to.be.false;
      expect(stage?.operator).to.be.null;
      expect(stage?.value).to.be.null;
      expect(stage?.syntaxError?.message).to.be.equal('A pipeline stage specification object must contain exactly one field.');

      stage = builder.getStage(1);
      expect(stage?.disabled).to.be.false;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$match');

      stage = builder.getStage(2);
      expect(stage?.disabled).to.be.true;
      expect(stage?.syntaxError).to.be.null;
      expect(stage?.operator).to.equal('$limit');
    });
  });

  describe('Gets preview results', function () {
    const pipeline = `[
      {$match: {name: 'hello'}},
      {$sort: {name: -1}}
    ]`;

    it('gets preview for a stage', async function () {
      const data = [{ _id: 1 }, { _id: 2 }];
      const { spies, dataService } = mockDataService({ data });
      const builder = new PipelineBuilder(pipeline,
        { dataService }
      );
      const response = await builder.getPreviewForStage(
        0,
        'airbnb.users',
        { maxTimeMS: 1000 },
      );

      // Starts sessions
      expect(spies.startSession?.args).to.deep.equal([['CRUD']]);
      // Runs aggregate
      expect(spies.aggregate?.args).to.deep.equal([[
        'airbnb.users',
        [
          { $match: { name: 'hello' } },
        ],
        {
          allowDiskUse: true,
          bsonRegExp: true,
          promoteValues: false,
          maxTimeMS: 1000,
          session: undefined,
        }
      ]]);
      // Gets results from cursor
      expect(spies.cursorToArray?.args).to.deep.equal([[]]);
      expect(spies.cursorClose?.args).to.deep.equal([]);

      expect(response).to.deep.equal(data);
    });

    it('gets preview for pipeline', async function () {
      const data = [{ _id: 1 }, { _id: 2 }, { _id: 3 }];
      const { spies, dataService } = mockDataService({ data });
      const builder = new PipelineBuilder(pipeline,
        { dataService }
      );
      const response = await builder.getPreviewForPipeline(
        'airbnb.users',
        { maxTimeMS: 1000 },
      );

      // Starts sessions
      expect(spies.startSession?.args).to.deep.equal([['CRUD']]);
      // Runs aggregate
      expect(spies.aggregate?.args).to.deep.equal([[
        'airbnb.users',
        [
          { $match: { name: 'hello' } },
          { $sort: { name: -1 } }
        ],
        {
          allowDiskUse: true,
          bsonRegExp: true,
          promoteValues: false,
          maxTimeMS: 1000,
          session: undefined,
        }
      ]]);
      // Gets results from cursor
      expect(spies.cursorToArray?.args).to.deep.equal([[]]);
      expect(spies.cursorClose?.args).to.deep.equal([]);

      expect(response).to.deep.equal(data);
    });
  });
});
