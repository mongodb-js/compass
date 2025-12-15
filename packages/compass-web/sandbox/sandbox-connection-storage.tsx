import type {
  ConnectionInfo,
  ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';

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
    return JSON.parse(str);
  } catch {
    return [];
  }
}
function saveHistory(history: ConnectionInfo[]) {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(history));
    const binStr = String.fromCodePoint(...bytes);
    const b64Str = window.btoa(binStr);
    localStorage.setItem(historyKey, b64Str);
  } catch {
    // noop
  }
}

class SandboxConnectionStorage implements ConnectionStorage {
  private _connections = new Map(
    getHistory().map((info) => {
      return [info.id, info];
    })
  );

  // Ensure useSystemCA is set to false for all connections since system CA
  // certificates are not available in the browser environment
  private normalizeConnectionInfo(info: ConnectionInfo): ConnectionInfo {
    return {
      ...info,
      connectionOptions: {
        ...info.connectionOptions,
        useSystemCA: false,
      },
    };
  }

  loadAll(): Promise<ConnectionInfo[]> {
    return Promise.resolve(
      Array.from(this._connections.values()).map((info) =>
        this.normalizeConnectionInfo(info)
      )
    );
  }
  load({ id }: { id: string }): Promise<ConnectionInfo | undefined> {
    const info = this._connections.get(id);
    return Promise.resolve(
      info ? this.normalizeConnectionInfo(info) : undefined
    );
  }
  save({ connectionInfo }: { connectionInfo: ConnectionInfo }): Promise<void> {
    // Normalize the connection to ensure useSystemCA is false before saving
    const normalizedInfo = this.normalizeConnectionInfo(connectionInfo);
    this._connections.set(normalizedInfo.id, normalizedInfo);
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

export const sandboxConnectionStorage = new SandboxConnectionStorage();
