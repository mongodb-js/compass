import reducer, { openSavedPipelines, closeSavedPipelines, SAVED_PIPELINES_OPEN, SAVED_PIPELINES_CLOSE } from 'modules/saved-pipelines';

describe('saved pipelines module', () => {
  describe('#openSavedPipelines', () => {
    it('returns open action type', () => {
      expect(openSavedPipelines()).to.deep.equal({
        type: SAVED_PIPELINES_OPEN
      });
    });
  });

  describe('#closeeSavedPipelines', () => {
    it('returns close action type', () => {
      expect(closeSavedPipelines()).to.deep.equal({
        type: SAVED_PIPELINES_CLOSE
      });
    });
  });

  describe('#reducer', () => {
    context('action type is close saved pipelines', () => {
      it('isVisible is set to false', () => {
        expect(reducer(undefined, closeSavedPipelines())).to.deep.equal({
          pipelines: [],
          isVisible: false
        });
      });
    });

    context('action type is open saved pipelines', () => {
      it('isVisible is set to true', () => {
        expect(reducer(undefined, openSavedPipelines())).to.deep.equal({
          pipelines: [],
          isVisible: true
        });
      });
    });

    context('action type is neither open or close', () => {
      it('isVisible is set to true', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          pipelines: [],
          isVisible: false
        });
      });
    });
  });
});
