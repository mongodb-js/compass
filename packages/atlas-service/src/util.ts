import { ipcMain, ipcRenderer } from 'electron';
import type * as plugin from '@mongodb-js/oidc-plugin';

export type UserInfo = unknown;

export type IntrospectInfo = { active: boolean };

export type Token = plugin.IdPServerResponse;

export type AIQuery = {
  content?: {
    query?: unknown;
  };
};

type SerializedError = { $$error: Error & { statusCode?: number } };

function serializeErrorForIpc(err: any): SerializedError {
  return {
    $$error: { name: err.name, message: err.message, statusCode: err.status },
  };
}

function deserializeErrorFromIpc({ $$error: err }: SerializedError) {
  const e = new Error(err.message);
  e.name = err.name;
  (e as any).stausCode = err.statusCode;
  return e;
}

function isSerializedError(err: any): err is { $$error: Error } {
  return err !== null && typeof err === 'object' && !!err.$$error;
}

type PickByValue<T, K> = Pick<
  T,
  { [k in keyof T]: T[k] extends K ? k : never }[keyof T]
>;

export function ipcExpose<T>(
  serviceName: string,
  obj: T,
  methodNames: Extract<
    keyof PickByValue<T, (...args: any) => Promise<any>>,
    string
  >[]
) {
  for (const name of methodNames) {
    ipcMain.handle(`${serviceName}.${name}`, async (_evt, ...args) => {
      try {
        return await (obj[name] as (...args: any[]) => any).call(obj, ...args);
      } catch (err) {
        return serializeErrorForIpc(err);
      }
    });
  }
}

export function ipcInvoke<
  T,
  K extends Extract<
    keyof PickByValue<T, (...args: any) => Promise<any>>,
    string
  >
>(serviceName: string, methodNames: K[]) {
  return Object.fromEntries(
    methodNames.map((name) => {
      return [
        name,
        async (...args: any[]) => {
          const res = await ipcRenderer.invoke(
            `${serviceName}.${name}`,
            ...args
          );
          if (isSerializedError(res)) {
            throw deserializeErrorFromIpc(res);
          }
          return res;
        },
      ];
    })
  ) as Pick<T, K>;
}
