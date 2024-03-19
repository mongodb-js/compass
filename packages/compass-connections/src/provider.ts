import { createContext, useContext } from 'react';
import { createServiceLocator } from 'hadron-app-registry';
import { useConnectionInfo } from '@mongodb-js/connection-storage/provider';

import type { DataService } from 'mongodb-data-service';
import type { ConnectionsManager } from './connections-manager';

export type { DataService };
export * from './connections-manager';
export { useConnections } from './stores/connections-store';

const ConnectionsManagerContext = createContext<ConnectionsManager | null>(
  null
);
export const ConnectionsManagerProvider = ConnectionsManagerContext.Provider;

export const useConnectionsManagerContext = (): ConnectionsManager => {
  const connectionsManager = useContext(ConnectionsManagerContext);
  if (!connectionsManager) {
    throw new Error(
      'ConnectionsManager not available in context. Did you forget to setup ConnectionsManagerProvider'
    );
  }
  return connectionsManager;
};

export const connectionsManagerLocator = createServiceLocator(
  useConnectionsManagerContext,
  'connectionsManagerLocator'
);

export type DataServiceLocator<
  K extends keyof DataService = keyof DataService,
  L extends keyof DataService = K
> = () => Pick<DataService, K> & Partial<Pick<DataService, L>>;

/**
 * DataService locator method. Generic type can be used to limit the required /
 * available methods on the injected service (only on compilation time, doesn't
 * have the effect otherwise)
 */
export const dataServiceLocator = createServiceLocator(
  function dataServiceLocator<
    K extends keyof DataService = keyof DataService,
    L extends keyof DataService = K
  >(): Pick<DataService, K> & Partial<Pick<DataService, L>> {
    const connectionInfo = useConnectionInfo();
    if (!connectionInfo) {
      throw new Error(
        'ConnectionInfo for an active connection not available in context. Did you forget to setup ConnectionInfoProvider'
      );
    }
    const connectionsManager = useConnectionsManagerContext();
    const ds = connectionsManager.getDataServiceForConnection(
      connectionInfo.id
    );
    if (!ds) {
      throw new Error('DataService is not available for the active connection');
    }
    return ds;
  }
);
