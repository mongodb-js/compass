import { expect } from 'chai';
import { applyMiddleware, createStore as createReduxStore } from 'redux';
import type { DataService } from 'mongodb-data-service';
import thunk from 'redux-thunk';
import { AtlasService } from '@mongodb-js/atlas-service/renderer';

import reducer from '..';
import { getPipelineStageOperatorsFromBuilderState } from './builder-helpers';
import { PipelineBuilder } from './pipeline-builder';
import {
  addStage,
  mapBuilderStageToStoreStage,
  mapStoreStagesToStageIdAndType,
} from './stage-editor';
import { changePipelineMode } from './pipeline-mode';
import { PipelineStorage } from '@mongodb-js/my-queries-storage';
import { defaultPreferencesInstance } from 'compass-preferences-model';

function createStore(pipelineSource = `[{$match: {_id: 1}}, {$limit: 10}]`) {
  const preferences = defaultPreferencesInstance;
  const pipelineBuilder = new PipelineBuilder(
    {} as DataService,
    preferences,
    pipelineSource
  );
  const stages = pipelineBuilder.stages.map(mapBuilderStageToStoreStage);
  return createReduxStore(
    reducer,
    {
      pipelineBuilder: {
        stageEditor: {
          stages,
          stagesIdAndType: mapStoreStagesToStageIdAndType(stages),
        },
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({
        atlasService: new AtlasService(),
        pipelineBuilder,
        pipelineStorage: new PipelineStorage(),
        instance: {} as any,
        workspaces: {} as any,
        preferences,
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
