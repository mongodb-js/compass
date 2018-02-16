import reducer, {
  openSavedPipelines,
  closeSavedPipelines,
  saveStateModalOpen,
  saveStateModalClose,
  SAVED_PIPELINES_OPEN,
  SAVED_PIPELINES_CLOSE,
  SAVE_STATE_MODAL_OPEN,
  SAVE_STATE_MODAL_CLOSE
} from 'modules/saved-pipelines';

describe('saved pipelines module', () => {
  describe('#openSavedPipelines', () => {
    it('returns open action type', () => {
      expect(openSavedPipelines()).to.deep.equal({
        type: SAVED_PIPELINES_OPEN
      });
    });
  });

  describe('#closeSavedPipelines', () => {
    it('returns close action type', () => {
      expect(closeSavedPipelines()).to.deep.equal({
        type: SAVED_PIPELINES_CLOSE
      });
    });
  });

  describe('#saveStateModalOpen', () => {
    it('returns open modal action type', () => {
      expect(saveStateModalOpen()).to.deep.equal({
        type: SAVE_STATE_MODAL_OPEN
      });
    });
  });

  describe('#saveStateModalClose', () => {
    it('returns close modal action type', () => {
      expect(saveStateModalClose()).to.deep.equal({
        type: SAVE_STATE_MODAL_CLOSE
      });
    });
  });

  describe('#reducer', () => {
    context('action type is close saved pipelines', () => {
      it('isVisible is set to false', () => {
        expect(reducer(undefined, closeSavedPipelines())).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: false,
          saveError: false
        });
      });
    });

    context('action type is open saved pipelines', () => {
      it('isVisible is set to true', () => {
        expect(reducer(undefined, openSavedPipelines())).to.deep.equal({
          pipelines: [],
          isVisible: true,
          isModalVisible: false,
          saveError: false
        });
      });
    });

    context('action type is neither open or close saved pipeline list', () => {
      it('isVisible is set to true', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: false,
          saveError: false
        });
      });
    });

    context('action type is close save modal', () => {
      it('isModalVisible is set to false', () => {
        expect(reducer(undefined, saveStateModalClose())).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: false,
          saveError: false
        });
      });
    });

    context('action type is open save modal', () => {
      it('isModalVisible is set to false', () => {
        expect(reducer(undefined, saveStateModalOpen())).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: true,
          saveError: false
        });
      });
    });

    context('action type is neither open or close modal', () => {
      it('isModalVisible is set to false', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: false,
          saveError: false
        });
      });
    });
  });
});
