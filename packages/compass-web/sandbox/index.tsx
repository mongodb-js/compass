import React, { useCallback, useState } from 'react';
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
import { CompassWeb } from '../src/index';
import type { OpenWorkspaceOptions } from '@mongodb-js/compass-workspaces';

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

function getHistory(): string[] {
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
  const [connectionsHistory, setConnectionsHistory] = useState<string[]>(() => {
    return getHistory();
  });
  const [focused, setFocused] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  const [openCompassWeb, setOpenCompassWeb] = useState(false);
  const [
    connectionStringValidationResult,
    setConnectionStringValidationResult,
  ] = useState<null | string>(null);

  const canSubmit =
    connectionStringValidationResult === null && connectionString !== '';

  const onChangeConnectionString = useCallback((str: string) => {
    setConnectionStringValidationResult(validateConnectionString(str));
    setConnectionString(str);
  }, []);

  const onConnectClick = useCallback(() => {
    setOpenCompassWeb(true);
    setConnectionsHistory((history) => {
      if (history.includes(connectionString)) {
        return history;
      }
      history.unshift(connectionString);
      if (history.length > 10) {
        history.pop();
      }
      saveHistory(history);
      return [...history];
    });
  }, [connectionString]);

  if (openCompassWeb) {
    return (
      <Body as="div" className={sandboxContainerStyles}>
        <ErrorBoundary>
          <CompassWeb
            connectionString={connectionString}
            initialWorkspaceTabs={[initialTab]}
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
                  {connectionsHistory.map((connectionString) => {
                    return (
                      <KeylineCard
                        as="li"
                        key={connectionString}
                        className={historyListItemStyles}
                        contentStyle="clickable"
                      >
                        <button
                          className={historyItemButtonStyles}
                          type="button"
                          onClick={() => {
                            onChangeConnectionString(connectionString);
                          }}
                        >
                          {redactConnectionString(connectionString)}
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
