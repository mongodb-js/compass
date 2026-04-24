import type {
  ConnectionInfo,
  ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { sandboxConnectionStorage } from '../src/connection-storage';
import ConnectionString from 'mongodb-connection-string-url';

function ensureConnectionWithCompression(
  connectionInfo: ConnectionInfo
): ConnectionInfo {
  const cs = new ConnectionString(
    connectionInfo.connectionOptions.connectionString
  );
  cs.searchParams.delete('compressors');
  const compressor = process.env.COMPRESSION_ALGORITHM;
  if (compressor && ['zlib', 'snappy'].includes(compressor)) {
    cs.searchParams.append('compressors', compressor);
  }
  connectionInfo.connectionOptions.connectionString = cs.toString();
  return connectionInfo;
}

const historyKey = 'CONNECTIONS_HISTORY_V$';

function getHistory(): ConnectionInfo[] {
  try {
    const b64Str = localStorage.getItem(historyKey);
    if (!b64Str) {
      return [];
    }
    const binStr = window.atob(b64Str);
    const bytes = Uint8Array.from(binStr, (v) => v.codePointAt(0) ?? 0);
    const str = new TextDecoder().decode(bytes);
    return JSON.parse(str).map(ensureConnectionWithCompression);
  } catch {
    return [];
  }
}
function saveHistory(history: ConnectionInfo[]) {
  try {
    const bytes = new TextEncoder().encode(
      JSON.stringify(history.map(ensureConnectionWithCompression))
    );
    const binStr = String.fromCodePoint(...bytes);
    const b64Str = window.btoa(binStr);
    localStorage.setItem(historyKey, b64Str);
  } catch {
    // noop
  }
}

export class SandboxConnectionStorage implements ConnectionStorage {
  private _connections = new Map(
    getHistory().map((info) => {
      return [info.id, info];
    })
  );
  loadAll(): Promise<ConnectionInfo[]> {
    return Promise.resolve(Array.from(this._connections.values()));
  }
  load({ id }: { id: string }): Promise<ConnectionInfo | undefined> {
    return Promise.resolve(this._connections.get(id));
  }
  save({ connectionInfo }: { connectionInfo: ConnectionInfo }): Promise<void> {
    this._connections.set(
      connectionInfo.id,
      ensureConnectionWithCompression(connectionInfo)
    );
    setTimeout(() => {
      saveHistory(Array.from(this._connections.values()));
    }, 0);
    return Promise.resolve();
  }
  delete({ id }: { id: string }): Promise<void> {
    this._connections.delete(id);
    setTimeout(() => {
      saveHistory(Array.from(this._connections.values()));
    }, 0);
    return Promise.resolve();
  }
}

sandboxConnectionStorage.current = Object.hasOwn(
  globalThis,
  '__compassWebEnableSandboxStorage'
)
  ? new SandboxConnectionStorage()
  : null;

(window as any).SandboxConnectionStorage = sandboxConnectionStorage;
