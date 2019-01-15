import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import store from 'stores';
import { reset } from 'modules/reset';

const InstanceStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return {
      instance: {
        collections: []
      }
    };
  }
});

const WriteStateStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { isWritable: false };
  }
});

describe('DdlStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();
    appRegistry.registerStore('App.InstanceStore', InstanceStore);
    appRegistry.registerStore('DeploymentAwareness.WriteStateStore', WriteStateStore);

    before(() => {
      store.onActivated(appRegistry);
    });

    it('activates the app registry module', () => {
      expect(store.getState().appRegistry).to.deep.equal(appRegistry);
    });

    context('when the instance store triggers', () => {
      const dbs = [{ _id: 'db1', storage_size: 10, collections: [], index_count: 2 }];
      const mappedDbs = [
        { 'Collection Name': 'db1', 'Storage Size': 10, 'Collections': 0, 'Indexes': 2 }
      ];

      beforeEach(() => {
        InstanceStore.setState({ instance: { collections: dbs }});
      });

      it('dispatches the load collection action', () => {
        expect(store.getState().collections).to.deep.equal(mappedDbs);
      });
    });

    context('when write state changes', () => {
      beforeEach(() => {
        WriteStateStore.setState({ isWritable: true });
      });

      it('dispatches the change write state action', () => {
        expect(store.getState().isWritable).to.equal(true);
      });
    });
  });
});
