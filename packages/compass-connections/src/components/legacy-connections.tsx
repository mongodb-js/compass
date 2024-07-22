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
import React, { useMemo } from 'react';
import { usePreference } from 'compass-preferences-model/provider';
import { cloneDeep } from 'lodash';
import type { ConnectionInfo } from '../provider';
import { useConnections } from '../provider';
import Connecting from './connecting/connecting';
import ConnectionList from './connection-list/connection-list';
import FormHelp from './form-help/form-help';

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
    state,
    cancelConnectionAttempt,
    connect,
    createNewConnection,
    legacyDuplicateConnection: duplicateConnection,
    setActiveConnectionById,
    removeAllRecentsConnections,
    removeConnection,
    saveConnection,
    favoriteConnections,
    recentConnections,
  } = useConnections();

  const {
    connectingConnectionId,
    activeConnectionId,
    activeConnectionInfo,
    connectionErrorMessage,
    connectingStatusText,
    oidcDeviceAuthVerificationUrl,
    oidcDeviceAuthUserCode,
  } = state;

  const darkMode = useDarkMode();

  const protectConnectionStrings = usePreference('protectConnectionStrings');
  const forceConnectionOptions = usePreference('forceConnectionOptions');
  const showKerberosPasswordField = usePreference('showKerberosPasswordField');
  const showOIDCDeviceAuthFlow = usePreference('showOIDCDeviceAuthFlow');
  const enableOidc = usePreference('enableOidc');
  const enableDebugUseCsfleSchemaMap = usePreference(
    'enableDebugUseCsfleSchemaMap'
  );
  const protectConnectionStringsForNewConnections = usePreference(
    'protectConnectionStringsForNewConnections'
  );
  const isMultiConnectionEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const preferences = useMemo(
    () => ({
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
    }),
    [
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
    ]
  );

  const onConnectClick = (connectionInfo: ConnectionInfo) => {
    void connect({ ...cloneDeep(connectionInfo) }, true).catch(() => {
      // noop, we're logging in the connect method
    });
  };

  return (
    <div data-testid="connections-wrapper" className={connectStyles}>
      <ResizableSidebar>
        <ConnectionList
          activeConnectionId={activeConnectionId}
          appRegistry={appRegistry}
          favoriteConnections={favoriteConnections}
          recentConnections={recentConnections}
          createNewConnection={createNewConnection}
          setActiveConnectionId={setActiveConnectionById}
          onDoubleClick={onConnectClick}
          removeAllRecentsConnections={() => {
            void removeAllRecentsConnections();
          }}
          removeConnection={removeConnection}
          duplicateConnection={duplicateConnection}
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
                  onConnectClicked={onConnectClick}
                  key={activeConnectionId}
                  onSaveClicked={saveConnection}
                  initialConnectionInfo={activeConnectionInfo}
                  connectionErrorMessage={connectionErrorMessage}
                  preferences={preferences}
                />
              </Card>
            </div>
          </ErrorBoundary>
          <FormHelp isMultiConnectionEnabled={isMultiConnectionEnabled} />
        </div>
      </div>
      {connectingConnectionId && (
        <Connecting
          oidcDeviceAuthVerificationUrl={oidcDeviceAuthVerificationUrl}
          oidcDeviceAuthUserCode={oidcDeviceAuthUserCode}
          connectingStatusText={connectingStatusText}
          onCancelConnectionClicked={() =>
            void cancelConnectionAttempt(connectingConnectionId)
          }
        />
      )}
    </div>
  );
}

export default Connections;
