import reducer, {
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  savingPipelineOpen,
  SAVING_PIPELINE_NAME_CHANGED,
  SAVING_PIPELINE_APPLY,
  SAVING_PIPELINE_CANCEL,
  SAVING_PIPELINE_OPEN,
  INITIAL_STATE
} from './saving-pipeline';
import { expect } from 'chai';

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
      expect(savingPipelineApply()).to.deep.equal({
        type: SAVING_PIPELINE_APPLY
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
});
