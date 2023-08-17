import { expect } from 'chai';
import { applyMiddleware, createStore as createReduxStore } from 'redux';
import thunk from 'redux-thunk';
import { AtlasService } from '@mongodb-js/atlas-service/renderer';
import { PipelineBuilder } from './pipeline-builder';
import {
  changeEditorValue,
  loadPreviewForPipeline,
} from './text-editor-pipeline';
import reducer from '..';
import Sinon from 'sinon';
import { toggleAutoPreview } from '../auto-preview';
import { PipelineStorage } from '../../utils/pipeline-storage';
import { mockDataService } from '../../../test/mocks/data-service';

function createStore(
  pipelineSource = `[{$match: {_id: 1}}, {$limit: 10}]`,
  data: unknown[] | (() => unknown[]) = []
) {
  const pipelineBuilder = Sinon.spy(
    new PipelineBuilder(mockDataService({ data }), pipelineSource)
  ) as unknown as PipelineBuilder;
  const store = createReduxStore(
    reducer,
    {
      pipelineBuilder: {
        textEditor: {
          pipeline: {
            pipelineText: pipelineBuilder.getPipelineStringFromSource(),
            isLoading: false,
            isPreviewStale: false,
            previewDocs: null,
            serverError: null,
            pipeline: pipelineBuilder.pipeline ?? [],
            syntaxErrors: pipelineBuilder.syntaxError,
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
        atlasService: new AtlasService(),
        pipelineBuilder,
        pipelineStorage: new PipelineStorage(),
      })
    )
  );
  return {
    dispatch: store.dispatch,
    getState() {
      return store.getState().pipelineBuilder.textEditor;
    },
    pipelineBuilder,
  };
}

describe('textEditorPipeline', function () {
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
      expect(pipeline.pipeline).to.deep.equal([{ $match: { _id: 1 } }]);
      expect(pipeline.syntaxErrors).to.deep.equal([]);
      expect(pipeline.isPreviewStale).to.equal(false);
    });
  });

  describe('loadPreviewForPipeline', function () {
    it('should load preview for valid pipeline', async function () {
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

    it('should cancel preview for stage when new stage state is invalid', function () {
      store.dispatch(changeEditorValue('[{$match: {foo: 1}}]'));
      Sinon.resetHistory();
      store.dispatch(changeEditorValue('[{$match: {foo: 1'));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForPipeline).not.to.be.called;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.cancelPreviewForPipeline).to.have.been
        .calledOnce;
    });
  });

  describe('stale results', function () {
    beforeEach(function () {
      store = createStore(`[{$limit: "2"}]`, () => {
        throw new Error('Wrong aggregation');
      });
    });
    it('should set results as stale if there is a server error', async function () {
      await store.dispatch(loadPreviewForPipeline());
      const state = store.getState().pipeline;
      expect(state.isPreviewStale).to.equal(true);
    });
  });
});
