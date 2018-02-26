import reducer, {
  RESTORE_PIPELINE_MODAL_TOGGLE,
  restorePipelineModalToggle,
  RESTORE_PIPELINE_OBJECT_ID,
  restorePipelineObjectID
} from 'modules/restore-pipeline';

describe('restore previous pipeline', () => {
  describe('#restorePipelineModalToggle', () => {
    it('returns a restore pipeline toggle action type', () => {
      expect(restorePipelineModalToggle(1)).to.deep.equal({
        type: RESTORE_PIPELINE_MODAL_TOGGLE,
        index: 1
      });
    });
  });

  describe('#restorePipelineObjectID', () => {
    it('returns a restore pipeline object id action type', () => {
      expect(restorePipelineObjectID('00ff84b')).to.deep.equal({
        type: RESTORE_PIPELINE_OBJECT_ID,
        objectID: '00ff84b'
      });
    });
  });

  describe('#reducer', () => {
    context('action type is restore pipeline modal toggle', () => {
      it('isModalVisible is set to false', () => {
        expect(reducer(undefined, restorePipelineModalToggle(0))).to.deep.equal({
          isModalVisible: false,
          pipelineObjectID: ''
        });
      });

      it('isModalVisible is set to true', () => {
        expect(reducer(undefined, restorePipelineModalToggle(1))).to.deep.equal({
          isModalVisible: true,
          pipelineObjectID: ''
        });
      });
    });

    context('action type is restore pipeline object id', () => {
      it('pipelineObjectId is set', () => {
        expect(reducer(undefined, restorePipelineObjectID('823nds8'))).to.deep.equal({
          isModalVisible: false,
          pipelineObjectID: '823nds8'
        });
      });
    });

    context('an empty action type returns an intial state', () => {
      it('pipelineObjectId is set', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          isModalVisible: false,
          pipelineObjectID: ''
        });
      });
    });
  });
});
