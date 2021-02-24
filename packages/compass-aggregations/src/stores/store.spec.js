import AppRegistry from 'hadron-app-registry';
import configureStore from 'stores';
import {
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageAdded,
  stageAddedAfter,
  stageToggled
} from 'modules/pipeline';
import { INITIAL_STATE } from '../modules/index';

describe('Aggregation Store', () => {
  describe('#configureStore', () => {
    context('when providing an app registry', () => {
      let store;
      const localAppRegistry = new AppRegistry();
      const globalAppRegistry = new AppRegistry();

      beforeEach(() => {
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry
        });
      });

      it('sets the app registry the state', () => {
        expect(store.getState().appRegistry).to.deep.equal({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry
        });
      });
    });

    context('when providing a serverVersion', () => {
      let store;

      beforeEach(() => {
        store = configureStore({
          serverVersion: '4.2.0'
        });
      });

      it('sets the server version the state', () => {
        expect(store.getState().serverVersion).to.equal('4.2.0');
      });
    });

    context('when providing an env', () => {
      let store;

      beforeEach(() => {
        store = configureStore({
          env: 'atlas'
        });
      });

      it('sets the env in the state', () => {
        expect(store.getState().env).to.equal('atlas');
      });
    });

    context('when providing fields', () => {
      let store;
      const fields = [ 1, 2, 3 ];

      beforeEach(() => {
        store = configureStore({
          fields: fields
        });
      });

      it('sets the server version the state', () => {
        expect(store.getState().fields).to.deep.equal(fields);
      });
    });

    context('when providing a data provider', () => {
      let store;

      beforeEach(() => {
        store = configureStore({
          dataProvider: {
            error: 'error',
            dataProvider: 'ds'
          }
        });
      });

      it('sets the data service in the state', () => {
        expect(store.getState().dataService.dataService).to.equal('ds');
      });

      it('sets the error in the state', () => {
        expect(store.getState().dataService.error).to.equal('error');
      });
    });

    context('when providing a namespace', () => {
      context('when there is no collection', () => {
        let state;

        beforeEach(() => {
          const store = configureStore({ namespace: 'db' });
          state = store.getState();
        });

        it('does not update the namespace in the store', () => {
          expect(state.namespace).to.equal('');
        });

        it('resets the app registry', () => {
          expect(state.appRegistry).to.equal(INITIAL_STATE.appRegistry);
        });

        it('resets the comments', () => {
          expect(state.comments).to.equal(INITIAL_STATE.comments);
        });

        it('resets the sample', () => {
          expect(state.sample).to.equal(INITIAL_STATE.sample);
        });

        it('resets auto preview', () => {
          expect(state.autoPreview).to.equal(INITIAL_STATE.autoPreview);
        });

        it('resets the name', () => {
          expect(state.name).to.equal(INITIAL_STATE.name);
        });

        it('resets restore', () => {
          expect(state.restorePipeline).to.equal(INITIAL_STATE.restorePipeline);
        });

        it('resets the saved pipeline', () => {
          expect(state.savedPipeline).to.equal(INITIAL_STATE.savedPipeline);
        });

        it('resets the data service', () => {
          expect(state.dataService).to.equal(INITIAL_STATE.dataService);
        });

        it('resets the fields', () => {
          expect(state.fields).to.equal(INITIAL_STATE.fields);
        });

        it('resets the input douments', () => {
          expect(state.inputDocuments).to.equal(INITIAL_STATE.inputDocuments);
        });

        it('resets the server version', () => {
          expect(state.serverVersion).to.equal(INITIAL_STATE.serverVersion);
        });

        it('resets the pipeline with a new id', () => {
          expect(state.pipeline[0].id).to.not.equal(INITIAL_STATE.pipeline[0].id);
        });

        it('resets is modified', () => {
          expect(state.isModified).to.equal(INITIAL_STATE.isModified);
        });

        it('resets import pipeline', () => {
          expect(state.importPipeline).to.equal(INITIAL_STATE.importPipeline);
        });

        it('resets collation', () => {
          expect(state.collation).to.equal(INITIAL_STATE.collation);
        });

        it('resets collation string', () => {
          expect(state.collationString).to.equal(INITIAL_STATE.collationString);
        });

        it('resets is collation expanded', () => {
          expect(state.isCollationExpanded).to.equal(INITIAL_STATE.isCollationExpanded);
        });

        it('resets is overview on', () => {
          expect(state.isOverviewOn).to.equal(INITIAL_STATE.isOverviewOn);
        });

        it('resets settings', () => {
          expect(state.settings).to.equal(INITIAL_STATE.settings);
        });

        it('resets limit', () => {
          expect(state.limit).to.equal(INITIAL_STATE.limit);
        });

        it('resets large limit', () => {
          expect(state.largeLimit).to.equal(INITIAL_STATE.largeLimit);
        });

        it('resets maxTimeMS', () => {
          expect(state.maxTimeMS).to.equal(INITIAL_STATE.maxTimeMS);
        });

        it('resets isFullscreenOn', () => {
          expect(state.isFullscreenOn).to.equal(INITIAL_STATE.isFullscreenOn);
        });

        it('resets saving pipeline', () => {
          expect(state.savingPipeline).to.equal(INITIAL_STATE.savingPipeline);
        });
      });

      context('when there is a collection', () => {
        let store;

        beforeEach(() => {
          store = configureStore({ namespace: 'db.coll' });
        });

        it('updates the namespace in the store', () => {
          expect(store.getState().namespace).to.equal('db.coll');
        });

        it('resets the rest of the state to initial state', () => {
          expect(store.getState()).to.deep.equal({
            allowWrites: INITIAL_STATE.allowWrites,
            outResultsFn: INITIAL_STATE.outResultsFn,
            namespace: 'db.coll',
            env: INITIAL_STATE.env,
            editViewName: null,
            sourceName: null,
            appRegistry: INITIAL_STATE.appRegistry,
            comments: INITIAL_STATE.comments,
            sample: INITIAL_STATE.sample,
            autoPreview: INITIAL_STATE.autoPreview,
            name: INITIAL_STATE.name,
            id: INITIAL_STATE.id,
            restorePipeline: INITIAL_STATE.restorePipeline,
            savedPipeline: INITIAL_STATE.savedPipeline,
            dataService: INITIAL_STATE.dataService,
            fields: INITIAL_STATE.fields,
            inputDocuments: INITIAL_STATE.inputDocuments,
            serverVersion: INITIAL_STATE.serverVersion,
            pipeline: INITIAL_STATE.pipeline,
            isModified: INITIAL_STATE.isModified,
            isAtlasDeployed: INITIAL_STATE.isAtlasDeployed,
            isReadonly: INITIAL_STATE.isReadonly,
            importPipeline: INITIAL_STATE.importPipeline,
            collation: INITIAL_STATE.collation,
            collationString: INITIAL_STATE.collationString,
            isCollationExpanded: INITIAL_STATE.isCollationExpanded,
            isOverviewOn: INITIAL_STATE.isOverviewOn,
            settings: INITIAL_STATE.settings,
            limit: INITIAL_STATE.limit,
            largeLimit: INITIAL_STATE.largeLimit,
            maxTimeMS: INITIAL_STATE.maxTimeMS,
            isFullscreenOn: INITIAL_STATE.isFullscreenOn,
            savingPipeline: INITIAL_STATE.savingPipeline,
            projections: INITIAL_STATE.projections,
            isNewPipelineConfirm: INITIAL_STATE.isNewPipelineConfirm,
            updateViewError: INITIAL_STATE.updateViewError
          });
        });
      });
    });
  });

  describe('#onActivated', () => {
    let store;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();

    beforeEach(() => {
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry
      });
    });

    context('when the fields change', () => {
      it('updates the fields', (done) => {
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

  describe('#dispatch', () => {
    let store;

    beforeEach(() => {
      store = configureStore();
    });

    context('when the action is unknown', () => {
      it('returns the initial state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().pipeline[0].stage).to.equal('');
          done();
        });
        store.dispatch({ type: 'UNKNOWN' });
      });
    });

    context('when the action is STAGE_CHANGED', () => {
      const stage = '{ $match: {}}';

      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().pipeline[0].stage).to.equal(stage);
          done();
        });
        store.dispatch(stageChanged(stage, 0));
      });
    });

    context('when the action is STAGE_DELETED', () => {
      it('deletes the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().pipeline).to.deep.equal([]);
          done();
        });
        store.dispatch(stageDeleted(0));
      });
    });

    context('when the action is STAGE_ADDED', () => {
      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().pipeline.length).to.equal(2);
          done();
        });
        store.dispatch(stageAdded());
      });
    });

    context('when the action is STAGE_ADDED_AFTER', () => {
      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().pipeline.length).to.equal(2);
          done();
        });
        store.dispatch(stageAddedAfter(0));
      });
    });

    context('when the action is STAGE_TOGGLED', () => {
      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().pipeline[0].isEnabled).to.equal(false);
          done();
        });
        store.dispatch(stageToggled(0));
      });
    });

    context('when the action is STAGE_COLLAPSE_TOGGLED', () => {
      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().pipeline[0].isExpanded).to.equal(false);
          done();
        });
        store.dispatch(stageCollapseToggled(0));
      });
    });
  });
});
