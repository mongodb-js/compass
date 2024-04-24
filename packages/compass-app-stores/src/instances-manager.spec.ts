import { expect } from 'chai';
import sinon from 'sinon';
import {
  MongoDBInstancesManager,
  MongoDBInstancesManagerEvents,
} from './instances-manager';
import { TEST_CONNECTION_INFO } from '@mongodb-js/compass-connections/provider';
import { MongoDBInstance } from 'mongodb-instance-model';

describe('InstancesManager', function () {
  let instancesManager: MongoDBInstancesManager;
  beforeEach(function () {
    instancesManager = new MongoDBInstancesManager();
  });

  it('should be able to create and return a MongoDB instance', function () {
    const instance = instancesManager.createMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id,
      {
        _id: 'test.com',
        hostname: 'test.com',
        port: 2000,
        topologyDescription: {
          type: '',
          servers: [],
          setName: '',
        },
      }
    );
    expect(instance).to.be.instanceOf(MongoDBInstance);
  });

  it('should be able to list all the MongoDB instances', function () {
    instancesManager.createMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id,
      {
        _id: 'test.com',
        hostname: 'test.com',
        port: 2000,
        topologyDescription: {
          type: '',
          servers: [],
          setName: '',
        },
      }
    );
    expect(instancesManager.listMongoDBInstances()).to.have.lengthOf(1);
  });

  it('should emit instance created event when an instance is created', function () {
    const onInstanceCreatedStub = sinon.stub();
    instancesManager.on(
      MongoDBInstancesManagerEvents.InstanceCreated,
      onInstanceCreatedStub
    );
    const instance = instancesManager.createMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id,
      {
        _id: 'test.com',
        hostname: 'test.com',
        port: 2000,
        topologyDescription: {
          type: '',
          servers: [],
          setName: '',
        },
      }
    );
    expect(onInstanceCreatedStub).to.be.calledOnceWithExactly(
      TEST_CONNECTION_INFO.id,
      instance
    );
  });

  it('should be able return a MongoDBInstance if available', function () {
    const nonExistentInstance =
      instancesManager.getMongoDBInstanceForConnection('1234'); // non-existent
    expect(nonExistentInstance).to.be.undefined;
    instancesManager.createMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id,
      {
        _id: 'test.com',
        hostname: 'test.com',
        port: 2000,
        topologyDescription: {
          type: '',
          servers: [],
          setName: '',
        },
      }
    );
    const existingInstance = instancesManager.getMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id
    );
    expect(existingInstance).to.not.be.undefined;
  });

  it('should be able to remove MongoDBInstance for a connection', function () {
    instancesManager.createMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id,
      {
        _id: 'test.com',
        hostname: 'test.com',
        port: 2000,
        topologyDescription: {
          type: '',
          servers: [],
          setName: '',
        },
      }
    );
    expect(
      instancesManager.getMongoDBInstanceForConnection(TEST_CONNECTION_INFO.id)
    ).to.not.be.undefined;
    instancesManager.removeMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id
    );
    expect(
      instancesManager.getMongoDBInstanceForConnection(TEST_CONNECTION_INFO.id)
    ).to.be.undefined;
  });

  it('should emit instances removed event when an instance is removed', function () {
    const onRemovedStub = sinon.stub();
    instancesManager.on(
      MongoDBInstancesManagerEvents.InstanceRemoved,
      onRemovedStub
    );
    instancesManager.createMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id,
      {
        _id: 'test.com',
        hostname: 'test.com',
        port: 2000,
        topologyDescription: {
          type: '',
          servers: [],
          setName: '',
        },
      }
    );
    instancesManager.removeMongoDBInstanceForConnection(
      TEST_CONNECTION_INFO.id
    );
    expect(onRemovedStub).to.be.calledWithExactly(TEST_CONNECTION_INFO.id);
  });
});
