import { EventEmitter } from 'events';
import { expect } from 'chai';
import { stub, type SinonStub, spy, type SinonSpy } from 'sinon';
import { createSidebarStore } from '.';
import { createInstance } from '../../test/helpers';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import {
  MongoDBInstancesManagerEvents,
  type MongoDBInstancesManager,
} from '@mongodb-js/compass-app-stores/provider';

const CONNECTION_ID = 'webscale';
const ALL_EVENTS = [
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
];

describe('SidebarStore [Store]', function () {
  const instance = createInstance();
  const globalAppRegistry = {} as any;
  let instanceOnSpy: SinonSpy;
  let instanceOffSpy: SinonSpy;

  let deactivate: () => void;
  let listMongoDBInstancesStub: SinonStub;
  let instancesManager: MongoDBInstancesManager;

  beforeEach(function () {
    instanceOnSpy = spy();
    instanceOffSpy = spy();
    instance.on = instanceOnSpy;
    (instance as any).off = instanceOffSpy;

    listMongoDBInstancesStub = stub().returns(
      new Map([[CONNECTION_ID, instance]])
    );

    instancesManager = new EventEmitter() as MongoDBInstancesManager;
    instancesManager.listMongoDBInstances = listMongoDBInstancesStub;

    ({ deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        connections: {
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
        instancesManager: instancesManager,
        logger: createNoopLogger(),
      },
      { on() {}, cleanup() {}, addCleanup() {} } as any
    ));
  });

  afterEach(function () {
    deactivate();
  });

  for (const event of ALL_EVENTS) {
    it(`subscribes to an existing instance event ${event}`, function () {
      expect(instanceOnSpy).to.have.been.calledWith(event);
    });
  }

  describe('when a new instance is created', function () {
    beforeEach(function () {
      instancesManager.emit(
        MongoDBInstancesManagerEvents.InstanceCreated,
        'newConnection',
        createInstance()
      );
    });

    for (const event of ALL_EVENTS) {
      it(`subscribes to an existing instance event ${event}`, function () {
        expect(instanceOnSpy).to.have.been.calledWith(event);
      });
    }
  });
});
