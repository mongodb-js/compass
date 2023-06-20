import reducer, {
  savedPipelineAdd,
  SAVED_PIPELINE_ADD,
} from './saved-pipeline';
import { expect } from 'chai';
import type { StoredPipeline } from '../utils/pipeline-storage';

describe('saved pipelines module', function () {
  describe('#addSavedPipelines', function () {
    it('returns an add saved pipelines action type', function () {
      expect(
        savedPipelineAdd({
          test: 123,
        } as any)
      ).to.deep.equal({
        pipelines: {
          test: 123,
        },
        type: SAVED_PIPELINE_ADD,
      });
    });
  });

  describe('#reducer', function () {
    context('action type is add saved pipelines', function () {
      it('returns new state with an additional pipeline item ', function () {
        const pipelines = [
          { id: 'pipeline', name: 'newPipeline', namespace: 'test' },
        ] as StoredPipeline[];
        expect(reducer(undefined, savedPipelineAdd(pipelines))).to.deep.equal({
          pipelines: pipelines,
          isLoaded: true,
        });
      });
    });
  });
});
