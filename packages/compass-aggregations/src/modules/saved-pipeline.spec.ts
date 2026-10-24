import reducer, {
  savedPipelineAdd,
  saveCurrentPipeline,
  SAVED_PIPELINE_ADD,
} from './saved-pipeline';
import { expect } from 'chai';
import Sinon from 'sinon';
import type { SavedPipeline } from '@mongodb-js/my-queries-storage';
import configureStore from '../../test/configure-store';

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

  describe('#saveCurrentPipeline', function () {
    it('tracks the save when the pipeline has syntax errors', async function () {
      const result = await configureStore({
        pipelineText: `[{$match: {_id: ObjectId('invalid')}}]`,
      });
      result.track.resetHistory();

      await result.plugin.store.dispatch(saveCurrentPipeline());

      expect(result.track).to.have.been.calledWithMatch(
        'Aggregation Saved',
        Sinon.match({ id: Sinon.match.string, num_stages: undefined })
      );
    });
  });

  describe('#reducer', function () {
    context('action type is add saved pipelines', function () {
      it('returns new state with an additional pipeline item ', function () {
        const pipelines = [
          { id: 'pipeline', name: 'newPipeline', namespace: 'test' },
        ] as SavedPipeline[];
        expect(reducer(undefined, savedPipelineAdd(pipelines))).to.deep.equal({
          pipelines: pipelines,
          isLoaded: true,
        });
      });
    });
  });
});
