import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import InstanceModel from 'mongodb-instance-model';
import store from './databases-store';
import { reset } from '../modules/reset';

const WriteStateStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { isWritable: false };
  }
});

describe('Databases [Store]', () => {
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
      const instance = new InstanceModel({ _id: '123', databases: dbs });

      beforeEach(() => {
        appRegistry.emit('instance-created', {
          instance,
        });
      });

      it('dispatches the load database action', () => {
        expect(store.getState().databases).to.deep.equal(
          instance.databases.toJSON()
        );
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
