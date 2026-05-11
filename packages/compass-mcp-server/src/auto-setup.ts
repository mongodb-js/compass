import fs from 'fs/promises';
import path from 'path';
import {
  applyEdits,
  findNodeAtLocation,
  modify,
  parseTree,
  type Node,
} from 'jsonc-parser';
import * as clientPaths from './client-paths';
import type { AiClientId } from './client-paths';

/**
 * The single MCP server name written under the client's servers map. We use
 * the same id everywhere so subsequent installs (e.g. switching dev <-> prod
 * Compass) update the existing entry in place rather than spawning duplicates.
 */
export const MCP_SERVER_NAME = 'mongodb-compass';

export interface InstallStatus {
  /** Absolute path of the config file we wrote. */
  configPath: string;
  /** True if we created the file (it didn't exist). */
  created: boolean;
  /** True if we replaced an existing 'mongodb-compass' entry. */
  updated: boolean;
}

export interface DetectedStatus {
  configPath: string;
  /** File exists on disk and is parseable. */
  configExists: boolean;
  /**
   * The entry is present AND its command + args exactly match what we would
   * install today. False means either no entry or a stale entry.
   */
  installed: boolean;
}

const JSONC_FORMAT = {
  formattingOptions: {
    tabSize: 2,
    insertSpaces: true,
    eol: '\n',
  } as const,
};

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

function buildEntry(
  command: string,
  args: string[]
): {
  command: string;
  args: string[];
} {
  return { command, args };
}

/**
 * Install or update the Compass MCP entry in `client`'s user-level config
 * file, preserving any pre-existing entries, comments, and formatting.
 */
export async function installInClient(
  client: AiClientId,
  command: string,
  args: string[]
): Promise<InstallStatus> {
  const spec = clientPaths.getClientSpec(client);
  const existing = await readIfExists(spec.configPath);

  const entry = buildEntry(command, args);
  const basePath = [spec.serversKey, MCP_SERVER_NAME];

  if (existing === null || existing.trim() === '') {
    // Brand new file (or empty placeholder). Write a minimal valid JSON file
    // that wraps our entry.
    const newContent = JSON.stringify(
      { [spec.serversKey]: { [MCP_SERVER_NAME]: entry } },
      null,
      2
    );
    await fs.mkdir(path.dirname(spec.configPath), { recursive: true });
    await fs.writeFile(spec.configPath, newContent + '\n', 'utf-8');
    return { configPath: spec.configPath, created: true, updated: false };
  }

  // File exists with content. Use jsonc-parser to patch in place so we keep
  // any comments / trailing commas the user has.
  const tree = parseTree(existing);
  const existingEntry = tree ? findNodeAtLocation(tree, basePath) : undefined;

  let next = existing;
  next = applyEdits(next, modify(next, basePath, entry, JSONC_FORMAT));

  // If the parent `servers` / `mcpServers` block didn't exist, `modify` above
  // already creates it. Preserve trailing newline if the original had one.
  if (!next.endsWith('\n')) next += '\n';

  await fs.writeFile(spec.configPath, next, 'utf-8');
  return {
    configPath: spec.configPath,
    created: false,
    updated: existingEntry !== undefined,
  };
}

/**
 * Remove the Compass MCP entry from `client`'s config. No-op if the entry
 * isn't present. Leaves the rest of the file alone.
 */
export async function uninstallFromClient(client: AiClientId): Promise<void> {
  const spec = clientPaths.getClientSpec(client);
  const existing = await readIfExists(spec.configPath);
  if (existing === null || existing.trim() === '') return;

  const tree = parseTree(existing);
  if (!tree) return;
  const node = findNodeAtLocation(tree, [spec.serversKey, MCP_SERVER_NAME]);
  if (!node) return;

  let next = applyEdits(
    existing,
    modify(
      existing,
      [spec.serversKey, MCP_SERVER_NAME],
      undefined,
      JSONC_FORMAT
    )
  );
  if (!next.endsWith('\n')) next += '\n';
  await fs.writeFile(spec.configPath, next, 'utf-8');
}

/**
 * Report whether the Compass MCP entry is already present in this client's
 * config AND matches the command/args we would write today. Used by the
 * Settings UI to render Install / Update / Installed states.
 */
export async function detectInClient(
  client: AiClientId,
  command: string,
  args: string[]
): Promise<DetectedStatus> {
  const spec = clientPaths.getClientSpec(client);
  const existing = await readIfExists(spec.configPath);
  if (existing === null) {
    return {
      configPath: spec.configPath,
      configExists: false,
      installed: false,
    };
  }
  if (existing.trim() === '') {
    return {
      configPath: spec.configPath,
      configExists: true,
      installed: false,
    };
  }

  const tree = parseTree(existing);
  if (!tree) {
    return {
      configPath: spec.configPath,
      configExists: true,
      installed: false,
    };
  }
  const entry = findNodeAtLocation(tree, [spec.serversKey, MCP_SERVER_NAME]);
  return {
    configPath: spec.configPath,
    configExists: true,
    installed: entry !== undefined && entryMatches(entry, command, args),
  };
}

function entryMatches(
  node: Node,
  expectedCommand: string,
  expectedArgs: string[]
): boolean {
  const cmd = findNodeAtLocation(node, ['command']);
  if (cmd?.value !== expectedCommand) return false;
  const argsNode = findNodeAtLocation(node, ['args']);
  if (!argsNode || !Array.isArray(argsNode.children)) return false;
  const actual = argsNode.children.map((c) => c.value as unknown);
  if (actual.length !== expectedArgs.length) return false;
  return actual.every((v, i) => v === expectedArgs[i]);
}
