import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import store from 'stores/create-index';
import { reset } from 'modules/reset';

const FieldStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { fields: [] };
  }
});

describe('CreateIndexStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();
    appRegistry.registerStore('Field.Store', FieldStore);

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
        FieldStore.setState({
          fields: {city: {name: 'city', path: 'city', count: 1, type: 'Document', nestedFields: Array(1)},
            'city.home': {name: 'home', path: 'city.home', count: 1, type: 'String'},
            loc: {name: 'loc', path: 'loc', count: 1, type: 'String'},
            members: {name: 'members', path: 'members', count: 1, type: 'Number'},
            name: {name: 'name', path: 'name', count: 1, type: 'String'},
            newestAlbum: {name: 'newestAlbum', path: 'newestAlbum', count: 1, type: 'String'},
            _id: {name: '_id', path: '_id', count: 1, type: 'Number'}}
        });
      });

      it('dispatches the change schema fields action', () => {
        expect(store.getState().schemaFields).to.deep.equal([
          'city', 'city.home', 'loc', 'members', 'name', 'newestAlbum'
        ]);
      });
    });
  });
});
