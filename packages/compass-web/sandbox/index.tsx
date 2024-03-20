import React, { useCallback, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  TextArea,
  Button,
  resetGlobalCSS,
  Card,
  KeylineCard,
  css,
  spacing,
  palette,
  Label,
  ErrorBoundary,
  Banner,
  Body,
} from '@mongodb-js/compass-components';
import {
  redactConnectionString,
  ConnectionString,
} from 'mongodb-connection-string-url';

import createDebug from 'debug';
import { CompassWeb } from '../src/index';
import type { OpenWorkspaceOptions } from '@mongodb-js/compass-workspaces';

import { LoggerAndTelemetryProvider } from '@mongodb-js/compass-logging/provider';
import { mongoLogId } from '@mongodb-js/compass-logging';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { MongoLogWriter } from 'mongodb-log-writer';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';

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

const historyListStyles = css({
  all: 'unset',
  marginTop: spacing[1],
  display: 'grid',
  gridTemplateColumns: '100%',
  gridAutoRows: 'auto',
  gap: spacing[2],
});

const historyListItemStyles = css({
  listStyle: 'none',
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
});

const historyItemButtonStyles = css({
  all: 'unset',
  display: 'block',
  width: '100%',
  cursor: 'pointer',
  color: palette.black,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

resetGlobalCSS();

function getHistory(): ConnectionInfo[] {
  try {
    const b64Str = localStorage.getItem('CONNECTIONS_HISTORY');
    if (!b64Str) {
      return [];
    }
    const binStr = window.atob(b64Str);
    const bytes = Uint8Array.from(binStr, (v) => v.codePointAt(0) ?? 0);
    const str = new TextDecoder().decode(bytes);
    return JSON.parse(str);
  } catch (err) {
    return [];
  }
}

function saveHistory(history: any) {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(history));
    const binStr = String.fromCodePoint(...bytes);
    const b64Str = window.btoa(binStr);
    localStorage.setItem('CONNECTIONS_HISTORY', b64Str);
  } catch (err) {
    // noop
  }
}

function validateConnectionString(str: string) {
  try {
    new ConnectionString(str);
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

const tracking: { event: string; properties: any }[] = [];
const logging: { name: string; component: string; args: any[] }[] = [];

(globalThis as any).tracking = tracking;
(globalThis as any).logging = logging;

const App = () => {
  const [initialTab] = useState<OpenWorkspaceOptions>(() => {
    const [, tab, namespace = ''] = window.location.pathname.split('/');
    if (tab === 'databases') {
      return { type: 'Databases' };
    }
    if (tab === 'collections' && namespace) {
      return { type: 'Collections', namespace };
    }
    if (tab === 'collection' && namespace) {
      return { type: 'Collection', namespace };
    }
    return { type: 'Databases' };
  });
  const [connectionsHistory, setConnectionsHistory] = useState<
    ConnectionInfo[]
  >(() => {
    return getHistory();
  });
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

  const canSubmit =
    connectionStringValidationResult === null && connectionString !== '';

  const onChangeConnectionString = useCallback((str: string) => {
    setConnectionStringValidationResult(validateConnectionString(str));
    setConnectionString(str);
  }, []);

  const onConnectClick = useCallback(() => {
    setOpenCompassWeb(true);
    setConnectionsHistory((history) => {
      const info = history.find(
        (info) => info.connectionOptions.connectionString === connectionString
      );
      if (info) {
        setConnectionInfo(info);
        return history;
      }

      const newInfo: ConnectionInfo = {
        id: Math.random().toString(36).slice(2),
        connectionOptions: {
          connectionString,
        },
      };
      setConnectionInfo(newInfo);
      history.unshift(newInfo);
      if (history.length > 10) {
        history.pop();
      }
      saveHistory(history);
      return [...history];
    });
  }, [connectionString]);

  const loggerProvider = useRef({
    createLogger: (component = 'SANDBOX-LOGGER'): LoggerAndTelemetry => {
      const logger = (name: 'debug' | 'info' | 'warn' | 'error' | 'fatal') => {
        return (...args: any[]) => {
          logging.push({ name, component, args });
        };
      };

      const track = (event: string, properties: any) => {
        tracking.push({ event, properties });
      };

      const debug = createDebug(`mongodb-compass:${component.toLowerCase()}`);

      return {
        log: {
          component,
          get unbound() {
            return this as unknown as MongoLogWriter;
          },
          write: () => true,
          debug: logger('debug'),
          info: logger('info'),
          warn: logger('warn'),
          error: logger('error'),
          fatal: logger('fatal'),
        },
        debug,
        track,
        mongoLogId,
      };
    },
  });

  if (openCompassWeb && connectionInfo) {
    return (
      <Body as="div" className={sandboxContainerStyles}>
        <LoggerAndTelemetryProvider value={loggerProvider.current}>
          <ErrorBoundary>
            <CompassWeb
              connectionInfo={connectionInfo}
              initialWorkspaceTabs={[initialTab]}
              stackedElementsZIndex={500}
              onActiveWorkspaceTabChange={(tab) => {
                let newPath: string;
                switch (tab?.type) {
                  case 'Databases':
                    newPath = '/databases';
                    break;
                  case 'Collections':
                    newPath = `/collections/${tab.namespace}`;
                    break;
                  case 'Collection':
                    newPath = `/collection/${tab.namespace}`;
                    break;
                  default:
                    newPath = '/';
                }
                if (newPath) {
                  window.history.replaceState(null, '', newPath);
                }
              }}
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
              onConnectClick();
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
                  onConnectClick();
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
            {connectionsHistory.length > 0 && (
              <div>
                <Label htmlFor="connection-list">Connection history</Label>
                <ul id="connection-list" className={historyListStyles}>
                  {connectionsHistory.map((connectionInfo) => {
                    return (
                      <KeylineCard
                        as="li"
                        key={connectionInfo.id}
                        className={historyListItemStyles}
                        contentStyle="clickable"
                      >
                        <button
                          className={historyItemButtonStyles}
                          type="button"
                          onClick={() => {
                            onChangeConnectionString(
                              connectionInfo.connectionOptions.connectionString
                            );
                          }}
                        >
                          {redactConnectionString(
                            connectionInfo.connectionOptions.connectionString
                          )}
                        </button>
                      </KeylineCard>
                    );
                  })}
                </ul>
              </div>
            )}
            <Button
              data-testid="connect-button"
              disabled={!canSubmit}
              variant="primary"
              type="submit"
            >
              Connect
            </Button>
          </form>
        </Card>
      </div>
    </Body>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
