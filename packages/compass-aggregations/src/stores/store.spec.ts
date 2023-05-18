import AppRegistry from 'hadron-app-registry';
import rootReducer from '../modules';
import { expect } from 'chai';
import configureStore from '../../test/configure-store';
import type { Store } from 'redux';

const INITIAL_STATE = rootReducer(undefined, { type: '@@init' });

const fakeAppInstanceStore = {
  getState: function () {
    return {
      instance: {
        env: 'atlas',
      },
    };
  },
} as any;

describe('Aggregation Store', function () {
  describe('#configureStore', function () {
    context('when providing an app registry', function () {
      let store: Store;
      const localAppRegistry = new AppRegistry();
      const globalAppRegistry = new AppRegistry();

      beforeEach(function () {
        globalAppRegistry.registerStore(
          'App.InstanceStore',
          fakeAppInstanceStore
        );
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
        });
      });

      it('sets the app registry state', function () {
        expect(store.getState().appRegistry).to.deep.equal({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
        });
      });
    });

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
          expect(state).to.deep.equal({
            outResultsFn: INITIAL_STATE.outResultsFn,
            namespace: 'db.coll',
            env: INITIAL_STATE.env,
            isTimeSeries: false,
            editViewName: null,
            sourceName: null,
            appRegistry: INITIAL_STATE.appRegistry,
            comments: INITIAL_STATE.comments,
            autoPreview: INITIAL_STATE.autoPreview,
            name: INITIAL_STATE.name,
            id: INITIAL_STATE.id,
            savedPipeline: INITIAL_STATE.savedPipeline,
            fields: INITIAL_STATE.fields,
            inputDocuments: {
              ...INITIAL_STATE.inputDocuments,
              isLoading: true,
            },
            serverVersion: INITIAL_STATE.serverVersion,
            isModified: INITIAL_STATE.isModified,
            isAtlasDeployed: INITIAL_STATE.isAtlasDeployed,
            collationString: INITIAL_STATE.collationString,
            settings: INITIAL_STATE.settings,
            limit: INITIAL_STATE.limit,
            largeLimit: INITIAL_STATE.largeLimit,
            maxTimeMS: INITIAL_STATE.maxTimeMS,
            savingPipeline: INITIAL_STATE.savingPipeline,
            projections: INITIAL_STATE.projections,
            updateViewError: INITIAL_STATE.updateViewError,
            aggregation: INITIAL_STATE.aggregation,
            workspace: INITIAL_STATE.workspace,
            countDocuments: INITIAL_STATE.countDocuments,
            explain: INITIAL_STATE.explain,
            isDataLake: INITIAL_STATE.isDataLake,
            indexes: INITIAL_STATE.indexes,
            pipelineBuilder: INITIAL_STATE.pipelineBuilder,
            focusMode: INITIAL_STATE.focusMode,
            sidePanel: INITIAL_STATE.sidePanel,
            collectionsFields: INITIAL_STATE.collectionsFields,
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
      globalAppRegistry.registerStore(
        'App.InstanceStore',
        fakeAppInstanceStore
      );
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
      });
    });

    context('when the fields change', function () {
      it('updates the fields', function (done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().fields).to.deep.equal([
            {
              name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0',
            },
            {
              name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0',
            },
          ]);
          done();
        });

        localAppRegistry.emit('fields-changed', {
          fields: {
            harry: {
              name: 'harry',
              path: ['harry'],
              count: 1,
              type: 'Number',
            },
            potter: {
              name: 'potter',
              path: ['potter'],
              count: 1,
              type: 'Boolean',
            },
          },
          topLevelFields: ['harry', 'potter'],
          autocompleteFields: [
            {
              name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0',
            },
            {
              name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0',
            },
          ],
        });
      });
    });
  });
});
