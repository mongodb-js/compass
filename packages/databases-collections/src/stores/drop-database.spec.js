import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import store from './drop-database';
import { reset } from '../modules/reset';

describe('DropDatabaseStore [Store]', function () {
  beforeEach(function () {
    store.dispatch(reset());
  });

  afterEach(function () {
    store.dispatch(reset());
  });

  describe('#onActivated', function () {
    const appRegistry = new AppRegistry();

    before(function () {
      store.onActivated(appRegistry);
    });

    context('when the data service is connected', function () {
      const ds = { _testId: 'data-service', on() {} };

      beforeEach(function () {
        appRegistry.emit('data-service-connected', null, ds);
      });

      it('dispatches the data service connected action', function () {
        expect(store.getState().dataService.dataService).to.equal(ds);
      });
    });

    context('when open drop database is emitted', function () {
      beforeEach(function () {
        appRegistry.emit('open-drop-database', 'testing');
      });

      it('dispatches the toggle action', function () {
        expect(store.getState().isVisible).to.equal(true);
      });

      it('sets the name in the store', function () {
        expect(store.getState().name).to.equal('testing');
      });
    });
  });
});
