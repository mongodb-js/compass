import AppRegistry from 'hadron-app-registry';
import configureStore from './';
import rootReducer from '../modules';
import { expect } from 'chai';

const INITIAL_STATE = rootReducer(undefined, { type: '@@init' });

const fakeAppInstanceStore = {
  getState: function () {
    return {
      instance: {
        env: 'atlas'
      }
    };
  }
};

describe('Aggregation Store', function() {
  describe('#configureStore', function() {
    context('when providing an app registry', function() {
      let store;
      const localAppRegistry = new AppRegistry();
      const globalAppRegistry = new AppRegistry();

      beforeEach(function() {
        globalAppRegistry.registerStore('App.InstanceStore', fakeAppInstanceStore);
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry
        });
      });

      it('sets the app registry state', function() {
        expect(store.getState().appRegistry).to.deep.equal({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry
        });
      });
    });

    context('when providing a serverVersion', function() {
      let store;

      beforeEach(function() {
        store = configureStore({
          serverVersion: '4.2.0'
        });
      });

      it('sets the server version the state', function() {
        expect(store.getState().serverVersion).to.equal('4.2.0');
      });
    });

    context('when providing an env', function() {
      let store;

      beforeEach(function() {
        store = configureStore({
          env: 'atlas'
        });
      });

      it('sets the env in the state', function() {
        expect(store.getState().env).to.equal('atlas');
      });
    });

    context('when providing fields', function() {
      let store;
      const fields = [ 1, 2, 3 ];

      beforeEach(function() {
        store = configureStore({
          fields: fields
        });
      });

      it('sets the server version the state', function() {
        expect(store.getState().fields).to.deep.equal(fields);
      });
    });

    context('when providing a data provider', function() {
      let store;

      beforeEach(function() {
        store = configureStore({
          dataProvider: {
            error: 'error',
            dataProvider: 'ds'
          }
        });
      });

      it('sets the data service in the state', function() {
        expect(store.getState().dataService.dataService).to.equal('ds');
      });

      it('sets the error in the state', function() {
        expect(store.getState().dataService.error).to.equal('error');
      });
    });

    context('when providing a namespace', function() {
      context('when there is no collection', function() {
        let state;

        beforeEach(function() {
          const store = configureStore({ namespace: 'db' });
          state = store.getState();
        });

        it('does not update the namespace in the store', function() {
          expect(state.namespace).to.equal('');
        });

        it('resets the app registry', function() {
          expect(state.appRegistry).to.deep.eq(INITIAL_STATE.appRegistry);
        });

        it('resets the comments', function() {
          expect(state.comments).to.equal(INITIAL_STATE.comments);
        });

        it('resets auto preview', function() {
          expect(state.autoPreview).to.equal(INITIAL_STATE.autoPreview);
        });

        it('resets the name', function() {
          expect(state.name).to.equal(INITIAL_STATE.name);
        });

        it('resets the saved pipeline', function() {
          expect(state.savedPipeline).to.equal(INITIAL_STATE.savedPipeline);
        });

        it('resets the data service', function() {
          expect(state.dataService).to.deep.eq(INITIAL_STATE.dataService);
        });

        it('resets the fields', function() {
          expect(state.fields).to.deep.eq(INITIAL_STATE.fields);
        });

        it('resets the input douments', function() {
          expect(state.inputDocuments).to.equal(INITIAL_STATE.inputDocuments);
        });

        it('resets the server version', function() {
          expect(state.serverVersion).to.equal(INITIAL_STATE.serverVersion);
        });

        it('resets is modified', function() {
          expect(state.isModified).to.equal(INITIAL_STATE.isModified);
        });

        it('resets import pipeline', function() {
          expect(state.importPipeline).to.equal(INITIAL_STATE.importPipeline);
        });

        it('resets collation', function() {
          expect(state.collation).to.equal(INITIAL_STATE.collation);
        });

        it('resets collation string', function() {
          expect(state.collationString).to.equal(INITIAL_STATE.collationString);
        });

        it('resets settings', function() {
          expect(state.settings).to.equal(INITIAL_STATE.settings);
        });

        it('resets limit', function() {
          expect(state.limit).to.equal(INITIAL_STATE.limit);
        });

        it('resets large limit', function() {
          expect(state.largeLimit).to.equal(INITIAL_STATE.largeLimit);
        });

        it('resets maxTimeMS', function() {
          expect(state.maxTimeMS).to.equal(INITIAL_STATE.maxTimeMS);
        });

        it('resets saving pipeline', function() {
          expect(state.savingPipeline).to.equal(INITIAL_STATE.savingPipeline);
        });
      });

      context('when there is a collection', function() {
        let store;

        beforeEach(function() {
          store = configureStore({ namespace: 'db.coll' });
        });

        it('updates the namespace in the store', function() {
          expect(store.getState().namespace).to.equal('db.coll');
        });

        it('resets the rest of the state to initial state', function() {
          // eslint-disable-next-line no-unused-vars
          const { aggregationWorkspaceId, ...state } = store.getState();
          // eslint-disable-next-line no-unused-vars
          state.pipelineBuilder.stageEditor = { stages: [], stageIds: [] };
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
            dataService: INITIAL_STATE.dataService,
            fields: INITIAL_STATE.fields,
            inputDocuments: INITIAL_STATE.inputDocuments,
            serverVersion: INITIAL_STATE.serverVersion,
            isModified: INITIAL_STATE.isModified,
            isAtlasDeployed: INITIAL_STATE.isAtlasDeployed,
            isReadonly: INITIAL_STATE.isReadonly,
            importPipeline: INITIAL_STATE.importPipeline,
            collationString: INITIAL_STATE.collationString,
            settings: INITIAL_STATE.settings,
            limit: INITIAL_STATE.limit,
            largeLimit: INITIAL_STATE.largeLimit,
            maxTimeMS: INITIAL_STATE.maxTimeMS,
            savingPipeline: INITIAL_STATE.savingPipeline,
            projections: INITIAL_STATE.projections,
            isNewPipelineConfirm: INITIAL_STATE.isNewPipelineConfirm,
            updateViewError: INITIAL_STATE.updateViewError,
            aggregation: INITIAL_STATE.aggregation,
            workspace: INITIAL_STATE.workspace,
            countDocuments: INITIAL_STATE.countDocuments,
            explain: INITIAL_STATE.explain,
            isDataLake: INITIAL_STATE.isDataLake,
            indexes: INITIAL_STATE.indexes,
            pipelineBuilder: INITIAL_STATE.pipelineBuilder,
          });
        });
      });
    });
  });

  describe('#onActivated', function() {
    let store;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();

    beforeEach(function() {
      globalAppRegistry.registerStore('App.InstanceStore', fakeAppInstanceStore);
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry
      });
    });

    context('when the fields change', function() {
      it('updates the fields', function(done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().fields).to.deep.equal([
            {
              name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            }
          ]);
          done();
        });

        localAppRegistry.emit('fields-changed', {
          fields: {
            harry: {
              name: 'harry',
              path: 'harry',
              count: 1,
              type: 'Number'
            },
            potter: {
              name: 'potter',
              path: 'potter',
              count: 1,
              type: 'Boolean'
            }
          },
          topLevelFields: ['harry', 'potter'],
          aceFields: [
            {
              name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            }
          ]
        });
      });
    });
  });
});
