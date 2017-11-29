import store from 'stores';
import { stageChanged } from 'action-creators';

describe('Aggregation Store', () => {
  describe('#dispatch', () => {
    context('when the action is unknown', () => {
      it('returns the initial state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().stages).to.deep.equal([
            { isEnabled: true, isValid: true, stage: '' }
          ]);
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
          expect(store.getState().stages[0]).to.deep.equal({
            isEnabled: true,
            isValid: true,
            stage: stage
          });
          done();
        });
        store.dispatch(stageChanged(stage, 0));
      });
    });
  });
});
