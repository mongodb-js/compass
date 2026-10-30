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
  type FolderAssignment,
  type FolderStorage,
  type FolderAssignmentStorage,
} from './folder-storage';
import {
  InMemoryFolderStorage,
  InMemoryFolderAssignmentStorage,
} from './in-memory-folder-storage';

export {
  InMemoryConnectionStorage,
  InMemoryFolderStorage,
  InMemoryFolderAssignmentStorage,
};

export type { ConnectionStorage, ConnectionInfo, AtlasClusterMetadata };
export type {
  Folder,
  FolderAssignment,
  FolderStorage,
  FolderAssignmentStorage,
};

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

/**
 * The folder store and the assignment store are always consumed together, so
 * they are provided as one value.
 */
export type FolderStorageService = {
  folders: FolderStorage;
  assignments: FolderAssignmentStorage;
};

export const FolderStorageContext = createContext<FolderStorageService | null>(
  null
);

export const FolderStorageProvider = FolderStorageContext.Provider;

export function useFolderStorage(): FolderStorageService {
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
