import { EventEmitter } from 'events';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { MongoDBInstance, type MongoDBInstanceProps } from './models/instance';

export const MongoDBInstancesManagerEvents = {
  InstanceCreated: 'instance-started',
  InstanceRemoved: 'instance-removed',
} as const;

type MongoDBInstancesManagerEvent =
  typeof MongoDBInstancesManagerEvents[keyof typeof MongoDBInstancesManagerEvents];

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

  // TODO(COMPASS-7831): Remove this method and its usage once the linked
  // ticket's dependencies are resolved.
  listMongoDBInstances() {
    return new Map(this.instances);
  }

  getMongoDBInstanceForConnection(
    connectionInfoId: ConnectionInfo['id']
  ): MongoDBInstance {
    const instance = this.instances.get(connectionInfoId);
    if (!instance) {
      throw new Error(
        `MongoDBInstance for connectionId - ${connectionInfoId} not present in InstancesManager.`
      );
    }
    return instance;
  }

  removeMongoDBInstanceForConnection(connectionInfoId: ConnectionInfo['id']) {
    this.instances.delete(connectionInfoId);
    this.emit(MongoDBInstancesManagerEvents.InstanceRemoved, connectionInfoId);
  }

  on<T extends MongoDBInstancesManagerEvent>(
    eventName: T,
    listener: MongoDBInstancesManagerEventListeners[T]
  ): this {
    return super.on(eventName, listener);
  }

  off<T extends MongoDBInstancesManagerEvent>(
    eventName: T,
    listener: MongoDBInstancesManagerEventListeners[T]
  ): this {
    return super.off(eventName, listener);
  }

  once<T extends MongoDBInstancesManagerEvent>(
    eventName: T,
    listener: MongoDBInstancesManagerEventListeners[T]
  ): this {
    return super.once(eventName, listener);
  }

  removeListener<T extends MongoDBInstancesManagerEvent>(
    eventName: T,
    listener: MongoDBInstancesManagerEventListeners[T]
  ): this {
    return super.removeListener(eventName, listener);
  }

  emit<T extends MongoDBInstancesManagerEvent>(
    eventName: T,
    ...args: Parameters<MongoDBInstancesManagerEventListeners[T]>
  ): boolean {
    return super.emit(eventName, ...args);
  }
}
