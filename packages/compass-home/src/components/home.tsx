import {
  LeafyGreenProvider,
  Theme,
  ToastArea,
  ConfirmationModalArea,
  css,
  cx,
  getScrollbarStyles,
  palette,
  Body,
  useConfirmationModal,
  GuideCueProvider,
} from '@mongodb-js/compass-components';
import type { Cue, GroupCue } from '@mongodb-js/compass-components';
import Connections from '@mongodb-js/compass-connections';
import Welcome from '@mongodb-js/compass-welcome';
import ipc from 'hadron-ipc';
import type {
  DataService,
  ReauthenticationHandler,
} from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { getConnectionTitle } from '@mongodb-js/connection-storage/renderer';
import toNS from 'mongodb-ns';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import preferences from 'compass-preferences-model';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { useAppRegistryContext } from '../contexts/app-registry-context';
import updateTitle from '../modules/update-title';
import Workspace from './workspace';
import { SignalHooksProvider } from '@mongodb-js/compass-components';
import { AtlasSignIn } from '@mongodb-js/atlas-service/renderer';

const { track } = createLoggerAndTelemetry('COMPASS-HOME-UI');

type Namespace = ReturnType<typeof toNS>;

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
  backgroundColor: palette.black,
  color: palette.white,
});

const defaultNS: Namespace = toNS('');

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

  const { showConfirmation } = useConfirmationModal();
  const reauthenticationHandler = useRef<ReauthenticationHandler>(async () => {
    const confirmed = await showConfirmation({
      title: 'Authentication expired',
      description:
        'You need to re-authenticate to the database in order to continue.',
    });
    if (!confirmed) {
      throw new Error('Reauthentication declined by user');
    }
  });

  function onDataServiceConnected(
    err: Error | undefined | null,
    ds: DataService,
    connectionInfo: ConnectionInfo
  ) {
    connectedDataService.current = ds;
    ds.addReauthenticationHandler(reauthenticationHandler.current);
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
    <SignalHooksProvider
      onSignalMount={(id) => {
        track('Signal Shown', { id });
      }}
      onSignalOpen={(id) => {
        track('Signal Opened', { id });
      }}
      onSignalPrimaryActionClick={(id) => {
        track('Signal Action Button Clicked', { id });
      }}
      onSignalLinkClick={(id) => {
        track('Signal Link Clicked', { id });
      }}
      onSignalClose={(id) => {
        track('Signal Closed', { id });
      }}
    >
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
            appRegistry={appRegistry}
            onConnected={onConnected}
            isConnected={isConnected}
            appName={appName}
            getAutoConnectInfo={
              hasDisconnectedAtLeastOnce ? undefined : getAutoConnectInfo
            }
          />
        </div>
      </div>
    </SignalHooksProvider>
  );
}

function getCurrentTheme(): Theme {
  return preferences.getPreferences().enableLgDarkmode &&
    remote?.nativeTheme?.shouldUseDarkColors
    ? Theme.Dark
    : Theme.Light;
}

function ThemedHome(
  props: React.ComponentProps<typeof Home>
): ReturnType<typeof Home> {
  const [scrollbarsContainerRef, setScrollbarsContainerRef] =
    useState<HTMLDivElement | null>(null);
  const appRegistry = useAppRegistryContext();

  const [theme, setTheme] = useState<ThemeState>({
    theme: getCurrentTheme(),
    enabled: !!preferences.getPreferences().enableLgDarkmode,
  });

  const darkMode = useMemo(
    () => theme.enabled && theme.theme === Theme.Dark,
    [theme]
  );

  useEffect(() => {
    const listener = () => {
      setTheme({
        theme: getCurrentTheme(),
        enabled: !!preferences.getPreferences().enableLgDarkmode,
      });
    };

    const unsubscribeLgDarkmodeListener = preferences.onPreferenceValueChanged(
      'enableLgDarkmode',
      listener
    );
    remote?.nativeTheme?.on('updated', listener);

    return () => {
      // Cleanup preference listeners.
      unsubscribeLgDarkmodeListener();
      remote?.nativeTheme?.off('updated', listener);
    };
  }, [appRegistry]);

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  useLayoutEffect(() => {
    // If we haven't showed welcome modal that points users to network opt in
    // yet, show the modal and update preferences with default values to reflect
    // that
    if (preferences.getPreferences().showedNetworkOptIn === false) {
      setIsWelcomeOpen(true);
      void preferences.ensureDefaultConfigurableUserPreferences();
    }
  }, []);

  const closeWelcomeModal = useCallback(
    (showSettings?: boolean) => {
      function close() {
        setIsWelcomeOpen(false);
        if (showSettings) {
          appRegistry.emit('open-compass-settings');
        }
      }

      void close();
    },
    [setIsWelcomeOpen, appRegistry]
  );

  const onGuideCueNext = useCallback((cue: Cue) => {
    track('Guide Cue Dismissed', {
      groupId: cue.groupId,
      cueId: cue.cueId,
      step: cue.step,
    });
  }, []);

  const onGuideCueNextGroup = useCallback((cue: GroupCue) => {
    if (cue.groupSteps !== cue.step) {
      track('Guide Cue Group Dismissed', {
        groupId: cue.groupId,
        cueId: cue.cueId,
        step: cue.step,
      });
    }
  }, []);

  return (
    <LeafyGreenProvider
      darkMode={darkMode}
      popoverPortalContainer={{
        portalContainer: scrollbarsContainerRef,
      }}
    >
      <GuideCueProvider
        onNext={onGuideCueNext}
        onNextGroup={onGuideCueNextGroup}
      >
        {/* Wrap the page in a body typography element so that font-size and line-height is standardized. */}
        <Body as="div">
          <div
            className={getScrollbarStyles(darkMode)}
            ref={setScrollbarsContainerRef}
          >
            <Welcome isOpen={isWelcomeOpen} closeModal={closeWelcomeModal} />
            <ConfirmationModalArea>
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
            </ConfirmationModalArea>
          </div>
          <AtlasSignIn></AtlasSignIn>
        </Body>
      </GuideCueProvider>
    </LeafyGreenProvider>
  );
}

ThemedHome.displayName = 'HomeComponent';

export default ThemedHome;
