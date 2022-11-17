import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { MongoDBInstance, TopologyDescription } from 'mongodb-instance-model';
import store from './collections-store';
import { reset } from '../modules/reset';

const coll = {
  _id: 'db1.spotify',
  document_count: 10,
  size: 200,
  index_count: 1,
  index_size: 15,
  collation: { locale: 'se' },
};

const dbs = [
  { _id: 'db1', storage_size: 10, collections: [coll], index_count: 2 },
];

const topologyDescription = new TopologyDescription({
  type: 'Unknown',
  servers: [{ type: 'Unknown' }],
});

const fakeInstance = new MongoDBInstance({
  _id: '123',
  databases: dbs,
  topologyDescription,
  dataLake: {
    isDataLake: false,
  },
});

const fakeAppInstanceStore = {
  getState: function () {
    return {
      instance: fakeInstance,
    };
  },
};

describe('Collections [Store]', function () {
  const appRegistry = new AppRegistry();
  appRegistry.registerStore('App.InstanceStore', fakeAppInstanceStore);

  beforeEach(function () {
    store.dispatch(reset());
  });

  afterEach(function () {
    store.dispatch(reset());
  });

  describe('#onActivated', function () {
    beforeEach(function () {
      store.onActivated(appRegistry);
    });

    it('activates the app registry module', function () {
      expect(store.getState().appRegistry).to.deep.equal(appRegistry);
    });

    context('when the instance store triggers', function () {
      beforeEach(function () {
        appRegistry.emit('instance-created', { instance: fakeInstance });
        appRegistry.emit('select-database', 'db1');
      });

      context('when the database name changes', function () {
        context('when the name is different', function () {
          beforeEach(function () {
            appRegistry.emit('select-database', 'db1');
          });

          it('loads the collections', function () {
            expect(store.getState().collections).to.not.be.empty;
          });

          it('sets the database name', function () {
            expect(store.getState().databaseName).to.equal('db1');
          });
        });
      });
    });

    context('when instance state changes', function () {
      beforeEach(function () {
        appRegistry.emit('instance-created', { instance: fakeInstance });
      });

      it('dispatches the writeStateChanged action', function () {
        expect(store.getState().isWritable).to.equal(false);

        fakeInstance.topologyDescription.set({ type: 'ReplicaSetWithPrimary' });

        expect(store.getState().isWritable).to.equal(true);
      });

      it('dispatches the toggleIsDataLake action', function () {
        expect(store.getState().isDataLake).to.equal(false);

        fakeInstance.dataLake.set({ isDataLake: true });

        expect(store.getState().isDataLake).to.equal(true);
      });
    });
  });
});
