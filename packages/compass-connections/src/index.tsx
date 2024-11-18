import { registerHadronPlugin } from 'hadron-app-registry';
import {
  autoconnectCheck,
  configureStore,
  loadConnections,
} from './stores/connections-store-redux';
import React, { useContext, useRef } from 'react';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { connectionStorageLocator } from '@mongodb-js/connection-storage/provider';
import { ConnectionsStoreContext } from './stores/store-context';
export { default as SingleConnectionForm } from './components/legacy-connections';
export { LegacyConnectionsModal } from './components/legacy-connections-modal';
export { useConnectionFormPreferences } from './hooks/use-connection-form-preferences';
import type { connect as devtoolsConnect } from 'mongodb-data-service';
export type { ConnectionFeature } from './utils/connection-supports';
export { connectionSupports } from './utils/connection-supports';
import ConnectionsPlugin from './plugin';

const CompassConnectionsPlugin = registerHadronPlugin(
  {
    name: 'CompassConnections',
    component: ConnectionsPlugin,
    activate(
      initialProps,
      { logger, preferences, connectionStorage, track },
      helpers
    ) {
      const store = configureStore(initialProps.preloadStorageConnectionInfos, {
        logger,
        preferences,
        connectionStorage,
        track,
        getExtraConnectionData: initialProps.onExtraConnectionDataRequest,
        appName: initialProps.appName,
        connectFn: initialProps.connectFn,
      });

      setTimeout(() => {
        void store.dispatch(loadConnections());
        if (initialProps.onAutoconnectInfoRequest) {
          void store.dispatch(
            autoconnectCheck(initialProps.onAutoconnectInfoRequest)
          );
        }
      });

      return {
        store,
        deactivate: helpers.cleanup,
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
