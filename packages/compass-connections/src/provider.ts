import { createServiceLocator } from 'hadron-app-registry';
import { useConnectionInfo } from './connection-info-provider';
import type { DataService } from 'mongodb-data-service';
import { useConnections } from './stores/store-context';

export type { DataService };
export { useConnectionsWithStatus } from './hooks/use-connections-with-status';
export { useActiveConnections } from './hooks/use-active-connections';

export type ConnectionsManager = Pick<
  ReturnType<typeof useConnections>,
  | 'getDataServiceForConnection'
  | 'getConnectionById'
  | 'on'
  | 'off'
  | 'removeListener'
>;

/**
 * @deprecated use `connectionsLocator` instead
 */
export const connectionsManagerLocator = createServiceLocator(
  useConnections,
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
    const connectionsManager = connectionsManagerLocator();
    if (!connectionInfo) {
      throw new Error(
        'ConnectionInfo for an active connection not available in context. Did you forget to setup ConnectionInfoProvider'
      );
    }
    return connectionsManager.getDataServiceForConnection(connectionInfo.id);
  }
);

export {
  connectionScopedAppRegistryLocator,
  ConnectionScopedAppRegistryImpl,
  type ConnectionScopedAppRegistry,
  type ConnectionScopedAppRegistryLocator,
} from './connection-scoped-app-registry';

export type {
  ConnectionInfoRef,
  ConnectionInfo,
} from './connection-info-provider';

export {
  ConnectionInfoProvider,
  useConnectionInfo,
  useConnectionInfoRef,
  connectionInfoRefLocator,
} from './connection-info-provider';

export { useTabConnectionTheme } from './hooks/use-tab-connection-theme';

export type {
  ConnectionRepository,
  ConnectionRepositoryAccess,
} from './hooks/use-connection-repository';

export {
  withConnectionRepository,
  useConnectionRepository,
  connectionRepositoryAccessLocator,
} from './hooks/use-connection-repository';

export {
  useConnectionActions,
  useConnectionForId,
  useConnectionIds,
  useConnectionInfoForId,
  useConnectionInfoRefForId,
  connectionsLocator,
} from './stores/store-context';

export { useConnectionSupports } from './hooks/use-connection-supports';

const ConnectionStatus = {
  /**
   * @deprecated use a string literal directly
   */
  Connected: 'connected',
  /**
   * @deprecated use a string literal directly
   */
  Disconnected: 'disconnected',
  /**
   * @deprecated use a string literal directly
   */
  Failed: 'failed',
} as const;

export { ConnectionStatus };
