import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';
import { applyMiddleware, createStore as createReduxStore } from 'redux';
import thunk from 'redux-thunk';
import { PipelineBuilder } from './pipeline-builder';
import {
  changeStageOperator,
  changeStageValue,
  changeStageCollapsed,
  changeStageDisabled,
  addStage,
  moveStage,
  removeStage,
  mapBuilderStageToStoreStage
} from './stage-editor';
import reducer from '../';
import { PipelineStorage } from '../../utils/pipeline-storage';

function createStore(
  pipelineSource = `[{$match: {_id: 1}}, {$limit: 10}, {$out: 'match-and-limit'}]`
) {
  const pipelineBuilder = new PipelineBuilder(
    {} as DataService,
    pipelineSource
  );
  const store = createReduxStore(
    reducer,
    {
      pipelineBuilder: {
        stageEditor: {
          stagesCount: pipelineBuilder.stages.length,
          stages: pipelineBuilder.stages.map(mapBuilderStageToStoreStage)
        }
      }
    },
    applyMiddleware(
      thunk.withExtraArgument({
        pipelineBuilder,
        pipelineStorage: new PipelineStorage()
      })
    )
  );
  return {
    dispatch: store.dispatch,
    getState() {
      return store.getState().pipelineBuilder.stageEditor;
    }
  };
}

describe('stageEditor', function () {
  let store: ReturnType<typeof createStore>;

  beforeEach(function () {
    store = createStore();
  });

  describe('changeStageOperator', function () {
    it('should update stage operator', function () {
      expect(store.getState().stages[0]).to.have.property(
        'stageOperator',
        '$match'
      );

      store.dispatch(changeStageOperator(0, '$limit'));

      expect(store.getState().stages[0]).to.have.property(
        'stageOperator',
        '$limit'
      );
    });
  });

  describe('changeStageValue', function () {
    it('should update stage value', function () {
      expect(store.getState().stages[0]).to.have.property(
        'value',
        '{\n  _id: 1,\n}'
      );

      store.dispatch(changeStageValue(0, '{_id: 2}'));

      expect(store.getState().stages[0]).to.have.property('value', '{_id: 2}');
    });
  });

  describe('changeStageCollapsed', function () {
    it('should update stage collapsed state', function () {
      expect(store.getState().stages[0]).to.have.property('collapsed', false);

      store.dispatch(changeStageCollapsed(0, true));

      expect(store.getState().stages[0]).to.have.property('collapsed', true);
    });
  });

  describe('changeStageDisabled', function () {
    it('should update stage disabled state', function () {
      expect(store.getState().stages[0]).to.have.property('disabled', false);

      store.dispatch(changeStageDisabled(0, true));

      expect(store.getState().stages[0]).to.have.property('disabled', true);
    });
  });

  describe('addStage', function () {
    it('should add stage at the end of the pipeline when no argument provided', function () {
      expect(store.getState().stages).to.have.lengthOf(3);

      store.dispatch(addStage());

      expect(store.getState().stages).to.have.lengthOf(4);
    });

    it('should add stage after index when index is provided', function () {
      expect(store.getState().stages).to.have.lengthOf(3);

      store.dispatch(addStage(0));

      expect(store.getState().stages).to.have.lengthOf(4);
      expect(store.getState().stages[1]).to.have.property(
        'stageOperator',
        null
      );
      expect(store.getState().stages[1]).to.have.property('value', null);
    });
  });

  describe('moveStage', function () {
    it('should move stage from one id to another', function () {
      expect(store.getState().stages[0]).to.have.property(
        'stageOperator',
        '$match'
      );

      store.dispatch(moveStage(0, 2));

      expect(store.getState().stages[2]).to.have.property(
        'stageOperator',
        '$match'
      );
    });
  });

  describe('removeStage', function () {
    it('should remove stage at index', function () {
      expect(store.getState().stages).to.have.lengthOf(3);
      expect(store.getState().stages[0]).to.have.property(
        'stageOperator',
        '$match'
      );

      store.dispatch(removeStage(0));

      expect(store.getState().stages).to.have.lengthOf(2);
      expect(store.getState().stages[0]).to.have.property(
        'stageOperator',
        '$limit'
      );
    });
  });
});
