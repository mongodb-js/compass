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
  loadStagePreview,
  mapBuilderStageToStoreStage
} from './stage-editor';
import reducer from '../';
import { PipelineStorage } from '../../utils/pipeline-storage';
import Sinon from 'sinon';

function createStore(
  pipelineSource = `[{$match: {_id: 1}}, {$limit: 10}, {$out: 'match-and-limit'}]`
) {
  const pipelineBuilder = Sinon.spy(
    new PipelineBuilder({} as DataService, pipelineSource)
  ) as unknown as PipelineBuilder;
  const store = createReduxStore(
    reducer,
    {
      pipelineBuilder: {
        stageEditor: {
          stageIds: pipelineBuilder.stages.map(stage => stage.id),
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
    },
    pipelineBuilder
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

    it('should set stage value to a snippet when stage was in initial state', function () {
      // Adding a new empty stage
      store.dispatch(addStage());
      store.dispatch(changeStageOperator(3, '$match'));
      expect(store.getState().stages[3]).to.have.property(
        'value',
        `/**
 * query: The query in MQL.
 */
{
  query
}`
      );
    });

    it('should set stage value to a new snippet if the old snippet was not changed', function () {
      // Adding a new empty stage
      store.dispatch(addStage());
      store.dispatch(changeStageOperator(3, '$match'));
      store.dispatch(changeStageOperator(3, '$limit'));
      expect(store.getState().stages[3]).to.have.property(
        'value',
        `/**
 * Provide the number of documents to limit.
 */
number`
      );
    });

    it('should keep old stage value if stage was changed before switching the operators', function () {
      // Adding a new empty stage
      store.dispatch(addStage());
      store.dispatch(changeStageOperator(3, '$match'));
      store.dispatch(changeStageValue(3, '{ _id: 1 }'));
      store.dispatch(changeStageOperator(3, '$limit'));
      expect(store.getState().stages[3]).to.have.property(
        'value',
        '{ _id: 1 }'
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

  describe('loadStagePreview', function () {
    it('should load preview for valid stage', async function () {
      await store.dispatch(loadStagePreview(0));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForStage).to.be.calledOnce;
    });

    it('should not load preview for disabled stage', async function () {
      store.dispatch(changeStageDisabled(0, true));
      Sinon.resetHistory();
      await store.dispatch(loadStagePreview(0));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForStage).not.to.be.called;
    });

    it('should not load preview for invalid stage', async function () {
      store.dispatch(changeStageValue(0, '{ foo: '));
      Sinon.resetHistory();
      await store.dispatch(loadStagePreview(0));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForStage).not.to.be.called;
    });

    it('should not load preview for stage if any previous stages are invalid', async function () {
      store.dispatch(changeStageValue(0, '{ foo: '));
      Sinon.resetHistory();
      await store.dispatch(loadStagePreview(2));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForStage).not.to.be.called;
    });
  });
});
