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
} from '@mongodb-js/compass-components';
import { CompassFindInPagePlugin } from '@mongodb-js/compass-find-in-page';
import type { SettingsTabId } from '@mongodb-js/compass-settings';
import { CompassSettingsPlugin } from '@mongodb-js/compass-settings';
import CompassConnections from '@mongodb-js/compass-connections';
import { WelcomeModal } from '@mongodb-js/compass-welcome';
import { type ConnectionStorage } from '@mongodb-js/connection-storage/provider';
import { AppRegistryProvider } from 'hadron-app-registry';
import React, { useCallback, useState } from 'react';
import Workspace from './workspace';
import { getExtraConnectionData } from '../utils/telemetry';
// The only place where the app-stores plugin can be used as a plugin and not a
// provider
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import { AtlasAuthPlugin } from '@mongodb-js/atlas-service/renderer';
import { CompassGenerativeAIPlugin } from '@mongodb-js/compass-generative-ai';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { ConnectionStorageProvider } from '@mongodb-js/connection-storage/provider';
import { ConnectionImportExportProvider } from '@mongodb-js/compass-connection-import-export';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

resetGlobalCSS();

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

export type HomeProps = {
  appName: string;
  showWelcomeModal?: boolean;
  createFileInputBackend: () => FileInputBackend;
  onDisconnect: () => void;
  showCollectionSubMenu: (args: { isReadOnly: boolean }) => void;
  hideCollectionSubMenu: () => void;
  showSettings: (tab?: SettingsTabId) => void;
} & Pick<
  React.ComponentProps<typeof CompassConnections>,
  'onAutoconnectInfoRequest'
>;

const verticalSplitStyles = css({
  width: '100vw',
  height: '100vh',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto min-content',
  overflow: 'hidden',
});

function Home({
  appName,
  showWelcomeModal = false,
  createFileInputBackend,
  //onDisconnect,
  showCollectionSubMenu,
  hideCollectionSubMenu,
  showSettings,
  onAutoconnectInfoRequest,
}: Omit<HomeProps, 'connectionStorage'>): React.ReactElement | null {
  // TODO: port single connection code
  /*
  useEffect(() => {
    function onDisconnect() {
      void disconnect();
    }

    hadronIpc.ipcRenderer?.on('app:disconnect', onDisconnect);

    return () => {
      // Clean up the ipc listener.
      hadronIpc.ipcRenderer?.removeListener('app:disconnect', onDisconnect);
    };
  }, [disconnect]);
  */

  const onWorkspaceChange = useCallback(
    (ws: WorkspaceTab | null, collectionInfo) => {
      if (ws?.type === 'Collection') {
        showCollectionSubMenu({ isReadOnly: !!collectionInfo?.isReadonly });
      } else {
        hideCollectionSubMenu();
      }
    },
    [showCollectionSubMenu, hideCollectionSubMenu]
  );

  // TODO: port single connection code
  /*
  useEffectOnChange(() => {
    if (!isConnected) {
      hideCollectionSubMenu();
      onDisconnect();
    }
  }, [isConnected, onDisconnect, hideCollectionSubMenu]);
  */

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(showWelcomeModal);

  const closeWelcomeModal = useCallback(
    (showSettingsModal?: boolean) => {
      setIsWelcomeOpen(false);
      if (showSettingsModal) {
        showSettings('privacy');
      }
    },
    [setIsWelcomeOpen, showSettings]
  );

  return (
    <CompassConnections
      appName={appName}
      onExtraConnectionDataRequest={getExtraConnectionData}
      onAutoconnectInfoRequest={onAutoconnectInfoRequest}
    >
      <FileInputBackendProvider createFileInputBackend={createFileInputBackend}>
        <ConnectionImportExportProvider>
          <CompassInstanceStorePlugin>
            <FieldStorePlugin>
              <div data-testid="home" className={verticalSplitStyles}>
                <AppRegistryProvider scopeName="Multiple Connections">
                  <Workspace
                    appName={appName}
                    onActiveWorkspaceTabChange={onWorkspaceChange}
                  />
                </AppRegistryProvider>
              </div>
              <WelcomeModal
                isOpen={isWelcomeOpen}
                closeModal={closeWelcomeModal}
              />
              <CompassSettingsPlugin></CompassSettingsPlugin>
              <CompassFindInPagePlugin></CompassFindInPagePlugin>
              <AtlasAuthPlugin></AtlasAuthPlugin>
              <CompassGenerativeAIPlugin></CompassGenerativeAIPlugin>
            </FieldStorePlugin>
          </CompassInstanceStorePlugin>
        </ConnectionImportExportProvider>
      </FileInputBackendProvider>
    </CompassConnections>
  );
}

export function ThemedHome(
  props: Omit<HomeProps, 'connectionStorage'>
): ReturnType<typeof Home> {
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

export default function HomeWithConnections({
  connectionStorage,
  ...props
}: HomeProps & {
  connectionStorage: ConnectionStorage;
}) {
  return (
    <ConnectionStorageProvider value={connectionStorage}>
      <ThemedHome {...props}></ThemedHome>
    </ConnectionStorageProvider>
  );
}
