import reducer, {
  savedPipelinesListToggle,
  savedPipelineAdd,
  SAVED_PIPELINES_LIST_TOGGLED,
  SAVED_PIPELINE_ADD
} from '../../src/modules/saved-pipeline';
import { expect } from 'chai';

describe('saved pipelines module', function() {
  describe('#openSavedPipelines', function() {
    it('returns open action type', function() {
      expect(savedPipelinesListToggle(0)).to.deep.equal({
        type: SAVED_PIPELINES_LIST_TOGGLED,
        index: 0
      });
    });
  });

  describe('#addSavedPipelines', function() {
    it('returns an add saved pipelines action type', function() {
      expect(savedPipelineAdd({})).to.deep.equal({
        pipelines: {},
        type: SAVED_PIPELINE_ADD
      });
    });
  });

  describe('#reducer', function() {
    context('action type is close saved pipelines', function() {
      it('isListVisible is set to false', function() {
        expect(reducer(undefined, savedPipelinesListToggle(0))).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: false
        });
      });
    });

    context('action type is open saved pipelines', function() {
      it('isListVisible is set to true', function() {
        expect(reducer(undefined, savedPipelinesListToggle(1))).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: true
        });
      });
    });

    context('an empty action type returns an initial state', function() {
      it('isListVisible is set to true', function() {
        expect(reducer(undefined, {})).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: false
        });
      });
    });

    context('action type is add saved pipelines', function() {
      it('returns new state with an additional pipeline item ', function() {
        const pipelines = [ { name: 'newPipeline' } ];
        expect(reducer(undefined, savedPipelineAdd(pipelines))).to.deep.equal({
          pipelines: pipelines,
          isLoaded: true,
          isListVisible: false
        });
      });
    });
  });
});
