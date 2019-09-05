import configureStore, { CHANGE_STATUS } from 'stores';
import EventEmitter from 'events';

describe('LoadingStore [Store]', () => {
  context('when a change status ipc event is fired', () => {
    const ipc = new EventEmitter();
    const store = configureStore({ ipc: ipc });

    it('dispatches the change status action', (done) => {
      const unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(state.status).to.equal('Migrating');
        unsubscribe();
        done();
      });
      ipc.emit(CHANGE_STATUS, { status: 'Migrating' });
    });
  });
});
