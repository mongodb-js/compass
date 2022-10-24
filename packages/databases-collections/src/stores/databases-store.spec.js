import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { MongoDBInstance, TopologyDescription } from 'mongodb-instance-model';
import store from './databases-store';
import { reset } from '../modules/reset';

const dbs = [{ _id: 'db1', storage_size: 10, collections: [], index_count: 2 }];

const topologyDescription = new TopologyDescription({
  type: 'Unknown',
  servers: [{ type: 'Unknown' }]
});

const fakeInstance = new MongoDBInstance({
  _id: '123',
  databases: dbs,
  topologyDescription
});

const fakeAppInstanceStore = {
  getState: function() {
    return {
      instance: fakeInstance
    };
  }
};

describe('Databases [Store]', function() {
  beforeEach(function() {
    store.dispatch(reset());
  });

  afterEach(function() {
    store.dispatch(reset());
  });

  describe('#onActivated', function() {
    const appRegistry = new AppRegistry();
    appRegistry.registerStore('App.InstanceStore', fakeAppInstanceStore);

    beforeEach(function() {
      store.onActivated(appRegistry);
    });

    it('activates the app registry module', function() {
      expect(store.getState().appRegistry).to.deep.equal(appRegistry);
    });

    context('when the instance store triggers', function() {
      beforeEach(function() {
        appRegistry.emit('instance-created', { instance: fakeInstance });
      });

      it('dispatches the load database action', function() {
        expect(store.getState().databases).to.deep.equal(
          fakeInstance.databases.toJSON()
        );
      });
    });

    context('when instance state changes', function() {
      beforeEach(function() {
        appRegistry.emit('instance-created', { instance: fakeInstance });
      });

      it('dispatches the writeStateChanged action', function() {
        expect(store.getState().isWritable).to.equal(false);

        fakeInstance.topologyDescription.set({ type: 'ReplicaSetWithPrimary' });

        expect(store.getState().isWritable).to.equal(true);
      });
    });
  });
});
