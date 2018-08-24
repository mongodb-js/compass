import AppRegistry from 'hadron-app-registry';
import FieldStore, { activate } from '@mongodb-js/compass-field-store';
import store from 'stores';
import {
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageAdded,
  stageAddedAfter,
  stageToggled } from 'modules/pipeline';
import { reset, INITIAL_STATE } from '../modules/index';

describe('Aggregation Store', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();

    beforeEach(() => {
      activate(appRegistry);
      store.onActivated(appRegistry);
    });

    context('when the fields change', () => {
      const docs = [
        { _id: 1, name: 'Aphex Twin' }
      ];

      it('updates the namespace in the store', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().fields).to.deep.equal([
            { name: '_id', value: '_id', score: 1, meta: 'field', version: '0.0.0' },
            { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0' }
          ]);
          done();
        });

        FieldStore.processDocuments(docs);
      });
    });

    context('when the data service is connected', () => {
      beforeEach(() => {
        appRegistry.emit('data-service-connected', 'error', 'ds');
      });

      it('sets the data servicein the state', () => {
        expect(store.getState().dataService.dataService).to.equal('ds');
      });

      it('sets the error in the state', () => {
        expect(store.getState().dataService.error).to.equal('error');
      });
    });
  });

  describe('#dispatch', () => {
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

    context('when the collection changes', () => {
      context('when there is no collection', () => {
        const appRegistry = new AppRegistry();

        beforeEach(() => {
          store.onActivated(appRegistry);
          appRegistry.emit('collection-changed', 'db');
        });

        it('does not update the namespace in the store', () => {
          expect(store.getState().namespace).to.equal('');
        });

        it('resets the rest of the state to initial state', () => {
          expect(store.getState()).to.deep.equal({
            namespace: '',
            appRegistry: appRegistry,
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
            importPipeline: INITIAL_STATE.importPipeline,
            collation: INITIAL_STATE.collation,
            collationString: INITIAL_STATE.collationString,
            isCollationExpanded: INITIAL_STATE.isCollationExpanded
          });
        });
      });

      context('when there is a collection', () => {
        const appRegistry = new AppRegistry();

        beforeEach(() => {
          store.onActivated(appRegistry);
          appRegistry.emit('collection-changed', 'db.coll');
        });

        it('updates the namespace in the store', () => {
          expect(store.getState().namespace).to.equal('db.coll');
        });

        it('resets the rest of the state to initial state', () => {
          expect(store.getState()).to.deep.equal({
            namespace: 'db.coll',
            appRegistry: appRegistry,
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
            importPipeline: INITIAL_STATE.importPipeline,
            collation: INITIAL_STATE.collation,
            collationString: INITIAL_STATE.collationString,
            isCollationExpanded: INITIAL_STATE.isCollationExpanded
          });
        });
      });
    });
  });
});
