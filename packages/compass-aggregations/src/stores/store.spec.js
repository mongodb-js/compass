import store from 'stores';
import {
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageAdded,
  stageToggled } from 'modules/stages';

describe('Aggregation Store', () => {
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
  });
});
