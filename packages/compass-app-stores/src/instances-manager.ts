import { EventEmitter } from 'events';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import {
  MongoDBInstance,
  type MongoDBInstanceProps,
} from 'mongodb-instance-model';

export enum MongoDBInstancesManagerEvents {
  InstanceCreated = 'instance-started',
  InstanceRemoved = 'instance-removed',
}

export type MongoDBInstancesManagerEventListeners = {
  [MongoDBInstancesManagerEvents.InstanceCreated]: (
    connectionInfoId: ConnectionInfo['id'],
    instance: MongoDBInstance
  ) => void;

  [MongoDBInstancesManagerEvents.InstanceRemoved]: (
    connectionInfoId: ConnectionInfo['id']
  ) => void;
};

export class MongoDBInstancesManager extends EventEmitter {
  private readonly instances = new Map<ConnectionInfo['id'], MongoDBInstance>();

  createMongoDBInstanceForConnection(
    connectionInfoId: ConnectionInfo['id'],
    instanceProps: Pick<
      MongoDBInstanceProps,
      '_id' | 'hostname' | 'port' | 'topologyDescription'
    > &
      Partial<MongoDBInstanceProps>
  ) {
    const instance = new MongoDBInstance(instanceProps as MongoDBInstanceProps);
    this.instances.set(connectionInfoId, instance);
    this.emit(
      MongoDBInstancesManagerEvents.InstanceCreated,
      connectionInfoId,
      instance
    );
    return instance;
  }

  getMongoDBInstanceForConnection(connectionInfoId: ConnectionInfo['id']) {
    return this.instances.get(connectionInfoId);
  }

  removeMongoDBInstanceForConnection(connectionInfoId: ConnectionInfo['id']) {
    this.instances.delete(connectionInfoId);
    this.emit(MongoDBInstancesManagerEvents.InstanceRemoved, connectionInfoId);
  }

  on<T extends MongoDBInstancesManagerEvents>(
    eventName: T,
    listener: MongoDBInstancesManagerEventListeners[T]
  ): this {
    return super.on(eventName, listener);
  }

  off<T extends MongoDBInstancesManagerEvents>(
    eventName: T,
    listener: MongoDBInstancesManagerEventListeners[T]
  ): this {
    return super.off(eventName, listener);
  }

  once<T extends MongoDBInstancesManagerEvents>(
    eventName: T,
    listener: MongoDBInstancesManagerEventListeners[T]
  ): this {
    return super.once(eventName, listener);
  }

  removeListener<T extends MongoDBInstancesManagerEvents>(
    eventName: T,
    listener: MongoDBInstancesManagerEventListeners[T]
  ): this {
    return super.removeListener(eventName, listener);
  }

  emit<T extends MongoDBInstancesManagerEvents>(
    eventName: T,
    ...args: Parameters<MongoDBInstancesManagerEventListeners[T]>
  ): boolean {
    return super.emit(eventName, ...args);
  }
}
