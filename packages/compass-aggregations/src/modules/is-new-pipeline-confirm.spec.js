import reducer, {
  setIsNewPipelineConfirm,
  SET_IS_NEW_PIPELINE_CONFIRM
} from './is-new-pipeline-confirm';
import { expect } from 'chai';

describe('is new pipeline confirm', function() {
  describe('#setIsNewPipelineConfirm', function() {
    it('returns the SET_IS_NEW_PIPELINE_CONFIRM action', function() {
      expect(setIsNewPipelineConfirm(true)).to.deep.equal({
        type: SET_IS_NEW_PIPELINE_CONFIRM,
        isNewPipelineConfirm: true
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not set is new pipeline confirm', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });
  });
});
