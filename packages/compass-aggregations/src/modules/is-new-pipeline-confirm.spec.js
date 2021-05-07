import reducer, {
  setIsNewPipelineConfirm,
  SET_IS_NEW_PIPELINE_CONFIRM
} from 'modules/is-new-pipeline-confirm';

describe('is new pipeline confirm', () => {
  describe('#setIsNewPipelineConfirm', () => {
    it('returns the SET_IS_NEW_PIPELINE_CONFIRM action', () => {
      expect(setIsNewPipelineConfirm(true)).to.deep.equal({
        type: SET_IS_NEW_PIPELINE_CONFIRM,
        isNewPipelineConfirm: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not set is new pipeline confirm', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });
  });
});
