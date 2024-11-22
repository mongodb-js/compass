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
import CompassConnections, {
  LegacyConnectionsModal,
} from '@mongodb-js/compass-connections';
import { CompassFindInPagePlugin } from '@mongodb-js/compass-find-in-page';
import type { SettingsTabId } from '@mongodb-js/compass-settings';
import { CompassSettingsPlugin } from '@mongodb-js/compass-settings';
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
  showCollectionSubMenu: (args: { isReadOnly: boolean }) => void;
  hideCollectionSubMenu: () => void;
  showSettings: (tab?: SettingsTabId) => void;
};

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
  showCollectionSubMenu,
  hideCollectionSubMenu,
  showSettings,
}: HomeProps): React.ReactElement | null {
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
          <WelcomeModal isOpen={isWelcomeOpen} closeModal={closeWelcomeModal} />
          <CompassSettingsPlugin></CompassSettingsPlugin>
          <CompassFindInPagePlugin></CompassFindInPagePlugin>
          <AtlasAuthPlugin></AtlasAuthPlugin>
          <CompassGenerativeAIPlugin></CompassGenerativeAIPlugin>
          <LegacyConnectionsModal />
        </FieldStorePlugin>
      </CompassInstanceStorePlugin>
    </ConnectionImportExportProvider>
  );
}

type HomeWithConnectionsProps = HomeProps &
  Pick<
    React.ComponentProps<typeof CompassConnections>,
    'onAutoconnectInfoRequest'
  > & {
    connectionStorage: ConnectionStorage;
    createFileInputBackend: () => FileInputBackend;
  };

function HomeWithConnections({
  onAutoconnectInfoRequest,
  connectionStorage,
  createFileInputBackend,
  ...props
}: HomeWithConnectionsProps) {
  return (
    <ConnectionStorageProvider value={connectionStorage}>
      <FileInputBackendProvider createFileInputBackend={createFileInputBackend}>
        <CompassConnections
          appName={props.appName}
          onExtraConnectionDataRequest={getExtraConnectionData}
          onAutoconnectInfoRequest={onAutoconnectInfoRequest}
          doNotReconnectDisconnectedAutoconnectInfo
        >
          <Home {...props}></Home>
        </CompassConnections>
      </FileInputBackendProvider>
    </ConnectionStorageProvider>
  );
}

export default function ThemedHome(
  props: HomeWithConnectionsProps
): ReturnType<typeof HomeWithConnections> {
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
                <HomeWithConnections {...props}></HomeWithConnections>
              </div>
            </div>
          </Body>
        );
      }}
    </CompassComponentsProvider>
  );
}
