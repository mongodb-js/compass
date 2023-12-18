import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import { createSidebarStore } from '.';
import { createInstance } from '../../test/helpers';
import type { Database } from '../modules/databases';
import type { MongoDBInstance } from 'mongodb-instance-model';

const instance = createInstance();

function getDatabases(_instance: MongoDBInstance) {
  return _instance.databases.map((db: Database) => {
    return {
      _id: db._id,
      name: db.name,
      collectionsStatus: db.collectionsStatus,
      collectionsLength: db.collectionsLength,
      collections: db.collections.map((coll) => {
        return {
          _id: coll._id,
          name: coll.name,
          type: coll.type,
          pipeline: coll.pipeline,
          sourceName: coll.sourceName,
        };
      }),
    };
  });
}

describe('SidebarStore [Store]', function () {
  const globalAppRegistry = new AppRegistry();
  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;

  beforeEach(function () {
    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        dataService: {
          getConnectionOptions() {
            return {};
          },
          currentOp() {},
          top() {},
        },
        instance,
        logger: { log: { warn() {} }, mongoLogId() {} },
      } as any,
      { on() {}, cleanup() {}, addCleanup() {} }
    ));
  });

  afterEach(function () {
    deactivate();
  });

  context('when instance created', function () {
    it('updates the instance and databases state', function () {
      const state = store.getState();

      expect(state)
        .to.have.property('instance')
        .deep.equal({
          build: {
            isEnterprise: undefined,
            version: undefined,
          },
          csfleMode: 'unavailable',
          dataLake: {
            isDataLake: false,
            version: undefined,
          },
          databasesStatus: 'initial',
          env: 'on-prem',
          genuineMongoDB: {
            dbType: undefined,
            isGenuine: true,
          },
          isAtlas: false,
          isLocalAtlas: false,
          isWritable: false,
          refreshingStatus: 'initial',
          status: 'initial',
          topologyDescription: {
            servers: [],
            setName: 'foo',
            type: 'Unknown',
          },
        });
      expect(state)
        .to.have.property('databases')
        .deep.equal({
          databases: getDatabases(instance),
          filteredDatabases: getDatabases(instance),
          expandedDbList: {},
          filterRegex: null,
        });
    });
  });
});
