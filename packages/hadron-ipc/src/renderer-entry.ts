/**
 * Renderer-only entry point, mirroring `./index` minus the main-process half.
 *
 * `./index` imports `./main` eagerly, and that file imports `electron` as a
 * value, so a renderer resolving the default entry pulls Electron into the
 * bundle even though it never uses the main-process API. The renderer webpack
 * config aliases `hadron-ipc` here instead.
 */
import hadronIpcRenderer from './renderer';

export const ipcRenderer = hadronIpcRenderer;

/** Always undefined here: there is no main process in the renderer. */
export const ipcMain = undefined;

const hadronIpc = (hadronIpcRenderer ?? {}) as Partial<
  NonNullable<typeof hadronIpcRenderer>
>;

export type HadronIpc = typeof hadronIpc;
export type HadronIpcRenderer = NonNullable<typeof hadronIpcRenderer>;
export type HadronIpcMain = never;
export type { IpcMainEvent as HadronIpcMainEvent } from 'electron';
export default hadronIpc;
