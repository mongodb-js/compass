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
import type { connect } from 'mongodb-data-service';
import React, { useEffect, useState } from 'react';
import { usePreference } from 'compass-preferences-model/provider';
import type { ConnectionInfo } from '../provider';
import {
  ConnectionStatus,
  useConnectionRepository,
  useConnections,
} from '../provider';
import Connecting from './connecting/connecting';
import ConnectionList from './connection-list/connection-list';
import FormHelp from './form-help/form-help';
import { useConnectionInfoStatus } from '../hooks/use-connections-with-status';
import { createNewConnectionInfo } from '../stores/connections-store';
import {
  getConnectingStatusText,
  getConnectionErrorMessage,
} from './connection-status-notifications';
import { useConnectionFormPreferences } from '../hooks/use-connection-form-preferences';

type ConnectFn = typeof connect;

export type { ConnectFn };

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

// Single connection form is a bit of a special case where form is always on
// screen so even when user is not explicitly editing any connections, we need a
// connection info object to be passed around. For that purposes this hook will
// either return an editing connection info or will create a new one as a
// fallback if nothing is actively being edited
function useActiveConnectionInfo(
  editingConnectionInfo?: ConnectionInfo | null
) {
  const [connectionInfo, setConnectionInfo] = useState(() => {
    return editingConnectionInfo ?? createNewConnectionInfo();
  });
  useEffect(() => {
    setConnectionInfo(editingConnectionInfo ?? createNewConnectionInfo());
  }, [editingConnectionInfo]);
  return connectionInfo;
}

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
    state: { editingConnectionInfo, connectionErrors, oidcDeviceAuthState },
    connect,
    disconnect,
    createNewConnection,
    editConnection,
    duplicateConnection,
    removeAllRecentConnections,
    removeConnection,
    saveEditedConnection,
  } = useConnections();

  const { favoriteConnections, nonFavoriteConnections: recentConnections } =
    useConnectionRepository();

  const darkMode = useDarkMode();
  const connectionFormPreferences = useConnectionFormPreferences();
  const isMultiConnectionEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const activeConnectionInfo = useActiveConnectionInfo(
    // TODO(COMPASS-7397): Even though connection form interface expects
    // connection info to only be "initial", some parts of the form UI actually
    // read the values from the info as if they should be updated (favorite edit
    // form), for that purpose instead of using state store directly, we will
    // first try to find the connection in the list of connections that track
    // the connection info updates instead of passing the store state directly.
    // This should go away when we are normalizing this state and making sure
    // that favorite form is correctly reading the state from a single store
    [...favoriteConnections, ...recentConnections].find((info) => {
      // Might be missing in case of "New connection" when it's not saved yet
      return info.id === editingConnectionInfo?.id;
    }) ?? editingConnectionInfo
  );
  const activeConnectionStatus = useConnectionInfoStatus(
    activeConnectionInfo.id
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
                />
              </Card>
            </div>
          </ErrorBoundary>
          <FormHelp isMultiConnectionEnabled={isMultiConnectionEnabled} />
        </div>
      </div>
      {activeConnectionStatus === ConnectionStatus.Connecting && (
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
