import { useConnectionInfoContext } from '@mongodb-js/connection-storage/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { createServiceLocator } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import { createContext, useContext } from 'react';

export const InstanceContext = createContext<
  Record<ConnectionInfo['id'], MongoDBInstance>
>({});

export const MongoDBInstanceProvider = InstanceContext.Provider;

export const mongoDBInstanceLocator = createServiceLocator(
  function mongoDBInstanceLocator(): MongoDBInstance {
    const connectionInfo = useConnectionInfoContext();
    const instances = useContext(InstanceContext);
    const instance = instances[connectionInfo.id];
    if (!instance) {
      throw new Error('No MongoDBInstance available in this context');
    }
    return instance;
  }
);

export type { MongoDBInstance };
