import reducer, {
  ActionTypes,
  toggleNewPipelineModal,
} from './is-new-pipeline-confirm';
import { expect } from 'chai';

describe('is new pipeline confirm', function() {
  it('returns the set confirm pipeline action', function() {
    expect(toggleNewPipelineModal(true)).to.deep.equal({
      type: ActionTypes.ToggleConfirmNewPipeline,
      confirm: true
    });

    expect(toggleNewPipelineModal(false)).to.deep.equal({
      type: ActionTypes.ToggleConfirmNewPipeline,
      confirm: false
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
