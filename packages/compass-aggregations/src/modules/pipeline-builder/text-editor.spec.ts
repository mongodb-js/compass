import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';
import { applyMiddleware, createStore as createReduxStore } from 'redux';
import thunk from 'redux-thunk';
import { PipelineBuilder } from './pipeline-builder';
import {
  changeEditorValue,
  loadPreviewForPipeline,
} from './text-editor';
import reducer from '../';
import Sinon from 'sinon';
import { toggleAutoPreview } from '../auto-preview';

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
        textEditor: {
          pipelineText: pipelineBuilder.getPipelineStringFromSource(),
          loading: false,
          previewDocs: null,
          serverError: null,
          stageOperators: ['$match', '$limit', '$out'],
          syntaxErrors: [],
        },
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({
        pipelineBuilder,
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
      expect(store.getState().pipelineText).to.equal(newPipeline);
      expect(store.getState().stageOperators).to.deep.equal(['$match']);
      expect(store.getState().syntaxErrors).to.deep.equal([]);
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
  });
});
