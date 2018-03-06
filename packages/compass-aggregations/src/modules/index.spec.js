import {
  reset,
  clearPipeline,
  restoreSavedPipeline,
  RESET,
  CLEAR_PIPELINE,
  RESTORE_PIPELINE
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
});
