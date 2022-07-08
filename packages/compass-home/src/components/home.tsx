import {
  css,
  Theme,
  ThemeProvider,
  ToastArea,
} from '@mongodb-js/compass-components';
import Connections from '@mongodb-js/compass-connections';
import ipc from 'hadron-ipc';
import type { ConnectionInfo, DataService } from 'mongodb-data-service';
import { getConnectionTitle } from 'mongodb-data-service';
import toNS from 'mongodb-ns';
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useAppRegistryContext } from '../contexts/app-registry-context';
import updateTitle from '../modules/update-title';
import type Namespace from '../types/namespace';
import Workspace from './workspace';
import { useConnect } from '@mongodb-js/compass-store';

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
  const connectedDataService = useRef<DataService>();

  const [{ connectionTitle, isConnected, namespace }, dispatch] = useReducer(
    reducer,
    {
      ...initialState,
    }
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

    ipc.ipcRenderer?.on('app:disconnect', onDisconnect);

    return () => {
      // Clean up the ipc listener.
      ipc.ipcRenderer?.removeListener('app:disconnect', onDisconnect);
    };
  }, [appRegistry, onDataServiceDisconnected]);
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

  const connect = useConnect();

  if (isConnected) {
    return (
      <div className="with-global-bootstrap-styles">
        <Workspace namespace={namespace} />
      </div>
    );
  }

  return (
    <div className={homeViewStyles} data-test-id="home-view">
      <div className={homePageStyles}>
        <Connections
          // TODO: This should rather have a onConnect callback interface instead
          // of passing dependency directly, connection form knows too much
          // about data service and connection process
          // @ts-expect-error
          connectFn={connect}
          onConnected={onConnected}
          appName={appName}
        />
      </div>
    </div>
  );
}

function ThemedHome(
  props: React.ComponentProps<typeof Home>
): ReturnType<typeof Home> {
  const appRegistry = useAppRegistryContext();

  const [theme, setTheme] = useState<Theme>({
    theme: (global as any).hadronApp?.theme ?? Theme.Light,
  });

  function onDarkModeEnabled() {
    setTheme({
      theme: Theme.Dark,
    });
  }

  function onDarkModeDisabled() {
    setTheme({
      theme: Theme.Light,
    });
  }

  useEffect(() => {
    // Setup app registry listeners.
    appRegistry.on('darkmode-enable', onDarkModeEnabled);
    appRegistry.on('darkmode-disable', onDarkModeDisabled);

    return () => {
      // Clean up the app registry listeners.
      appRegistry.removeListener('darkmode-enable', onDarkModeEnabled);
      appRegistry.removeListener('darkmode-disable', onDarkModeDisabled);
    };
  }, [appRegistry]);

  return (
    <ThemeProvider theme={theme}>
      <ToastArea>
        <Home appName={props.appName}></Home>
      </ToastArea>
    </ThemeProvider>
  );
}

ThemedHome.displayName = 'HomeComponent';

export default ThemedHome;
