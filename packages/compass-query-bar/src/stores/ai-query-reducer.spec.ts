import { expect } from 'chai';

import configureStore from './query-bar-store';
import {
  AIQueryActionTypes,
  cancelAIQuery,
  runAIQuery,
} from './ai-query-reducer';
import { startMockAIServer } from '../../test/create-mock-ai-endpoint';

function createStore() {
  return configureStore();
}

describe('aiQueryReducer', function () {
  describe('runAIQuery', function () {
    describe('with a successful server response (mock server)', function () {
      let stopServer: () => Promise<void>;
      let getRequests: () => any[];

      beforeEach(async function () {
        // Start a mock server to pass an ai response.
        // Set the server endpoint in the env.
        const {
          endpoint,
          getRequests: _getRequests,
          stop,
        } = await startMockAIServer();

        stopServer = stop;
        getRequests = _getRequests;
        process.env.DEV_AI_QUERY_ENDPOINT = endpoint;
      });

      afterEach(async function () {
        await stopServer();
        delete process.env.DEV_AI_QUERY_ENDPOINT;
      });

      it('should succeed', async function () {
        const store = createStore();
        let didSetAbortController = false;
        store.subscribe(() => {
          if (store.getState().aiQuery.aiQueryAbortController) {
            didSetAbortController = true;
          }
        });
        expect(store.getState().aiQuery.didSucceed).to.equal(false);
        await store.dispatch(runAIQuery('testing prompt') as any);

        expect(didSetAbortController).to.equal(true);
        expect(getRequests()[0].content).to.deep.equal({
          userPrompt: 'testing prompt',
        });
        expect(store.getState().aiQuery.aiQueryAbortController).to.equal(
          undefined
        );
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        expect(store.getState().aiQuery.didSucceed).to.equal(true);
      });
    });

    describe('when there is an error', function () {
      let stopServer: () => Promise<void>;

      beforeEach(async function () {
        const { endpoint, stop } = await startMockAIServer({
          response: {},
          sendError: true,
        });

        stopServer = stop;
        process.env.DEV_AI_QUERY_ENDPOINT = endpoint;
      });

      afterEach(async function () {
        await stopServer();
        delete process.env.DEV_AI_QUERY_ENDPOINT;
      });

      it('sets the error on the store', async function () {
        const store = createStore();
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        await store.dispatch(runAIQuery('testing prompt') as any);
        expect(store.getState().aiQuery.aiQueryAbortController).to.equal(
          undefined
        );
        expect(store.getState().aiQuery.errorMessage).to.equal(
          'Error: 500 Internal Server Error'
        );
        expect(store.getState().aiQuery.didSucceed).to.equal(false);
      });
    });
  });

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
