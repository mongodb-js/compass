import reducer, {
  ActionTypes,
  setIsNewPipelineConfirm,
} from './is-new-pipeline-confirm';
import { expect } from 'chai';

describe('is new pipeline confirm', function() {
  describe('#setIsNewPipelineConfirm', function() {
    it('returns the set confirm pipeline action', function() {
      expect(setIsNewPipelineConfirm(true)).to.deep.equal({
        type: ActionTypes.SetConfirmNewPipeline,
        confirm: true
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
