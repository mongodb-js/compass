import reducer, {
  RESTORE_PIPELINE_MODAL_TOGGLE,
  restorePipelineModalToggle,
  RESTORE_PIPELINE_OBJECT_ID,
  restorePipelineFrom
} from './restore-pipeline';
import { expect } from 'chai';

describe('restore previous pipeline', function() {
  describe('#restorePipelineModalToggle', function() {
    it('returns a restore pipeline toggle action type', function() {
      expect(restorePipelineModalToggle(1)).to.deep.equal({
        type: RESTORE_PIPELINE_MODAL_TOGGLE,
        index: 1
      });
    });
  });

  describe('#restorePipelineFrom', function() {
    it('returns a restore pipeline object id action type', function() {
      expect(restorePipelineFrom('00ff84b')).to.deep.equal({
        type: RESTORE_PIPELINE_OBJECT_ID,
        objectID: '00ff84b'
      });
    });
  });

  describe('#reducer', function() {
    context('action type is restore pipeline modal toggle', function() {
      it('isModalVisible is set to false', function() {
        expect(reducer(undefined, restorePipelineModalToggle(0))).to.deep.equal({
          isModalVisible: false,
          pipelineObjectID: ''
        });
      });

      it('isModalVisible is set to true', function() {
        expect(reducer(undefined, restorePipelineModalToggle(1))).to.deep.equal({
          isModalVisible: true,
          pipelineObjectID: ''
        });
      });
    });

    context('action type is restore pipeline object id', function() {
      it('pipelineObjectId is set', function() {
        expect(reducer(undefined, restorePipelineFrom('823nds8'))).to.deep.equal({
          isModalVisible: false,
          pipelineObjectID: '823nds8'
        });
      });
    });

    context('an empty action type returns an initial state', function() {
      it('pipelineObjectId is set', function() {
        expect(reducer(undefined, {})).to.deep.equal({
          isModalVisible: false,
          pipelineObjectID: ''
        });
      });
    });
  });
});
