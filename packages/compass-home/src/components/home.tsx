import {
  LeafyGreenProvider,
  Theme,
  ToastArea,
  css,
  cx,
  getScrollbarStyles,
  palette,
  Body,
} from '@mongodb-js/compass-components';
import Connections from '@mongodb-js/compass-connections';
import Settings from '@mongodb-js/compass-settings';
import Welcome from '@mongodb-js/compass-welcome';
import ipc from 'hadron-ipc';
import type { ConnectionInfo, DataService } from 'mongodb-data-service';
import { getConnectionTitle } from 'mongodb-data-service';
import toNS from 'mongodb-ns';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import preferences from 'compass-preferences-model';

import { useAppRegistryContext } from '../contexts/app-registry-context';
import updateTitle from '../modules/update-title';
import type Namespace from '../types/namespace';
import Workspace from './workspace';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let remote: typeof import('@electron/remote') | undefined;
try {
  remote = require('@electron/remote');
} catch {
  /* no electron, eg. mocha tests */
}

const homeViewStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100vh',
});

const hiddenStyles = css({
  display: 'none',
});

const homePageStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  flex: 1,
  overflow: 'auto',
  height: '100%',
});

const homeContainerStyles = css({
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  // ensure modals and any other overlays will
  // paint properly above the content
  position: 'relative',
  zIndex: 0,
});

const globalLightThemeStyles = css({
  backgroundColor: palette.white,
  color: palette.gray.dark2,
});

const globalDarkThemeStyles = css({
  backgroundColor: palette.gray.dark3,
  color: palette.white,
});

const defaultNS: Namespace = {
  database: '',
  collection: '',
};

type ThemeState = {
  theme: Theme;
  enabled: boolean;
};

type State = {
  connectionTitle: string;
  isConnected: boolean;
  namespace: Namespace;
  hasDisconnectedAtLeastOnce: boolean;
};

const initialState: State = {
  connectionTitle: '',
  isConnected: false,
  namespace: defaultNS,
  hasDisconnectedAtLeastOnce: false,
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
        // Reset to initial state, but do not automatically connect this time.
        ...initialState,
        hasDisconnectedAtLeastOnce: true,
      };
    default:
      return state;
  }
}

function hideCollectionSubMenu() {
  void ipc.ipcRenderer?.call('window:hide-collection-submenu');
}

function notifyMainProcessOfDisconnect() {
  void ipc.ipcRenderer?.call('compass:disconnected');
}

function Home({
  appName,
  getAutoConnectInfo,
}: {
  appName: string;
  getAutoConnectInfo?: () => Promise<ConnectionInfo | undefined>;
}): React.ReactElement | null {
  const appRegistry = useAppRegistryContext();
  const connectedDataService = useRef<DataService>();

  const [
    { connectionTitle, isConnected, namespace, hasDisconnectedAtLeastOnce },
    dispatch,
  ] = useReducer(reducer, {
    ...initialState,
  });

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

  const onConnected = useCallback(
    (connectionInfo: ConnectionInfo, dataService: DataService) => {
      appRegistry.emit(
        'data-service-connected',
        null, // No error connecting.
        dataService,
        connectionInfo
      );
    },
    [appRegistry]
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
    hideCollectionSubMenu();
    notifyMainProcessOfDisconnect();
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

  return (
    <>
      {isConnected && <Workspace namespace={namespace} />}
      {/* Hide <Connections> but keep it in scope if connected so that the connection
          import/export functionality can still be used through the application menu */}
      <div
        className={isConnected ? hiddenStyles : homeViewStyles}
        data-hidden={isConnected}
        data-testid="home-view"
      >
        <div className={homePageStyles}>
          <Connections
            onConnected={onConnected}
            isConnected={isConnected}
            appName={appName}
            getAutoConnectInfo={
              hasDisconnectedAtLeastOnce ? undefined : getAutoConnectInfo
            }
          />
        </div>
      </div>
    </>
  );
}

function getCurrentTheme(): Theme {
  return preferences.getPreferences().lgDarkmode &&
    remote?.nativeTheme?.shouldUseDarkColors
    ? Theme.Dark
    : Theme.Light;
}

function ThemedHome(
  props: React.ComponentProps<typeof Home> & {
    showWelcomeModal?: boolean;
  }
): ReturnType<typeof Home> {
  const [scrollbarsContainerRef, setScrollbarsContainerRef] =
    useState<HTMLDivElement | null>(null);
  const {
    showWelcomeModal = !preferences.getPreferences().showedNetworkOptIn,
  } = props;
  const appRegistry = useAppRegistryContext();

  const [theme, setTheme] = useState<ThemeState>({
    theme: getCurrentTheme(),
    enabled: !!preferences.getPreferences().lgDarkmode,
  });

  const darkMode = useMemo(
    () => theme.enabled && theme.theme === Theme.Dark,
    [theme]
  );

  useEffect(() => {
    const listener = () => {
      setTheme({
        theme: getCurrentTheme(),
        enabled: !!preferences.getPreferences().lgDarkmode,
      });
    };

    const unsubscribeLgDarkmodeListener = preferences.onPreferenceValueChanged(
      'lgDarkmode',
      listener
    );
    remote?.nativeTheme?.on('updated', listener);

    return () => {
      // Cleanup preference listeners.
      unsubscribeLgDarkmodeListener();
      remote?.nativeTheme?.off('updated', listener);
    };
  }, [appRegistry]);

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(showWelcomeModal);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  function showSettingsModal() {
    async function show() {
      await preferences.ensureDefaultConfigurableUserPreferences();
      setIsSettingsOpen(true);
    }

    void show();
  }

  useEffect(() => {
    ipc.ipcRenderer?.on('window:show-settings', showSettingsModal);
    return function cleanup() {
      ipc.ipcRenderer?.off('window:show-settings', showSettingsModal);
    };
  }, [appRegistry]);

  const closeWelcomeModal = useCallback(
    (showSettings?: boolean) => {
      async function close() {
        await preferences.ensureDefaultConfigurableUserPreferences();
        setIsWelcomeOpen(false);
        if (showSettings) {
          setIsSettingsOpen(true);
        }
      }

      void close();
    },
    [setIsWelcomeOpen]
  );

  const closeSettingsModal = useCallback(() => {
    setIsSettingsOpen(false);
  }, [setIsSettingsOpen]);

  return (
    <LeafyGreenProvider
      darkMode={darkMode}
      popoverPortalContainer={{
        portalContainer: scrollbarsContainerRef,
      }}
    >
      {/* Wrap the page in a body typography element so that font-size and line-height is standardized. */}
      <Body as="div">
        <div
          className={getScrollbarStyles(darkMode)}
          ref={setScrollbarsContainerRef}
        >
          {showWelcomeModal && (
            <Welcome isOpen={isWelcomeOpen} closeModal={closeWelcomeModal} />
          )}
          <Settings isOpen={isSettingsOpen} closeModal={closeSettingsModal} />
          <ToastArea>
            <div
              className={cx(
                homeContainerStyles,
                darkMode ? globalDarkThemeStyles : globalLightThemeStyles
              )}
              data-theme={theme.theme}
            >
              <Home {...props}></Home>
            </div>
          </ToastArea>
        </div>
      </Body>
    </LeafyGreenProvider>
  );
}

ThemedHome.displayName = 'HomeComponent';

export default ThemedHome;
