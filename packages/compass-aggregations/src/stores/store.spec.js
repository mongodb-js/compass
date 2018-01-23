import AppRegistry from 'hadron-app-registry';
import FieldStore, { activate } from '@mongodb-js/compass-field-store';
import store from 'stores';
import {
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageAdded,
  stageToggled } from 'modules/stages';
import { INITIAL_STATE } from '../modules/index';

describe('Aggregation Store', () => {
  describe('#onActivated', () => {
    context('when the fields change', () => {
      const appRegistry = new AppRegistry();
      const docs = [
        { _id: 1, name: 'Aphex Twin' }
      ];

      before(() => {
        activate(appRegistry);
        store.onActivated(appRegistry);
        FieldStore.processDocuments(docs);
      });

      it('updates the namespace in the store', () => {
        expect(store.getState().fields).to.deep.equal([
          { name: '_id', value: '_id', score: 1, meta: 'field', version: '0.0.0' },
          { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0' }
        ]);
      });
    });
  });

  describe('#dispatch', () => {
    context('when the action is unknown', () => {
      it('returns the initial state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().stages[0].stage).to.equal('{\n  \n}');
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
          expect(store.getState().stages[0].stage).to.equal(stage);
          done();
        });
        store.dispatch(stageChanged(stage, 0));
      });
    });

    context('when the action is STAGE_DELETED', () => {
      it('deletes the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().stages).to.deep.equal([]);
          done();
        });
        store.dispatch(stageDeleted(0));
      });
    });

    context('when the action is STAGE_ADDED', () => {
      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().stages.length).to.equal(1);
          done();
        });
        store.dispatch(stageAdded());
      });
    });

    context('when the action is STAGE_TOGGLED', () => {
      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().stages[0].isEnabled).to.equal(false);
          done();
        });
        store.dispatch(stageToggled(0));
      });
    });

    context('when the action is STAGE_COLLAPSE_TOGGLED', () => {
      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().stages[0].isExpanded).to.equal(false);
          done();
        });
        store.dispatch(stageCollapseToggled(0));
      });
    });

    /* Note: this test must stay last */
    context('when the collection changes', () => {
      const appRegistry = new AppRegistry();

      before(() => {
        store.onActivated(appRegistry);
        appRegistry.emit('collection-changed', 'db.coll');
      });

      it('updates the namespace in the store', () => {
        expect(store.getState().namespace).to.equal('db.coll');
      });
      it('resets the rest of the state to initial state', () => {
        expect(store.getState()).to.deep.equal({
          namespace: 'db.coll',
          fields: INITIAL_STATE.fields,
          serverVersion: INITIAL_STATE.serverVersion,
          stages: INITIAL_STATE.stages,
          view: INITIAL_STATE.view
        });
      });
    });
  });
});
