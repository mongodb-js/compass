import reducer, {
  openSavedPipelines,
  closeSavedPipelines,
  saveStateModalOpen,
  saveStateModalClose,
  saveErrorOpen,
  saveErrorClose,
  addSavedPipelines,
  SAVED_PIPELINES_OPEN,
  SAVED_PIPELINES_CLOSE,
  SAVE_STATE_MODAL_OPEN,
  SAVE_STATE_MODAL_CLOSE,
  ADD_SAVED_PIPELINES,
  SAVE_ERROR_OPEN,
  SAVE_ERROR_CLOSE
} from '../../src/modules/saved-pipelines';

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

  describe('#saveErrorOpen', () => {
    it('returns an open error action type', () => {
      expect(saveErrorOpen()).to.deep.equal({
        type: SAVE_ERROR_OPEN
      });
    });
  });

  describe('#saveErrorClose', () => {
    it('returns a close error action type', () => {
      expect(saveErrorClose()).to.deep.equal({
        type: SAVE_ERROR_CLOSE
      });
    });
  });

  describe('#addSavedPipelines', () => {
    it('returns an add saved pipelines action type', () => {
      expect(addSavedPipelines({})).to.deep.equal({
        pipelines: {},
        type: ADD_SAVED_PIPELINES
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
          modalError: false
        });
      });
    });

    context('action type is open saved pipelines', () => {
      it('isVisible is set to true', () => {
        expect(reducer(undefined, openSavedPipelines())).to.deep.equal({
          pipelines: [],
          isVisible: true,
          isModalVisible: false,
          modalError: false
        });
      });
    });

    context('an empty action type returns an initial state', () => {
      it('isVisible is set to true', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: false,
          modalError: false
        });
      });
    });

    context('action type is close save modal', () => {
      it('isModalVisible is set to false', () => {
        expect(reducer(undefined, saveStateModalClose())).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: false,
          modalError: false
        });
      });
    });

    context('action type is open save modal', () => {
      it('isModalVisible is set to false', () => {
        expect(reducer(undefined, saveStateModalOpen())).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: true,
          modalError: false
        });
      });
    });

    context('action type is save error open', () => {
      it('saveError is set to true', () => {
        expect(reducer(undefined, saveErrorOpen())).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: false,
          modalError: true
        });
      });
    });

    context('action type is save error close', () => {
      it('saveError is set to false', () => {
        expect(reducer(undefined, saveErrorClose())).to.deep.equal({
          pipelines: [],
          isVisible: false,
          isModalVisible: false,
          modalError: false
        });
      });
    });

    context('action type is add saved pipelines', () => {
      it('returns new state with an additional pipeline item ', () => {
        const pipelines = [ { name: 'newPipeline' } ];
        expect(reducer(undefined, addSavedPipelines(pipelines))).to.deep.equal({
          pipelines: pipelines,
          isVisible: false,
          isModalVisible: false,
          modalError: false
        });
      });
    });
  });
});
