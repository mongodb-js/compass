import AppRegistry from 'hadron-app-registry';
import { activate } from '@mongodb-js/compass-field-store';
import store from 'stores';
import { reset, INITIAL_STATE } from '../modules/index';
import hadronApp from 'hadron-app';

describe('Explain Plan Store', () => {
  const appRegistry = new AppRegistry();
  const collectionStore = { isReadonly: () => false };

  before(() => {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerStore('App.CollectionStore', collectionStore);
  });

  beforeEach(() => store.dispatch(reset()));

  describe('#onActivated', () => {
    beforeEach(() => {
      activate(appRegistry);
      store.onActivated(appRegistry);
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
          expect(store.getState().namespace).to.equal('');
          done();
        });

        store.dispatch({ type: 'UNKNOWN' });
      });
    });

    context('when the collection changes', () => {
      context('when there is no collection', () => {
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
            dataService: INITIAL_STATE.dataService,
            serverVersion: INITIAL_STATE.serverVersion,
            isZeroState: INITIAL_STATE.isZeroState,
            isEditable: INITIAL_STATE.isEditable,
            explain: INITIAL_STATE.explain
          });
        });
      });
    });
  });
});
