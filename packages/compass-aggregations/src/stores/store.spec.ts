import AppRegistry from 'hadron-app-registry';
import rootReducer from '../modules';
import { expect } from 'chai';
import configureStore from '../../test/configure-store';
import type { Store } from 'redux';

const INITIAL_STATE = rootReducer(undefined, { type: '@@init' });

describe('Aggregation Store', function () {
  describe('#configureStore', function () {
    context('when providing a serverVersion', function () {
      let store: Store;

      beforeEach(function () {
        store = configureStore({
          serverVersion: '4.2.0',
        });
      });

      it('sets the server version the state', function () {
        expect(store.getState().serverVersion).to.equal('4.2.0');
      });
    });

    context('when providing an env', function () {
      let store: Store;

      beforeEach(function () {
        store = configureStore({
          env: 'atlas',
        });
      });

      it('sets the env in the state', function () {
        expect(store.getState().env).to.equal('atlas');
      });
    });

    context('when providing a namespace', function () {
      context('when there is no collection', function () {
        it('throws', function () {
          expect(() => configureStore({ namespace: 'db' })).to.throw();
        });
      });

      context('when there is a collection', function () {
        let store: Store;

        beforeEach(function () {
          store = configureStore({ namespace: 'db.coll' });
        });

        it('updates the namespace in the store', function () {
          expect(store.getState().namespace).to.equal('db.coll');
        });

        it('resets the rest of the state to initial state', function () {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { aggregationWorkspaceId, dataService, ...state } =
            store.getState();
          state.pipelineBuilder.stageEditor = {
            stages: [],
            stagesIdAndType: [],
          };
          delete state.pipeline;
          delete state.sidePanel;

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
              isLoading: true,
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
            collectionsFields: INITIAL_STATE.collectionsFields,
            searchIndexes: INITIAL_STATE.searchIndexes,
          });
        });
      });
    });
  });

  describe('#onActivated', function () {
    let store: Store;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();

    beforeEach(function () {
      store = configureStore(undefined, undefined, {
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
      });
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
