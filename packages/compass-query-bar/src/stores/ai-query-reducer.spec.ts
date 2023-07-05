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
        let didSetFetchId = false;
        store.subscribe(() => {
          if (store.getState().aiQuery.aiQueryFetchId !== -1) {
            didSetFetchId = true;
          }
        });
        expect(store.getState().aiQuery.status).to.equal('ready');
        await store.dispatch(runAIQuery('testing prompt') as any);

        expect(didSetFetchId).to.equal(true);
        expect(getRequests()[0].content).to.deep.equal({
          userPrompt: 'testing prompt',
        });
        expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        expect(store.getState().aiQuery.status).to.equal('success');
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
        expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
        expect(store.getState().aiQuery.errorMessage).to.equal(
          'Error: 500 Internal Server Error'
        );
        expect(store.getState().aiQuery.status).to.equal('ready');
      });
    });
  });

  describe('cancelAIQuery', function () {
    it('should unset the fetching id on the store', function () {
      const store = createStore();
      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);

      store.dispatch({
        type: AIQueryActionTypes.AIQueryStarted,
        fetchId: 1,
      });

      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(1);
      store.dispatch(cancelAIQuery());
      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
    });
  });
});
