import { expect } from 'chai';
import { applyMiddleware, createStore as createReduxStore } from 'redux';
import thunk from 'redux-thunk';
import { PipelineBuilder } from './pipeline-builder';
import {
  changeEditorValue,
  loadPreviewForPipeline,
} from './text-editor-pipeline';
import type { PipelineBuilderThunkDispatch } from '..';
import reducer from '..';
import Sinon from 'sinon';
import { waitFor } from '@mongodb-js/testing-library-compass';
import { toggleAutoPreview } from '../auto-preview';
import { collationStringChanged } from '../collation-string';
import { createElectronPipelineStorage } from '@mongodb-js/my-queries-storage/electron';
import { mockDataService } from '../../../test/mocks/data-service';
import type { PreferencesAccess } from '@mongodb-js/compass-preferences-model';

function createStore(
  pipelineSource = `[{$match: {_id: 1}}, {$limit: 10}]`,
  data: unknown[] | (() => unknown[]) = []
) {
  // The preview manager runs real aggregations, which read maxTimeMS from here
  const preferences = {
    getPreferences() {
      return { maxTimeMS: 10000 };
    },
  } as unknown as PreferencesAccess;
  const dataService = mockDataService({ data });
  const pipelineBuilder = Sinon.spy(
    new PipelineBuilder(dataService, preferences, pipelineSource)
  ) as unknown as PipelineBuilder;
  const store = createReduxStore(
    reducer,
    {
      dataService: { dataService },
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
        atlasAiService: {} as any,
        pipelineBuilder,
        pipelineStorage: createElectronPipelineStorage({
          basepath: '/tmp/test',
        }),
        instance: {} as any,
        workspaces: {} as any,
        preferences,
      })
    )
  );
  return {
    dispatch: store.dispatch as PipelineBuilderThunkDispatch,
    subscribe: (listener: () => void) => store.subscribe(listener),
    getState() {
      return store.getState().pipelineBuilder.textEditor;
    },
    pipelineBuilder,
    dataService,
  };
}

describe('textEditorPipeline', function () {
  let store: ReturnType<typeof createStore>;

  beforeEach(function () {
    store = createStore();
  });

  describe('changeEditorValue', function () {
    it('should change text pipeline value', async function () {
      const newPipeline = `[{$match: {_id: 1}}]`;
      await store.dispatch(changeEditorValue(newPipeline));
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

    context('when collation is still parsing', function () {
      beforeEach(function () {
        // Not awaited, so the collation parse is pending when preview starts
        void store.dispatch(collationStringChanged('{ locale: "fr" }'));
      });

      it('should run preview with the parsed collation', async function () {
        await store.dispatch(loadPreviewForPipeline());
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(store.dataService.aggregate).to.have.been.calledOnceWith(
          Sinon.match.any,
          Sinon.match.any,
          Sinon.match({ collation: { locale: 'fr' } })
        );
      });

      it('should only run the latest preview when a newer one supersedes it', async function () {
        await Promise.all([
          store.dispatch(loadPreviewForPipeline()),
          store.dispatch(loadPreviewForPipeline()),
        ]);

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(store.dataService.aggregate).to.have.been.calledOnce;
        expect(store.getState().pipeline.serverError).to.equal(null);
      });

      it('should not run preview when autoPreview is turned off', async function () {
        // Turn off once the fetch has started (deferred so the preview is
        // already requested), while collation is still parsing
        const unsubscribe = store.subscribe(() => {
          if (store.getState().pipeline.isLoading) {
            unsubscribe();
            void Promise.resolve().then(() =>
              store.dispatch(toggleAutoPreview(false))
            );
          }
        });

        await store.dispatch(loadPreviewForPipeline());

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(store.dataService.aggregate).not.to.have.been.called;
        expect(store.getState().pipeline.previewDocs).to.equal(null);
        expect(store.getState().pipeline.serverError).to.equal(null);
      });
    });

    it('should load preview when autoPreview is enabled and pipeline contains $out', async function () {
      store.dispatch(toggleAutoPreview(true));
      const newPipeline = `[{$out: "somewhere"}]`;
      await store.dispatch(changeEditorValue(newPipeline));
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(store.pipelineBuilder.getPreviewForPipeline).to.be.calledOnce;
      });
    });

    it('should load preview when autoPreview is enabled and pipeline contains $merge', async function () {
      store.dispatch(toggleAutoPreview(true));
      const newPipeline = `[{$merge: "somewhere"}]`;
      await store.dispatch(changeEditorValue(newPipeline));
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(store.pipelineBuilder.getPreviewForPipeline).to.be.calledOnce;
      });
    });

    it('should cancel preview for stage when new stage state is invalid', async function () {
      await store.dispatch(changeEditorValue('[{$match: {foo: 1}}]'));
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(store.pipelineBuilder.getPreviewForPipeline).to.be.calledOnce;
      });
      Sinon.resetHistory();
      await store.dispatch(changeEditorValue('[{$match: {foo: 1'));
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(store.pipelineBuilder.cancelPreviewForPipeline).to.have.been
          .calledOnce;
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(store.pipelineBuilder.getPreviewForPipeline).not.to.be.called;
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
