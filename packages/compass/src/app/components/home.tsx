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
import CompassConnections from '@mongodb-js/compass-connections';
import { CompassFindInPagePlugin } from '@mongodb-js/compass-find-in-page';
import { CompassSettingsPlugin } from '@mongodb-js/compass-settings';
import { WelcomeModal } from '@mongodb-js/compass-welcome';
import { type ConnectionStorage } from '@mongodb-js/connection-storage/provider';
import { AppRegistryProvider } from '@mongodb-js/compass-app-registry';
import React from 'react';
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import { AtlasAuthPlugin } from '@mongodb-js/atlas-service/renderer';
import { CompassGenerativeAIPlugin } from '@mongodb-js/compass-generative-ai';
import { ToolsControllerProvider } from '@mongodb-js/compass-generative-ai/provider';
import { ConnectionStorageProvider } from '@mongodb-js/connection-storage/provider';
import {
  FolderStorageProvider,
  type FolderStorageService,
} from '@mongodb-js/connection-storage/provider';
import { ConnectionImportExportProvider } from '@mongodb-js/compass-connection-import-export';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { usePreferences } from '@mongodb-js/compass-preferences-model/provider';
import {
  CompassAssistantProvider,
  APP_NAMES_FOR_PROMPT,
} from '@mongodb-js/compass-assistant';
import { getExtraConnectionData } from '../utils/telemetry';
import Workspace from './workspace';

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
};

const verticalSplitStyles = css({
  width: '100vw',
  height: '100vh',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto min-content',
  overflow: 'hidden',
});

function noop() {}

function Home({ appName }: HomeProps): React.ReactElement | null {
  return (
    <ConnectionImportExportProvider>
      <CompassInstanceStorePlugin>
        <FieldStorePlugin>
          <div data-testid="home" className={verticalSplitStyles}>
            <AppRegistryProvider scopeName="Connections">
              <Workspace onActiveWorkspaceTabChange={noop} appName={appName} />
            </AppRegistryProvider>
          </div>
          <WelcomeModal></WelcomeModal>
          <CompassSettingsPlugin></CompassSettingsPlugin>
          <CompassFindInPagePlugin></CompassFindInPagePlugin>
          <CompassGenerativeAIPlugin
            isCloudOptIn={false}
          ></CompassGenerativeAIPlugin>
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
    folderStorage: FolderStorageService;
    createFileInputBackend: () => FileInputBackend;
  };

function HomeWithConnections({
  onAutoconnectInfoRequest,
  connectionStorage,
  folderStorage,
  createFileInputBackend,
  ...props
}: HomeWithConnectionsProps) {
  return (
    <ConnectionStorageProvider value={connectionStorage}>
      <FolderStorageProvider value={folderStorage}>
        <FileInputBackendProvider
          createFileInputBackend={createFileInputBackend}
        >
          <ToolsControllerProvider>
            <AtlasAuthPlugin>
              <CompassAssistantProvider
                originForPrompt="mongodb-compass"
                appNameForPrompt={APP_NAMES_FOR_PROMPT.Compass}
              >
                <CompassConnections
                  appName={props.appName}
                  onExtraConnectionDataRequest={getExtraConnectionData}
                  onAutoconnectInfoRequest={onAutoconnectInfoRequest}
                  doNotReconnectDisconnectedAutoconnectInfo
                >
                  <Home {...props}></Home>
                </CompassConnections>
              </CompassAssistantProvider>
            </AtlasAuthPlugin>
          </ToolsControllerProvider>
        </FileInputBackendProvider>
      </FolderStorageProvider>
    </ConnectionStorageProvider>
  );
}

export default function ThemedHome(
  props: HomeWithConnectionsProps
): ReturnType<typeof HomeWithConnections> {
  const track = useTelemetry();
  const {
    legacyUUIDDisplayEncoding,
    timezone,
    showedNetworkOptIn,
    enableGuideCues,
  } = usePreferences([
    'legacyUUIDDisplayEncoding',
    'timezone',
    'showedNetworkOptIn',
    'enableGuideCues',
  ]);
  return (
    <CompassComponentsProvider
      legacyUUIDDisplayEncoding={legacyUUIDDisplayEncoding}
      timezone={timezone}
      onGuideCueShown={(cue) => {
        track('Guide Cue Shown', {
          groupId: cue.groupId,
          cueId: cue.cueId,
          step: cue.step,
        });
      }}
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
      onContextMenuOpen={(itemGroups) => {
        if (itemGroups.length > 0) {
          track('Context Menu Opened', {
            item_groups: itemGroups.map((group) => group.telemetryLabel),
          });
        }
      }}
      onContextMenuItemClick={(itemGroup, item) => {
        track('Context Menu Item Clicked', {
          item_group: itemGroup.telemetryLabel,
          item_label: item.label,
        });
      }}
      onDrawerSectionOpen={(drawerSectionId) => {
        track('Drawer Section Opened', { sectionId: drawerSectionId });
      }}
      onDrawerSectionHide={(drawerSectionId) => {
        track('Drawer Section Closed', { sectionId: drawerSectionId });
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
      // Wait for the "Welcome" modal to disappear before showing any guide cues
      // in the app
      disableGuideCues={!enableGuideCues || !showedNetworkOptIn}
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
