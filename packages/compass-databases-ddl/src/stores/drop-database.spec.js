import AppRegistry from 'hadron-app-registry';
import store from 'stores/drop-database';
import { reset } from 'modules/reset';

describe('DropDatabaseStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();

    before(() => {
      store.onActivated(appRegistry);
    });

    context('when the data service is connected', () => {
      const ds = 'data-service';

      beforeEach(() => {
        appRegistry.emit('data-service-connected', null, ds);
      });

      it('dispatches the data service connected action', () => {
        expect(store.getState().dataService.dataService).to.equal(ds);
      });
    });

    context('when open drop database is emitted', () => {
      beforeEach(() => {
        appRegistry.emit('open-drop-database', 'testing');
      });

      it('dispatches the toggle action', () => {
        expect(store.getState().isVisible).to.equal(true);
      });

      it('sets the name in the store', () => {
        expect(store.getState().name).to.equal('testing');
      });
    });
  });
});
