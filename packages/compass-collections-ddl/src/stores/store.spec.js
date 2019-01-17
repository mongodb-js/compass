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
      const coll = {
        name: 'spotify',
        document_count: 10,
        size: 200,
        index_count: 1,
        index_size: 15,
        collation: { locale: 'se' }
      };
      const dbs = [{ _id: 'db1', storage_size: 10, collections: [ coll ], index_count: 2 }];

      beforeEach(() => {
        InstanceStore.setState({ instance: { databases: dbs }});
      });

      it('dispatches the load databases action', () => {
        expect(store.getState().databases).to.deep.equal(dbs);
      });

      context('when the database name changes', () => {
        context('when the name is missing', () => {
          beforeEach(() => {
            appRegistry.emit('database-changed');
          });

          it('does not load collections', () => {
            expect(store.getState().collections).to.be.empty;
          });
        });

        context('when the name is a collection', () => {
          beforeEach(() => {
            appRegistry.emit('database-changed', 'name.test');
          });

          it('does not load collections', () => {
            expect(store.getState().collections).to.be.empty;
          });
        });

        context('when the name is different', () => {
          beforeEach(() => {
            appRegistry.emit('database-changed', 'db1');
          });

          it('loads the collections', () => {
            expect(store.getState().collections).to.not.be.empty;
          });

          it('sets the database name', () => {
            expect(store.getState().databaseName).to.equal('db1');
          });
        });
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
