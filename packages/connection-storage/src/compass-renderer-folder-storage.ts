import type { HadronIpcRenderer } from '@mongodb-js/hadron-ipc';
import type { FolderOrganization, FolderStorage } from './folder-storage';

export type FolderStorageIPCInterface = Required<
  Omit<FolderStorage, 'on' | 'off' | 'emit'>
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
        'load' | 'save'
      >('FolderStorage', ['load', 'save']));
    if (!ipc) {
      throw new Error('IPC not available');
    }
    return ipc;
  }

  load(): Promise<FolderOrganization> {
    return this.ipc.load();
  }

  async save(options: {
    folderOrganization: FolderOrganization;
  }): Promise<void> {
    await this.ipc.save(options);
  }
}

export { CompassRendererFolderStorage };
