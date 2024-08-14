import type AppRegistry from 'hadron-app-registry';
import rootReducer from '../modules';
import { expect } from 'chai';
import configureStore from '../../test/configure-store';
import type { AggregationsStore } from '../stores/store';

const INITIAL_STATE = rootReducer(undefined, { type: '@@init' });

describe('Aggregation Store', function () {
  describe('#configureStore', function () {
    context('when providing a serverVersion', function () {
      let store: AggregationsStore;

      beforeEach(async function () {
        const result = await configureStore({
          serverVersion: '4.2.0',
        });
        store = result.plugin.store;
      });

      it('sets the server version the state', function () {
        expect(store.getState().serverVersion).to.equal('4.2.0');
      });
    });

    context('when providing an env', function () {
      let store: AggregationsStore;

      beforeEach(async function () {
        const result = await configureStore({
          env: 'atlas',
        });
        store = result.plugin.store;
      });

      it('sets the env in the state', function () {
        expect(store.getState().env).to.equal('atlas');
      });
    });

    context('when providing a namespace', function () {
      context('when there is no collection', function () {
        it('throws', async function () {
          try {
            await configureStore({ namespace: 'db' });
            expect.fail('Expected configureStore to throw');
          } catch (err) {
            expect(err).to.exist;
          }
        });
      });

      context('when there is a collection', function () {
        let store: AggregationsStore;

        beforeEach(async function () {
          const result = await configureStore({ namespace: 'db.coll' });
          store = result.plugin.store;
        });

        it('updates the namespace in the store', function () {
          expect(store.getState().namespace).to.equal('db.coll');
        });

        it('resets the rest of the state to initial state', function () {
          // Remove properties that we don't want to compare
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { aggregationWorkspaceId, dataService, sidePanel, ...state } =
            store.getState();

          state.pipelineBuilder.stageEditor = {
            stages: [],
            stagesIdAndType: [],
          };

          expect(state).to.deep.equal({
            outResultsFn: INITIAL_STATE.outResultsFn,
            namespace: 'db.coll',
            env: INITIAL_STATE.env,
            isTimeSeries: false,
            editViewName: null,
            sourceName: null,
            comments: INITIAL_STATE.comments,
            autoPreview: INITIAL_STATE.autoPreview,
            name: INITIAL_STATE.name,
            id: INITIAL_STATE.id,
            savedPipeline: INITIAL_STATE.savedPipeline,
            inputDocuments: {
              ...INITIAL_STATE.inputDocuments,
            },
            serverVersion: INITIAL_STATE.serverVersion,
            isModified: INITIAL_STATE.isModified,
            insights: {
              isCollectionScan: false,
            },
            collationString: INITIAL_STATE.collationString,
            settings: INITIAL_STATE.settings,
            limit: INITIAL_STATE.limit,
            largeLimit: INITIAL_STATE.largeLimit,
            maxTimeMS: INITIAL_STATE.maxTimeMS,
            savingPipeline: INITIAL_STATE.savingPipeline,
            updateViewError: INITIAL_STATE.updateViewError,
            aggregation: INITIAL_STATE.aggregation,
            workspace: INITIAL_STATE.workspace,
            countDocuments: INITIAL_STATE.countDocuments,
            isDataLake: INITIAL_STATE.isDataLake,
            pipelineBuilder: INITIAL_STATE.pipelineBuilder,
            focusMode: INITIAL_STATE.focusMode,
            collectionStats: INITIAL_STATE.collectionStats,
            collectionsFields: INITIAL_STATE.collectionsFields,
            searchIndexes: INITIAL_STATE.searchIndexes,
          });
        });
      });
    });
  });

  describe('#onActivated', function () {
    let store: AggregationsStore;
    let localAppRegistry: AppRegistry;

    beforeEach(async function () {
      const result = await configureStore();
      localAppRegistry = result.localAppRegistry;
      store = result.plugin.store;
    });

    context('when an aggregation should be generated from query', function () {
      it('updates the ai store', function (done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().pipelineBuilder.aiPipeline).to.deep.equal({
            aiPipelineRequestId: null,
            aiPromptText: 'group by price',
            errorMessage: undefined,
            errorCode: undefined,
            isAggregationGeneratedFromQuery: true,
            isInputVisible: true,
            lastAIPipelineRequestId: 'abc',
            status: 'success',
          });
          done();
        });

        localAppRegistry.emit('generate-aggregation-from-query', {
          userInput: 'group by price',
          aggregation: {
            pipeline: '[{ $group: { _id: "$price" } }]',
          },
          requestId: 'abc',
        });
      });
    });
  });
});
