import reducer, {
  savedPipelinesListToggle,
  savePipelineModalToggle,
  saveModalErrorToggle,
  savedPipelinesAdd,
  SAVED_PIPELINES_LIST_TOGGLED,
  SAVE_PIPELINE_MODAL_TOGGLED,
  SAVE_MODAL_ERROR_TOGGLED,
  SAVED_PIPELINES_ADD
} from '../../src/modules/saved-pipelines';

describe('saved pipelines module', () => {
  describe('#openSavedPipelines', () => {
    it('returns open action type', () => {
      expect(savedPipelinesListToggle(0)).to.deep.equal({
        type: SAVED_PIPELINES_LIST_TOGGLED,
        index: 0
      });
    });
  });

  describe('#saveStateModalOpen', () => {
    it('returns open modal action type', () => {
      expect(savePipelineModalToggle(1)).to.deep.equal({
        type: SAVE_PIPELINE_MODAL_TOGGLED,
        index: 1
      });
    });
  });

  describe('#saveErrorOpen', () => {
    it('returns an open error action type', () => {
      expect(saveModalErrorToggle(1, {})).to.deep.equal({
        type: SAVE_MODAL_ERROR_TOGGLED,
        index: 1,
        error: {}
      });
    });
  });

  describe('#addSavedPipelines', () => {
    it('returns an add saved pipelines action type', () => {
      expect(savedPipelinesAdd({})).to.deep.equal({
        pipelines: {},
        type: SAVED_PIPELINES_ADD
      });
    });
  });

  describe('#reducer', () => {
    context('action type is close saved pipelines', () => {
      it('isListVisible is set to false', () => {
        expect(reducer(undefined, savedPipelinesListToggle(0))).to.deep.equal({
          pipelines: [],
          isListVisible: false,
          isModalVisible: false,
          isModalError: false
        });
      });
    });

    context('action type is open saved pipelines', () => {
      it('isListVisible is set to true', () => {
        expect(reducer(undefined, savedPipelinesListToggle(1))).to.deep.equal({
          pipelines: [],
          isListVisible: true,
          isModalVisible: false,
          isModalError: false
        });
      });
    });

    context('an empty action type returns an initial state', () => {
      it('isListVisible is set to true', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          pipelines: [],
          isListVisible: false,
          isModalVisible: false,
          isModalError: false
        });
      });
    });

    context('action type is close save modal', () => {
      it('isModalVisible is set to false', () => {
        expect(reducer(undefined, savePipelineModalToggle(0))).to.deep.equal({
          pipelines: [],
          isListVisible: false,
          isModalVisible: false,
          isModalError: false
        });
      });
    });

    context('action type is open save modal', () => {
      it('isModalVisible is set to false', () => {
        expect(reducer(undefined, savePipelineModalToggle(1))).to.deep.equal({
          pipelines: [],
          isListVisible: false,
          isModalVisible: true,
          isModalError: false
        });
      });
    });

    context('action type is save error open', () => {
      it('saveError is set to true', () => {
        expect(reducer(undefined, saveModalErrorToggle(1))).to.deep.equal({
          pipelines: [],
          isListVisible: false,
          isModalVisible: false,
          isModalError: true
        });
      });
    });

    context('action type is save error close', () => {
      it('saveError is set to false', () => {
        expect(reducer(undefined, saveModalErrorToggle(0))).to.deep.equal({
          pipelines: [],
          isListVisible: false,
          isModalVisible: false,
          isModalError: false
        });
      });
    });

    context('action type is add saved pipelines', () => {
      it('returns new state with an additional pipeline item ', () => {
        const pipelines = [ { name: 'newPipeline' } ];
        expect(reducer(undefined, savedPipelinesAdd(pipelines))).to.deep.equal({
          pipelines: pipelines,
          isListVisible: false,
          isModalVisible: false,
          isModalError: false
        });
      });
    });
  });
});
