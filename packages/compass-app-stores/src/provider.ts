import { useConnectionInfo } from '@mongodb-js/connection-storage/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { createServiceLocator } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import { createContext, useContext } from 'react';

export const InstancesContext = createContext<
  Record<ConnectionInfo['id'], MongoDBInstance>
>({});

export const MongoDBInstanceProvider = InstancesContext.Provider;

export const mongoDBInstanceLocator = createServiceLocator(
  function mongoDBInstanceLocator(): MongoDBInstance {
    const connectionInfo = useConnectionInfo();
    const instances = useContext(InstancesContext);
    const instance = instances[connectionInfo.id];
    if (!instance) {
      throw new Error('No MongoDBInstance available in this context');
    }
    return instance;
  }
);

export type { MongoDBInstance };
