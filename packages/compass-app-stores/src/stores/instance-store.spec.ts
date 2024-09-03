import type AppRegistry from 'hadron-app-registry';
import { CompassInstanceStorePlugin } from '../plugin';
import sinon from 'sinon';
import { expect } from 'chai';
import type { MongoDBInstance } from 'mongodb-instance-model';
import { type MongoDBInstancesManager } from '../instances-manager';
import {
  createDefaultConnectionInfo,
  activatePluginWithConnections,
  cleanup,
} from '@mongodb-js/compass-connections/test';

const mockConnections = [
  createDefaultConnectionInfo(),
  createDefaultConnectionInfo(),
  createDefaultConnectionInfo(),
];

function createDataService(): any {
  return {
    getConnectionString() {
      return { hosts: ['localhost:27020'] };
    },
    listDatabases() {
      return Promise.resolve([{ _id: 'foo' }]);
    },
    databaseStats() {
      return Promise.resolve({});
    },
    listCollections() {
      return Promise.resolve([{ _id: 'foo.bar' }, { _id: 'foo.buz' }]);
    },
  };
}

describe('InstanceStore [Store]', function () {
  let globalAppRegistry: AppRegistry;
  let instancesManager: MongoDBInstancesManager;
  let sandbox: sinon.SinonSandbox;
  let getDataService: any;
  let connectionsStore: any;

  function waitForInstanceRefresh(instance: MongoDBInstance): Promise<void> {
    return new Promise((resolve) => {
      if (instance.refreshingStatus === 'ready') {
        resolve();
      }
      instance.on('change:refreshingStatus', () => {
        if (instance.refreshingStatus === 'ready') {
          resolve();
        }
      });
    });
  }

  beforeEach(function () {
    const result = activatePluginWithConnections(
      CompassInstanceStorePlugin,
      {},
      {
        connectFn() {
          return createDataService();
        },
      }
    );
    connectionsStore = result.connectionsStore;
    getDataService = result.getDataServiceForConnection;
    globalAppRegistry = result.globalAppRegistry;
    sandbox = sinon.createSandbox();
    instancesManager = result.plugin.store.getState().instancesManager;
  });

  afterEach(function () {
    sandbox.restore();
    cleanup();
  });

  it('should not have any MongoDBInstance if no connection is established', function () {
    expect(instancesManager.listMongoDBInstances()).to.be.of.length(0);
  });

  it('should have a MongodbInstance for each of the connected connection', async function () {
    for (const connectionInfo of mockConnections) {
      await connectionsStore.actions.connect(connectionInfo);
      expect(() => {
        instancesManager.getMongoDBInstanceForConnection(connectionInfo.id);
      }).to.not.throw();
    }
  });

  context('when connected', function () {
    let connectedInstance: MongoDBInstance;
    let initialInstanceRefreshedPromise: Promise<unknown>;
    const connectedConnectionInfoId = mockConnections[0].id;

    beforeEach(async function () {
      await connectionsStore.actions.connect(mockConnections[0]);
      const instance = instancesManager.getMongoDBInstanceForConnection(
        connectedConnectionInfoId
      );
      expect(instance).to.not.be.undefined;
      connectedInstance = instance;
      initialInstanceRefreshedPromise =
        waitForInstanceRefresh(connectedInstance);
    });

    context('on refresh data', function () {
      beforeEach(async function () {
        await initialInstanceRefreshedPromise;
        sandbox
          .stub(getDataService(connectedConnectionInfoId), 'instance')
          .resolves({ build: { version: '3.2.1' } });
        const instance = instancesManager.getMongoDBInstanceForConnection(
          connectedConnectionInfoId
        );
        expect(instance).to.have.nested.property('build.version', '0.0.0');
        globalAppRegistry.emit('refresh-data');
        await waitForInstanceRefresh(instance);
      });

      it('calls instance model fetch', function () {
        const instance = instancesManager.getMongoDBInstanceForConnection(
          connectedConnectionInfoId
        );
        expect(instance).to.have.nested.property('build.version', '3.2.1');
      });
    });

    context('when instance ready', function () {
      beforeEach(async function () {
        await initialInstanceRefreshedPromise;
        await Promise.all(
          connectedInstance.databases.map((db) => {
            return db.fetchCollections({
              dataService: getDataService(connectedConnectionInfoId),
            });
          })
        );
        expect(connectedInstance.databases).to.have.lengthOf(1);
        expect(connectedInstance.databases.get('foo')).to.exist;
        expect(
          connectedInstance.databases
            .get('foo')
            ?.collections.get('foo.bar', '_id')
        ).to.exist;
        expect(
          connectedInstance.databases
            .get('foo')
            ?.collections.get('foo.buz', '_id')
        ).to.exist;
      });

      context(`on 'collection-dropped' event`, function () {
        it('should not respond when the connectionId does not matches the connectionId for the instance', function () {
          // we only start with 2 collections;
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);

          // emit the event without connectionId
          globalAppRegistry.emit('collection-dropped', 'foo.bar');

          // should still be 2
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);

          // emit the event with a different connectionId
          globalAppRegistry.emit('collection-dropped', 'foo.bar', {
            connectionId: '2',
          });

          // should still be 2
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);
        });

        it('should remove collection from the database collections', function () {
          globalAppRegistry.emit('collection-dropped', 'foo.bar', {
            connectionId: connectedConnectionInfoId,
          });
          expect(
            connectedInstance.databases.get('foo')?.collections.get('foo.bar')
          ).not.to.exist;
        });

        it('should remove all listeners from the collection', function () {
          const coll = connectedInstance.databases
            .get('foo')
            ?.collections.get('foo.bar', '_id');
          coll?.on('change', () => {});
          expect((coll as any)._events.change).to.have.lengthOf(1);
          globalAppRegistry.emit('collection-dropped', 'foo.bar', {
            connectionId: connectedConnectionInfoId,
          });
          expect((coll as any)._events).to.not.exist;
        });

        it('should remove database if last collection was removed', function () {
          globalAppRegistry.emit('collection-dropped', 'foo.bar', {
            connectionId: connectedConnectionInfoId,
          });
          globalAppRegistry.emit('collection-dropped', 'foo.buz', {
            connectionId: connectedConnectionInfoId,
          });
          expect(connectedInstance.databases).to.have.lengthOf(0);
          expect(connectedInstance.databases.get('foo')).not.to.exist;
        });
      });

      context(`on 'database-dropped' event`, function () {
        it('should not respond when the connectionId does not matches the connectionId for the instance', function () {
          // we only start with 1 database;
          expect(connectedInstance.databases.length).to.equal(1);

          // emit the event without connectionId
          globalAppRegistry.emit('database-dropped', 'foo');

          // should still be 1
          expect(connectedInstance.databases.length).to.equal(1);

          // emit the event with a different connectionId
          globalAppRegistry.emit('database-dropped', 'foo', {
            connectionId: '2',
          });

          // should still be 1
          expect(connectedInstance.databases.length).to.equal(1);
        });

        it('should remove database from instance databases', function () {
          globalAppRegistry.emit('database-dropped', 'foo', {
            connectionId: connectedConnectionInfoId,
          });
          expect(connectedInstance.databases).to.have.lengthOf(0);
          expect(connectedInstance.databases.get('foo')).not.to.exist;
        });

        it('should remove all listeners from the database', function () {
          const db = connectedInstance.databases.get('foo');
          db?.on('change', () => {});
          expect((db as any)._events.change).to.have.lengthOf(1);
          globalAppRegistry.emit('database-dropped', 'foo', {
            connectionId: connectedConnectionInfoId,
          });
          expect((db as any)._events).to.not.exist;
        });
      });

      context(`on 'view-created' event`, function () {
        it('should not respond when the connectionId does not matches the connectionId for the instance', function () {
          // we only start with 2 collections;
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);

          // emit the event without connectionId
          globalAppRegistry.emit('view-created', 'foo.qux');

          // should still be 2
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);

          // emit the event with a different connectionId
          globalAppRegistry.emit('view-created', 'foo.qux', {
            connectionId: '2',
          });

          // should still be 2
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);
        });

        it('should add collection to the databases collections', function () {
          globalAppRegistry.emit('view-created', 'foo.qux', {
            connectionId: connectedConnectionInfoId,
          });
          expect(
            connectedInstance.databases.get('foo')?.collections
          ).to.have.lengthOf(3);
          expect(
            connectedInstance.databases
              .get('foo')
              ?.collections.get('foo.qux', '_id')
          ).to.exist;
        });

        it("should add new database and add collection to its collections if database doesn't exist yet", function () {
          globalAppRegistry.emit('view-created', 'bar.qux', {
            connectionId: connectedConnectionInfoId,
          });
          expect(connectedInstance.databases).to.have.lengthOf(2);
          expect(connectedInstance.databases.get('bar')).to.exist;
          expect(
            connectedInstance.databases.get('bar')?.collections
          ).to.have.lengthOf(1);
          expect(
            connectedInstance.databases.get('bar')?.collections.get('bar.qux')
          ).to.exist;
        });
      });

      context(`on 'agg-pipeline-out-executed' event`, function () {
        it('should add collection to the databases collections', function () {
          globalAppRegistry.emit('agg-pipeline-out-executed', 'foo.qux', {
            connectionId: connectedConnectionInfoId,
          });
          expect(
            connectedInstance.databases.get('foo')?.collections
          ).to.have.lengthOf(3);
          expect(
            connectedInstance.databases
              .get('foo')
              ?.collections.get('foo.qux', '_id')
          ).to.exist;
        });

        it("should add new database and add collection to its collections if database doesn't exist yet", function () {
          globalAppRegistry.emit('agg-pipeline-out-executed', 'bar.qux', {
            connectionId: connectedConnectionInfoId,
          });
          expect(connectedInstance.databases).to.have.lengthOf(2);
          expect(connectedInstance.databases.get('bar')).to.exist;
          expect(
            connectedInstance.databases.get('bar')?.collections
          ).to.have.lengthOf(1);
          expect(
            connectedInstance.databases.get('bar')?.collections.get('bar.qux')
          ).to.exist;
        });
      });

      context(`on 'collection-created' event`, function () {
        it('should not respond when the connectionId does not matches the connectionId for the instance', function () {
          // we only start with 2 collections;
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);

          // emit the event without connectionId
          globalAppRegistry.emit('collection-created', 'foo.qux');

          // should still be 2
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);

          // emit the event with a different connectionId
          globalAppRegistry.emit('collection-created', 'foo.qux', {
            connectionId: '2',
          });

          // should still be 2
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);
        });

        it('should add collection to the databases collections', function () {
          globalAppRegistry.emit('collection-created', 'foo.qux', {
            connectionId: connectedConnectionInfoId,
          });
          expect(
            connectedInstance.databases.get('foo')?.collections
          ).to.have.lengthOf(3);
          expect(
            connectedInstance.databases
              .get('foo')
              ?.collections.get('foo.qux', '_id')
          ).to.exist;
        });

        it("should add new database and add collection to its collections if database doesn't exist yet", function () {
          globalAppRegistry.emit('collection-created', 'bar.qux', {
            connectionId: connectedConnectionInfoId,
          });
          expect(connectedInstance.databases).to.have.lengthOf(2);
          expect(connectedInstance.databases.get('bar')).to.exist;
          expect(
            connectedInstance.databases.get('bar')?.collections
          ).to.have.lengthOf(1);
          expect(
            connectedInstance.databases.get('bar')?.collections.get('bar.qux')
          ).to.exist;
        });
      });

      context(`on 'collection-renamed' event`, function () {
        it('should not respond when the connectionId does not matches the connectionId for the instance', function () {
          // we only start with 2 collections;
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);

          // emit the event without connectionId
          globalAppRegistry.emit('collection-renamed', 'foo.qux');

          // should still be 2
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);

          // emit the event with a different connectionId
          globalAppRegistry.emit('collection-renamed', 'foo.qux', {
            connectionId: '2',
          });

          // should still be 2
          expect(
            connectedInstance.databases.get('foo')?.collections.length
          ).to.equal(2);
        });

        it('should update collection _id', function () {
          globalAppRegistry.emit(
            'collection-renamed',
            {
              from: 'foo.bar',
              to: 'foo.qux',
            },
            {
              connectionId: connectedConnectionInfoId,
            }
          );
          expect(
            connectedInstance.databases.get('foo')?.collections
          ).to.have.lengthOf(2);
          expect(
            connectedInstance.databases
              .get('foo')
              ?.collections.get('foo.bar', '_id')
          ).to.not.exist;
          expect(
            connectedInstance.databases
              .get('foo')
              ?.collections.get('foo.qux', '_id')
          ).to.exist;
        });
      });
    });
  });

  context('when disconnected', function () {
    const connectionInfo = mockConnections[0];
    const connectedConnectionInfoId = connectionInfo.id;

    it('should remove the instance from InstancesManager and should not perform any actions on the stale instance', async function () {
      // first connect
      await connectionsStore.actions.connect(connectionInfo);

      // setup a spy on old instance
      const oldInstance = instancesManager.getMongoDBInstanceForConnection(
        connectedConnectionInfoId
      );
      await waitForInstanceRefresh(oldInstance);

      connectionsStore.actions.disconnect(connectedConnectionInfoId);

      // setup a spy on old instance
      const oldFetchDatabasesSpy = sinon.spy(oldInstance, 'fetchDatabases');

      // there is no instance in store InstancesManager now
      expect(() => {
        instancesManager.getMongoDBInstanceForConnection(
          connectedConnectionInfoId
        );
      }).to.throw();

      // lets connect again and ensure that old instance does not receive events anymore
      await connectionsStore.actions.connect(connectionInfo);

      // setup a spy on new instance
      const newInstance = instancesManager.getMongoDBInstanceForConnection(
        connectedConnectionInfoId
      );

      let resolveFetchDatabasePromise: (() => void) | undefined;
      const fetchDatabasePromise = new Promise<void>((resolve) => {
        resolveFetchDatabasePromise = resolve;
      });
      const newFetchDatabasesSpy = sinon
        .stub(newInstance, 'fetchDatabases')
        .callsFake(() => {
          resolveFetchDatabasePromise?.();
          return Promise.resolve();
        });

      globalAppRegistry.emit('refresh-databases', {
        connectionId: connectedConnectionInfoId,
      });
      await fetchDatabasePromise;
      expect(oldFetchDatabasesSpy).to.not.be.called;
      expect(newFetchDatabasesSpy).to.be.called;
    });
  });
});
