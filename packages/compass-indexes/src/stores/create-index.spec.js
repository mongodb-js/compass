import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';

import configureStore from './create-index';

describe('CreateIndexStore [Store]', function () {
  const appRegistry = new AppRegistry();
  let store;

  context('when the data service is connected', function () {
    const ds = { 'data-service': 1 };
    beforeEach(function () {
      store = configureStore({
        dataProvider: {
          error: null,
          dataProvider: ds,
        },
      });
    });
    it('dispatches the data service connected action', function () {
      expect(store.getState().dataService).to.deep.equal({ 'data-service': 1 });
    });
  });

  context('when the data service errors', function () {
    beforeEach(function () {
      store = configureStore({
        dataProvider: {
          error: { message: 'err' },
          dataProvider: null,
        },
      });
    });

    it('dispatches the data service connected action', function () {
      expect(store.getState().error).to.equal('err');
    });
  });

  context('when the field-store triggers', function () {
    beforeEach(function () {
      store = configureStore({
        localAppRegistry: appRegistry,
      });
      appRegistry.emit('fields-changed', {
        fields: { a: 1, b: 2 },
        topLevelFields: ['a'],
        autocompleteFields: ['a', 'b'],
      });
    });
    it('dispatches the changeSchemaFields action', function () {
      expect(store.getState().schemaFields).to.deep.equal(['a', 'b']);
    });
  });
});
