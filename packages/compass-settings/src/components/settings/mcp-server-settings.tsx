import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import {
  Badge,
  Body,
  Button,
  Code,
  css,
  Link,
  spacing,
  TextInput,
  Tooltip,
} from '@mongodb-js/compass-components';
import { usePreferences } from 'compass-preferences-model/provider';
import SettingsList from './settings-list';

const MCP_PORT = 27097;
const MCP_URL = `http://127.0.0.1:${MCP_PORT}/mcp`;

type McpStatus = 'running' | 'stopped' | 'error';

const sectionStyles = css({
  marginTop: spacing[3],
});

const rowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  marginTop: spacing[2],
});

const codeBlockStyles = css({
  marginTop: spacing[2],
  width: '100%',
  overflowX: 'auto',
});

function buildSnippet(token: string): string {
  return JSON.stringify(
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
  );
}

const McpServerSettings: React.FunctionComponent = () => {
  const { enableMcpServer, mcpServerToken } = usePreferences([
    'enableMcpServer',
    'mcpServerToken',
  ]);
  const [status, setStatus] = useState<McpStatus>('stopped');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [tokenVisible, setTokenVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();

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
    };
    ipcRenderer?.on('mcp:status-update', handler as never);
    return () => {
      ipcRenderer?.removeListener('mcp:status-update', handler as never);
    };
  }, []);

  const copySnippet = useCallback(() => {
    if (!mcpServerToken) return;
    void navigator.clipboard.writeText(buildSnippet(mcpServerToken));
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [mcpServerToken]);

  const copyToken = useCallback(() => {
    if (!mcpServerToken) return;
    void navigator.clipboard.writeText(mcpServerToken);
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [mcpServerToken]);

  return (
    <div data-testid="mcp-server-settings">
      <Body>
        Start a local MCP server so AI tools like{' '}
        <Link href="https://www.anthropic.com/claude">Claude Desktop</Link> can
        run read-only MongoDB queries against your connections.
      </Body>

      <SettingsList fields={['enableMcpServer']} />

      <div className={sectionStyles}>
        <Body weight="medium">Server URL</Body>
        <Code language="none">{MCP_URL}</Code>
      </div>

      {mcpServerToken && (
        <>
          <div className={sectionStyles}>
            <Body weight="medium">Bearer Token</Body>
            <div className={rowStyles}>
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
              <Button size="xsmall" onClick={copyToken}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className={sectionStyles}>
            <Body weight="medium">Claude Desktop snippet</Body>
            <Body>
              Paste this into your{' '}
              <Code language="none">claude_desktop_config.json</Code>:
            </Body>
            <div className={codeBlockStyles}>
              <Code language="json">{buildSnippet(mcpServerToken)}</Code>
            </div>
            <div className={rowStyles}>
              <Button size="xsmall" onClick={copySnippet}>
                {copied ? 'Copied!' : 'Copy snippet'}
              </Button>
            </div>
          </div>
        </>
      )}

      {enableMcpServer && (
        <div className={sectionStyles}>
          <div className={rowStyles}>
            <Body weight="medium">Server status:</Body>
            {status === 'running' && <Badge variant="green">Running</Badge>}
            {status === 'stopped' && <Badge variant="lightgray">Stopped</Badge>}
            {status === 'error' && (
              <Tooltip trigger={<Badge variant="red">Error</Badge>}>
                <Body>{errorMsg || 'Unknown error'}</Body>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default McpServerSettings;
