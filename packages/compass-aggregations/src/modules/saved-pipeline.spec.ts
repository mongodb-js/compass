import reducer, {
  setShowSavedPipelines,
  savedPipelineAdd,
  SET_SHOW_SAVED_PIPELINES,
  SAVED_PIPELINE_ADD
} from './saved-pipeline';
import { expect } from 'chai';
import type { Pipeline } from './pipeline';

describe('saved pipelines module', function() {
  describe('#openSavedPipelines', function() {
    it('returns open action type', function() {
      expect(setShowSavedPipelines(false)).to.deep.equal({
        type: SET_SHOW_SAVED_PIPELINES,
        show: false
      });
    });
  });

  describe('#addSavedPipelines', function() {
    it('returns an add saved pipelines action type', function() {
      expect(savedPipelineAdd({
        test: 123
      } as any)).to.deep.equal({
        pipelines: {
          test: 123
        },
        type: SAVED_PIPELINE_ADD
      });
    });
  });

  describe('#reducer', function() {
    context('action type is close saved pipelines', function() {
      it('isListVisible is set to false', function() {
        expect(reducer(undefined, setShowSavedPipelines(false))).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: false
        });
      });
    });

    context('action type is open saved pipelines', function() {
      it('isListVisible is set to true', function() {
        expect(reducer(undefined, setShowSavedPipelines(true))).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: true
        });
      });
    });

    context('an empty action type returns an initial state', function() {
      it('isListVisible is set to true', function() {
        expect(reducer(undefined, {} as any)).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: false
        });
      });
    });

    context('action type is add saved pipelines', function() {
      it('returns new state with an additional pipeline item ', function() {
        const pipelines = [ { name: 'newPipeline' } ] as Pipeline[];
        expect(reducer(undefined, savedPipelineAdd(pipelines))).to.deep.equal({
          pipelines: pipelines,
          isLoaded: true,
          isListVisible: false
        });
      });
    });
  });
});
