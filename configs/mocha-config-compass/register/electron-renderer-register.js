const isElectronRenderer = require('is-electron-renderer');

// We are overriding default mocha-electron handling of console as it can throw
// trying to log non-seializable values which should not lead to test failure
if (isElectronRenderer) {
  const { ipcRenderer } = require('electron');
  const { inspect } = require('util');

  const console = globalThis.console;

  const ipcConsole = {
    assert(assertion, ...args) {
      if (!assertion) ipcConsole.log(...args);
    },
  };

  for (const k in console) {
    if (Object.prototype.hasOwnProperty.call(console, k) && k !== 'assert') {
      ipcConsole[k] = (...args) => {
        // This mirrorrs mocha-electron implementation with the only difference
        // being that we inspect values before sending them through ipc to avoid
        // "Object can't be cloned" errors
        //
        // @see {@link https://github.com/jprichardson/electron-mocha/blob/master/renderer/run.js}
        ipcRenderer.send(
          'console-call',
          k,
          args.map((arg) => {
            return inspect(arg);
          })
        );
      };
    }
  }

  Object.defineProperty(global, 'console', {
    get() {
      return ipcConsole;
    },
  });
}
