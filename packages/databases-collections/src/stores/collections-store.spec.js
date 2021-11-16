import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import InstanceModel from 'mongodb-instance-model';
import sinon from 'sinon';
import store from './collections-store';
import { reset } from '../modules/reset';

const WriteStateStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { isWritable: false };
  }
});

describe('Collections [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();
    appRegistry.registerStore('DeploymentAwareness.WriteStateStore', WriteStateStore);
    const clock = sinon.useFakeTimers();

    before(() => {
      store.onActivated(appRegistry);
      clock.runAll();
    });

    after(() => {
      clock.restore();
    });

    it('activates the app registry module', () => {
      expect(store.getState().appRegistry).to.deep.equal(appRegistry);
    });

    context('when the instance store triggers', () => {
      const coll = {
        _id: 'db1.spotify',
        document_count: 10,
        size: 200,
        index_count: 1,
        index_size: 15,
        collation: { locale: 'se' }
      };

      const dbs = [{ _id: 'db1', storage_size: 10, collections: [ coll ], index_count: 2 }];

      beforeEach(() => {
        appRegistry.emit('instance-created', {
          instance: new InstanceModel({ _id: '123', databases: dbs }),
        });
        appRegistry.emit('select-database', 'db1');
        clock.runAll();
      });

      context('when the database name changes', () => {
        context('when the name is different', () => {
          beforeEach(() => {
            appRegistry.emit('select-database', 'db1');
            clock.runAll();
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
        clock.runAll();
      });

      it('dispatches the change write state action', () => {
        expect(store.getState().isWritable).to.equal(true);
      });
    });
  });
});
