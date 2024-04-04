import { expect } from 'chai';
import Sinon from 'sinon';

import { configureStore } from './query-bar-store';
import type {
  QueryBarExtraArgs,
  QueryBarStoreOptions,
} from './query-bar-store';
import {
  AIQueryActionTypes,
  cancelAIQuery,
  runAIQuery,
} from './ai-query-reducer';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

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
            atlasAuthService: { on: sandbox.stub() },
            atlasAiService: mockAtlasAiService,
            preferences,
            logger: createNoopLoggerAndTelemetry(),
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

        expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        expect(store.getState().aiQuery.status).to.equal('success');
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
          atlasAuthService: { on: sandbox.stub() },
          atlasAiService: mockAtlasAiService,
          dataService: {
            sample() {
              return Promise.resolve([]);
            },
          },
          preferences,
          logger: createNoopLoggerAndTelemetry(),
        } as any);
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        await store.dispatch(runAIQuery('testing prompt') as any);
        expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
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
          atlasAuthService: { on: sandbox.stub() },
          atlasAiService: mockAtlasAiService,
          dataService: {
            sample() {
              return Promise.resolve([]);
            },
          },
          preferences,
          logger: createNoopLoggerAndTelemetry(),
        } as any);
        await store.dispatch(runAIQuery('testing prompt') as any);
        expect(store.getState()).to.have.property('aiQuery').deep.eq({
          status: 'ready',
          aiPromptText: '',
          errorMessage: undefined,
          errorCode: undefined,
          isInputVisible: false,
          aiQueryFetchId: -1,
        });
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
            atlasAuthService: { on: sandbox.stub() },
            atlasAiService: mockAtlasAiService,
            preferences,
            logger: createNoopLoggerAndTelemetry(),
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
            atlasAuthService: { on: sandbox.stub() },
            atlasAiService: mockAtlasAiService,
            preferences,
            logger: createNoopLoggerAndTelemetry(),
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
    it('should unset the fetching id and set the status on the store', function () {
      const store = createStore({}, {} as any);
      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);

      store.dispatch({
        type: AIQueryActionTypes.AIQueryStarted,
        fetchId: 1,
      });

      expect(store.getState().aiQuery.status).to.equal('fetching');
      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(1);

      store.dispatch(cancelAIQuery());

      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
      expect(store.getState().aiQuery.status).to.equal('ready');
    });
  });
});
