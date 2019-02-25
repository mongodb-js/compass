import AppRegistry from 'hadron-app-registry';
import { NamespaceStore as store } from 'stores';
import { reset } from 'modules/namespace/reset';

describe('NamespaceStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    let hold;
    before(() => {
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = new AppRegistry();
      store.onActivated(global.hadronApp.appRegistry);
    });
    after(() => {
      global.hadronApp.appRegistry = hold;
    });

    context('call public ns setter', () => {
      beforeEach(() => {
        expect(store.getState().ns).to.deep.equal(''); // initial state
        store.ns = 'db.tester';
      });

      it('dispatches the change namespace action', () => {
        expect(store.getState().ns).to.equal('db.tester');
      });
      it('ns getter is correct', () => {
        expect(store.ns).to.equal('db.tester');
      });
    });
  });
});
