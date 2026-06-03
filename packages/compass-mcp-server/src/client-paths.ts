import os from 'os';
import path from 'path';

/**
 * AI client desktop applications we know how to write MCP server config for.
 * Each id corresponds to one entry in the auto-setup registry and one tab in
 * the Settings → MCP Server panel.
 */
export type AiClientId = 'claude' | 'cursor' | 'vscode' | 'windsurf';

/** Top-level JSON key under which each client lists its MCP servers. */
export type McpServersKey = 'mcpServers' | 'servers';

export interface AiClientSpec {
  id: AiClientId;
  label: string;
  /** User-level config file path (NOT workspace). */
  configPath: string;
  serversKey: McpServersKey;
}

function serversKey(client: AiClientId): McpServersKey {
  // VS Code uses `servers`; everyone else uses `mcpServers`.
  return client === 'vscode' ? 'servers' : 'mcpServers';
}

function label(client: AiClientId): string {
  switch (client) {
    case 'claude':
      return 'Claude Desktop';
    case 'cursor':
      return 'Cursor';
    case 'vscode':
      return 'VS Code';
    case 'windsurf':
      return 'Windsurf';
  }
}

/**
 * Absolute paths to the user-level MCP config file for each supported AI
 * client on the current OS. These are the same files `npx mongodb-mcp-server
 * setup` writes to.
 */
function resolveConfigPath(client: AiClientId): string {
  const home = os.homedir();
  if (process.platform === 'win32') {
    const appData =
      process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    switch (client) {
      case 'claude':
        return path.join(appData, 'Claude', 'claude_desktop_config.json');
      case 'cursor':
        return path.join(home, '.cursor', 'mcp.json');
      case 'vscode':
        return path.join(appData, 'Code', 'User', 'mcp.json');
      case 'windsurf':
        return path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
    }
  }
  if (process.platform === 'darwin') {
    switch (client) {
      case 'claude':
        return path.join(
          home,
          'Library',
          'Application Support',
          'Claude',
          'claude_desktop_config.json'
        );
      case 'cursor':
        return path.join(home, '.cursor', 'mcp.json');
      case 'vscode':
        return path.join(
          home,
          'Library',
          'Application Support',
          'Code',
          'User',
          'mcp.json'
        );
      case 'windsurf':
        return path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
    }
  }
  // linux / other unix
  const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  switch (client) {
    case 'claude':
      return path.join(configHome, 'Claude', 'claude_desktop_config.json');
    case 'cursor':
      return path.join(home, '.cursor', 'mcp.json');
    case 'vscode':
      return path.join(configHome, 'Code', 'User', 'mcp.json');
    case 'windsurf':
      return path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
  }
}

export function getClientSpec(client: AiClientId): AiClientSpec {
  return {
    id: client,
    label: label(client),
    configPath: resolveConfigPath(client),
    serversKey: serversKey(client),
  };
}

export const ALL_CLIENTS: AiClientId[] = [
  'claude',
  'cursor',
  'vscode',
  'windsurf',
];

/** Convenience: map of client → absolute config path. */
export function getAllClientConfigPaths(): Record<AiClientId, string> {
  const out = Object.create(null) as Record<AiClientId, string>;
  for (const c of ALL_CLIENTS) {
    out[c] = resolveConfigPath(c);
  }
  return out;
}
