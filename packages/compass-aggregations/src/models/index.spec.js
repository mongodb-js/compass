import {
  restoreSavedPipeline,
  clearPipeline,
  RESTORE_PIPELINE,
  CLEAR_PIPELINE
} from 'modules';

describe('root [ module ]', () => {
  describe('#restoreSavedPipeline', () => {
    const state = { name: 'test' };

    it('returns the action', () => {
      expect(restoreSavedPipeline(state)).to.deep.equal({
        type: RESTORE_PIPELINE,
        restoreState: state
      });
    });
  });

  describe('#clearPipeline', () => {
    it('returns the action', () => {
      expect(clearPipeline()).to.deep.equal({
        type: CLEAR_PIPELINE
      });
    });
  });
});
