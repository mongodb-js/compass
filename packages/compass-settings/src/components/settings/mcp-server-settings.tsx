import React, { useCallback, useEffect, useState } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import {
  Code,
  css,
  cx,
  Link,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { usePreferences } from 'compass-preferences-model/provider';
import SettingsList from './settings-list';

// ─── client definitions ─────────────────────────────────────────────────────

type ClientId = 'claude' | 'cursor' | 'vscode' | 'windsurf';

interface BridgeInfo {
  command: string;
  args: string[];
  clientConfigPaths: Record<ClientId, string>;
}

const CLIENTS: {
  id: ClientId;
  label: string;
  key: 'mcpServers' | 'servers';
}[] = [
  { id: 'claude', label: 'Claude Desktop', key: 'mcpServers' },
  { id: 'cursor', label: 'Cursor', key: 'mcpServers' },
  { id: 'vscode', label: 'VS Code', key: 'servers' },
  { id: 'windsurf', label: 'Windsurf', key: 'mcpServers' },
];

function buildSnippet(
  bridge: BridgeInfo,
  key: 'mcpServers' | 'servers'
): string {
  return JSON.stringify(
    {
      [key]: {
        'mongodb-compass': {
          command: bridge.command,
          args: bridge.args,
        },
      },
    },
    null,
    2
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const sectionStyles = css({ marginTop: spacing[3] });

const tabsContainerStyles = css({
  display: 'flex',
  gap: spacing[3],
  marginTop: spacing[2],
});

const tabListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
  minWidth: spacing[1600] + spacing[200],
  flexShrink: 0,
});

const tabButtonStyles = css({
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

const tabActiveLightStyles = css({
  backgroundColor: palette.green.light3,
  color: palette.gray.dark3,
});

const tabActiveDarkStyles = css({
  backgroundColor: palette.gray.dark2,
  color: palette.white,
});

const tabHoverLightStyles = css({
  '&:hover': {
    backgroundColor: palette.green.light2,
    color: palette.gray.dark3,
  },
});

const tabHoverDarkStyles = css({
  '&:hover': {
    backgroundColor: palette.gray.dark3,
    color: palette.white,
  },
});

const contentStyles = css({ flex: 1, minWidth: 0 });

const codeStyles = css({ marginTop: spacing[1], overflowX: 'auto' });

const openConfigRowStyles = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[1],
  fontSize: '13px',
});

const openConfigLinkStyles = css({
  fontFamily: 'monospace',
  fontSize: '12px',
  wordBreak: 'break-all',
});

// ─── component ───────────────────────────────────────────────────────────────

const McpServerSettings: React.FunctionComponent = () => {
  const { enableMcpServer } = usePreferences(['enableMcpServer']);
  const [bridge, setBridge] = useState<BridgeInfo | null>(null);
  const [activeClient, setActiveClient] = useState<ClientId>('claude');
  const darkMode = useDarkMode();

  useEffect(() => {
    void ipcRenderer
      ?.call('mcp:get-bridge-info')
      .then((info: BridgeInfo) => setBridge(info));
  }, []);

  const client = CLIENTS.find((c) => c.id === activeClient) ?? CLIENTS[0];
  const configPath = bridge?.clientConfigPaths[client.id] ?? '';
  const snippet = bridge ? buildSnippet(bridge, client.key) : '';

  const openConfig = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!configPath) return;
      void ipcRenderer?.call('mcp:open-config-file', configPath);
    },
    [configPath]
  );

  return (
    <div data-testid="mcp-server-settings">
      <SettingsList fields={['enableMcpServer']} />

      {enableMcpServer && bridge && (
        <div className={sectionStyles}>
          <div className={tabsContainerStyles}>
            <div className={tabListStyles} role="tablist">
              {CLIENTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={activeClient === c.id}
                  className={cx(tabButtonStyles, {
                    [darkMode ? tabActiveDarkStyles : tabActiveLightStyles]:
                      activeClient === c.id,
                    [darkMode ? tabHoverDarkStyles : tabHoverLightStyles]:
                      activeClient !== c.id,
                  })}
                  onClick={() => setActiveClient(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className={contentStyles}>
              <div className={openConfigRowStyles}>
                <span>Open config:</span>
                <Link
                  className={openConfigLinkStyles}
                  href="#"
                  onClick={openConfig}
                  hideExternalIcon
                >
                  {configPath}
                </Link>
              </div>
              <div className={codeStyles}>
                <Code language="json">{snippet}</Code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default McpServerSettings;
