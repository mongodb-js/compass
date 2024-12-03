import { expect } from 'chai';
import { createInstance } from '../../test/helpers';
import { spy, stub, type SinonSpy, type SinonStub } from 'sinon';
import type { DataService } from 'mongodb-data-service';
import { setupInstance } from './instance';
import type { RootState } from '.';
import type AppRegistry from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';

describe('sidebar instance', function () {
  const instance = createInstance();
  let instanceOnSpy: SinonSpy;
  const globalAppRegistry = {} as any as AppRegistry;
  const connectionsService = {
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
  } as any;
  let instancesManager: MongoDBInstancesManager;
  let logger: Logger;
  let listMongoDBInstancesStub: SinonStub;

  beforeEach(function () {
    instanceOnSpy = spy();
    instance.on = instanceOnSpy;
    instancesManager = {
      listMongoDBInstances: listMongoDBInstancesStub,
    } as any;
    logger = {
      log: { warn() {} },
      mongoLogId() {},
    } as any as Logger;
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
  ]) {
    it(`subscribes to an existing instance event ${event}`, function () {
      setupInstance(instance._id, instance)(
        stub(),
        () =>
          ({
            instance: [],
          } as any as RootState),
        {
          globalAppRegistry,
          connections: connectionsService,
          instancesManager,
          logger,
        }
      );

      expect(instanceOnSpy).to.have.been.calledWith(event);
    });
  }
});
