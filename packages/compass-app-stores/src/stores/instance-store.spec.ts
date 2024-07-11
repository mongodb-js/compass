import { EventEmitter } from 'events';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { createInstancesStore } from './instance-store';
import sinon from 'sinon';
import { expect } from 'chai';

import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { MongoDBInstance } from 'mongodb-instance-model';
import {
  ConnectionsManager,
  ConnectionsManagerEvents,
} from '@mongodb-js/compass-connections/provider';
import { type MongoDBInstancesManager } from '../instances-manager';

class FakeDataService extends EventEmitter {
  instanceInfo: any;
  getConnectionString() {
    return { hosts: ['localhost:27020'] };
  }
  instance() {
    return Promise.resolve(this.instanceInfo);
  }
  listDatabases() {
    return Promise.resolve([{ _id: 'foo' }]);
  }
  databaseStats() {
    return Promise.resolve({});
  }
  listCollections() {
    return Promise.resolve([{ _id: 'foo.bar' }, { _id: 'foo.buz' }]);
  }
  getLastSeenTopology() {
    return {
      type: 'Unknown',
      servers: [],
      setName: 'foo',
    };
  }
}

function createDataService(
  instanceInfo: any = { build: { version: '1.2.3' }, host: { arch: 'x64' } }
): any {
  const dataService = new FakeDataService();
  dataService.instanceInfo = instanceInfo;
  return dataService;
}

describe('InstanceStore [Store]', function () {
  const connectedConnectionInfoId = '1';
  let globalAppRegistry: AppRegistry;
  let dataService: any;
  let connectionsManager: ConnectionsManager;
  let store: ReturnType<typeof createInstancesStore>;
  let instancesManager: MongoDBInstancesManager;

  let sandbox: sinon.SinonSandbox;

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
    globalAppRegistry = new AppRegistry();
    sandbox = sinon.createSandbox();

    dataService = createDataService();
    const logger = createNoopLogger();
    connectionsManager = new ConnectionsManager({
      logger: logger.log.unbound,
      __TEST_CONNECT_FN: () => Promise.resolve(dataService),
    });

    store = createInstancesStore(
      {
        connectionsManager,
        globalAppRegistry,
        logger,
      },
      createActivateHelpers()
    );
    instancesManager = store.getState().instancesManager;
  });

  afterEach(function () {
    sandbox.restore();
    store.deactivate();
  });

  it('should not have any MongoDBInstance if no connection is established', function () {
    expect(instancesManager.listMongoDBInstances()).to.be.of.length(0);
  });

  it('should have a MongodbInstance for each of the connected connection', function () {
    for (const connectedConnectionInfoId of ['1', '2', '3']) {
      connectionsManager.emit(
        ConnectionsManagerEvents.ConnectionAttemptSuccessful,
        connectedConnectionInfoId,
        dataService
      );
    }

    expect(() => instancesManager.getMongoDBInstanceForConnection('1')).to.not
      .throw;
    expect(() => instancesManager.getMongoDBInstanceForConnection('2')).to.not
      .throw;
    expect(() => instancesManager.getMongoDBInstanceForConnection('3')).to.not
      .throw;
  });

  context('when connected', function () {
    let connectedInstance: MongoDBInstance;
    let initialInstanceRefreshedPromise: Promise<unknown>;
    beforeEach(function () {
      sinon
        .stub(connectionsManager, 'getDataServiceForConnection')
        .returns(dataService);
      connectionsManager.emit(
        ConnectionsManagerEvents.ConnectionAttemptSuccessful,
        connectedConnectionInfoId,
        dataService
      );
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
        sandbox
          .stub(dataService, 'instance')
          .returns({ build: { version: '3.2.1' } });
        await initialInstanceRefreshedPromise;
        const instance = instancesManager.getMongoDBInstanceForConnection(
          connectedConnectionInfoId
        );
        expect(instance).to.have.nested.property('build.version', '1.2.3');
        globalAppRegistry.emit('refresh-data');
        await waitForInstanceRefresh(instance);
      });

      it('calls instance model fetch', function () {
        const instance = instancesManager.getMongoDBInstanceForConnection('1');
        expect(instance).to.have.nested.property('build.version', '3.2.1');
      });
    });

    context('when instance ready', function () {
      beforeEach(async function () {
        await initialInstanceRefreshedPromise;
        await Promise.all(
          connectedInstance.databases.map((db) => {
            return db.fetchCollections({ dataService });
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
            connectionId: '1',
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
            connectionId: '1',
          });
          expect((coll as any)._events).to.not.exist;
        });

        it('should remove database if last collection was removed', function () {
          globalAppRegistry.emit('collection-dropped', 'foo.bar', {
            connectionId: '1',
          });
          globalAppRegistry.emit('collection-dropped', 'foo.buz', {
            connectionId: '1',
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
            connectionId: '1',
          });
          expect(connectedInstance.databases).to.have.lengthOf(0);
          expect(connectedInstance.databases.get('foo')).not.to.exist;
        });

        it('should remove all listeners from the database', function () {
          const db = connectedInstance.databases.get('foo');
          db?.on('change', () => {});
          expect((db as any)._events.change).to.have.lengthOf(1);
          globalAppRegistry.emit('database-dropped', 'foo', {
            connectionId: '1',
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
    it('should remove the instance from InstancesManager and also remove listeners from the old instance', async function () {
      // first connect
      connectionsManager.emit(
        ConnectionsManagerEvents.ConnectionAttemptSuccessful,
        connectedConnectionInfoId,
        dataService
      );

      // setup a spy on old instance
      const oldInstance = instancesManager.getMongoDBInstanceForConnection(
        connectedConnectionInfoId
      );
      const oldFetchDatabasesSpy = sinon.spy(oldInstance, 'fetchDatabases');

      // now disconnect
      connectionsManager.emit(
        ConnectionsManagerEvents.ConnectionDisconnected,
        connectedConnectionInfoId
      );

      // there is no instance in store InstancesManager now
      expect(() =>
        instancesManager.getMongoDBInstanceForConnection(
          connectedConnectionInfoId
        )
      ).to.throw;

      // lets connect again and ensure that old instance does not receive events anymore
      const newDataService = createDataService();
      sinon
        .stub(connectionsManager, 'getDataServiceForConnection')
        .returns(dataService);
      connectionsManager.emit(
        ConnectionsManagerEvents.ConnectionAttemptSuccessful,
        connectedConnectionInfoId,
        newDataService
      );

      // setup a spy on new instance
      const newInstance = instancesManager.getMongoDBInstanceForConnection(
        connectedConnectionInfoId
      );
      const newFetchDatabasesSpy = sinon.spy(newInstance, 'fetchDatabases');

      globalAppRegistry.emit('refresh-databases', {
        connectionId: connectedConnectionInfoId,
      });
      expect(oldFetchDatabasesSpy).to.not.be.called;
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(newFetchDatabasesSpy).to.be.called;
    });
  });
});
