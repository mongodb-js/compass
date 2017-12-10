import store from 'stores';
import { nsChanged } from 'modules/ns';

describe('ImportExportStore [store]', () => {
  describe('#dispatch', () => {
    context('when the action is unknown', () => {
      it('returns the initial state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState()).to.deep.equal({ ns: '' });
          done();
        });
        store.dispatch({ type: 'UNKNOWN' });
      });
    });

    context('when the action is NS_CHANGED', () => {
      it('updates the ns in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState()).to.deep.equal({ ns: 'db.coll' });
          done();
        });
        store.dispatch(nsChanged('db.coll'));
      });
    });
  });
});
