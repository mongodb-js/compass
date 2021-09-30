import type { IpcMain, IpcRenderer, BrowserWindow } from 'electron';

export type HadronIpcMain = IpcMain & {
  respondTo(
    name: string,
    handler: (browserWindow: BrowserWindow, ...args: any[]) => any
  ): void;
  respondTo(
    handlerMap: Record<
      string,
      (browserWindow: BrowserWindow, ...args: any[]) => any
    >
  ): void;
  broadcast(name: string, ...args: any[]): void;
  broadcastFocused(name: string, ...args: any[]): void;
  remove: typeof ipcMain['removeListener'];
};

export type HadronIpcRenderer = IpcRenderer & {
  call(name: string, ...args: any[]): Promise<any>;
  callQuiet(name: string, ...args: any[]): Promise<any>;
};

export type HadronIpc = HadronIpcMain | HadronIpcRenderer;

export = HadronIpc;
export const ipcMain: HadronIpcMain;
export const ipcRenderer: HadronIpcRenderer;
