import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import store from 'stores';
import { reset } from 'modules/reset';

const WriteStateStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { isWritable: true, description: 'store initial state description' };
  }
});
const CollectionStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return {};
  },
  isReadonly() {
    return true;
  }
});
const NamespaceStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { ns: 'initial' };
  },
  get ns() {
    return 'initial';
  }
});


describe('IndexesStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();
    appRegistry.registerStore('DeploymentAwareness.WriteStateStore', WriteStateStore);
    appRegistry.registerStore('App.CollectionStore', CollectionStore);
    appRegistry.registerStore('App.NamespaceStore', NamespaceStore);

    before(() => {
      store.onActivated(appRegistry);
    });

    it('activates the app registry module', () => {
      expect(store.getState().appRegistry).to.deep.equal(appRegistry);
    });

    context('when write state changes', () => {
      beforeEach(() => {
        expect(store.getState().isWritable).to.equal(true); // initial state
        WriteStateStore.setState({ isWritable: false, description: 'test description' });
      });

      it('dispatches the change write state action', () => {
        expect(store.getState().isWritable).to.equal(false);
        expect(store.getState().description).to.equal('test description');
      });
    });
    context('query-changed emitted', () => {
      beforeEach(() => {
        expect(store.getState().isReadonly).to.equal(false);
        appRegistry.emit('query-changed', {ns: 'test.coll'});
      });
      it('dispatches the readStateChanged action', () => {
        expect(store.getState().isReadonly).to.equal(true);
        expect(store.getState().indexes).to.deep.equal([]);
        expect(store.getState().error).to.equal(null);
      });
    });
    context('refresh-data emitted', () => {
      beforeEach(() => {
        expect(store.getState().isReadonly).to.equal(false);
        appRegistry.emit('refresh-data');
      });
      it('dispatches the readStateChanged action', () => {
        expect(store.getState().isReadonly).to.equal(true);
        expect(store.getState().indexes).to.deep.equal([]);
        expect(store.getState().error).to.equal(null);
      });
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
  });
});
