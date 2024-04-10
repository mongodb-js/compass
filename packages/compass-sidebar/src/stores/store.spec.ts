import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import { stub, type SinonStub, spy, type SinonSpy } from 'sinon';
import { createSidebarStore } from '.';
import { createInstance } from '../../test/helpers';
import type { Database } from '../modules/databases';
import type { MongoDBInstance } from 'mongodb-instance-model';
import { DataService } from 'mongodb-data-service';

const CONNECTION_ID = 'webscale';

describe('SidebarStore [Store]', function () {
  const instance = createInstance();
  const globalAppRegistry = {};

  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;
  let listMongoDBInstancesStub: SinonStub;

  beforeEach(function () {
    instance.on = spy();

    listMongoDBInstancesStub = stub().returns(
      new Map([[CONNECTION_ID, instance]])
    );

    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        connectionsManager: {
          getDataServiceForConnection(id: string) {
            return {
              getConnectionOptions() {
                return {};
              },
              currentOp() {
                return Promise.resolve(null);
              },
              top() {
                return Promise.resolve(null);
              },
            } as unknown as DataService;
          },
        } as any,
        instancesManager: {
          listMongoDBInstances: listMongoDBInstancesStub,
        },
        logger: { log: { warn() {} }, mongoLogId() {} },
      } as any,
      { on() {}, cleanup() {}, addCleanup() {} } as any
    ));
  });

  afterEach(function () {
    deactivate();
  });

  for (const event of [
    'change:status',
    'change:refreshingStatus',
    'change:databasesStatus',
    'change:csfleMode',
    'change:topologyDescription',
    'change:isWritable',
    'change:env',
    'change:databasesStatus',
    'add:databases',
    'remove:databases',
    'change:databases',
    'change:databases.collectionsStatus',
    'add:collections',
    'remove:collections',
    'change:collections._id',
    'change:collections.status',
    'change:genuineMongoDB.isGenuine',
  ]) {
    it(`subscribes to an existing instance event ${event}`, function () {
      expect(instance.on).to.have.been.calledWith(event);
    });
  }
});
