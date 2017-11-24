import store from 'stores';
import { STAGE_CHANGED } from 'constants/actions';

describe('Aggregation Store', () => {
  describe('#dispatch', () => {
    context('when the action is unknown', () => {
      it('returns the initial state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().stages).to.deep.equal(['']);
          done();
        });
        store.dispatch({ type: 'UNKNOWN' });
      });
    });

    context('when the action is STAGE_CHANGED', () => {
      const stage = '{ $match: {}}';
      const action = { type: STAGE_CHANGED, index: 0, stage: stage };

      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().stages[0]).to.equal(stage);
          done();
        });
        store.dispatch(action);
      });
    });
  });
});
