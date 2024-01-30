import { expect } from 'chai';
import { getPipelineStageOperatorsFromBuilderState } from './builder-helpers';
import { addStage } from './stage-editor';
import { changePipelineMode } from './pipeline-mode';
import configureStore from '../../../test/configure-store';

function createStore(pipelineText = `[{$match: {_id: 1}}, {$limit: 10}]`) {
  return configureStore({ pipelineText });
}

describe('builder-helpers', function () {
  describe('getPipelineStageOperatorsFromBuilderState', function () {
    let store: ReturnType<typeof createStore>;
    beforeEach(function () {
      store = createStore();
    });
    describe('in stage editor mode', function () {
      it('should return filtered stage names', function () {
        store.dispatch(addStage());
        expect(
          getPipelineStageOperatorsFromBuilderState(store.getState())
        ).to.deep.equal(['$match', '$limit']);
      });

      it('should return unfiltered stage names', function () {
        store.dispatch(addStage());
        expect(
          getPipelineStageOperatorsFromBuilderState(store.getState(), false)
        ).to.deep.equal(['$match', '$limit', null]);
      });
    });
    describe('in text editor mode', function () {
      it('should return filtered stage names', function () {
        store.dispatch(changePipelineMode('as-text'));
        store.dispatch(addStage());
        expect(
          getPipelineStageOperatorsFromBuilderState(store.getState())
        ).to.deep.equal(['$match', '$limit']);
      });
      it('should return unfiltered stage names', function () {
        store.dispatch(addStage());
        expect(
          getPipelineStageOperatorsFromBuilderState(store.getState(), false)
        ).to.deep.equal(['$match', '$limit', null]);
      });
    });
  });
});
