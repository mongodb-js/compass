import { expect } from 'chai';
import {
  getPipelineStageOperatorsFromBuilderState,
  getIsRerankFirstStage,
} from './builder-helpers';
import { addStage } from './stage-editor';
import { changePipelineMode } from './pipeline-mode';
import { changeEditorValue } from './text-editor-pipeline';
import configureStore from '../../../test/configure-store';
import type { AggregationsStore } from '../../stores/store';

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
    describe('in stage editor mode', function () {
      it('returns true when $rerank is the only stage', async function () {
        const store = await createStore('[{ $rerank: {} }]');
        expect(getIsRerankFirstStage(store.getState())).to.equal(true);
      });

      it('returns false when any stage precedes $rerank', async function () {
        const store = await createStore('[{ $match: {} }, { $rerank: {} }]');
        expect(getIsRerankFirstStage(store.getState())).to.equal(false);
      });

      it('returns false when pipeline has no $rerank', async function () {
        const store = await createStore('[{ $match: {} }]');
        expect(getIsRerankFirstStage(store.getState())).to.equal(false);
      });
    });

    describe('in text editor mode', function () {
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
});
