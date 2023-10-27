import { getResponseChannel } from './common';
import electron from 'electron';
import createDebug from 'debug';

const debug = createDebug('hadron-ipc:renderer');

function call(
  debug: (...args: unknown[]) => void,
  methodName: string,
  ...args: any[]
): Promise<any> {
  debug(`calling ${methodName} with args`, args);

  const ipcRenderer = electron.ipcRenderer as electron.IpcRenderer | undefined;
  const responseChannel = getResponseChannel(methodName);
  const errorResponseChannel = `${responseChannel}-error`;

  return new Promise(function (resolve, reject) {
    ipcRenderer?.on(responseChannel, function (_event, result) {
      debug(`got response for ${methodName} from main`, result);
      ipcRenderer?.removeAllListeners(responseChannel);
      ipcRenderer?.removeAllListeners(errorResponseChannel);
      resolve(result);
    });

    ipcRenderer?.on(errorResponseChannel, function (_event, err) {
      debug(`error for ${methodName} from main`, err);
      ipcRenderer?.removeAllListeners(responseChannel);
      ipcRenderer?.removeAllListeners(errorResponseChannel);
      reject(err);
    });

    ipcRenderer?.send(methodName, ...args);
  });
}

export default Object.assign(electron.ipcRenderer ?? {}, {
  call: call.bind(null, debug),
  callQuiet: call.bind(null, () => {
    // noop for a quiet call
  }),
});
