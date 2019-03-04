import AppRegistry from 'hadron-app-registry';
import store from 'stores/create-index';
import { reset } from 'modules/reset';

describe('CreateIndexStore [Store]', () => {
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
      const ds = {'data-service': 1};
      beforeEach(() => {
        appRegistry.emit('data-service-connected', null, ds);
      });
      it('dispatches the data service connected action', () => {
        expect(store.getState().dataService).to.deep.equal({'data-service': 1});
      });
    });

    context('when the data service errors', () => {
      beforeEach(() => {
        appRegistry.emit('data-service-connected', {message: 'err'}, null);
      });
      it('dispatches the data service connected action', () => {
        expect(store.getState().error).to.equal('err');
      });
    });

    context('when the field-store triggers', () => {
      beforeEach(() => {
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
});
