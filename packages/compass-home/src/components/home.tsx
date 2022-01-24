import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { css } from '@mongodb-js/compass-components';
import {
  ConnectionInfo,
  DataService,
  getConnectionTitle,
  ConnectionStorage,
} from 'mongodb-data-service';
import toNS from 'mongodb-ns';
import Connections from '@mongodb-js/compass-connections';
import ipc from 'hadron-ipc';
import debugModule from 'debug';

import Workspace from './workspace';
import Namespace from '../types/namespace';
import {
  AppRegistryRoles,
  useAppRegistryContext,
  useAppRegistryRole,
} from '../contexts/app-registry-context';
import updateTitle from '../modules/update-title';

const debug = debugModule('mongodb-compass:home:home');

const homeViewStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100vh',
});

const homePageStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  flex: 1,
  overflow: 'auto',
  height: '100%',
  zIndex: 0,
});

const defaultNS: Namespace = {
  database: '',
  collection: '',
};

type State =
  | {
      connectionInfo: undefined;
      isConnected: false;
      namespace: Namespace;
    }
  | {
      connectionInfo: ConnectionInfo;
      isConnected: true;
      namespace: Namespace;
    };

const initialState: State = {
  connectionInfo: undefined,
  namespace: defaultNS,
  isConnected: false,
};

type Action =
  | {
      type: 'connected';
      connectionInfo: ConnectionInfo;
    }
  | { type: 'disconnected' }
  | { type: 'update-connection-info'; connectionInfo: ConnectionInfo }
  | { type: 'update-namespace'; namespace: Namespace };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'connected':
      return {
        ...state,
        connectionInfo: action.connectionInfo,
        namespace: { ...defaultNS },
        isConnected: true,
      };
    case 'update-connection-info':
      return {
        ...state,
        isConnected: true,
        connectionInfo: {
          ...action.connectionInfo,
        },
      };
    case 'update-namespace':
      return {
        ...state,
        namespace: action.namespace,
      };
    case 'disconnected':
      return {
        // Reset to initial state.
        ...initialState,
      };
    default:
      return state;
  }
}

function hideCollectionSubMenu() {
  void ipc.ipcRenderer?.call('window:hide-collection-submenu');
}

async function saveConnectionInfo(
  connectionInfo: ConnectionInfo,
  connectionStorage: ConnectionStorage
) {
  try {
    await connectionStorage.save(connectionInfo);
    debug(`saved connection with id ${connectionInfo.id || ''}`);
  } catch (err) {
    debug(
      `error saving connection with id ${connectionInfo.id || ''}: ${
        (err as Error).message
      }`
    );
  }
}

function Home({
  appName,
  connectionStorage = new ConnectionStorage(),
}: {
  appName: string;
  connectionStorage?: ConnectionStorage;
}): React.ReactElement | null {
  const appRegistry = useAppRegistryContext();
  const connectRole = useAppRegistryRole(AppRegistryRoles.APPLICATION_CONNECT);
  const connectedDataService = useRef<DataService>();
  const showNewConnectForm = process.env.USE_NEW_CONNECT_FORM === 'true';

  const [{ connectionInfo, isConnected, namespace }, dispatch] = useReducer(
    reducer,
    { ...initialState }
  );

  function onDataServiceConnected(
    err: Error | undefined | null,
    ds: DataService,
    connectionInfo: ConnectionInfo
  ) {
    connectedDataService.current = ds;
    dispatch({
      type: 'connected',
      connectionInfo,
    });
  }

  // TODO: Remove this comment once we only have one connections package:
  // This is currently only used by the new connections package.
  // We've moved to calling the `data-service-connected` event here instead
  // of inside `connections`/`compass-connect` and instead call it here.
  function onConnected(
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) {
    appRegistry.emit(
      'data-service-connected',
      null, // No error connecting.
      dataService,
      connectionInfo
    );
  }

  const updateAndSaveConnectionInfo = useCallback(
    (newConnectionInfo: ConnectionInfo) => {
      // Currently we silently fail if saving the favorite fails.
      void saveConnectionInfo(newConnectionInfo, connectionStorage);

      dispatch({
        type: 'update-connection-info',
        connectionInfo: newConnectionInfo,
      });
    },
    [connectionStorage]
  );

  function onSelectDatabase(ns: string) {
    hideCollectionSubMenu();
    dispatch({
      type: 'update-namespace',
      namespace: toNS(ns),
    });
  }

  function onSelectNamespace(meta: { namespace: string }) {
    dispatch({
      type: 'update-namespace',
      namespace: toNS(meta.namespace),
    });
  }

  function onInstanceWorkspaceOpenTap() {
    hideCollectionSubMenu();
    dispatch({
      type: 'update-namespace',
      namespace: toNS(''),
    });
  }

  function onOpenNamespaceInNewTab(meta: { namespace: string }) {
    dispatch({
      type: 'update-namespace',
      namespace: toNS(meta.namespace),
    });
  }

  function onAllTabsClosed() {
    dispatch({
      type: 'update-namespace',
      namespace: toNS(''),
    });
  }

  const onDataServiceDisconnected = useCallback(() => {
    dispatch({
      type: 'disconnected',
    });
    updateTitle(appName);
  }, [appName]);

  useEffect(() => {
    if (isConnected && connectionInfo) {
      updateTitle(appName, getConnectionTitle(connectionInfo) || '', namespace);
    }
  }, [isConnected, appName, connectionInfo, namespace]);

  useEffect(() => {
    async function handleDisconnectClicked() {
      if (!connectedDataService.current) {
        // We aren't connected.
        return;
      }

      await connectedDataService.current.disconnect();
      connectedDataService.current = undefined;

      appRegistry.emit('data-service-disconnected');
    }

    function onDisconnect() {
      void handleDisconnectClicked();
    }

    // TODO: Once we merge https://jira.mongodb.org/browse/COMPASS-5302
    // we can remove this check and handle the disconnect event here by default.
    if (showNewConnectForm) {
      // Setup ipc listener.
      ipc.ipcRenderer?.on('app:disconnect', onDisconnect);

      return () => {
        // Clean up the ipc listener.
        ipc.ipcRenderer?.removeListener('app:disconnect', onDisconnect);
      };
    }
  }, [appRegistry, showNewConnectForm, onDataServiceDisconnected]);

  useEffect(() => {
    // Setup app registry listeners.
    appRegistry.on('data-service-connected', onDataServiceConnected);
    appRegistry.on('data-service-disconnected', onDataServiceDisconnected);
    appRegistry.on('select-database', onSelectDatabase);
    appRegistry.on('select-namespace', onSelectNamespace);
    appRegistry.on('open-instance-workspace', onInstanceWorkspaceOpenTap);
    appRegistry.on('open-namespace-in-new-tab', onOpenNamespaceInNewTab);
    appRegistry.on('all-collection-tabs-closed', onAllTabsClosed);

    return () => {
      // Clean up the app registry listeners.
      appRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      appRegistry.removeListener(
        'data-service-disconnected',
        onDataServiceDisconnected
      );
      appRegistry.removeListener('select-database', onSelectDatabase);
      appRegistry.removeListener('select-namespace', onSelectNamespace);
      appRegistry.removeListener(
        'open-instance-workspace',
        onInstanceWorkspaceOpenTap
      );
      appRegistry.removeListener(
        'open-namespace-in-new-tab',
        onOpenNamespaceInNewTab
      );
      appRegistry.removeListener('all-collection-tabs-closed', onAllTabsClosed);
    };
  }, [appRegistry, onDataServiceDisconnected]);

  if (isConnected && connectionInfo) {
    return (
      <Workspace
        connectionInfo={connectionInfo}
        updateAndSaveConnectionInfo={updateAndSaveConnectionInfo}
        namespace={namespace}
      />
    );
  }

  if (showNewConnectForm) {
    return (
      <div className={homeViewStyles} data-test-id="home-view">
        <div className={homePageStyles}>
          <Connections onConnected={onConnected} />
        </div>
      </div>
    );
  }

  if (!connectRole) {
    return null;
  }

  const Connect = connectRole[0].component;
  return (
    <div className={homeViewStyles} data-test-id="home-view">
      <div className={homePageStyles}>
        <Connect />
      </div>
    </div>
  );
}

Home.displayName = 'HomeComponent';

export default Home;
