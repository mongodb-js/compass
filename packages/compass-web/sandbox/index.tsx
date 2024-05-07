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
  Tabs,
  Tab,
  VisuallyHidden,
  Label,
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
  gap: spacing[400],
  marginTop: spacing[200],
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

function AtlasClusterConnectionForm({
  onConnect,
}: {
  onConnect(info: ConnectionInfo): void;
}) {
  const { signIn, signInStatus, signInError, connections } =
    useAtlasClusterConnectionsList();

  return (
    <div className={connectionFormStyles}>
      <AtlasClusterConnectionsList
        connections={connections}
        onConnectionClick={() => {
          // noop
        }}
        onConnectionDoubleClick={onConnect}
        signInStatus={signInStatus}
        signInError={signInError}
        onSignInClick={() => {
          void signIn();
        }}
      ></AtlasClusterConnectionsList>
    </div>
  );
}

function ConnectionStringConnectionForm({
  onConnect,
}: {
  onConnect(connectionInfo: ConnectionInfo): void;
}) {
  const [history, updateHistory] = useConnectionsHistory();
  const [connectionString, setConnectionString] = useState('');
  const [validationResult, setValidationResult] = useState<null | string>(null);
  const [focused, setFocused] = useState(false);

  const onFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const onBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const onChange = useCallback((value: string) => {
    setConnectionString(value);
    setValidationResult(validateConnectionString(value));
  }, []);

  const onSubmit = useCallback(() => {
    if (validationResult || !connectionString) {
      return;
    }
    updateHistory(connectionString);
    onConnect({
      id: connectionString,
      connectionOptions: {
        connectionString,
        lookup() {
          return {
            wsURL: 'ws://localhost:1337',
          };
        },
      },
    });
  }, [connectionString, onConnect, updateHistory, validationResult]);

  return (
    <form
      className={connectionFormStyles}
      onSubmit={(evt) => {
        evt.preventDefault();
        onSubmit();
      }}
    >
      <VisuallyHidden>
        <Label htmlFor="connection-string-input-label">Connection string</Label>
      </VisuallyHidden>
      <TextArea
        // For testing purposes this should be exactly the same as the textarea
        // test id in connection-form
        data-testid="connectionString"
        aria-labelledby="connection-string-input-label"
        placeholder="e.g mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin"
        value={
          focused ? connectionString : redactConnectionString(connectionString)
        }
        onKeyDown={(evt) => {
          if (evt.key === 'Enter') {
            evt.preventDefault();
            onSubmit();
          }
        }}
        onChange={(evt) => {
          const { value } = evt.currentTarget;
          onChange(value);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
      ></TextArea>
      {validationResult && <Banner variant="danger">{validationResult}</Banner>}

      <Button
        data-testid="connect-button"
        disabled={Boolean(validationResult || !connectionString)}
        variant="primary"
        type="submit"
      >
        Connect
      </Button>
      <StoredConnectionsList
        connectionsHistory={history}
        onConnectionClick={onChange}
        onConnectionDoubleClick={(connectionString) => {
          onChange(connectionString);
          onSubmit();
        }}
      ></StoredConnectionsList>
    </form>
  );
}

function ConnectedApp({ connectionInfo }: { connectionInfo: ConnectionInfo }) {
  const isAtlasConnection = !!connectionInfo.atlasMetadata;
  const [initialCurrentTab, updateCurrentTab] = useWorkspaceTabRouter(
    connectionInfo?.id
  );

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

const App = () => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(
    null
  );
  const [selectedConnectionMethod, setSelectedConnectionMethod] = useState(0);

  (window as any).disconnectCompassWeb = () => {
    setConnectionInfo(null);
  };

  if (connectionInfo) {
    return <ConnectedApp connectionInfo={connectionInfo}></ConnectedApp>;
  }

  return (
    <Body as="div" className={sandboxContainerStyles}>
      <div className={cardContainerStyles}>
        <Card className={cardStyles}>
          <Tabs
            aria-label="Connection Type"
            selected={selectedConnectionMethod}
            setSelected={setSelectedConnectionMethod}
          >
            <Tab name="Connection String"></Tab>
            <Tab name="Atlas"></Tab>
          </Tabs>
          {selectedConnectionMethod === 0 && (
            <ConnectionStringConnectionForm
              onConnect={setConnectionInfo}
            ></ConnectionStringConnectionForm>
          )}
          {selectedConnectionMethod === 1 && (
            <AtlasClusterConnectionForm
              onConnect={setConnectionInfo}
            ></AtlasClusterConnectionForm>
          )}
        </Card>
      </div>
    </Body>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
