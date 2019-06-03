import AppRegistry from 'hadron-app-registry';
import configureStore from 'stores/create-index';

describe('CreateIndexStore [Store]', () => {
  const appRegistry = new AppRegistry();
  let store;

  context('when the data service is connected', () => {
    const ds = {'data-service': 1};
    beforeEach(() => {
      store = configureStore({
        dataProvider: {
          error: null,
          dataProvider: ds
        }
      });
    });
    it('dispatches the data service connected action', () => {
      expect(store.getState().dataService).to.deep.equal({'data-service': 1});
    });
  });

  context('when the data service errors', () => {
    beforeEach(() => {
      store = configureStore({
        dataProvider: {
          error: { message: 'err' },
          dataProvider: null
        }
      });
    });

    it('dispatches the data service connected action', () => {
      expect(store.getState().error).to.equal('err');
    });
  });

  context('when the field-store triggers', () => {
    beforeEach(() => {
      store = configureStore({
        localAppRegistry: appRegistry
      });
      appRegistry.emit('fields-changed', {
        fields: {'a': 1, 'b': 2},
        topLevelFields: ['a'],
        aceFields: ['a', 'b']
      });
    });
    it('dispatches the changeSchemaFields action', () => {
      expect(store.getState().schemaFields).to.deep.equal(['a', 'b']);
    });
  });
});
