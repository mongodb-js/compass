import { createContext, useContext } from 'react';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  type ConnectionStorage,
  type ConnectionInfo,
  type AtlasClusterMetadata,
} from './connection-storage';
import { InMemoryConnectionStorage } from './in-memory-connection-storage';

export { InMemoryConnectionStorage };

export type { ConnectionStorage, ConnectionInfo, AtlasClusterMetadata };

export const ConnectionStorageContext = createContext<ConnectionStorage | null>(
  null
);

export const ConnectionStorageProvider = ConnectionStorageContext.Provider;

// TODO(COMPASS-7397): storage context should not be leaking out of the service
// provider export, but the way the connection plugin is currently implemented
// prevents us from avoiding this
export function useConnectionStorageContext(): ConnectionStorage {
  const connectionStorage = useContext(ConnectionStorageContext);
  if (!connectionStorage) {
    throw new Error(
      'Could not find the current ConnectionStorage. Did you forget to setup the ConnectionStorageProvider?'
    );
  }
  return connectionStorage;
}

export const connectionStorageLocator = createServiceLocator(
  useConnectionStorageContext,
  'connectionStorageLocator'
);

export {
  type ExportConnectionOptions,
  type ImportConnectionOptions,
} from './import-export-connection';
