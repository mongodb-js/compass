import { ipcRenderer } from 'hadron-ipc';
import type { AgentConfig, CommandRisk } from '../stores/store';

// ─── Command Classification ─────────────────────────────────

export function classifyCommand(command: string): CommandRisk {
  const normalized = command.toLowerCase();

  if (
    /\.(drop|dropdatabase|dropindex|createindex|createcollection)\s*\(/.test(
      normalized
    )
  ) {
    return 'admin';
  }
  if (
    /\.(delete|deleteone|deletemany|remove|findoneanddelete)\s*\(/.test(
      normalized
    )
  ) {
    return 'delete';
  }
  if (
    /\.(update|updateone|updatemany|replaceone|findoneandupdate|findoneandreplace)\s*\(/.test(
      normalized
    )
  ) {
    return 'update';
  }
  if (/\.(insert|insertone|insertmany|bulkwrite)\s*\(/.test(normalized)) {
    return 'write';
  }
  // Default: read operations — find, aggregate, count, distinct, explain, etc.
  return 'read';
}

// ─── Risk Labels ─────────────────────────────────────────────

export function getRiskLabel(risk: CommandRisk): {
  label: string;
  variant: 'info' | 'warning' | 'danger';
} {
  switch (risk) {
    case 'read':
      return { label: 'Read Operation', variant: 'info' };
    case 'write':
      return { label: 'Write Operation', variant: 'warning' };
    case 'update':
      return { label: 'Update Operation', variant: 'warning' };
    case 'delete':
      return { label: '⚠ Delete Operation', variant: 'danger' };
    case 'admin':
      return { label: '🔴 Admin Operation', variant: 'danger' };
  }
}

// ─── AI Service ──────────────────────────────────────────────

export type AgentResponse = {
  explanation: string;
  command: string;
  risk: CommandRisk;
};

export async function queryAgent(
  userMessage: string,
  config: AgentConfig,
  dbContext: {
    dbName: string;
    collections: string[];
    schemaSamples: Record<string, unknown>;
  }
): Promise<AgentResponse> {
  const response = await ipcRenderer?.invoke('compass-agent-shell:query', {
    userMessage,
    config,
    dbContext,
  });

  return response as AgentResponse;
}
