import { createContext, useContext } from 'react';
import type { ConnectionStorage } from './connection-storage';
import { createServiceLocator } from 'hadron-app-registry';

export const ConnectionStorageContext = createContext<ConnectionStorage | null>(
  null
);

export const ConnectionStorageProvider = ConnectionStorageContext.Provider;

export type { ConnectionStorage };

// TODO(COMPASS-7397): storage context should not be leaking out of the service
// provider export, but the way the connection plugin is currently implemented
// prevents us from avoiding this
export function useConnectionStorageContext() {
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
