import { getResponseChannel } from './common';
import electron from 'electron';
import type { IpcRenderer } from 'electron';
import createDebug from 'debug';
import { deserializeErrorFromIpc, isSerializedError } from './serialized-error';

const debug = createDebug('hadron-ipc:renderer');

function call(
  debug: (...args: unknown[]) => void,
  methodName: string,
  ...args: any[]
): Promise<any> {
  debug(`calling ${methodName} with args`, args);

  const ipcRenderer = electron.ipcRenderer as IpcRenderer | undefined;
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

const ipcRenderer = electron.ipcRenderer
  ? Object.assign(electron.ipcRenderer, {
      call: call.bind(null, debug),
      callQuiet: call.bind(null, () => {
        // noop for a quiet call
      }),
      createInvoke: ipcInvoke.bind(null),
    })
  : undefined;

let cId = 0;

type PickByValue<T, K> = Pick<
  T,
  { [k in keyof T]: T[k] extends K ? k : never }[keyof T]
>;

export function ipcInvoke<
  T,
  K extends Extract<
    keyof PickByValue<T, (options: any) => Promise<any>>,
    string
  >
>(
  serviceName: string,
  methodNames: K[],
  _ipcRenderer: Pick<IpcRenderer, 'invoke'> | undefined = ipcRenderer
) {
  return Object.fromEntries(
    methodNames.map((name) => {
      const channel = `${serviceName}.${name}`;
      const signalId = `${channel}:${++cId}`;
      return [
        name,
        async ({
          signal,
          ...rest
        }: { signal?: AbortSignal } & Record<string, unknown> = {}) => {
          await _ipcRenderer?.invoke('ipcHandlerInvoke', signalId);
          const onAbort = () => {
            return _ipcRenderer?.invoke('ipcHandlerAborted', signalId);
          };
          // If signal is already aborted, make sure that handler will see it
          // when it runs, otherwise just set up abort listener to communicate
          // this to main process
          if (signal?.aborted) {
            await onAbort();
          } else {
            signal?.addEventListener(
              'abort',
              () => {
                void onAbort();
              },
              { once: true }
            );
          }
          const res = await _ipcRenderer?.invoke(`${serviceName}.${name}`, {
            // We replace this with a matched signal on the other side, this
            // is mostly for testing / debugging purposes
            signal: signalId,
            ...rest,
          });
          if (isSerializedError(res)) {
            throw deserializeErrorFromIpc(res);
          }
          return res;
        },
      ];
    })
  ) as Pick<T, K>;
}

export default ipcRenderer;
