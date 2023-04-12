import { expect } from 'chai';
import { applyMiddleware, createStore as createReduxStore } from 'redux';
import type { DataService } from 'mongodb-data-service';
import thunk from 'redux-thunk';

import reducer from '..';
import { getPipelineStageOperatorsFromBuilderState } from './builder-helpers';
import { PipelineBuilder } from './pipeline-builder';
import { addStage, mapBuilderStageToStoreStage } from './stage-editor';
import { changePipelineMode } from './pipeline-mode';
import { PipelineStorage } from '../../utils/pipeline-storage';

function createStore(pipelineSource = `[{$match: {_id: 1}}, {$limit: 10}]`) {
  const pipelineBuilder = new PipelineBuilder(
    {} as DataService,
    pipelineSource
  );
  const stages = pipelineBuilder.stages.map(mapBuilderStageToStoreStage);
  return createReduxStore(
    reducer,
    {
      pipelineBuilder: {
        stageEditor: {
          stagesIdAndType: stages.map(({ id, type }) => ({ id, type })),
          stages,
        },
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({
        pipelineBuilder,
        pipelineStorage: new PipelineStorage(),
      })
    )
  );
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
