import type { HadronIpcMain, HadronIpcRenderer } from 'hadron-ipc';
import type {
  ConnectionInfo,
  AtlasClusterMetadata,
} from '@mongodb-js/connection-info';
import {
  type ExportConnectionOptions,
  type ImportConnectionOptions,
} from './import-export-connection';

export type { ConnectionInfo, AtlasClusterMetadata };

export const ConnectionStorageEvents = {
  ConnectionsChanged: 'ConnectionsChanged',
} as const;

export type ConnectionStorageEvent =
  typeof ConnectionStorageEvents[keyof typeof ConnectionStorageEvents];

export type ConnectionStorageEventListeners = {
  [ConnectionStorageEvents.ConnectionsChanged]: () => void;
};

export interface ConnectionStorage {
  on<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): ConnectionStorage;

  off<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): ConnectionStorage;

  emit<T extends ConnectionStorageEvent>(
    eventName: T,
    ...args: Parameters<ConnectionStorageEventListeners[T]>
  ): boolean;

  loadAll(options?: { signal?: AbortSignal }): Promise<ConnectionInfo[]>;

  load(options: {
    id: string;
    signal?: AbortSignal;
  }): Promise<ConnectionInfo | undefined>;

  save?(options: {
    connectionInfo: ConnectionInfo;
    signal?: AbortSignal;
  }): Promise<void>;

  delete?(options: { id: string; signal?: AbortSignal }): Promise<void>;

  getLegacyConnections?(options?: {
    signal?: AbortSignal;
  }): Promise<{ name: string }[]>;

  deserializeConnections?(args: {
    content: string;
    options: ImportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<ConnectionInfo[]>;

  exportConnections?(args?: {
    options?: ExportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<string>;

  importConnections?(args: {
    content: string;
    options?: ImportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<void>;
}

export type ConnectionStorageIPCInterface = Required<
  Omit<ConnectionStorage, 'on' | 'off' | 'emit'>
>;

export type ConnectionStorageIPCMain = Pick<HadronIpcMain, 'createHandle'>;

export type ConnectionStorageIPCRenderer = Pick<
  HadronIpcRenderer,
  'createInvoke'
>;
