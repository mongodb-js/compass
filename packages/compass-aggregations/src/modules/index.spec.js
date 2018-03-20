import {
  reset,
  clearPipeline,
  restoreSavedPipeline,
  newPipeline,
  RESET,
  CLEAR_PIPELINE,
  RESTORE_PIPELINE,
  NEW_PIPELINE
} from 'modules';

describe('root [ module ]', () => {
  describe('#reset', () => {
    it('returns the action', () => {
      expect(reset()).to.deep.equal({
        type: RESET
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

  describe('#restoreSavedPipeline', () => {
    it('returns the action', () => {
      expect(restoreSavedPipeline({ name: 'test' })).to.deep.equal({
        type: RESTORE_PIPELINE,
        restoreState: { name: 'test' }
      });
    });
  });

  describe('#newPipeline', () => {
    it('returns the NEW_PIPELINE action', () => {
      expect(newPipeline()).to.deep.equal({
        type: NEW_PIPELINE
      });
    });
  });
});
