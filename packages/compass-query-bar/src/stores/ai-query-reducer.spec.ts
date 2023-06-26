import { expect } from 'chai';

import configureStore from './query-bar-store';
import { AIQueryActionTypes, cancelAIQuery } from './ai-query-reducer';

function createStore() {
  return configureStore();
}

/**
 * TODO: Test:
 * - Making a request.
 * - On request:
 *    - Error
 *    - Success
 *    - Cancelled
 * - ?
 */

describe('aiQueryReducer', function () {
  describe('cancelAIQuery', function () {
    it('should cancel the abort controller on the store', function () {
      const store = createStore();
      expect(store.getState().aiQuery.aiQueryAbortController).to.equal(
        undefined
      );

      const abortController = new AbortController();
      store.dispatch({
        type: AIQueryActionTypes.AIQueryStarted,
        abortController,
      });

      expect(store.getState().aiQuery.aiQueryAbortController).to.equal(
        abortController
      );
      expect(
        store.getState().aiQuery.aiQueryAbortController?.signal.aborted
      ).to.equal(false);

      store.dispatch(cancelAIQuery());
      expect(abortController?.signal.aborted).to.equal(true);
      expect(store.getState().aiQuery.aiQueryAbortController).to.equal(
        undefined
      );
    });
  });
});
