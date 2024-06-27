import { createContext, useContext } from 'react';
import { createServiceLocator } from 'hadron-app-registry';
import { useConnectionInfo } from './connection-info-provider';
import { EventEmitter } from 'events';
import type { DataService } from 'mongodb-data-service';
import { ConnectionsManager } from './connections-manager';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';

export type { DataService };
export * from './connections-manager';
export { useConnections } from './components/connections-provider';
export { useConnectionsWithStatus } from './hooks/use-connections-with-status';
export { useActiveConnections } from './hooks/use-active-connections';

class TestConnectionsManager extends EventEmitter {
  getDataServiceForConnection() {
    return new EventEmitter() as unknown as DataService;
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
      logger: createNoopLogger().log.unbound,
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
    return ds;
  }
);

export { useConnectionStatus } from './hooks/use-connection-status';
export {
  connectionScopedAppRegistryLocator,
  ConnectionScopedAppRegistryImpl,
  type ConnectionScopedAppRegistry,
  type ConnectionScopedAppRegistryLocator,
} from './connection-scoped-app-registry';
export {
  type CanNotOpenConnectionReason,
  useCanOpenNewConnections,
} from './hooks/use-can-open-new-connections';
export {
  type ConnectionRepository,
  useConnectionRepository,
  areConnectionsEqual,
  connectionRepositoryLocator,
} from './components/connections-provider';
export * from './connection-info-provider';

export { useTabConnectionTheme } from './hooks/use-tab-connection-theme';
