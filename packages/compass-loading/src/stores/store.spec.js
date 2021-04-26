import configureStore, { CHANGE_STATUS } from 'stores';
import AppRegistry from 'hadron-app-registry';

describe('LoadingStore [Store]', () => {
  context('when a change status globalAppRegistry event is fired', () => {
    const globalAppRegistry = new AppRegistry();
    const store = configureStore({ globalAppRegistry: globalAppRegistry });

    it('dispatches the change status action', (done) => {
      const unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(state.status).to.equal('Migrating');
        unsubscribe();
        done();
      });
      globalAppRegistry.emit(CHANGE_STATUS, { status: 'Migrating' });
    });
  });
});
