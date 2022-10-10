import reducer, {
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  savingPipelineOpen,
  SAVING_PIPELINE_NAME_CHANGED,
  SAVING_PIPELINE_APPLY,
  SAVING_PIPELINE_CANCEL,
  SAVING_PIPELINE_OPEN,
  INITIAL_STATE,
  makeViewPipeline
} from './saving-pipeline';
import { expect } from 'chai';
import Sinon from 'sinon';

describe('saving-pipeline module', function() {
  describe('#savingPipelineNameChanged', function() {
    it('returns the SAVING_PIPELINE_NAME_CHANGED action', function() {
      expect(savingPipelineNameChanged('testing')).to.deep.equal({
        type: SAVING_PIPELINE_NAME_CHANGED,
        name: 'testing'
      });
    });
    describe('#reducer', function() {
      describe('when the action is not name changed', function() {
        it('returns the default state', function() {
          expect(reducer(undefined, {
            type: 'test'
          })).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineApply', function() {
    it('returns the SAVING_PIPELINE_APPLY action', function() {
      const dispatchSpy = Sinon.spy()
      savingPipelineApply()(dispatchSpy, () => ({
        savingPipeline: { name: 'test' }
      }));
      expect(dispatchSpy).to.be.calledOnceWith({
        type: SAVING_PIPELINE_APPLY,
        name: 'test'
      });
    });
    describe('#reducer', function() {
      describe('when the action is not apply', function() {
        it('returns the default state', function() {
          expect(reducer(undefined, {
            type: 'test'
          })).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineCancel', function() {
    it('returns the SAVING_PIPELINE_CANCEL action', function() {
      expect(savingPipelineCancel()).to.deep.equal({
        type: SAVING_PIPELINE_CANCEL
      });
    });
    describe('#reducer', function() {
      describe('when the action is not apply', function() {
        it('returns the default state', function() {
          expect(reducer(undefined, {
            type: 'test'
          })).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineOpen', function() {
    it('returns the SAVING_PIPELINE_OPEN action', function() {
      expect(savingPipelineOpen()).to.deep.equal({
        type: SAVING_PIPELINE_OPEN,
        isSaveAs: false,
        name: ''
      });
    });
    describe('#reducer', function() {
      describe('when the action is not apply', function() {
        it('returns the default state', function() {
          expect(reducer(undefined, {
            type: 'test'
          })).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#makeViewPipeline', function() {
    it('filters out empty stages', function() {
      const pipeline = [
        // executor preferred
        { executor: { a: 1 } },

        // falling back to generateStage()
        { isEnabled: false}, // !isEnabled
        {}, // no stageOperator
        { stage: '' } // stage === ''
        // leaving out non-blank generated ones for generateStage()'s own unit tests
      ];

      expect(makeViewPipeline(pipeline)).to.deep.equal([{ a: 1 }]);
    });
  });
});
