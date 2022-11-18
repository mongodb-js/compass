import { expect } from 'chai';
import sinon from 'sinon';
import { mockDataService } from '../../../test/mocks/data-service';
import {
  DEFAULT_PIPELINE,
  PipelineBuilder
} from './pipeline-builder';
import Stage from './stage';

describe('PipelineBuilder', function () {
  const pipelineBuilder = new PipelineBuilder(mockDataService());
  const sandbox = sinon.createSandbox();
  beforeEach(function () {
    pipelineBuilder.reset();
    sandbox.spy(pipelineBuilder);
  });
  afterEach(function () {
    sandbox.restore();
  });

  it('resets builder', function() {
    const source = `[{$match: {name: /berlin/i}}]`;

    pipelineBuilder.reset(source);
    expect(pipelineBuilder.source, 'resets to new value').to.deep.equal(source);
    
    pipelineBuilder.reset();
    expect(pipelineBuilder.source, 'resets to default value').to.deep.equal(DEFAULT_PIPELINE);
  });

  it('changes source', function() {
    const source = `[{$match: {name: /berlin/i}}]`;
    pipelineBuilder.changeSource(source);

    expect(pipelineBuilder.syntaxError.length).to.equal(0);
    expect(pipelineBuilder.source).to.equal(source);
  });

  it('converts source to stages', function() {
    const source = `[{$match: {name: /berlin/i}}]`;
    pipelineBuilder.changeSource(source);
    pipelineBuilder.sourceToStages();

    expect(pipelineBuilder.syntaxError.length).to.equal(0);
    expect(pipelineBuilder.source).to.equal(source);

    expect(pipelineBuilder.stages.length).to.equal(1);
    const stage = pipelineBuilder.stages[0];
    expect(stage.operator).to.equal('$match');
    expect(stage.value).to.equal('{\n  name: /berlin/i,\n}');
    expect(stage.disabled).to.equal(false);
    expect(stage.syntaxError).to.be.null;
  });

  it('adds stage', function() {
    pipelineBuilder.addStage();
    expect(pipelineBuilder.stages.length).to.equal(1);
  });

  it('adds stage after index', function() {
    const pipeline = `[{$match: {}}, {$unwind: "users"}]`;
    pipelineBuilder.reset(pipeline);
    pipelineBuilder.addStage(0);
    expect(pipelineBuilder.stages.length).to.equal(3);

    expect(pipelineBuilder.stages[0].operator).to.equal('$match');
    expect(pipelineBuilder.stages[1].operator).to.equal(null);
    expect(pipelineBuilder.stages[2].operator).to.equal('$unwind');
  });

  it('removes stage', function() {
    const pipeline = `[{$match: {}}, {$unwind: "users"}]`;
    pipelineBuilder.reset(pipeline);
    pipelineBuilder.removeStage(0);
    expect(pipelineBuilder.stages.length).to.equal(1);
    expect(pipelineBuilder.stages[0].operator).to.equal('$unwind');
  });

  it('moves stage', function() {
    const pipeline = `[{$match: {}}, {$unwind: "users"}]`;
    pipelineBuilder.reset(pipeline);
    pipelineBuilder.moveStage(1, 0);
    expect(pipelineBuilder.stages.length).to.equal(2);
    expect(pipelineBuilder.stages[0].operator).to.equal('$unwind');
    expect(pipelineBuilder.stages[1].operator).to.equal('$match');
  });

  it('gets preview for stage', async function() {
    const pipeline = `[{$match: {}}, {$unwind: "users"}]`;
    pipelineBuilder.reset(pipeline);

    const mock = sandbox.mock(pipelineBuilder.previewManager);
    mock.expects('getPreviewForStage')
      .withArgs(1, 'airbnb.listings', [{$match: {}}, {$unwind: "users"}], {}, true)
      .returns([{_id: 1}]);

    const data = await pipelineBuilder.getPreviewForStage(1, 'airbnb.listings', {}, true);
    expect(data).to.deep.equal([{_id: 1}]);

    mock.verify();
    mock.restore();
  });

  it('gets preview for pipeline', async function() {
    const pipeline = `[{$match: {}}, {$unwind: "users"}]`;
    pipelineBuilder.reset(pipeline);

    const mock = sandbox.mock(pipelineBuilder.previewManager);
    mock.expects('getPreviewForStage')
      .withArgs(Infinity, 'airbnb.listings', [{$match: {}}, {$unwind: "users"}], {})
      .returns([{_id: 1}, {_id: 2}]);

    const data = await pipelineBuilder.getPreviewForPipeline('airbnb.listings', {});
    expect(data).to.deep.equal([{_id: 1}, {_id: 2}]);

    mock.verify();
    mock.restore();
  });

  it('gets preview for pipeline with output stage when filtering it out', async function() {
    const pipeline = `[{$match: {}}, {$unwind: "users"}, {$out: "test"}]`;
    pipelineBuilder.reset(pipeline);

    const mock = sandbox.mock(pipelineBuilder.previewManager);
    mock.expects('getPreviewForStage')
      .withArgs(Infinity, 'airbnb.listings', [{$match: {}}, {$unwind: "users"}], {})
      .returns([{_id: 1}, {_id: 2}]);

    const data = await pipelineBuilder.getPreviewForPipeline('airbnb.listings', {}, true);
    expect(data).to.deep.equal([{_id: 1}, {_id: 2}]);

    mock.verify();
    mock.restore();
  });

  it('throws when previewing a pipeline with output stage and not fitlering it out', function() {
    const pipeline = `[{$match: {}}, {$unwind: "users"}, {$out: "test"}]`;
    pipelineBuilder.reset(pipeline);

    expect(async () => {
      await pipelineBuilder.getPreviewForPipeline('airbnb.listings', {})
    }).to.throw;
  });

  it('should handle leading and trailing stages of the pipeline', function () {
    pipelineBuilder.reset(`// leading comment\n[{$match: {_id: 1}}]`);
    expect(pipelineBuilder.syntaxError).to.have.lengthOf(0);

    pipelineBuilder.reset(`[{$match: {_id: 1}}]\n// trailing comment`);
    expect(pipelineBuilder.syntaxError).to.have.lengthOf(0);
  });

  describe('stagesToSource', function() {
    it('converts stages to source', function() {
      const stages = [
        new Stage(),
        new Stage(),
        new Stage(),
      ]
      
      stages[0].changeOperator('$match');
      stages[0].changeValue('{ _id: 1 }');

      stages[1].changeOperator('$limit');
      stages[1].changeValue('10');

      stages[2].changeOperator('$out');
      stages[2].changeValue('"test-out"');

      pipelineBuilder.stages = stages;

      pipelineBuilder.stagesToSource();

      expect(pipelineBuilder.source).to.eq(`[
  {
    $match: {
      _id: 1,
    },
  },
  {
    $limit: 10,
  },
  {
    $out: "test-out",
  },
]`);
    });

    it('throws if enabled stages has syntax errors', function () {
      const stages = [new Stage()];

      stages[0].changeOperator('$match');
      stages[0].changeValue('{ _id: 1');

      pipelineBuilder.stages = stages;

      expect(() => pipelineBuilder.stagesToSource()).to.throw();
    });

    it('converts stages to source if stages with syntax errors are disabled', function() {
      const stages = [new Stage()];

      stages[0].changeOperator('$match');
      stages[0].changeValue('{ _id: 1');
      stages[0].changeDisabled(true);

      pipelineBuilder.stages = stages;

      pipelineBuilder.stagesToSource();

      expect(pipelineBuilder.source).to.eq(`[
  // {
  //   $match: { _id: 1
  // }
]`);
    })
  })
});
