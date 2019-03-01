import AppRegistry from 'hadron-app-registry';
import store from 'stores/create-index';
import { reset } from 'modules/reset';
import { activate } from '@mongodb-js/compass-field-store';

describe('CreateIndexStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();
    activate(appRegistry);

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

    context('when the field store emits', () => {
      beforeEach(() => {
        expect(store.getState().schemaFields).to.deep.equal([]); // initial state
      });

      it('dispatches the change schema fields action', (done) => {
        const unsubscribe = store.subscribe(() => {
          expect(store.getState().schemaFields).to.deep.equal([
            'city', 'city.home', 'loc', 'members', 'name', 'newestAlbum'
          ]);
          unsubscribe();
          done();
        });
        appRegistry.getStore('Field.Store').processSingleDocument({
          city: {home: 1}, loc: 1, members: 1, name: 1, newestAlbum: 1
        });
      });
    });
  });
});
