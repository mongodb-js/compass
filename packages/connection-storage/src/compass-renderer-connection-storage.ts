import { ipcRenderer } from 'hadron-ipc';
import { EventEmitter } from 'events';
import {
  type CompassConnectionStorageIPCRenderer,
  type CompassConnectionStorage,
  type ConnectionStorageEvent,
  type ConnectionStorageEventListeners,
  type CompassConnectionStorageIPCInterface,
  ConnectionStorageEvents,
} from './connection-storage';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type {
  ExportConnectionOptions,
  ImportConnectionOptions,
} from './import-export-connection';

class CompassRendererConnectionStorage
  extends EventEmitter
  implements CompassConnectionStorage
{
  private _ipc: CompassConnectionStorageIPCInterface | undefined;
  constructor(
    private readonly ipcRenderer?: CompassConnectionStorageIPCRenderer
  ) {
    super();
  }

  get ipc() {
    const ipc =
      this._ipc ??
      (this._ipc = this.ipcRenderer?.createInvoke<
        CompassConnectionStorage,
        | 'loadAll'
        | 'load'
        | 'save'
        | 'delete'
        | 'getLegacyConnections'
        | 'deserializeConnections'
        | 'exportConnections'
        | 'importConnections'
      >('ConnectionStorage', [
        'loadAll',
        'load',
        'save',
        'delete',
        'getLegacyConnections',
        'deserializeConnections',
        'exportConnections',
        'importConnections',
      ]));
    if (!ipc) {
      throw new Error('IPC not available');
    }
    return ipc;
  }

  get loadAll() {
    return this.ipc.loadAll;
  }

  get load() {
    return this.ipc.load;
  }

  async save(options: {
    connectionInfo: ConnectionInfo;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.save(options);
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
  }

  async delete(options: {
    id: string;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.delete(options);
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
  }

  getLegacyConnections(
    options?: { signal?: AbortSignal | undefined } | undefined
  ): Promise<{ name: string }[]> {
    return this.ipc.getLegacyConnections(options);
  }

  deserializeConnections(args: {
    content: string;
    options: ImportConnectionOptions;
    signal?: AbortSignal | undefined;
  }): Promise<ConnectionInfo[]> {
    return this.ipc.deserializeConnections(args);
  }

  exportConnections(
    args?:
      | {
          options?: ExportConnectionOptions | undefined;
          signal?: AbortSignal | undefined;
        }
      | undefined
  ): Promise<string> {
    return this.ipc.exportConnections(args);
  }

  async importConnections(args: {
    content: string;
    options?: ImportConnectionOptions | undefined;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.importConnections(args);
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
  }

  on<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.on(eventName, listener);
  }

  off<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.off(eventName, listener);
  }

  once<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.once(eventName, listener);
  }

  removeListener<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.removeListener(eventName, listener);
  }

  emit<T extends ConnectionStorageEvent>(
    eventName: T,
    ...args: Parameters<ConnectionStorageEventListeners[T]>
  ): boolean {
    return super.emit(eventName, ...args);
  }
}

export type { CompassRendererConnectionStorage };

let rendererConnectionStorage: CompassRendererConnectionStorage | null = null;

export const getCompassRendererConnectionStorage =
  (): CompassRendererConnectionStorage => {
    if (!rendererConnectionStorage) {
      rendererConnectionStorage = new CompassRendererConnectionStorage(
        ipcRenderer
      );
    }

    return rendererConnectionStorage;
  };
