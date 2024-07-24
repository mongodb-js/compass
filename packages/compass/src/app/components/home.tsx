import {
  Body,
  CompassComponentsProvider,
  type FileInputBackend,
  FileInputBackendProvider,
  css,
  cx,
  getScrollbarStyles,
  palette,
  resetGlobalCSS,
  showConfirmation,
  useEffectOnChange,
} from '@mongodb-js/compass-components';
import CompassConnections, {
  SingleConnectionForm,
  LegacyConnectionsModal,
} from '@mongodb-js/compass-connections';
import { CompassFindInPagePlugin } from '@mongodb-js/compass-find-in-page';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { CompassSettingsPlugin } from '@mongodb-js/compass-settings';
import { WelcomeModal } from '@mongodb-js/compass-welcome';
import * as hadronIpc from 'hadron-ipc';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { type ConnectionStorage } from '@mongodb-js/connection-storage/provider';
import { AppRegistryProvider, useLocalAppRegistry } from 'hadron-app-registry';
import type AppRegistry from 'hadron-app-registry';
import {
  ConnectionsManagerProvider,
  ConnectionsManager,
  type ConnectionInfo,
} from '@mongodb-js/compass-connections/provider';
import type { DataService } from 'mongodb-data-service';
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import updateTitle from '../utils/update-title';
import Workspace from './workspace';
import {
  trackConnectionAttemptEvent,
  trackNewConnectionEvent,
  trackConnectionFailedEvent,
} from '../utils/telemetry';
// The only place where the app-stores plugin can be used as a plugin and not a
// provider
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import { AtlasAuthPlugin } from '@mongodb-js/atlas-service/renderer';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { ConnectionStorageProvider } from '@mongodb-js/connection-storage/provider';
import {
  ConnectionImportExportProvider,
  useOpenConnectionImportExportModal,
} from '@mongodb-js/compass-connection-import-export';
import { usePreference } from 'compass-preferences-model/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

resetGlobalCSS();

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
};

const initialState: State = {
  connectionInfo: null,
  isConnected: false,
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
        // Reset to initial state
        ...initialState,
      };
    default:
      return state;
  }
}

async function reauthenticationHandler() {
  const confirmed = await showConfirmation({
    title: 'Authentication expired',
    description:
      'You need to re-authenticate to the database in order to continue.',
  });
  if (!confirmed) {
    throw new Error('Reauthentication declined by user');
  }
}

export type HomeProps = {
  appName: string;
  showWelcomeModal?: boolean;
  createFileInputBackend: () => FileInputBackend;
  onDisconnect: () => void;
  showCollectionSubMenu: (args: { isReadOnly: boolean }) => void;
  hideCollectionSubMenu: () => void;
  showSettings: () => void;
  connectionStorage: ConnectionStorage;
  __TEST_MONGODB_DATA_SERVICE_CONNECT_FN?: () => Promise<DataService>;
};

function SingleConnectionFormWithConnectionImportExport({
  appRegistry,
}: {
  appRegistry: AppRegistry;
}) {
  const { supportsConnectionImportExport, openConnectionImportExportModal } =
    useOpenConnectionImportExportModal({ context: 'connectionsList' });
  return (
    <SingleConnectionForm
      appRegistry={appRegistry}
      openConnectionImportExportModal={
        supportsConnectionImportExport
          ? openConnectionImportExportModal
          : undefined
      }
    />
  );
}

function Home({
  appName,
  showWelcomeModal = false,
  createFileInputBackend,
  onDisconnect,
  showCollectionSubMenu,
  hideCollectionSubMenu,
  showSettings,
  connectionStorage,
  __TEST_MONGODB_DATA_SERVICE_CONNECT_FN,
}: HomeProps): React.ReactElement | null {
  const appRegistry = useLocalAppRegistry();
  const logger = useLogger('COMPASS-CONNECT-UI');
  const track = useTelemetry();

  const connectionsManager = useRef(
    new ConnectionsManager({
      appName,
      logger: logger.log.unbound,
      reAuthenticationHandler: reauthenticationHandler,
      __TEST_CONNECT_FN: __TEST_MONGODB_DATA_SERVICE_CONNECT_FN,
    })
  );

  const [{ connectionInfo, isConnected }, dispatch] = useReducer(reducer, {
    ...initialState,
  });

  const onConnected = useCallback(
    (connectionInfo: ConnectionInfo, dataService: DataService) => {
      trackNewConnectionEvent(connectionInfo, dataService, logger, track);
      dispatch({ type: 'connected', connectionInfo: connectionInfo });
    },
    [logger, track]
  );

  const onConnectionFailed = useCallback(
    (connectionInfo: ConnectionInfo | null, error: Error) => {
      trackConnectionFailedEvent(connectionInfo, error, logger, track);
    },
    [logger, track]
  );

  const onConnectionAttemptStarted = useCallback(
    (connectionInfo: ConnectionInfo) => {
      trackConnectionAttemptEvent(connectionInfo, logger, track);
    },
    [logger, track]
  );

  useEffect(() => {
    async function handleDisconnectClicked() {
      if (!connectionInfo) {
        return;
      }

      await connectionsManager.current.closeConnection(connectionInfo.id);
      dispatch({ type: 'disconnected' });
    }

    function onDisconnect() {
      void handleDisconnectClicked();
    }

    hadronIpc.ipcRenderer?.on('app:disconnect', onDisconnect);

    return () => {
      // Clean up the ipc listener.
      hadronIpc.ipcRenderer?.removeListener('app:disconnect', onDisconnect);
    };
  }, [appRegistry, appName, connectionInfo]);

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
    [appName, connectionInfo, showCollectionSubMenu, hideCollectionSubMenu]
  );

  useEffectOnChange(() => {
    if (!isConnected) {
      updateTitle(appName);
      hideCollectionSubMenu();
      onDisconnect();
    }
  }, [appName, isConnected, onDisconnect, hideCollectionSubMenu]);

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(showWelcomeModal);

  const closeWelcomeModal = useCallback(
    (showSettingsModal?: boolean) => {
      setIsWelcomeOpen(false);
      if (showSettingsModal) {
        showSettings();
      }
    },
    [setIsWelcomeOpen, showSettings]
  );

  const multiConnectionsEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  return (
    <FileInputBackendProvider createFileInputBackend={createFileInputBackend}>
      <ConnectionStorageProvider value={connectionStorage}>
        <ConnectionsManagerProvider value={connectionsManager.current}>
          <CompassConnections
            onConnectionAttemptStarted={onConnectionAttemptStarted}
            onConnectionFailed={onConnectionFailed}
            onConnected={onConnected}
          >
            <ConnectionImportExportProvider>
              <CompassInstanceStorePlugin>
                <FieldStorePlugin>
                  {multiConnectionsEnabled && (
                    <AppRegistryProvider scopeName="Multiple Connections">
                      <Workspace
                        onActiveWorkspaceTabChange={onWorkspaceChange}
                      />
                    </AppRegistryProvider>
                  )}
                  {!multiConnectionsEnabled &&
                    (isConnected ? (
                      <AppRegistryProvider scopeName="Single Connection">
                        <Workspace
                          onActiveWorkspaceTabChange={onWorkspaceChange}
                        />
                      </AppRegistryProvider>
                    ) : (
                      <div className={homePageStyles}>
                        <SingleConnectionFormWithConnectionImportExport
                          appRegistry={appRegistry}
                        />
                      </div>
                    ))}
                  <WelcomeModal
                    isOpen={isWelcomeOpen}
                    closeModal={closeWelcomeModal}
                  />
                  <CompassSettingsPlugin></CompassSettingsPlugin>
                  <CompassFindInPagePlugin></CompassFindInPagePlugin>
                  <AtlasAuthPlugin></AtlasAuthPlugin>
                  <LegacyConnectionsModal />
                </FieldStorePlugin>
              </CompassInstanceStorePlugin>
            </ConnectionImportExportProvider>
          </CompassConnections>
        </ConnectionsManagerProvider>
      </ConnectionStorageProvider>
    </FileInputBackendProvider>
  );
}

function ThemedHome(props: HomeProps): ReturnType<typeof Home> {
  const track = useTelemetry();
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
      utmSource="compass"
      utmMedium="product"
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
