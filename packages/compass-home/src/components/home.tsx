import { css } from '@emotion/css';
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  ConnectionInfo,
  DataService,
  convertConnectionInfoToModel,
  getConnectionTitle,
} from 'mongodb-data-service';
import toNS from 'mongodb-ns';
import Connections from '@mongodb-js/compass-connections';

import Workspace from './workspace';
import Namespace from '../types/namespace';
import {
  AppRegistryRoles,
  useAppRegistryContext,
  useAppRegistryRole,
} from '../contexts/app-registry-context';
import updateTitle from '../modules/update-title';
import ipc from 'hadron-ipc';

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

type State = {
  connectionTitle: string;
  isConnected: boolean;
  namespace: Namespace;
};

const initialState = {
  connectionTitle: '',
  isConnected: false,
  namespace: defaultNS,
};

type Action =
  | {
      type: 'connected';
      connectionTitle: string;
    }
  | { type: 'disconnected' }
  | { type: 'update-namespace'; namespace: Namespace };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'connected':
      return {
        ...state,
        namespace: { ...defaultNS },
        isConnected: true,
        connectionTitle: action.connectionTitle,
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

function Home({ appName }: { appName: string }): React.ReactElement | null {
  const appRegistry = useAppRegistryContext();
  const connectRole = useAppRegistryRole(AppRegistryRoles.APPLICATION_CONNECT);
  const connectedDataService = useRef<DataService>();
  const showNewConnectForm = process.env.USE_NEW_CONNECT_FORM === 'true';

  const [{ connectionTitle, isConnected, namespace }, dispatch] = useReducer(
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
      connectionTitle: getConnectionTitle(connectionInfo) || '',
    });
  }

  // TODO: Remove this comment once we only have one connections package:
  // This is currently only used by the new connections package.
  // We've moved to not calling the `data-service-connected` event inside
  // of connections and instead call it here.
  async function onConnected(
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) {
    const legacyConnectionModel = await convertConnectionInfoToModel(
      connectionInfo
    );

    appRegistry.emit(
      'data-service-connected',
      null, // No error connecting.
      dataService,
      connectionInfo,
      legacyConnectionModel // TODO: Remove this once we remove the dependency in compass-sidebar.
    );
  }

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

  function onSelectInstance() {
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
    if (isConnected) {
      updateTitle(appName, connectionTitle, namespace);
    }
  }, [isConnected, appName, connectionTitle, namespace]);

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
    appRegistry.on('select-instance', onSelectInstance);
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
      appRegistry.removeListener('select-instance', onSelectInstance);
      appRegistry.removeListener(
        'open-namespace-in-new-tab',
        onOpenNamespaceInNewTab
      );
      appRegistry.removeListener('all-collection-tabs-closed', onAllTabsClosed);
    };
  }, [appRegistry, onDataServiceDisconnected]);

  if (isConnected) {
    return <Workspace namespace={namespace} />;
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
