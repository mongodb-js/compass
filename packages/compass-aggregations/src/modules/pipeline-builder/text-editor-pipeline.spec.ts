import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';
import { applyMiddleware, createStore as createReduxStore } from 'redux';
import thunk from 'redux-thunk';
import { PipelineBuilder } from './pipeline-builder';
import {
  changeEditorValue,
  loadPreviewForPipeline,
} from './text-editor-pipeline';
import reducer from '..';
import Sinon from 'sinon';
import { toggleAutoPreview } from '../auto-preview';
import { PipelineStorage } from '../../utils/pipeline-storage';

function createStore(
  pipelineSource = `[{$match: {_id: 1}}, {$limit: 10}]`
) {
  const pipelineBuilder = Sinon.spy(
    new PipelineBuilder({} as DataService, pipelineSource)
  ) as unknown as PipelineBuilder;
  const store = createReduxStore(
    reducer,
    {
      pipelineBuilder: {
        textEditor: {
          pipeline: {
            pipelineText: pipelineBuilder.getPipelineStringFromSource(),
            isLoading: false,
            previewDocs: null,
            serverError: null,
            stageOperators: ['$match', '$limit'],
            syntaxErrors: [],
          },
          outputStage: {
            isLoading: false,
            isComplete: false,
            serverError: null,
          },
        },
      },
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
      return store.getState().pipelineBuilder.textEditor;
    },
    pipelineBuilder
  };
}

describe('stageEditor', function () {
  let store: ReturnType<typeof createStore>;

  beforeEach(function () {
    store = createStore();
  });

  describe('changeEditorValue', function () {
    it('should change text pipeline value', function () {
      const newPipeline = `[{$match: {_id: 1}}]`;
      store.dispatch(changeEditorValue(newPipeline));
      const pipeline = store.getState().pipeline;
      expect(pipeline.pipelineText).to.equal(newPipeline);
      expect(pipeline.stageOperators).to.deep.equal(['$match']);
      expect(pipeline.syntaxErrors).to.deep.equal([]);
    });
  });

  describe('loadPreviewForPipeline', function () {
    it('should load preview for valid stage', async function () {
      await store.dispatch(loadPreviewForPipeline());
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForPipeline).to.be.calledOnce;
    });

    it('should not load preview when autoPreview is not enabled', async function () {
      store.dispatch(toggleAutoPreview(false));
      await store.dispatch(loadPreviewForPipeline());
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForPipeline).not.to.be.called;
    });

    it('should load preview when autoPreview is enabled and pipeline contains $out', function () {
      store.dispatch(toggleAutoPreview(true));
      const newPipeline = `[{$out: "somewhere"}]`;
      store.dispatch(changeEditorValue(newPipeline));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForPipeline).to.be.calledOnce;
    });

    it('should load preview when autoPreview is enabled and pipeline contains $merge', function () {
      store.dispatch(toggleAutoPreview(true));
      const newPipeline = `[{$merge: "somewhere"}]`;
      store.dispatch(changeEditorValue(newPipeline));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForPipeline).to.be.calledOnce;
    });
  });
});
