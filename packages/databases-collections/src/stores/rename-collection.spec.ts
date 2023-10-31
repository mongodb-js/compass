import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import store from './rename-collection';
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
      // @ts-expect-error No `onActivated` property exists on the store
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

    context('when open rename collection is emitted', function () {
      beforeEach(function () {
        appRegistry.emit('open-rename-collection', {
          database: 'my-db',
          collection: 'my-collection',
        });
      });

      it('dispatches the toggle action', function () {
        expect(store.getState().isVisible).to.equal(true);
      });

      it('sets the database name in the store', function () {
        expect(store.getState().databaseName).to.equal('my-db');
      });

      it('sets the database name in the store', function () {
        expect(store.getState().initialCollectionName).to.equal(
          'my-collection'
        );
      });
    });
  });
});
