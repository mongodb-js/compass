import { AtlasSignIn } from '@mongodb-js/atlas-service/renderer';
import {
  Body,
  CompassComponentsProvider,
  FileInputBackendProvider,
  createElectronFileInputBackend,
  css,
  cx,
  getScrollbarStyles,
  palette,
  resetGlobalCSS,
  useConfirmationModal,
} from '@mongodb-js/compass-components';
import Connections from '@mongodb-js/compass-connections';
import { CompassFindInPagePlugin } from '@mongodb-js/compass-find-in-page';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { CompassSettingsPlugin } from '@mongodb-js/compass-settings';
import Welcome from '@mongodb-js/compass-welcome';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import {
  type ConnectionInfo,
  ConnectionStorage,
} from '@mongodb-js/connection-storage/renderer';
import { AppRegistryProvider, useLocalAppRegistry } from 'hadron-app-registry';
import { ipcRenderer } from 'hadron-ipc';
import type {
  DataService,
  ReauthenticationHandler,
} from 'mongodb-data-service';
import { DataServiceProvider } from 'mongodb-data-service/provider';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import updateTitle from '../modules/update-title';
import Workspace from './workspace';
// The only place where the app-stores plugin can be used as a plugin and not a
// provider
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { preferencesLocator } from 'compass-preferences-model/provider';
import {
  ConnectionStorageContext,
  ConnectionRepositoryContextProvider,
} from '@mongodb-js/connection-storage/main';

resetGlobalCSS();

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

type State = {
  connectionInfo: ConnectionInfo | null;
  isConnected: boolean;
  hasDisconnectedAtLeastOnce: boolean;
};

const initialState: State = {
  connectionInfo: null,
  isConnected: false,
  hasDisconnectedAtLeastOnce: false,
};

type Action =
  | {
      type: 'connected';
      connectionInfo: ConnectionInfo;
    }
  | { type: 'disconnected' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'connected':
      return {
        ...state,
        isConnected: true,
        connectionInfo: action.connectionInfo,
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

function showCollectionSubMenu({ isReadOnly }: { isReadOnly: boolean }) {
  void ipcRenderer?.call('window:show-collection-submenu', { isReadOnly });
}

function hideCollectionSubMenu() {
  void ipcRenderer?.call('window:hide-collection-submenu');
}

function notifyMainProcessOfDisconnect() {
  void ipcRenderer?.call('compass:disconnected');
}

function Home({
  appName,
  getAutoConnectInfo,
}: {
  appName: string;
  getAutoConnectInfo?: () => Promise<ConnectionInfo | undefined>;
}): React.ReactElement | null {
  const appRegistry = useLocalAppRegistry();
  const connectedDataService = useRef<DataService>();

  const [
    { connectionInfo, isConnected, hasDisconnectedAtLeastOnce },
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
      connectionInfo: connectionInfo,
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

  const onDataServiceDisconnected = useCallback(() => {
    dispatch({
      type: 'disconnected',
    });
  }, []);

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

    ipcRenderer?.on('app:disconnect', onDisconnect);

    return () => {
      // Clean up the ipc listener.
      ipcRenderer?.removeListener('app:disconnect', onDisconnect);
    };
  }, [appRegistry, onDataServiceDisconnected]);

  useEffect(() => {
    // Setup app registry listeners.
    appRegistry.on('data-service-connected', onDataServiceConnected);
    appRegistry.on('data-service-disconnected', onDataServiceDisconnected);

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
    };
  }, [appRegistry, onDataServiceDisconnected]);

  const onWorkspaceChange = useCallback(
    (ws: WorkspaceTab | null, collectionInfo) => {
      const namespace =
        ws?.type === 'Collection' || ws?.type === 'Collections'
          ? ws.namespace
          : undefined;

      updateTitle(
        appName,
        connectionInfo ? getConnectionTitle(connectionInfo) : undefined,
        ws?.type,
        namespace
      );

      if (ws?.type === 'Collection') {
        showCollectionSubMenu({ isReadOnly: !!collectionInfo?.isReadonly });
      } else {
        hideCollectionSubMenu();
      }
    },
    [appName, connectionInfo]
  );

  const onDataSeviceDisconnected = useCallback(() => {
    if (!isConnected) {
      updateTitle(appName);
      hideCollectionSubMenu();
      notifyMainProcessOfDisconnect();
    }
  }, [appName, isConnected]);

  useLayoutEffect(onDataSeviceDisconnected);

  if (isConnected && !connectedDataService.current) {
    throw new Error(
      'Application is connected, but DataService is not available'
    );
  }

  const electronFileInputBackendRef = useRef(
    remote ? createElectronFileInputBackend(remote) : null
  );

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const preferences = preferencesLocator();

  useLayoutEffect(() => {
    // If we haven't showed welcome modal that points users to network opt in
    // yet, show the modal and update preferences with default values to reflect
    // that
    if (preferences.getPreferences().showedNetworkOptIn === false) {
      setIsWelcomeOpen(true);
      void preferences.ensureDefaultConfigurableUserPreferences();
    }
  }, [preferences]);

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

  return (
    <FileInputBackendProvider
      createFileInputBackend={electronFileInputBackendRef.current}
    >
      <ConnectionStorageContext.Provider value={ConnectionStorage}>
        <ConnectionRepositoryContextProvider>
          {isConnected && connectedDataService.current && (
            // AppRegistry scope for a connected application
            <AppRegistryProvider>
              <DataServiceProvider value={connectedDataService.current}>
                <CompassInstanceStorePlugin>
                  <FieldStorePlugin>
                    <Workspace
                      connectionInfo={connectionInfo}
                      onActiveWorkspaceTabChange={onWorkspaceChange}
                    />
                  </FieldStorePlugin>
                </CompassInstanceStorePlugin>
              </DataServiceProvider>
            </AppRegistryProvider>
          )}

          {/* TODO(COMPASS-7397): Hide <Connections> but keep it in scope if
          connected so that the connection import/export functionality can still
          be used through the application menu */}
          <div
            className={isConnected ? hiddenStyles : homeViewStyles}
            data-hidden={isConnected}
            data-testid="connections"
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
          <Welcome isOpen={isWelcomeOpen} closeModal={closeWelcomeModal} />
          <CompassSettingsPlugin></CompassSettingsPlugin>
          <CompassFindInPagePlugin></CompassFindInPagePlugin>
          <AtlasSignIn></AtlasSignIn>
        </ConnectionRepositoryContextProvider>
      </ConnectionStorageContext.Provider>
    </FileInputBackendProvider>
  );
}

function ThemedHome(
  props: React.ComponentProps<typeof Home>
): ReturnType<typeof Home> {
  const { track } = useLoggerAndTelemetry('COMPASS-HOME-UI');

  return (
    <CompassComponentsProvider
      onNextGuideGue={(cue) => {
        track('Guide Cue Dismissed', {
          groupId: cue.groupId,
          cueId: cue.cueId,
          step: cue.step,
        });
      }}
      onNextGuideCueGroup={(cue) => {
        if (cue.groupSteps !== cue.step) {
          track('Guide Cue Group Dismissed', {
            groupId: cue.groupId,
            cueId: cue.cueId,
            step: cue.step,
          });
        }
      }}
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
      {({ darkMode, portalContainerRef }) => {
        return (
          // Wrap the page in a body typography element so that font-size and
          // line-height is standardized.
          <Body as="div">
            <div
              className={getScrollbarStyles(darkMode)}
              ref={portalContainerRef as React.Ref<HTMLDivElement>}
            >
              <div
                className={cx(
                  homeContainerStyles,
                  darkMode ? globalDarkThemeStyles : globalLightThemeStyles
                )}
                data-theme={darkMode ? 'Dark' : 'Light'}
              >
                <Home {...props}></Home>
              </div>
            </div>
          </Body>
        );
      }}
    </CompassComponentsProvider>
  );
}

export default ThemedHome;
