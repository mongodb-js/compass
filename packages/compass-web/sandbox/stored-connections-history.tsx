import { useCallback, useState } from 'react';
import { Label } from '@mongodb-js/compass-components';
import { redactConnectionString } from 'mongodb-connection-string-url';
import React from 'react';
import { ConnectionsList } from './connections-list';

const historyKey = 'CONNECTIONS_HISTORY_V3';

function getHistory(): string[] {
  try {
    const b64Str = localStorage.getItem(historyKey);
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
    localStorage.setItem(historyKey, b64Str);
  } catch (err) {
    // noop
  }
}
export function useConnectionsHistory() {
  const [connectionsHistory, setConnectionsHistory] = useState(() => {
    return getHistory();
  });

  const updateConnectionsHistory = useCallback((connectionString: string) => {
    const history = getHistory();
    const connectionExists = history.some((str) => {
      return str === connectionString;
    });
    if (connectionExists) {
      return;
    }
    const newHistory = [connectionString, ...history];
    if (newHistory.length > 10) {
      newHistory.pop();
    }
    saveHistory(newHistory);
    setConnectionsHistory(newHistory);
  }, []);

  return [connectionsHistory, updateConnectionsHistory] as const;
}

export function StoredConnectionsList({
  connectionsHistory,
  onConnectionClick,
  onConnectionDoubleClick,
}: {
  connectionsHistory: string[];
  onConnectionClick(info: string): void;
  onConnectionDoubleClick(info: string): void;
}) {
  if (connectionsHistory.length === 0) {
    return null;
  }
  return (
    <div>
      <Label htmlFor="connection-list">Connection history</Label>
      <ConnectionsList
        id="connection-list"
        connections={connectionsHistory.map((str) => {
          return { id: str, connectionOptions: { connectionString: str } };
        })}
        onConnectionClick={(info) => {
          onConnectionClick(info.connectionOptions.connectionString);
        }}
        onConnectionDoubleClick={(info) => {
          onConnectionDoubleClick(info.connectionOptions.connectionString);
        }}
        renderConnectionLabel={(connectionInfo) => {
          return redactConnectionString(
            connectionInfo.connectionOptions.connectionString
          );
        }}
      ></ConnectionsList>
    </div>
  );
}
