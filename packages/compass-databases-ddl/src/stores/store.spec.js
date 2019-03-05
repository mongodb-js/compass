import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import store from 'stores';
import { reset } from 'modules/reset';

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
        { 'Database Name': 'db1', 'Storage Size': 10, 'Collections': 0, 'Indexes': 2 }
      ];

      beforeEach(() => {
        appRegistry.emit('instance-refreshed', { instance: { databases: dbs }});
      });

      it('dispatches the load database action', () => {
        expect(store.getState().databases).to.deep.equal(mappedDbs);
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
