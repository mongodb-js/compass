import { getResponseChannel } from './common';
import electron from 'electron';
import type { IpcRenderer } from 'electron';
import createDebug from 'debug';
import { deserializeErrorFromIpc, isSerializedError } from './serialized-error';

const debug = createDebug('hadron-ipc:renderer');

export function call(
  ipcRenderer:
    | Pick<IpcRenderer, 'on' | 'removeAllListeners' | 'send'>
    | undefined,
  debug: (...args: unknown[]) => void,
  methodName: string,
  ...args: any[]
): Promise<any> {
  debug(`calling ${methodName} with args`, args);

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
      /**
       * Call a method in the main process set up with `ipcMain.respondTo`
       * helper
       */
      call: call.bind(null, electron.ipcRenderer, debug),

      /**
       * Same as `ipcRenderer.call`, but doesn't print any debug information
       * when called (`debug` is no-op)
       */
      callQuiet: call.bind(null, electron.ipcRenderer, () => {
        // noop for a quiet call
      }),

      /**
       * Helper method to create a caller for the method in the main process set
       * up with `ipcMain.createHandler` method
       *
       * @param serviceName Identifier used to locate the service methods in the
       *                    main process
       * @param methodNames List of the method names that will get exposed
       */
      createInvoke: <
        T,
        K extends Extract<
          keyof PickByValue<T, (options: any) => Promise<any>>,
          string
        >
      >(
        serviceName: string,
        methodNames: K[]
      ) => {
        return ipcInvoke<T, K>(ipcRenderer, serviceName, methodNames);
      },
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
  ipcRenderer: Pick<IpcRenderer, 'invoke'> | undefined,
  serviceName: string,
  methodNames: K[]
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
          await ipcRenderer?.invoke('ipcHandlerInvoke', signalId);
          const onAbort = () => {
            return ipcRenderer?.invoke('ipcHandlerAborted', signalId);
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
          const res = await ipcRenderer?.invoke(`${serviceName}.${name}`, {
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
