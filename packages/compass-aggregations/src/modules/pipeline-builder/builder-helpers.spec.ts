import { expect } from 'chai';
import {
  getPipelineStageOperatorsFromBuilderState,
  getIsRerankFirstStage,
  getIsRerankFirstStageBannerVisible,
  getIsNewPipelineFromBuilderState,
} from './builder-helpers';
import { SAVING_PIPELINE_APPLY } from '../saving-pipeline';
import {
  addStage,
  changeStageDisabled,
  StageEditorActionTypes,
} from './stage-editor';
import { changePipelineMode } from './pipeline-mode';
import { changeEditorValue, EditorActionTypes } from './text-editor-pipeline';
import configureStore from '../../../test/configure-store';
import type { AggregationsStore } from '../../stores/store';
import HadronDocument from 'hadron-document';

async function createStore(
  pipelineText = `[{$match: {_id: 1}}, {$limit: 10}]`
) {
  const result = await configureStore({ pipelineText });
  return result.plugin.store;
}

describe('builder-helpers', function () {
  describe('getPipelineStageOperatorsFromBuilderState', function () {
    let store: AggregationsStore;
    beforeEach(async function () {
      store = await createStore();
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

  describe('getIsRerankFirstStage', function () {
    describe('per-card (stage / focus mode)', function () {
      it('returns true on the first enabled $rerank card', async function () {
        const store = await createStore('[{ $rerank: {} }]');
        expect(getIsRerankFirstStage(store.getState(), 0)).to.equal(true);
      });

      it('returns false on later $rerank cards', async function () {
        const store = await createStore('[{ $rerank: {} }, { $rerank: {} }]');
        expect(getIsRerankFirstStage(store.getState(), 1)).to.equal(false);
      });

      it('skips disabled stages when locating the first enabled $rerank card', async function () {
        const store = await createStore('[{ $match: {} }, { $rerank: {} }]');
        store.dispatch(changeStageDisabled(0, true));
        expect(getIsRerankFirstStage(store.getState(), 1)).to.equal(true);
      });
    });

    describe('text mode (no index)', function () {
      it('returns true when $rerank is the first stage in the parsed pipeline', async function () {
        const store = await createStore('[{ $rerank: {} }]');
        store.dispatch(changePipelineMode('as-text'));
        expect(getIsRerankFirstStage(store.getState())).to.equal(true);
      });

      it('returns false when any stage precedes $rerank in the parsed pipeline', async function () {
        const store = await createStore('[{ $match: {} }, { $rerank: {} }]');
        store.dispatch(changePipelineMode('as-text'));
        expect(getIsRerankFirstStage(store.getState())).to.equal(false);
      });

      it('returns false when parsed pipeline has no $rerank', async function () {
        const store = await createStore('[{ $match: {} }]');
        store.dispatch(changePipelineMode('as-text'));
        expect(getIsRerankFirstStage(store.getState())).to.equal(false);
      });

      it('returns true when text has syntax errors and $rerank is the first operator', async function () {
        const store = await createStore('[]');
        store.dispatch(changePipelineMode('as-text'));
        store.dispatch(changeEditorValue('[{ $rerank: '));
        expect(getIsRerankFirstStage(store.getState())).to.equal(true);
      });

      it('returns false when text has syntax errors and any stage precedes $rerank', async function () {
        const store = await createStore('[]');
        store.dispatch(changePipelineMode('as-text'));
        store.dispatch(changeEditorValue('[{ $match: {} }, { $rerank: '));
        expect(getIsRerankFirstStage(store.getState())).to.equal(false);
      });
    });
  });

  describe('getIsRerankFirstStageBannerVisible', function () {
    describe('per-card (stage / focus mode)', function () {
      it('returns false when $rerank is not the first enabled stage', async function () {
        const store = await createStore('[{ $match: {} }, { $rerank: {} }]');
        expect(
          getIsRerankFirstStageBannerVisible(store.getState(), 1)
        ).to.equal(false);
      });

      it('returns false when $rerank is first but no docs have been returned yet', async function () {
        const store = await createStore('[{ $rerank: {} }]');
        expect(
          getIsRerankFirstStageBannerVisible(store.getState(), 0)
        ).to.equal(false);
      });

      it('returns true when $rerank is first and preview has returned docs', async function () {
        const store = await createStore('[{ $rerank: {} }]');
        store.dispatch({
          type: StageEditorActionTypes.StagePreviewFetchSuccess,
          id: 0,
          previewDocs: [new HadronDocument({ _id: 1 })],
          stageMetadata: null,
        });
        expect(
          getIsRerankFirstStageBannerVisible(store.getState(), 0)
        ).to.equal(true);
      });
    });

    describe('text mode', function () {
      it('returns false when $rerank is first but previewDocs is null', async function () {
        const store = await createStore('[{ $rerank: {} }]');
        store.dispatch(changePipelineMode('as-text'));
        expect(getIsRerankFirstStageBannerVisible(store.getState())).to.equal(
          false
        );
      });

      it('returns true when $rerank is first and previewDocs has results', async function () {
        const store = await createStore('[{ $rerank: {} }]');
        store.dispatch(changePipelineMode('as-text'));
        store.dispatch({
          type: EditorActionTypes.EditorPreviewFetchSuccess,
          previewDocs: [new HadronDocument({ _id: 1 })],
        });
        expect(getIsRerankFirstStageBannerVisible(store.getState())).to.equal(
          true
        );
      });
    });
  });

  describe('getIsNewPipelineFromBuilderState', function () {
    it('returns true for an empty, unmodified pipeline', async function () {
      const store = await createStore('[]');
      expect(getIsNewPipelineFromBuilderState(store.getState())).to.equal(true);
    });

    it('returns false once a stage is added', async function () {
      const store = await createStore('[]');
      store.dispatch(addStage());
      expect(getIsNewPipelineFromBuilderState(store.getState())).to.equal(
        false
      );
    });

    it('returns false when the pipeline has stages but was not modified', async function () {
      const store = await createStore('[{ $match: { _id: 1 } }]');
      expect(getIsNewPipelineFromBuilderState(store.getState())).to.equal(
        false
      );
    });

    it('returns false when an unmodified empty pipeline has a name', async function () {
      const store = await createStore('[]');
      store.dispatch({ type: SAVING_PIPELINE_APPLY, name: 'test agg' });
      expect(getIsNewPipelineFromBuilderState(store.getState())).to.equal(
        false
      );
    });

    describe('in text editor mode', function () {
      it('returns true for an empty pipeline text', async function () {
        const store = await createStore('[]');
        store.dispatch(changePipelineMode('as-text'));
        expect(getIsNewPipelineFromBuilderState(store.getState())).to.equal(
          true
        );
      });

      it('returns false once the editor value changes', async function () {
        const store = await createStore('[]');
        store.dispatch(changePipelineMode('as-text'));
        store.dispatch(changeEditorValue('[{ $match: { _id: 1 } }]'));
        expect(getIsNewPipelineFromBuilderState(store.getState())).to.equal(
          false
        );
      });
    });
  });
});
