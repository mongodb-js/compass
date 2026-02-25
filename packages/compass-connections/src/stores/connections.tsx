import { useSyncAssistantGlobalState } from '@mongodb-js/compass-assistant';
import type { ExtraConnectionData as ExtraConnectionDataForTelemetry } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { ConnectionStorage } from '@mongodb-js/connection-storage/provider';
import type { connect as devtoolsConnect } from 'mongodb-data-service';
import React, { useMemo } from 'react';
import ConnectedConnectionModal from '../components/connection-modal';
import type { ConnectionState, State } from './connections-store-redux';
import { getDataServiceForConnection } from './connections-store-redux';
import {
  connect,
  ConnectionActionsProvider,
  selectActiveConnections,
} from './store-context';
import { ClusterLoadError } from './cluster-load-error';

export const ConnectionsComponent: React.FunctionComponent<{
  /**
   * Application name, will be passed to the driver during connection
   */
  appName: string;
  /**
   * Callback prop that should resolve with any extra connection information to
   * be added to the connection tracking
   */
  onExtraConnectionDataRequest: (
    connectionInfo: ConnectionInfo
  ) => Promise<[ExtraConnectionDataForTelemetry, string | null]>;
  /**
   * Callback prop that might optionally resolve with the connectionInfo object
   * to be automatically connected to as soon as plugin is activated.
   * ConnectionStorage argument can be used to pick connectionInfo from the list
   * of existing connections
   */
  onAutoconnectInfoRequest?: (
    connectionStorage: ConnectionStorage
  ) => Promise<ConnectionInfo | undefined>;
  /**
   * By default any connection returned by `onAutoconnectInfoRequest` will be
   * automatically connected. This property can be used to disable "reconnect"
   * if connection with the matching id was explicitly disconnected by the user
   * in the UI before in the same session. Currently this is only behavior of
   * Compass desktop.
   */
  doNotReconnectDisconnectedAutoconnectInfo?: boolean;
  /**
   * Can be used to override default connection function
   */
  connectFn?: typeof devtoolsConnect | undefined;
  /**
   * Can be used to provide preloaded connections instead of triggering loading
   * connections on plugin activate
   */
  preloadStorageConnectionInfos?: ConnectionInfo[];
  /**
   * Whether or not the error state should be displayed when loading clusters
   * failed
   */
  showErrorStateOnInitialConnectionLoadError?: boolean;
  /**
   * List of active connections (used to sync to assistant global state)
   */
  activeConnections: ConnectionState[];
  /**
   * If `true`, will show an error screen instead of an empty compass window if
   * fetching connection info from connection store failed on first load
   */
  showErrorStateOnConnectionLoadError?: boolean;
  initialConnectionLoadFailed?: boolean;
}> = ({
  activeConnections,
  showErrorStateOnConnectionLoadError,
  initialConnectionLoadFailed,
  children,
}) => {
  const activeConnectionsInfo = useMemo(() => {
    return activeConnections.map((connection) => {
      return {
        ...connection.info,
        connectOptions:
          getDataServiceForConnection(
            connection.info.id
          )?.getMongoClientConnectionOptions()?.options ?? null,
      };
    });
  }, [activeConnections]);
  useSyncAssistantGlobalState('activeConnections', activeConnectionsInfo);

  if (showErrorStateOnConnectionLoadError && initialConnectionLoadFailed) {
    return <ClusterLoadError></ClusterLoadError>;
  }

  return (
    <ConnectionActionsProvider>
      {children}
      <ConnectedConnectionModal />
    </ConnectionActionsProvider>
  );
};

export default connect((state: State) => {
  return {
    activeConnections: selectActiveConnections(state.connections.byId),
    initialConnectionLoadFailed: state.connections.status === 'loading-error',
  };
})(ConnectionsComponent);
