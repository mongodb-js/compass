import { EventEmitter } from 'events';
import type { HadronIpcMain, HadronIpcRenderer } from 'hadron-ipc';
import type {
  ConnectionInfo,
  AtlasClusterMetadata,
} from '@mongodb-js/connection-info';
import type {
  ExportConnectionOptions,
  ImportConnectionOptions,
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
}

export interface CompassConnectionStorage extends ConnectionStorage {
  save(options: {
    connectionInfo: ConnectionInfo;
    signal?: AbortSignal;
  }): Promise<void>;

  delete(options: {
    id: ConnectionInfo['id'];
    signal?: AbortSignal;
  }): Promise<void>;

  getLegacyConnections(options?: {
    signal?: AbortSignal;
  }): Promise<{ name: string }[]>;

  deserializeConnections(args: {
    content: string;
    options: ImportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<ConnectionInfo[]>;

  exportConnections(args?: {
    options?: ExportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<string>;

  importConnections(args: {
    content: string;
    options?: ImportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<void>;
}

export type CompassConnectionStorageIPCInterface = Omit<
  CompassConnectionStorage,
  'on' | 'off' | 'emit'
>;

export type CompassConnectionStorageIPCMain = Pick<
  HadronIpcMain,
  'createHandle'
>;

export type CompassConnectionStorageIPCRenderer = Pick<
  HadronIpcRenderer,
  'createInvoke'
>;

export class NoopConnectionStorage
  extends EventEmitter
  implements ConnectionStorage
{
  constructor() {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadAll(options?: { signal?: AbortSignal }): Promise<ConnectionInfo[]> {
    return Promise.resolve([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  load(options: {
    id: string;
    signal?: AbortSignal;
  }): Promise<ConnectionInfo | undefined> {
    return Promise.resolve(undefined);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  save(options: {
    connectionInfo: ConnectionInfo;
    signal?: AbortSignal;
  }): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(options: { id: string; signal?: AbortSignal }): Promise<void> {
    return Promise.resolve();
  }
}

export class NoopCompassConnectionStorage
  extends NoopConnectionStorage
  implements CompassConnectionStorage
{
  constructor() {
    super();
  }

  getLegacyConnections(): Promise<{ name: string }[]> {
    return Promise.resolve([]);
  }
  deserializeConnections(): Promise<ConnectionInfo[]> {
    return Promise.resolve([]);
  }
  exportConnections(): Promise<string> {
    return Promise.resolve('');
  }
  importConnections(): Promise<void> {
    return Promise.resolve();
  }
}

export function isCompassConnectionStorage(
  connectionStorage: ConnectionStorage | CompassConnectionStorage
): connectionStorage is CompassConnectionStorage {
  return (
    'getLegacyConnections' in connectionStorage &&
    'deserializeConnections' in connectionStorage &&
    'exportConnections' in connectionStorage &&
    'importConnections' in connectionStorage
  );
}
