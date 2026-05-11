import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import {
  Badge,
  Body,
  Button,
  Code,
  css,
  cx,
  palette,
  spacing,
  TextInput,
  Tooltip,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { usePreferences } from 'compass-preferences-model/provider';
import SettingsList from './settings-list';

const MCP_PORT = 27097;
const MCP_URL = `http://127.0.0.1:${MCP_PORT}/mcp`;

type McpStatus = 'running' | 'stopped' | 'error';

// ─── client definitions ─────────────────────────────────────────────────────

type ClientId = 'claude' | 'cursor' | 'vscode' | 'windsurf';

interface Client {
  id: ClientId;
  label: string;
  configFile: string;
  buildSnippet: (token: string) => string;
}

const CLIENTS: Client[] = [
  {
    id: 'claude',
    label: 'Claude Desktop',
    configFile:
      process.platform === 'win32'
        ? '%APPDATA%\\Claude\\claude_desktop_config.json'
        : '~/Library/Application Support/Claude/claude_desktop_config.json',
    buildSnippet: (token) =>
      JSON.stringify(
        {
          mcpServers: {
            'mongodb-compass': {
              type: 'http',
              url: MCP_URL,
              headers: { Authorization: `Bearer ${token}` },
            },
          },
        },
        null,
        2
      ),
  },
  {
    id: 'cursor',
    label: 'Cursor',
    configFile:
      process.platform === 'win32'
        ? '%USERPROFILE%\\.cursor\\mcp.json'
        : '~/.cursor/mcp.json',
    buildSnippet: (token) =>
      JSON.stringify(
        {
          mcpServers: {
            'mongodb-compass': {
              type: 'http',
              url: MCP_URL,
              headers: { Authorization: `Bearer ${token}` },
            },
          },
        },
        null,
        2
      ),
  },
  {
    id: 'vscode',
    label: 'VS Code',
    configFile: '.vscode/mcp.json  (workspace)  or  User Settings',
    buildSnippet: (token) =>
      JSON.stringify(
        {
          servers: {
            'mongodb-compass': {
              type: 'http',
              url: MCP_URL,
              headers: { Authorization: `Bearer ${token}` },
            },
          },
        },
        null,
        2
      ),
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    configFile:
      process.platform === 'win32'
        ? '%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json'
        : '~/.codeium/windsurf/mcp_config.json',
    buildSnippet: (token) =>
      JSON.stringify(
        {
          mcpServers: {
            'mongodb-compass': {
              type: 'http',
              url: MCP_URL,
              headers: { Authorization: `Bearer ${token}` },
            },
          },
        },
        null,
        2
      ),
  },
];

// ─── styles ─────────────────────────────────────────────────────────────────

const topRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[3],
  marginTop: spacing[3],
});

const tokenRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  marginTop: spacing[2],
});

const dividerStyles = css({
  borderTop: '1px solid',
  marginTop: spacing[4],
  marginBottom: spacing[3],
});

const dividerLightStyles = css({ borderColor: palette.gray.light2 });
const dividerDarkStyles = css({ borderColor: palette.gray.dark2 });

const clientTabsContainerStyles = css({
  display: 'flex',
  gap: spacing[3],
  marginTop: spacing[2],
});

const clientTabListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
  minWidth: spacing[1600] + spacing[200],
  flexShrink: 0,
});

const clientTabButtonStyles = css({
  background: 'none',
  border: 'none',
  borderRadius: spacing[1],
  cursor: 'pointer',
  padding: `${spacing[1]}px ${spacing[2]}px`,
  textAlign: 'left',
  fontWeight: 500,
  fontSize: '13px',
  width: '100%',
});

const clientTabButtonLightActiveStyles = css({
  backgroundColor: palette.green.light3,
  color: palette.gray.dark3,
});

const clientTabButtonDarkActiveStyles = css({
  backgroundColor: palette.gray.dark2,
  color: palette.white,
});

const clientTabButtonLightHoverStyles = css({
  '&:hover': {
    backgroundColor: palette.green.light2,
    color: palette.gray.dark3,
  },
});

const clientTabButtonDarkHoverStyles = css({
  '&:hover': {
    backgroundColor: palette.gray.dark3,
    color: palette.white,
  },
});

const clientContentStyles = css({
  flex: 1,
  minWidth: 0,
});

const codeBlockStyles = css({
  marginTop: spacing[2],
  overflowX: 'auto',
});

const copyRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  marginTop: spacing[2],
});

const configFileStyles = css({
  marginTop: spacing[2],
  color: palette.gray.base,
  fontSize: '12px',
  fontFamily: 'monospace',
});

// ─── component ───────────────────────────────────────────────────────────────

const McpServerSettings: React.FunctionComponent = () => {
  const { mcpServerToken } = usePreferences(['mcpServerToken']);
  // null = not yet queried; avoids showing a stale "Stopped" badge on mount
  const [status, setStatus] = useState<McpStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [tokenVisible, setTokenVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null); // stores what was copied
  const [activeClient, setActiveClient] = useState<ClientId>('claude');
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();
  const darkMode = useDarkMode();

  useEffect(() => {
    void ipcRenderer
      ?.call('mcp:get-status')
      .then((update: { status: McpStatus; error?: string }) => {
        setStatus(update.status);
        if (update.error) setErrorMsg(update.error);
      });

    const handler = (
      _event: unknown,
      update: { status: McpStatus; error?: string }
    ) => {
      setStatus(update.status);
      if (update.error) setErrorMsg(update.error);
      else setErrorMsg('');
    };
    ipcRenderer?.on('mcp:status-update', handler as never);
    return () => {
      ipcRenderer?.removeListener('mcp:status-update', handler as never);
    };
  }, []);

  const copyText = useCallback((text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(label);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 2000);
  }, []);

  const client = CLIENTS.find((c) => c.id === activeClient) ?? CLIENTS[0];

  return (
    <div data-testid="mcp-server-settings">
      <Body>
        Expose your MongoDB connections to external AI coding tools via a local
        MCP server running on your machine.
      </Body>

      <SettingsList fields={['enableMcpServer']} />

      {/* URL + status on the same row */}
      <div className={topRowStyles}>
        <div>
          <Body weight="medium">Server URL</Body>
          <Code language="none">{MCP_URL}</Code>
        </div>
        {status !== null && (
          <div>
            <Body weight="medium">Status</Body>
            <div style={{ marginTop: spacing[1] }}>
              {status === 'running' && <Badge variant="green">Running</Badge>}
              {status === 'stopped' && (
                <Badge variant="lightgray">Stopped</Badge>
              )}
              {status === 'error' && (
                <Tooltip trigger={<Badge variant="red">Error</Badge>}>
                  <Body>{errorMsg || 'Unknown error'}</Body>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Token */}
      {mcpServerToken && (
        <div style={{ marginTop: spacing[3] }}>
          <Body weight="medium">Bearer Token</Body>
          <div className={tokenRowStyles}>
            <TextInput
              value={tokenVisible ? mcpServerToken : '••••••••••••••••'}
              readOnly
              type={tokenVisible ? 'text' : 'password'}
              aria-label="MCP bearer token"
              onChange={() => {
                /* read-only */
              }}
            />
            <Button size="xsmall" onClick={() => setTokenVisible((v) => !v)}>
              {tokenVisible ? 'Hide' : 'Show'}
            </Button>
            <Button
              size="xsmall"
              onClick={() => copyText(mcpServerToken, 'token')}
            >
              {copied === 'token' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* Client config tabs */}
      {mcpServerToken && (
        <>
          <div
            className={cx(
              dividerStyles,
              darkMode ? dividerDarkStyles : dividerLightStyles
            )}
          />
          <Body weight="medium">Set up your AI tool</Body>
          <div className={clientTabsContainerStyles}>
            {/* vertical tab list */}
            <div className={clientTabListStyles} role="tablist">
              {CLIENTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={activeClient === c.id}
                  className={cx(clientTabButtonStyles, {
                    [darkMode
                      ? clientTabButtonDarkActiveStyles
                      : clientTabButtonLightActiveStyles]:
                      activeClient === c.id,
                    [darkMode
                      ? clientTabButtonDarkHoverStyles
                      : clientTabButtonLightHoverStyles]: activeClient !== c.id,
                  })}
                  onClick={() => setActiveClient(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* content */}
            <div className={clientContentStyles}>
              <div className={codeBlockStyles}>
                <Code language="json">
                  {client.buildSnippet(mcpServerToken)}
                </Code>
              </div>
              <div className={copyRowStyles}>
                <Button
                  size="xsmall"
                  onClick={() =>
                    copyText(client.buildSnippet(mcpServerToken), 'snippet')
                  }
                >
                  {copied === 'snippet' ? 'Copied!' : 'Copy snippet'}
                </Button>
              </div>
              <div className={configFileStyles}>
                Add to: {client.configFile}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default McpServerSettings;
