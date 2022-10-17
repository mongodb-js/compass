import reducer, {
  newPipelineFromText,
  closeImport,
  changeText,
  createNew,
  NEW_PIPELINE_FROM_TEXT,
  CLOSE_IMPORT,
  CHANGE_TEXT,
  CREATE_NEW,
  CONFIRM_NEW,
  confirmNew,
} from './import-pipeline';
import { expect } from 'chai';
import sinon from 'sinon';
import { PipelineBuilder } from './pipeline-builder/pipeline-builder';
import { mockDataService } from '../../test/mocks/data-service';

describe('import pipeline module', function() {
  describe('#newPipelineFromText', function() {
    it('returns the action', function() {
      expect(newPipelineFromText()).to.deep.equal({
        type: NEW_PIPELINE_FROM_TEXT
      });
    });
  });

  describe('#closeImport', function() {
    it('returns the action', function() {
      expect(closeImport()).to.deep.equal({
        type: CLOSE_IMPORT
      });
    });
  });

  describe('#createNew', function() {
    it('returns the action', function() {
      expect(createNew()).to.deep.equal({
        type: CREATE_NEW
      });
    });
  });

  describe('#changeText', function() {
    it('returns the action', function() {
      expect(changeText('testing')).to.deep.equal({
        type: CHANGE_TEXT,
        text: 'testing'
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is new pipeline from text', function() {
      it('sets isOpen to true', function() {
        expect(reducer(undefined, newPipelineFromText())).to.deep.equal({
          isOpen: true,
          text: '',
          isConfirmationNeeded: false,
          syntaxError: null
        });
      });
    });

    context('when the action is close import', function() {
      it('sets isOpen to false', function() {
        expect(reducer({ isOpen: true }, closeImport())).to.deep.equal({
          isOpen: false,
          isConfirmationNeeded: false,
          syntaxError: null
        });
      });
    });

    context('when the action is change text', function() {
      it('sets the text', function() {
        expect(reducer(undefined, changeText('testing'))).to.deep.equal({
          isOpen: false,
          text: 'testing',
          isConfirmationNeeded: false,
          syntaxError: null
        });
      });
    });

    context('when the action is create new', function() {
      it('sets the confirmation needed', function() {
        expect(reducer({ isOpen: true, text: '' }, createNew())).to.deep.equal({
          isOpen: false,
          text: '',
          isConfirmationNeeded: true
        });
      });
    });
  });

  describe('#confirmNew', function() {
    const pipelineBuilder = new PipelineBuilder(mockDataService);
    let dispatchSpy;
    const sandbox = sinon.createSandbox();

    beforeEach(function () {
      pipelineBuilder.reset();
      dispatchSpy = sinon.spy();
      sandbox.spy(pipelineBuilder);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('confirms new pipeline on valid pipeline', function() {
      const text = `[{$match: {name: /berlin/i}}, {$limit: 20}]`;
      const getState = () => ({
        importPipeline: {
          text
        },
      });
      confirmNew()(dispatchSpy, getState, { pipelineBuilder });

      expect(
        pipelineBuilder.reset.getCalls()[0].args,
        'changes pipeline value in pipeline builder'
      ).to.deep.equal([text]);

      const dispatchArgs = dispatchSpy.getCalls()[0].args[0];

      expect(dispatchArgs.type).to.equal(CONFIRM_NEW);
      expect(dispatchArgs.error).to.equal(undefined);
      expect(dispatchArgs.stages).to.eq(pipelineBuilder.stages)
      expect(dispatchArgs.source).to.eq(pipelineBuilder.source)
    });

    it('errors on invalid pipeline', function() {
      const text = `[{$match: {name: /berlin}}`;
      const getState = () => ({
        importPipeline: {
          text
        },
      });
      confirmNew()(dispatchSpy, getState, { pipelineBuilder });
      expect(
        pipelineBuilder.reset.getCalls()[0].args,
        'changes pipeline value in pipeline builder'
      ).to.deep.equal([text]);
      const dispatchArgs = dispatchSpy.getCalls()[0].args[0];
      expect(dispatchArgs.type).to.equal(CONFIRM_NEW);
      expect(dispatchArgs.stages).to.deep.equal([]);
      expect(dispatchArgs.error).to.not.be.empty;
    });
  });
});
