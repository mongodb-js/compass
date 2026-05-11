import React, { useCallback, useEffect, useState } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import {
  Button,
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

const installRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

const installErrorStyles = css({
  color: palette.red.base,
  fontSize: '12px',
});

// ─── component ───────────────────────────────────────────────────────────────

type DetectedStatus = {
  configPath: string;
  configExists: boolean;
  installed: boolean;
};

const McpServerSettings: React.FunctionComponent = () => {
  const { enableMcpServer } = usePreferences(['enableMcpServer']);
  const [bridge, setBridge] = useState<BridgeInfo | null>(null);
  const [activeClient, setActiveClient] = useState<ClientId>('claude');
  const [detected, setDetected] = useState<DetectedStatus | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const darkMode = useDarkMode();

  useEffect(() => {
    void ipcRenderer
      ?.call('mcp:get-bridge-info')
      .then((info: BridgeInfo) => setBridge(info));
  }, []);

  // Re-detect whenever the active tab changes (or after install/uninstall).
  // `nonce` is bumped after install/uninstall to force a re-run of this
  // effect even when `activeClient` is unchanged. We tag the result with the
  // client it belongs to so a slow response from a previous tab doesn't
  // override the current tab's detection.
  const [detectNonce, setDetectNonce] = useState(0);
  const [detectedFor, setDetectedFor] = useState<ClientId | null>(null);
  useEffect(() => {
    let cancelled = false;
    void ipcRenderer
      ?.call('mcp:detect-in-client', activeClient)
      .then((status: DetectedStatus) => {
        if (cancelled) return;
        setDetected(status);
        setDetectedFor(activeClient);
      });
    return () => {
      cancelled = true;
    };
  }, [activeClient, detectNonce]);
  const refreshDetection = useCallback(() => setDetectNonce((n) => n + 1), []);
  // Only trust `detected` when it matches the currently selected client.
  const currentDetected = detectedFor === activeClient ? detected : null;

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

  // Install button label and behavior depend on the detection result:
  //   - file missing OR no entry → "Install"
  //   - entry exists but command/args differ → "Update"
  //   - entry matches what we'd install today → "Installed ✓" (disabled)
  const installLabel = (() => {
    if (installing) return 'Installing…';
    if (!currentDetected) return 'Install';
    if (currentDetected.installed) return 'Installed ✓';
    if (currentDetected.configExists) return 'Update';
    return 'Install';
  })();
  const installDisabled = installing || currentDetected?.installed === true;

  const handleInstall = useCallback(() => {
    setInstalling(true);
    setInstallError(null);
    void ipcRenderer
      ?.call('mcp:install-in-client', activeClient)
      .then(() => refreshDetection())
      .catch((err: Error) => setInstallError(err.message))
      .finally(() => setInstalling(false));
  }, [activeClient, refreshDetection]);

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
              <div className={installRowStyles}>
                <Button
                  size="small"
                  variant={currentDetected?.installed ? 'default' : 'primary'}
                  disabled={installDisabled}
                  onClick={handleInstall}
                >
                  {installLabel}
                </Button>
                {installError && (
                  <span className={installErrorStyles}>{installError}</span>
                )}
              </div>
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
