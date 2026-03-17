import { preferencesLocator } from 'compass-preferences-model/provider';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import type { connect as devtoolsConnect } from 'mongodb-data-service';
import React, { useContext } from 'react';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { connectionStorageLocator } from '@mongodb-js/connection-storage/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
export { LegacyConnectionsModal } from './components/legacy-connections-modal';
import {
  autoconnectCheck,
  configureStore,
  disconnect,
  loadConnections,
} from './stores/connections-store-redux';
import { ConnectionsStoreContext } from './stores/store-context';
export type { ConnectionFeature } from './utils/connection-supports';
export { connectionSupports, connectable } from './utils/connection-supports';
import { compassAssistantServiceLocator } from '@mongodb-js/compass-assistant';
import { useInitialValue } from '@mongodb-js/compass-components';
import ConnectionsComponent from './stores/connections';

const CompassConnectionsPlugin = registerCompassPlugin(
  {
    name: 'CompassConnections',
    component: ConnectionsComponent,
    activate(
      initialProps,
      {
        logger,
        preferences,
        connectionStorage,
        track,
        globalAppRegistry,
        compassAssistant,
      },
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
        compassAssistant,
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
    compassAssistant: compassAssistantServiceLocator,
  }
);

const ConnectFnContext = React.createContext<
  typeof devtoolsConnect | undefined
>(undefined);

export const ConnectFnProvider: React.FunctionComponent<{
  connect?: typeof devtoolsConnect | undefined;
}> = ({ connect, children }) => {
  const connectFn = useInitialValue(() => connect);
  return (
    <ConnectFnContext.Provider value={connectFn}>
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
