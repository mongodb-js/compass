// setupIpc();
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (!require('hadron-ipc').on) {
  const callbacks = {};
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('hadron-ipc').ipcRenderer = {
    on: (name: string, callback: CallableFunction) => {
      if (!callbacks[name]) {
        callbacks[name] = [];
      }
      callbacks[name].push(callback);
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('hadron-ipc').ipcMain = {
    broadcast: (name: string, ...args: unknown[]) => {
      (callbacks[name] ?? []).forEach((callback: CallableFunction) =>
        callback({}, ...args)
      );
    },
  };
}
