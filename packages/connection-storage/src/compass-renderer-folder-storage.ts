import type { HadronIpcRenderer } from '@mongodb-js/hadron-ipc';
import type {
  Folder,
  FolderAssignment,
  FolderStorage,
  FolderAssignmentStorage,
} from './folder-storage';

export type FolderStorageIPCInterface = Required<
  Omit<FolderStorage, 'on' | 'off' | 'emit'>
>;

export type FolderAssignmentStorageIPCInterface = Required<
  Omit<FolderAssignmentStorage, 'on' | 'off' | 'emit'>
>;

export type FolderStorageIPCRenderer = Pick<
  HadronIpcRenderer,
  'createInvoke' | 'call'
>;

class CompassRendererFolderStorage implements FolderStorage {
  private _ipc: FolderStorageIPCInterface | undefined;
  private readonly ipcRenderer?: FolderStorageIPCRenderer;

  constructor(ipcRenderer?: FolderStorageIPCRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  get ipc() {
    const ipc =
      this._ipc ??
      (this._ipc = this.ipcRenderer?.createInvoke<
        FolderStorageIPCInterface,
        'loadAll' | 'save' | 'delete'
      >('FolderStorage', ['loadAll', 'save', 'delete']));
    if (!ipc) {
      throw new Error('IPC not available');
    }
    return ipc;
  }

  loadAll(options?: { signal?: AbortSignal | undefined }): Promise<Folder[]> {
    return this.ipc.loadAll(options);
  }

  async save(options: {
    folder: Folder;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.save(options);
  }

  async delete(options: {
    id: string;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.delete(options);
  }
}

class CompassRendererFolderAssignmentStorage implements FolderAssignmentStorage {
  private _ipc: FolderAssignmentStorageIPCInterface | undefined;
  private readonly ipcRenderer?: FolderStorageIPCRenderer;

  constructor(ipcRenderer?: FolderStorageIPCRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  get ipc() {
    const ipc =
      this._ipc ??
      (this._ipc = this.ipcRenderer?.createInvoke<
        FolderAssignmentStorageIPCInterface,
        'loadAll' | 'save' | 'delete'
      >('FolderAssignmentStorage', ['loadAll', 'save', 'delete']));
    if (!ipc) {
      throw new Error('IPC not available');
    }
    return ipc;
  }

  loadAll(options?: {
    signal?: AbortSignal | undefined;
  }): Promise<FolderAssignment[]> {
    return this.ipc.loadAll(options);
  }

  async save(options: {
    assignment: FolderAssignment;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.save(options);
  }

  async delete(options: {
    itemType: FolderAssignment['itemType'];
    itemId: string;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.delete(options);
  }
}

export { CompassRendererFolderStorage, CompassRendererFolderAssignmentStorage };
