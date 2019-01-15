import AppRegistry from 'hadron-app-registry';
import store from 'stores/create-database';
import { reset } from 'modules/reset';

describe('CreateDatabaseStore [Store]', () => {
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

    context('when open create database is emitted', () => {
      beforeEach(() => {
        appRegistry.emit('open-create-database');
      });

      it('dispatches the toggle action', () => {
        expect(store.getState().isVisible).to.equal(true);
      });
    });
  });
});
