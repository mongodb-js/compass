import React, { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  TextArea,
  Button,
  resetGlobalCSS,
  Card,
  css,
  spacing,
  Banner,
  Body,
  SpinLoaderWithLabel,
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
import {
  AtlasClusterConnectionsList,
  useAtlasClusterConnectionsList,
} from './atlas-cluster-connections';

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

const loadingContainerStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const spinnerStyles = css({
  flex: 'none',
});

function LoadingScreen({ connectionString }: { connectionString?: string }) {
  const host = useMemo(() => {
    try {
      const url = new ConnectionString(connectionString ?? '');
      return url.hosts[0];
    } catch {
      return 'cluster';
    }
  }, [connectionString]);

  return (
    <div data-testid="compass-web-loading" className={loadingContainerStyles}>
      <SpinLoaderWithLabel
        className={spinnerStyles}
        progressText={`Connecting to ${host}…`}
      ></SpinLoaderWithLabel>
    </div>
  );
}

const errorContainerStyles = css({
  width: '100%',
  padding: spacing[3],
});

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className={errorContainerStyles}>
      <Banner variant="danger">{error}</Banner>
    </div>
  );
}

function validateConnectionString(str: string) {
  try {
    new ConnectionString(str);
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

const App = () => {
  const [connectionsHistory, updateConnectionsHistory] =
    useConnectionsHistory();
  const {
    signIn,
    signInStatus,
    signInError,
    connections: atlasConnections,
  } = useAtlasClusterConnectionsList();
  const [focused, setFocused] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(
    null
  );
  const [initialCurrentTab, updateCurrentTab] = useWorkspaceTabRouter(
    connectionInfo?.id
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
    setConnectionInfo((connectionInfo) => {
      return {
        ...connectionInfo,
        id: connectionInfo?.id ?? str,
        connectionOptions: {
          ...connectionInfo?.connectionOptions,
          connectionString: str,
        },
      };
    });
  }, []);

  const onSelectFromList = useCallback((connectionInfo: ConnectionInfo) => {
    const str = connectionInfo.connectionOptions.connectionString;
    setConnectionString(str);
    setConnectionStringValidationResult(validateConnectionString(str));
    setConnectionInfo(connectionInfo);
  }, []);

  const onConnect = useCallback(async () => {
    if (canConnect) {
      if (connectionInfo.atlasMetadata) {
        await signIn();
      }

      updateConnectionsHistory(connectionInfo);
      setOpenCompassWeb(true);
    }
  }, [canConnect, connectionInfo, signIn, updateConnectionsHistory]);

  if (openCompassWeb && connectionInfo) {
    const isAtlasConnection = !!connectionInfo.atlasMetadata;

    return (
      <Body as="div" className={sandboxContainerStyles}>
        <LoggerAndTelemetryProvider value={sandboxLogger}>
          <CompassWeb
            onAutoconnectInfoRequest={() => {
              return Promise.resolve(connectionInfo);
            }}
            initialWorkspaceTabs={
              initialCurrentTab ? [initialCurrentTab] : undefined
            }
            onActiveWorkspaceTabChange={updateCurrentTab}
            initialPreferences={{
              enablePerformanceAdvisorBanner: isAtlasConnection,
              enableAtlasSearchIndexes: !isAtlasConnection,
              maximumNumberOfActiveConnections: isAtlasConnection ? 1 : 10,
            }}
            stackedElementsZIndex={5}
            renderConnecting={(connectionInfo) => {
              return (
                <LoadingScreen
                  connectionString={
                    connectionInfo?.connectionOptions.connectionString
                  }
                ></LoadingScreen>
              );
            }}
            renderError={(_connectionInfo, err) => {
              return (
                <ErrorScreen
                  error={err.message ?? 'Error occured when connecting'}
                ></ErrorScreen>
              );
            }}
          ></CompassWeb>
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
              void onConnect();
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
                  void onConnect();
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
                void onConnect();
              }}
            ></StoredConnectionsList>
            <AtlasClusterConnectionsList
              connections={atlasConnections}
              onConnectionClick={onSelectFromList}
              onConnectionDoubleClick={() => {
                // No-op because you'd need to enter connection info first
                // anyway
              }}
              signInStatus={signInStatus}
              signInError={signInError}
              onSignInClick={() => {
                void signIn();
              }}
            ></AtlasClusterConnectionsList>
          </form>
        </Card>
      </div>
    </Body>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
