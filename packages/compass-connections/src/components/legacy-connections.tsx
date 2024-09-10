import {
  Card,
  ErrorBoundary,
  ResizableSidebar,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import ConnectionForm from '@mongodb-js/connection-form';
import type AppRegistry from 'hadron-app-registry';
import React, { useCallback } from 'react';
import { usePreference } from 'compass-preferences-model/provider';
import type { ConnectionInfo } from '../provider';
import { useConnectionRepository } from '../hooks/use-connection-repository';
import Connecting from './connecting/connecting';
import ConnectionList from './connection-list/connection-list';
import FormHelp from './form-help/form-help';
import { useConnectionInfoStatus } from '../hooks/use-connections-with-status';
import { useConnections } from '../stores/connections-store';
import {
  getConnectingStatusText,
  getConnectionErrorMessage,
} from './connection-status-notifications';
import { useConnectionFormPreferences } from '../hooks/use-connection-form-preferences';

const connectStyles = css({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'row',
});

const formContainerStyles = css({
  position: 'relative',
  flexGrow: 1,
  display: 'flex',
  padding: spacing[4],
  margin: 0,
  paddingBottom: spacing[3],
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing[4],
  overflow: 'auto',
  height: '100%',
});

const connectFormContainerStyles = css({
  margin: 0,
  padding: 0,
  height: 'fit-content',
  width: spacing[6] * 12,
  position: 'relative',
  display: 'inline-block',
});

const connectFormCardStyles = css({
  margin: 0,
  height: 'fit-content',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexFlow: 'column nowrap',
  maxHeight: '95vh',
});

const formCardDarkThemeStyles = css({
  background: palette.black,
});

const formCardLightThemeStyles = css({
  background: palette.white,
});

function Connections({
  appRegistry,
  openConnectionImportExportModal,
}: {
  appRegistry: AppRegistry;
  openConnectionImportExportModal?: (
    action: 'import-saved-connections' | 'export-saved-connections'
  ) => void;
}): React.ReactElement {
  const { log, mongoLogId } = useLogger('COMPASS-CONNECTIONS');

  const {
    state: {
      editingConnectionInfo: activeConnectionInfo,
      connectionErrors,
      oidcDeviceAuthState,
    },
    connect,
    disconnect,
    createNewConnection,
    editConnection,
    duplicateConnection,
    removeAllRecentConnections,
    removeConnection,
    saveEditedConnection,
  } = useConnections();

  const activeConnectionStatus = useConnectionInfoStatus(
    activeConnectionInfo.id
  );

  const { favoriteConnections, nonFavoriteConnections: recentConnections } =
    useConnectionRepository();

  const darkMode = useDarkMode();
  const connectionFormPreferences = useConnectionFormPreferences();
  const isMultiConnectionEnabled = usePreference(
    'enableMultipleConnectionSystem'
  );

  const onConnectClick = (connectionInfo: ConnectionInfo) => {
    void connect(connectionInfo);
  };

  const connectionErrorMessage = getConnectionErrorMessage(
    connectionErrors[activeConnectionInfo.id]
  );

  const { title, description } = getConnectingStatusText(activeConnectionInfo);
  const connectingStatusText = `${title}${
    description ? `. ${description}` : ''
  }`;

  const activeConnectionOidcAuthState =
    oidcDeviceAuthState[activeConnectionInfo.id];

  const openSettingsModal = useCallback(
    (tab?: string) => appRegistry.emit('open-compass-settings', tab),
    [appRegistry]
  );

  return (
    <div data-testid="connections-wrapper" className={connectStyles}>
      <ResizableSidebar>
        <ConnectionList
          appRegistry={appRegistry}
          activeConnectionId={activeConnectionInfo.id}
          favoriteConnections={favoriteConnections}
          recentConnections={recentConnections}
          createNewConnection={createNewConnection}
          setActiveConnectionId={(id) => {
            editConnection(id);
          }}
          onDoubleClick={onConnectClick}
          removeAllRecentsConnections={() => {
            void removeAllRecentConnections();
          }}
          removeConnection={({ id }) => {
            void removeConnection(id);
          }}
          duplicateConnection={({ id }) => {
            void duplicateConnection(id, { autoDuplicate: true });
          }}
          openConnectionImportExportModal={openConnectionImportExportModal}
        />
      </ResizableSidebar>
      <div>
        <div className={formContainerStyles}>
          <ErrorBoundary
            onError={(error: Error, errorInfo: React.ErrorInfo) => {
              log.error(
                mongoLogId(1001000108),
                'Connect Form',
                'Rendering connect form failed',
                { error: error.message, errorInfo }
              );
            }}
          >
            <div
              className={connectFormContainerStyles}
              data-testid="connection-form"
            >
              <Card
                className={cx(
                  connectFormCardStyles,
                  darkMode ? formCardDarkThemeStyles : formCardLightThemeStyles
                )}
              >
                <ConnectionForm
                  key={activeConnectionInfo.id}
                  onConnectClicked={onConnectClick}
                  onSaveClicked={saveEditedConnection}
                  initialConnectionInfo={activeConnectionInfo}
                  connectionErrorMessage={connectionErrorMessage}
                  preferences={connectionFormPreferences}
                  openSettingsModal={openSettingsModal}
                />
              </Card>
            </div>
          </ErrorBoundary>
          <FormHelp isMultiConnectionEnabled={isMultiConnectionEnabled} />
        </div>
      </div>
      {activeConnectionStatus === 'connecting' && (
        <Connecting
          oidcDeviceAuthVerificationUrl={activeConnectionOidcAuthState?.url}
          oidcDeviceAuthUserCode={activeConnectionOidcAuthState?.code}
          connectingStatusText={connectingStatusText}
          onCancelConnectionClicked={() =>
            void disconnect(activeConnectionInfo.id)
          }
        />
      )}
    </div>
  );
}

export default Connections;
