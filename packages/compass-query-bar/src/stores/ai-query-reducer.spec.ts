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
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';

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

        expect(store.getState().aiQuery.aiQueryRequestId).to.equal(null);
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
        } as any);
        await store.dispatch(runAIQuery('testing prompt') as any);
        expect(store.getState()).to.have.property('aiQuery').deep.eq({
          status: 'ready',
          aiPromptText: '',
          errorMessage: undefined,
          errorCode: undefined,
          isInputVisible: false,
          aiQueryRequestId: null,
          lastAIQueryRequestId: null,
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
            connectionInfoRef,
            atlasAiService: mockAtlasAiService,
            preferences,
            logger: createNoopLogger(),
            track: createNoopTrack(),
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
});
