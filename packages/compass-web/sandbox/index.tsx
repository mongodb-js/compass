import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  TextArea,
  Button,
  resetGlobalCSS,
  Card,
  css,
  spacing,
  ErrorBoundary,
  Banner,
  Body,
} from '@mongodb-js/compass-components';
import {
  redactConnectionString,
  ConnectionString,
} from 'mongodb-connection-string-url';

import { CompassWeb } from '../src/index';
import { LoggerAndTelemetryProvider } from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { sandboxLogger } from './sandbox-logger';
import { useWorkspaceTabRouter } from './use-workspace-tab-router';
import {
  StoredConnectionsList,
  useConnectionsHistory,
} from './stored-connections-history';
import { AtlasClusterConnectionsList } from './atlas-cluster-connections';

const sandboxContainerStyles = css({
  width: '100%',
  height: '100%',
});

const cardContainerStyles = css({
  width: '100%',
  height: '100%',
  paddingTop: spacing[7],
});

const cardStyles = css({
  width: '50%',
  maxWidth: spacing[6] * 10,
  minWidth: spacing[6] * 6,
  marginLeft: 'auto',
  marginRight: 'auto',
});

const connectionFormStyles = css({
  display: 'grid',
  gridTemplateColumns: '100%',
  gridAutoRows: 'auto',
  gap: spacing[3],
});

resetGlobalCSS();

function validateConnectionString(str: string) {
  try {
    new ConnectionString(str);
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

const App = () => {
  const [initialCurrentTab, updateCurrentTab] = useWorkspaceTabRouter();
  const [connectionsHistory, updateConnectionsHistory] =
    useConnectionsHistory();
  const [focused, setFocused] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(
    null
  );
  const [openCompassWeb, setOpenCompassWeb] = useState(false);
  const [
    connectionStringValidationResult,
    setConnectionStringValidationResult,
  ] = useState<null | string>(null);

  (window as any).disconnectCompassWeb = () => {
    setOpenCompassWeb(false);
  };

  const canConnect =
    connectionStringValidationResult === null &&
    connectionString !== '' &&
    connectionInfo;

  const onChangeConnectionString = useCallback((str: string) => {
    setConnectionString(str);
    setConnectionStringValidationResult(validateConnectionString(str));
    const connectionInfo = {
      id: str,
      connectionOptions: { connectionString: str },
    };
    setConnectionInfo(connectionInfo);
  }, []);

  const onSelectFromList = useCallback((connectionInfo: ConnectionInfo) => {
    const str = connectionInfo.connectionOptions.connectionString;
    setConnectionString(str);
    setConnectionStringValidationResult(validateConnectionString(str));
    setConnectionInfo(connectionInfo);
  }, []);

  const onConnect = useCallback(() => {
    // TODO: if using connection from history and this connection is atlas
    // connection need to make sure that signed in
    if (canConnect) {
      updateConnectionsHistory(connectionInfo);
      setOpenCompassWeb(true);
    }
  }, [canConnect, connectionInfo, updateConnectionsHistory]);

  if (openCompassWeb && connectionInfo) {
    return (
      <Body as="div" className={sandboxContainerStyles}>
        <LoggerAndTelemetryProvider value={sandboxLogger}>
          <ErrorBoundary>
            <CompassWeb
              connectionInfo={connectionInfo}
              initialWorkspaceTabs={
                initialCurrentTab ? [initialCurrentTab] : undefined
              }
              onActiveWorkspaceTabChange={updateCurrentTab}
            ></CompassWeb>
          </ErrorBoundary>
        </LoggerAndTelemetryProvider>
      </Body>
    );
  }

  return (
    <Body as="div" className={sandboxContainerStyles}>
      <div className={cardContainerStyles}>
        <Card className={cardStyles}>
          <form
            className={connectionFormStyles}
            onSubmit={(evt) => {
              evt.preventDefault();
              onConnect();
            }}
          >
            <TextArea
              data-testid="connectionString"
              label="Connection string"
              placeholder="e.g mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin"
              value={
                focused
                  ? connectionString
                  : redactConnectionString(connectionString)
              }
              onKeyDown={(evt) => {
                if (evt.key === 'Enter') {
                  evt.preventDefault();
                  onConnect();
                }
              }}
              onChange={(evt) => {
                onChangeConnectionString(evt.currentTarget.value);
              }}
              onFocus={() => {
                setFocused(true);
              }}
              onBlur={() => {
                setFocused(false);
              }}
            ></TextArea>
            {connectionStringValidationResult && (
              <Banner variant="danger">
                {connectionStringValidationResult}
              </Banner>
            )}
            <Button
              data-testid="connect-button"
              disabled={!canConnect}
              variant="primary"
              type="submit"
            >
              Connect
            </Button>
            <StoredConnectionsList
              connectionsHistory={connectionsHistory}
              onConnectionClick={onSelectFromList}
              onConnectionDoubleClick={(connectionInfo) => {
                onSelectFromList(connectionInfo);
                onConnect();
              }}
            ></StoredConnectionsList>
            <AtlasClusterConnectionsList
              onConnectionClick={onSelectFromList}
              onConnectionDoubleClick={() => {
                // No-op because you'd need to enter connection info first
                // anyway
              }}
            ></AtlasClusterConnectionsList>
          </form>
        </Card>
      </div>
    </Body>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
