import isRenderer from 'is-electron-renderer';
import hadronIpcRenderer from './renderer';
import hadronIpcMain from './main';

const isElectron =
  typeof process !== 'undefined' &&
  ['browser', 'renderer', 'worker', 'utility'].includes(
    (process as unknown as { type: string }).type
  );

const ipcRenderer = isElectron && isRenderer ? hadronIpcRenderer : undefined;

const ipcMain = isElectron && !isRenderer ? hadronIpcMain : undefined;

const hadronIpc = (() => {
  if (!isElectron) {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.warn('Unsupported environment for hadron-ipc');
    }
    return {};
  }

  return (isRenderer ? hadronIpcRenderer : hadronIpcMain) ?? {};
})() as Partial<typeof hadronIpcRenderer & typeof hadronIpcMain>;

export type HadronIpc = typeof hadronIpc;
export type HadronIpcRenderer = NonNullable<typeof hadronIpcRenderer>;
export type HadronIpcMain = NonNullable<typeof hadronIpcMain>;
export type { IpcMainEvent as HadronIpcMainEvent } from 'electron';
export default hadronIpc;
export { ipcRenderer, ipcMain };
