import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { expect } from 'chai';
import { activatePlugin } from './create-index';

describe('CreateIndexStore [Store]', function () {
  const appRegistry = new AppRegistry();
  let store;
  let deactivate;

  function configureStore() {
    ({ store, deactivate } = activatePlugin(
      {
        namespace: 'db.coll',
        serverVersion: '0.0.0',
      },
      { localAppRegistry: appRegistry },
      createActivateHelpers()
    ));
  }

  afterEach(function () {
    deactivate();
    appRegistry.deactivate();
  });

  context('when the field-store triggers', function () {
    beforeEach(function () {
      configureStore();
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
