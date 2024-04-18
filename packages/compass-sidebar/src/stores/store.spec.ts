import { expect } from 'chai';
import { stub, type SinonStub, spy, type SinonSpy } from 'sinon';
import { createSidebarStore } from '.';
import { createInstance } from '../../test/helpers';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import { TEST_CONNECTION_INFO } from '@mongodb-js/compass-connections/provider';

const CONNECTION_ID = 'webscale';

describe('SidebarStore [Store]', function () {
  const instance = createInstance();
  const globalAppRegistry = {} as any;
  let instanceOnSpy: SinonSpy;

  let deactivate: () => void;
  let listMongoDBInstancesStub: SinonStub;

  beforeEach(function () {
    instanceOnSpy = spy();
    instance.on = instanceOnSpy;

    listMongoDBInstancesStub = stub().returns(
      new Map([[CONNECTION_ID, instance]])
    );

    ({ deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        connectionsManager: {
          getDataServiceForConnection() {
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
        } as any,
        logger: createNoopLoggerAndTelemetry(),
        initialConnectionInfo: TEST_CONNECTION_INFO,
      },
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
      expect(instanceOnSpy).to.have.been.calledWith(event);
    });
  }
});
