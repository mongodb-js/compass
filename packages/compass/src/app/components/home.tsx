import {
  Body,
  CompassComponentsProvider,
  type FileInputBackend,
  FileInputBackendProvider,
  css,
  cx,
  getScrollbarStyles,
  openToast,
  palette,
  resetGlobalCSS,
} from '@mongodb-js/compass-components';
import CompassConnections, {
  LegacyConnectionsModal,
} from '@mongodb-js/compass-connections';
import { CompassFindInPagePlugin } from '@mongodb-js/compass-find-in-page';
import { CompassSettingsPlugin } from '@mongodb-js/compass-settings';
import { WelcomeModal } from '@mongodb-js/compass-welcome';
import { type ConnectionStorage } from '@mongodb-js/connection-storage/provider';
import { AppRegistryProvider } from '@mongodb-js/compass-app-registry';
import React from 'react';
import Workspace from './workspace';
import { getExtraConnectionData } from '../utils/telemetry';
// The only place where the app-stores plugin can be used as a plugin and not a
// provider
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import { AtlasAuthPlugin } from '@mongodb-js/atlas-service/renderer';
import { CompassGenerativeAIPlugin } from '@mongodb-js/compass-generative-ai';
import { ToolsControllerProvider } from '@mongodb-js/compass-generative-ai/provider';
import { ConnectionStorageProvider } from '@mongodb-js/connection-storage/provider';
import { ConnectionImportExportProvider } from '@mongodb-js/compass-connection-import-export';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { usePreferences } from 'compass-preferences-model/provider';
import { CompassAssistantProvider } from '@mongodb-js/compass-assistant';
import { APP_NAMES_FOR_PROMPT } from '@mongodb-js/compass-assistant';

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
          <AtlasAuthPlugin></AtlasAuthPlugin>
          <CompassGenerativeAIPlugin
            isCloudOptIn={false}
          ></CompassGenerativeAIPlugin>
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
        <ToolsControllerProvider>
          <CompassAssistantProvider
            originForPrompt="mongodb-compass"
            appNameForPrompt={APP_NAMES_FOR_PROMPT.Compass}
          >
            <CompassConnections
              appName={props.appName}
              onExtraConnectionDataRequest={getExtraConnectionData}
              onAutoconnectInfoRequest={onAutoconnectInfoRequest}
              doNotReconnectDisconnectedAutoconnectInfo
              onFailToLoadConnections={(error) => {
                openToast('failed-to-load-connections', {
                  title: 'Failed to load connections',
                  description: error.message,
                  variant: 'warning',
                });
              }}
            >
              <Home {...props}></Home>
            </CompassConnections>
          </CompassAssistantProvider>
        </ToolsControllerProvider>
      </FileInputBackendProvider>
    </ConnectionStorageProvider>
  );
}

export default function ThemedHome(
  props: HomeWithConnectionsProps
): ReturnType<typeof HomeWithConnections> {
  const track = useTelemetry();
  const {
    enableContextMenus,
    legacyUUIDDisplayEncoding,
    showedNetworkOptIn,
    enableGuideCues,
  } = usePreferences([
    'enableContextMenus',
    'legacyUUIDDisplayEncoding',
    'showedNetworkOptIn',
    'enableGuideCues',
  ]);
  return (
    <CompassComponentsProvider
      legacyUUIDDisplayEncoding={legacyUUIDDisplayEncoding}
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
      disableContextMenus={!enableContextMenus}
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
