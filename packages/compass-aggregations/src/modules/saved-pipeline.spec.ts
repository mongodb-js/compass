import reducer, {
  savedPipelineAdd,
  SAVED_PIPELINE_ADD
} from './saved-pipeline';
import { expect } from 'chai';
import type { StoredPipeline } from '../utils/pipeline-storage';

describe('saved pipelines module', function() {
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
        const pipelines = [ { id: 'pipeline', name: 'newPipeline', namespace: 'test' } ] as StoredPipeline[]
        expect(reducer(undefined, savedPipelineAdd(pipelines))).to.deep.equal({
          pipelines: pipelines,
          isLoaded: true,
          isListVisible: false
        });
      });
    });
  });
});
