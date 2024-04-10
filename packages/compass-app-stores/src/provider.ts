import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { createServiceLocator } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import { createContext, useContext } from 'react';
import { type MongoDBInstancesManager } from './instances-manager';

export {
  MongoDBInstancesManagerEvents,
  type MongoDBInstancesManager,
} from './instances-manager';

export const MongoDBInstancesManagerContext =
  createContext<MongoDBInstancesManager | null>(null);

export const MongoDBInstancesManagerProvider =
  MongoDBInstancesManagerContext.Provider;

export const mongoDBInstancesManagerLocator = createServiceLocator(
  function mongoDBInstancesManagerLocator(): MongoDBInstancesManager {
    const instancesManager = useContext(MongoDBInstancesManagerContext);
    if (!instancesManager) {
      throw new Error(
        'No MongoDBInstancesManager available in this context, provider was not setup correctly'
      );
    }
    return instancesManager;
  }
);

export const mongoDBInstanceLocator = createServiceLocator(
  function mongoDBInstanceLocator(): MongoDBInstance {
    const connectionInfo = useConnectionInfo();
    const instancesManager = mongoDBInstancesManagerLocator();
    const instance = instancesManager.getMongoDBInstanceForConnection(
      connectionInfo.id
    );
    if (!instance) {
      throw new Error('No MongoDBInstance available in this context');
    }
    return instance;
  }
);

export type { MongoDBInstance };
