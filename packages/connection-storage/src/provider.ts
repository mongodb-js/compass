import { createContext, useContext } from 'react';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  type ConnectionStorage,
  type ConnectionInfo,
  type AtlasClusterMetadata,
} from './connection-storage';
import { InMemoryConnectionStorage } from './in-memory-connection-storage';
import {
  type Folder,
  type FolderOrganization,
  type FolderStorage,
} from './folder-storage';
import { InMemoryFolderStorage } from './in-memory-folder-storage';

export { InMemoryConnectionStorage, InMemoryFolderStorage };

export type { ConnectionStorage, ConnectionInfo, AtlasClusterMetadata };
export type { Folder, FolderOrganization, FolderStorage };

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

export const FolderStorageContext = createContext<FolderStorage | null>(null);

export const FolderStorageProvider = FolderStorageContext.Provider;

export function useFolderStorage(): FolderStorage {
  const folderStorage = useContext(FolderStorageContext);
  if (!folderStorage) {
    throw new Error(
      'Could not find the current FolderStorage. Did you forget to setup the FolderStorageProvider?'
    );
  }
  return folderStorage;
}

export const folderStorageLocator = createServiceLocator(
  useFolderStorage,
  'folderStorageLocator'
);

export {
  type ExportConnectionOptions,
  type ImportConnectionOptions,
} from './import-export-connection';
