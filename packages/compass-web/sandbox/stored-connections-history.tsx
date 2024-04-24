import { useCallback, useState, useEffect } from 'react';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { Label } from '@mongodb-js/compass-components';
import { redactConnectionString } from 'mongodb-connection-string-url';
import React from 'react';
import { ConnectionsList } from './connections-list';

function getHistory(): ConnectionInfo[] {
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
export function saveHistory(history: any) {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(history));
    const binStr = String.fromCodePoint(...bytes);
    const b64Str = window.btoa(binStr);
    localStorage.setItem('CONNECTIONS_HISTORY', b64Str);
  } catch (err) {
    // noop
  }
}
export function useConnectionsHistory() {
  const [connectionsHistory, setConnectionsHistory] = useState(() => {
    return getHistory();
  });

  useEffect(() => {
    saveHistory(connectionsHistory);
  }, [connectionsHistory]);

  const updateConnectionsHistory = useCallback(
    (connectionInfo: ConnectionInfo) => {
      setConnectionsHistory((history) => {
        const connectionExists = history.some((info) => {
          return (
            info.connectionOptions.connectionString ===
            connectionInfo.connectionOptions.connectionString
          );
        });
        if (connectionExists) {
          return history;
        }
        const newHistory = [...history];
        newHistory.unshift({
          ...connectionInfo,
          id: Math.random().toString(36).slice(2),
        });
        if (newHistory.length > 10) {
          newHistory.pop();
        }
        return newHistory;
      });
    },
    []
  );

  return [connectionsHistory, updateConnectionsHistory] as const;
}

export function StoredConnectionsList({
  connectionsHistory,
  onConnectionClick,
  onConnectionDoubleClick,
}: {
  connectionsHistory: ConnectionInfo[];
  onConnectionClick(info: ConnectionInfo): void;
  onConnectionDoubleClick(info: ConnectionInfo): void;
}) {
  if (connectionsHistory.length === 0) {
    return null;
  }
  return (
    <div>
      <Label htmlFor="connection-list">Connection history</Label>
      <ConnectionsList
        id="connection-list"
        connections={connectionsHistory}
        onConnectionClick={onConnectionClick}
        onConnectionDoubleClick={onConnectionDoubleClick}
        renderConnectionLabel={(connectionInfo) => {
          return redactConnectionString(
            connectionInfo.connectionOptions.connectionString
          );
        }}
      ></ConnectionsList>
    </div>
  );
}
