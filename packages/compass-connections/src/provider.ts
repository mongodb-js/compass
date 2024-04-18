import { createContext, useContext } from 'react';
import { createServiceLocator } from 'hadron-app-registry';
import { useConnectionInfo } from './connection-info-provider';

import type { DataService } from 'mongodb-data-service';
import { ConnectionsManager } from './connections-manager';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

export type { DataService };
export * from './connections-manager';
export { useConnections } from './stores/connections-store';
export { useConnectionRepository } from './hooks/use-connection-repository';
export { useActiveConnections } from './hooks/use-active-connections';

class TestConnectionsManager {
  getDataServiceForConnection() {
    return {} as DataService;
  }
}

const ConnectionsManagerContext = createContext<ConnectionsManager | null>(
  process.env.NODE_ENV === 'test'
    ? (new TestConnectionsManager() as unknown as ConnectionsManager)
    : null
);
export const ConnectionsManagerProvider = ConnectionsManagerContext.Provider;

export const useConnectionsManagerContext = (): ConnectionsManager => {
  const connectionsManager = useContext(ConnectionsManagerContext);

  if (!connectionsManager) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'ConnectionsManager not available in context. Did you forget to setup ConnectionsManagerProvider'
      );
    }
    return new ConnectionsManager({
      logger: createNoopLoggerAndTelemetry().log.unbound,
    });
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

export { useConnectionStatus } from './hooks/use-connection-status';
export {
  connectionScopedAppRegistryLocator,
  type ConnectionScopedAppRegistry,
  type ConnectionScopedAppRegistryLocator,
} from './connection-scoped-app-registry';
export {
  type CanNotOpenConnectionReason,
  useCanOpenNewConnections,
} from './hooks/use-can-open-new-connections';
export * from './connection-info-provider';
