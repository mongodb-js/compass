import { expect } from 'chai';
import Sinon from 'sinon';

import type { PreferencesAccess } from '@mongodb-js/compass-preferences-model';
import { createSandboxFromDefaultPreferences } from '@mongodb-js/compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import {
  AIQueryActionTypes,
  AI_INPUT_VISIBLE_STORAGE_KEY,
  THREAD_INACTIVITY_TIMEOUT_MS,
  cancelAIQuery,
  resetAIThread,
  runAIQuery,
  submitAIThreadPrompt,
  showInput,
  hideInput,
} from './ai-query-reducer';
import type {
  QueryBarExtraArgs,
  QueryBarStoreOptions,
} from './query-bar-store';
import { configureStore } from './query-bar-store';

const mockCollectionModel = {
  fetchMetadata() {
    return Promise.resolve({
      isFLE: false,
    });
  },
};

describe('aiQueryReducer', function () {
  let preferences: PreferencesAccess;
  const sandbox = Sinon.createSandbox();

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(function () {
    sandbox.reset();
  });

  function createStore(
    opts: Partial<QueryBarStoreOptions> = {},
    services: QueryBarExtraArgs
  ) {
    return configureStore(opts, services);
  }

  describe('runAIQuery', function () {
    const connectionInfoRef = {
      current: {
        id: 'TEST',
      },
    };

    describe('with a successful server response', function () {
      it('should succeed', async function () {
        const mockAtlasAiService = {
          getQueryFromUserInput: sandbox
            .stub()
            .resolves({ content: { query: { filter: '{_id: 1}' } } }),
        };

        const mockDataService = {
          sample: sandbox.stub().resolves([{ _id: 42 }]),
        };

        const store = createStore(
          {
            namespace: 'database.collection',
          },
          {
            dataService: mockDataService,
            connectionInfoRef,
            atlasAiService: mockAtlasAiService,
            preferences,
            logger: createNoopLogger(),
            track: createNoopTrack(),
            collection: mockCollectionModel,
          } as any
        );

        expect(store.getState().aiQuery.status).to.equal('ready');

        await store.dispatch(runAIQuery('testing prompt'));

        expect(mockAtlasAiService.getQueryFromUserInput).to.have.been
          .calledOnce;
        expect(
          mockAtlasAiService.getQueryFromUserInput.getCall(0)
        ).to.have.nested.property('args[0].userInput', 'testing prompt');
        expect(
          mockAtlasAiService.getQueryFromUserInput.getCall(0)
        ).to.have.nested.property('args[0].collectionName', 'collection');
        expect(
          mockAtlasAiService.getQueryFromUserInput.getCall(0)
        ).to.have.nested.property('args[0].databaseName', 'database');
        // Sample documents are currently disabled.
        expect(
          mockAtlasAiService.getQueryFromUserInput.getCall(0)
        ).to.not.have.nested.property('args[0].sampleDocuments');
        expect(mockAtlasAiService.getQueryFromUserInput.getCall(0))
          .to.have.nested.property('args[0].threadId')
          .that.is.a('string').and.is.not.empty;

        expect(store.getState().aiQuery.aiQueryRequestId).to.equal(null);
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        expect(store.getState().aiQuery.status).to.equal('success');
      });
    });

    describe('threadId', function () {
      function createStoreWithMocks() {
        const mockAtlasAiService = {
          getQueryFromUserInput: sandbox
            .stub()
            .resolves({ content: { query: { filter: '{_id: 1}' } } }),
        };
        const store = createStore({ namespace: 'database.collection' }, {
          dataService: { sample: sandbox.stub().resolves([]) },
          connectionInfoRef,
          atlasAiService: mockAtlasAiService,
          preferences,
          logger: createNoopLogger(),
          track: createNoopTrack(),
          collection: mockCollectionModel,
        } as any);
        const getThreadIds = () =>
          mockAtlasAiService.getQueryFromUserInput
            .getCalls()
            .map((call) => call.args[0].threadId);
        return { store, getThreadIds };
      }

      it('keeps the same threadId across follow-up prompts on the same collection', async function () {
        const { store, getThreadIds } = createStoreWithMocks();

        await store.dispatch(runAIQuery('first prompt'));
        await store.dispatch(runAIQuery('follow-up prompt'));

        const [first, second] = getThreadIds();
        expect(first).to.be.a('string').that.is.not.empty;
        expect(second).to.equal(first);
      });

      it('uses a new threadId for a new query bar (switching collections or restarting)', async function () {
        const first = createStoreWithMocks();
        const second = createStoreWithMocks();

        await first.store.dispatch(runAIQuery('prompt'));
        await second.store.dispatch(runAIQuery('prompt'));

        expect(second.getThreadIds()[0]).to.not.equal(first.getThreadIds()[0]);
      });

      describe('after a period of inactivity', function () {
        let clock: Sinon.SinonFakeTimers;

        beforeEach(function () {
          // Only fake Date so the thunk's promises still resolve.
          clock = Sinon.useFakeTimers({ toFake: ['Date'] });
        });

        afterEach(function () {
          clock.restore();
        });

        it('keeps the threadId when the next prompt is within the timeout', async function () {
          const { store, getThreadIds } = createStoreWithMocks();

          await store.dispatch(runAIQuery('first prompt'));
          clock.tick(THREAD_INACTIVITY_TIMEOUT_MS);
          await store.dispatch(runAIQuery('follow-up prompt'));

          const [first, second] = getThreadIds();
          expect(second).to.equal(first);
        });

        it('starts a new threadId when the next prompt is after the timeout', async function () {
          const { store, getThreadIds } = createStoreWithMocks();

          await store.dispatch(runAIQuery('first prompt'));
          clock.tick(THREAD_INACTIVITY_TIMEOUT_MS + 1);
          await store.dispatch(runAIQuery('prompt after a break'));
          await store.dispatch(runAIQuery('follow-up prompt'));

          const [first, second, third] = getThreadIds();
          expect(second).to.be.a('string').that.is.not.empty;
          expect(second).to.not.equal(first);
          expect(third).to.equal(second);
        });

        it('measures inactivity from the latest prompt, not the first', async function () {
          const { store, getThreadIds } = createStoreWithMocks();

          await store.dispatch(runAIQuery('first prompt'));
          clock.tick(THREAD_INACTIVITY_TIMEOUT_MS - 1);
          await store.dispatch(runAIQuery('second prompt'));
          clock.tick(THREAD_INACTIVITY_TIMEOUT_MS - 1);
          await store.dispatch(runAIQuery('third prompt'));

          expect(new Set(getThreadIds()).size).to.equal(1);
        });

        it('counts prompts from other NLQ entry points as activity', async function () {
          const { store, getThreadIds } = createStoreWithMocks();

          await store.dispatch(runAIQuery('query bar prompt'));
          clock.tick(THREAD_INACTIVITY_TIMEOUT_MS - 1);
          store.dispatch(submitAIThreadPrompt());
          clock.tick(THREAD_INACTIVITY_TIMEOUT_MS - 1);
          await store.dispatch(runAIQuery('query bar follow-up'));

          const [first, second] = getThreadIds();
          expect(second).to.equal(first);
        });
      });

      // Other NLQ entry points in the collection tab (the aggregation builder)
      // use these through the query bar service.
      describe('shared with other NLQ entry points', function () {
        it('gives other entry points the same threadId as the query bar', async function () {
          const { store, getThreadIds } = createStoreWithMocks();

          await store.dispatch(runAIQuery('query bar prompt'));
          const otherEntryPointThreadId = store.dispatch(
            submitAIThreadPrompt()
          );
          await store.dispatch(runAIQuery('back in the query bar'));

          const [first, second] = getThreadIds();
          expect(otherEntryPointThreadId).to.equal(first);
          expect(second).to.equal(first);
        });

        it('continues in the query bar a thread started by another entry point', async function () {
          const { store, getThreadIds } = createStoreWithMocks();

          const otherEntryPointThreadId = store.dispatch(
            submitAIThreadPrompt()
          );
          await store.dispatch(runAIQuery('query bar follow-up'));

          expect(getThreadIds()).to.deep.equal([otherEntryPointThreadId]);
        });

        it('starts a new thread for the query bar when another entry point resets it', async function () {
          const { store, getThreadIds } = createStoreWithMocks();

          await store.dispatch(runAIQuery('query bar prompt'));
          store.dispatch(resetAIThread());
          await store.dispatch(runAIQuery('prompt after signing in again'));

          const [first, second] = getThreadIds();
          expect(second).to.be.a('string').that.is.not.empty;
          expect(second).to.not.equal(first);
        });
      });
    });

    describe('when there is an error', function () {
      it('sets the error on the store', async function () {
        const mockAtlasAiService = {
          getQueryFromUserInput: sandbox
            .stub()
            .rejects(new Error('500 Internal Server Error')),
        };

        const store = createStore({}, {
          atlasAiService: mockAtlasAiService,
          connectionInfoRef,
          dataService: {
            sample() {
              return Promise.resolve([]);
            },
          },
          preferences,
          logger: createNoopLogger(),
          track: createNoopTrack(),
          collection: mockCollectionModel,
        } as any);
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        await store.dispatch(runAIQuery('testing prompt') as any);
        expect(store.getState().aiQuery.aiQueryRequestId).to.equal(null);
        expect(store.getState().aiQuery.errorMessage).to.equal(
          '500 Internal Server Error'
        );
        expect(store.getState().aiQuery.status).to.equal('ready');
      });

      it('resets the store if errs was caused by user being unauthorized', async function () {
        const authError = new Error('Unauthorized');
        (authError as any).statusCode = 401;
        const mockAtlasAiService = {
          getQueryFromUserInput: sandbox.stub().rejects(authError),
        };
        const store = createStore({}, {
          atlasAiService: mockAtlasAiService,
          dataService: {
            sample() {
              return Promise.resolve([]);
            },
          },
          connectionInfoRef,
          preferences,
          logger: createNoopLogger(),
          track: createNoopTrack(),
          collection: mockCollectionModel,
        } as any);
        await store.dispatch(runAIQuery('testing prompt') as any);
        const { threadId, ...restOfAiQuery } = store.getState().aiQuery;
        expect(restOfAiQuery).to.deep.eq({
          status: 'ready',
          aiPromptText: '',
          errorMessage: undefined,
          errorCode: undefined,
          isInputVisible: false,
          aiQueryRequestId: null,
          lastAIQueryRequestId: null,
          threadLastActiveAt: null,
        });

        // Signing back in starts a new session, so it gets a new thread.
        await store.dispatch(runAIQuery('testing prompt') as any);
        const [first, second] = mockAtlasAiService.getQueryFromUserInput
          .getCalls()
          .map((call) => call.args[0].threadId);
        expect(threadId).to.be.a('string').that.is.not.empty;
        expect(first).to.not.equal(threadId);
        expect(second).to.equal(threadId);
      });
    });

    describe('when cancelled while the response is being parsed', function () {
      let store: ReturnType<typeof createStore>;
      let query: any;
      beforeEach(function () {
        // Parsing starts by reading the content, so cancel right there
        const response = {
          get content() {
            store.dispatch(cancelAIQuery());
            return { query };
          },
        };
        store = createStore({ namespace: 'database.collection' }, {
          atlasAiService: {
            getQueryFromUserInput: sandbox.stub().resolves(response),
          },
          dataService: { sample: sandbox.stub().resolves([]) },
          connectionInfoRef,
          preferences,
          logger: createNoopLogger(),
          track: createNoopTrack(),
          collection: mockCollectionModel,
        } as any);
      });

      it('does not apply the generated query', async function () {
        query = { filter: '{_id: 1}' };
        await store.dispatch(runAIQuery('testing prompt'));
        expect(store.getState().aiQuery.status).to.equal('ready');
        expect(store.getState().aiQuery.lastAIQueryRequestId).to.equal(null);
      });

      it('does not show a parsing error', async function () {
        // A null query makes parsing throw
        query = null;
        await store.dispatch(runAIQuery('testing prompt'));

        expect(store.getState().aiQuery.status).to.equal('ready');
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
      });
    });

    describe('when the sample documents setting is enabled', function () {
      beforeEach(async function () {
        await preferences.savePreferences({
          enableGenAISampleDocumentPassing: true,
        });
      });

      it('includes sample documents in the request', async function () {
        const mockAtlasAiService = {
          getQueryFromUserInput: sandbox
            .stub()
            .resolves({ content: { query: { filter: '{_id: 1}' } } }),
        };

        const mockDataService = {
          sample: sandbox.stub().resolves([{ _id: 42 }]),
        };

        const store = createStore(
          {
            namespace: 'database.collection',
          },
          {
            dataService: mockDataService,
            connectionInfoRef,
            atlasAiService: mockAtlasAiService,
            preferences,
            logger: createNoopLogger(),
            track: createNoopTrack(),
            collection: mockCollectionModel,
          } as any
        );

        expect(store.getState().aiQuery.status).to.equal('ready');

        await store.dispatch(runAIQuery('testing prompt'));

        expect(mockAtlasAiService.getQueryFromUserInput).to.have.been
          .calledOnce;
        expect(
          mockAtlasAiService.getQueryFromUserInput.getCall(0)
        ).to.have.deep.nested.property('args[0].sampleDocuments', [
          { _id: 42 },
        ]);
      });
    });

    describe('when the sample documents setting is disabled', function () {
      it('does not include sample documents in the request', async function () {
        const mockAtlasAiService = {
          getQueryFromUserInput: sandbox
            .stub()
            .resolves({ content: { query: { filter: '{_id: 1}' } } }),
        };

        const mockDataService = {
          sample: sandbox.stub().resolves([{ _id: 42 }]),
        };

        const store = createStore(
          {
            namespace: 'database.collection',
          },
          {
            dataService: mockDataService,
            connectionInfoRef,
            atlasAiService: mockAtlasAiService,
            preferences,
            logger: createNoopLogger(),
            track: createNoopTrack(),
            collection: mockCollectionModel,
          } as any
        );

        expect(store.getState().aiQuery.status).to.equal('ready');

        await store.dispatch(runAIQuery('testing prompt'));

        expect(mockAtlasAiService.getQueryFromUserInput).to.have.been
          .calledOnce;
        expect(
          mockAtlasAiService.getQueryFromUserInput.getCall(0)
        ).to.not.have.nested.property('args[0].sampleDocuments');
      });
    });
  });

  describe('cancelAIQuery', function () {
    it('should unset the request id and set the status on the store', function () {
      const store = createStore({}, {} as any);
      expect(store.getState().aiQuery.aiQueryRequestId).to.equal(null);

      store.dispatch({
        type: AIQueryActionTypes.AIQueryStarted,
        requestId: 'pineapples',
      });

      expect(store.getState().aiQuery.status).to.equal('fetching');
      expect(store.getState().aiQuery.aiQueryRequestId).to.equal('pineapples');

      store.dispatch(cancelAIQuery());

      expect(store.getState().aiQuery.aiQueryRequestId).to.equal(null);
      expect(store.getState().aiQuery.status).to.equal('ready');
    });
  });

  describe('showInput / hideInput', function () {
    let fakeLocalStorage: Sinon.SinonStub;

    function createAIQueryStore() {
      return createStore({}, {
        atlasAiService: {
          ensureAiFeatureAccess: sandbox.stub().resolves(),
        },
        dataService: {
          sample() {
            return Promise.resolve([]);
          },
        },
        connectionInfoRef: { current: { id: 'TEST' } },
        preferences,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        collection: mockCollectionModel,
      } as any);
    }

    beforeEach(function () {
      const localStorageValues: Record<string, string> = Object.create(null);

      fakeLocalStorage = Sinon.stub(global, 'localStorage').value({
        getItem: (key: string) => localStorageValues[key],
        setItem: (key: string, value: unknown) => {
          localStorageValues[key] = String(value);
        },
      });
    });

    afterEach(function () {
      fakeLocalStorage.restore();
    });

    it('persists the visible state of the input for new stores', async function () {
      const store1 = createAIQueryStore();
      expect(store1.getState().aiQuery.isInputVisible).to.equal(false);

      await store1.dispatch(showInput());
      expect(store1.getState().aiQuery.isInputVisible).to.equal(true);
      expect(localStorage.getItem(AI_INPUT_VISIBLE_STORAGE_KEY)).to.equal(
        'true'
      );

      const store2 = createAIQueryStore();
      expect(store2.getState().aiQuery.isInputVisible).to.equal(true);

      store2.dispatch(hideInput());
      expect(store2.getState().aiQuery.isInputVisible).to.equal(false);
      expect(localStorage.getItem(AI_INPUT_VISIBLE_STORAGE_KEY)).to.equal(
        'false'
      );

      const store3 = createAIQueryStore();
      expect(store3.getState().aiQuery.isInputVisible).to.equal(false);
    });
  });
});
