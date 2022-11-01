import { expect } from 'chai';
import sinon from 'sinon';
import { mockDataService } from '../../../test/mocks/data-service';
import {
  DEFAULT_PIPELINE,
  PipelineBuilder
} from './pipeline-builder';


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
    expect(pipelineBuilder.stages.length).to.equal(2);
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

    const mock = sinon.mock(pipelineBuilder.previewManager);
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

    const mock = sinon.mock(pipelineBuilder.previewManager);
    mock.expects('getPreviewForStage')
      .withArgs(1, 'airbnb.listings', [{$match: {}}, {$unwind: "users"}], {})
      .returns([{_id: 1}, {_id: 2}]);

    const data = await pipelineBuilder.getPreviewForPipeline('airbnb.listings', {});
    expect(data).to.deep.equal([{_id: 1}, {_id: 2}]);

    mock.verify();
    mock.restore();
  });

  it('should handle leading and trailing stages of the pipeline', function () {
    pipelineBuilder.reset(`// leading comment\n[{$match: {_id: 1}}]`);
    expect(pipelineBuilder.syntaxError).to.have.lengthOf(0);

    pipelineBuilder.reset(`[{$match: {_id: 1}}]\n// trailing comment`);
    expect(pipelineBuilder.syntaxError).to.have.lengthOf(0);
  });
});
