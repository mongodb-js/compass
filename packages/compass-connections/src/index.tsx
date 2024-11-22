import { preferencesLocator } from 'compass-preferences-model/provider';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { connect as devtoolsConnect } from 'mongodb-data-service';
import React, { useContext, useRef } from 'react';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { connectionStorageLocator } from '@mongodb-js/connection-storage/provider';
import type {
  ConnectionInfo,
  ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import type { ExtraConnectionData as ExtraConnectionDataForTelemetry } from '@mongodb-js/compass-telemetry';
import { ConnectedConnectionModal } from './components/connection-modal';
export { LegacyConnectionsModal } from './components/legacy-connections-modal';
import {
  autoconnectCheck,
  configureStore,
  disconnect,
  loadConnections,
} from './stores/connections-store-redux';
import {
  ConnectionsStoreContext,
  ConnectionActionsProvider,
} from './stores/store-context';
export type { ConnectionFeature } from './utils/connection-supports';
export { connectionSupports } from './utils/connection-supports';

const ConnectionsComponent: React.FunctionComponent<{
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
}> = ({ children }) => {
  return (
    <ConnectionActionsProvider>
      {children}
      <ConnectedConnectionModal />
    </ConnectionActionsProvider>
  );
};

const CompassConnectionsPlugin = registerHadronPlugin(
  {
    name: 'CompassConnections',
    component: ConnectionsComponent,
    activate(
      initialProps,
      { logger, preferences, connectionStorage, track, globalAppRegistry },
      { addCleanup, cleanup }
    ) {
      const store = configureStore(initialProps.preloadStorageConnectionInfos, {
        logger,
        preferences,
        connectionStorage,
        track,
        getExtraConnectionData: initialProps.onExtraConnectionDataRequest,
        appName: initialProps.appName,
        connectFn: initialProps.connectFn,
        globalAppRegistry,
      });

      setTimeout(() => {
        void store.dispatch(loadConnections());
        if (initialProps.onAutoconnectInfoRequest) {
          void store.dispatch(
            autoconnectCheck(
              initialProps.onAutoconnectInfoRequest,
              initialProps.doNotReconnectDisconnectedAutoconnectInfo
            )
          );
        }
      });

      // Stop all connections on disconnect
      addCleanup(() => {
        for (const connectionId of store.getState().connections.ids) {
          store.dispatch(disconnect(connectionId));
        }
      });

      return {
        store,
        deactivate: cleanup,
        context: ConnectionsStoreContext,
      };
    },
  },
  {
    logger: createLoggerLocator('COMPASS-CONNECTIONS'),
    preferences: preferencesLocator,
    connectionStorage: connectionStorageLocator,
    track: telemetryLocator,
  }
);

const ConnectFnContext = React.createContext<
  typeof devtoolsConnect | undefined
>(undefined);

export const ConnectFnProvider: React.FunctionComponent<{
  connect?: typeof devtoolsConnect | undefined;
}> = ({ connect, children }) => {
  const ref = useRef(connect);
  return (
    <ConnectFnContext.Provider value={ref.current}>
      {children}
    </ConnectFnContext.Provider>
  );
};

export default function CompassConnections(
  props: Omit<
    React.ComponentProps<typeof CompassConnectionsPlugin>,
    'connectFn'
  >
) {
  const connectFn = useContext(ConnectFnContext);
  return (
    <CompassConnectionsPlugin
      connectFn={connectFn}
      {...props}
    ></CompassConnectionsPlugin>
  );
}
