import v8 from 'v8';
import { expose, caller } from 'postmsg-rpc';
import { deserializeError, serializeError } from './serializer';
import type {
  MessageData,
  PostmsgRpcOptions,
  ServerMessageData,
  ClientMessageData
} from 'postmsg-rpc';

export function serialize(data: unknown): string {
  return `data:;base64,${v8.serialize(data).toString('base64')}`;
}

export function deserialize<T = unknown>(str: string): T | string {
  if (/^data:;base64,.+/.test(str)) {
    return v8.deserialize(
      Buffer.from(str.replace('data:;base64,', ''), 'base64')
    );
  }
  return str;
}

type RPCMessageBus = { on: Function; off: Function } & (
  | { postMessage: Function; send?: never }
  | { postMessage?: never; send?: Function }
);

enum RPCMessageTypes {
  Message,
  Error
}

type RPCMessage = {
  type: RPCMessageTypes.Message;
  payload: string;
};

type RPCError = {
  type: RPCMessageTypes.Error;
  payload: Error;
};

function isRPCError(data: any): data is RPCError {
  return (
    data && typeof data === 'object' && data.type === RPCMessageTypes.Error
  );
}

function isMessageData(data: any): data is MessageData {
  return data && typeof data === 'object' && 'id' in data && 'sender' in data;
}

function isServerMessageData(data: any): data is ServerMessageData {
  return isMessageData(data) && data.sender === 'postmsg-rpc/server';
}

function isClientMessageData(data: any): data is ClientMessageData {
  return isMessageData(data) && data.sender === 'postmsg-rpc/client';
}

export function removeTrailingUndefined(arr: unknown[]): unknown[] {
  if (Array.isArray(arr)) {
    arr = [...arr];
    while (arr.length > 0 && arr[arr.length - 1] === undefined) {
      arr.pop();
    }
  }
  return arr;
}

function send(messageBus: RPCMessageBus, data: any): void {
  if (
    'postMessage' in messageBus &&
    typeof messageBus.postMessage === 'function'
  ) {
    messageBus.postMessage(data);
  }

  if ('send' in messageBus && typeof messageBus.send === 'function') {
    messageBus.send(data);
  }
}

function getRPCOptions(messageBus: RPCMessageBus): PostmsgRpcOptions {
  return {
    addListener: messageBus.on.bind(messageBus),
    removeListener: messageBus.off.bind(messageBus),
    postMessage(data) {
      if (isClientMessageData(data) && Array.isArray(data.args)) {
        data.args = serialize(removeTrailingUndefined(data.args));
      }

      if (isServerMessageData(data)) {
        // If serialization of the response failed for some reason (e.g., the
        // value is not serializable) we want to propagate the error back to the
        // client that issued the remote call instead of throwing on the server
        // that was executing the method.
        try {
          data.res = serialize(data.res);
        } catch (e) {
          data.res = serialize({
            type: RPCMessageTypes.Error,
            payload: serializeError(e)
          });
        }
      }

      return send(messageBus, data);
    },
    getMessageData(data) {
      if (
        isClientMessageData(data) &&
        data.args &&
        typeof data.args === 'string'
      ) {
        data.args = deserialize(data.args);
      }

      if (isServerMessageData(data) && typeof data.res === 'string') {
        data.res = deserialize(data.res);
      }

      return data;
    }
  };
}

export const close = Symbol('@@rpc.close');

export const cancel = Symbol('@@rpc.cancel');

export type Exposed<T> = { [k in keyof T]: T[k] & { close(): void } } & {
  [close]: () => void;
};

export function exposeAll<O>(obj: O, messageBus: RPCMessageBus): Exposed<O> {
  Object.entries(obj).forEach(([key, val]) => {
    const { close } = expose(
      key,
      async(...args: unknown[]) => {
        try {
          return { type: RPCMessageTypes.Message, payload: await val(...args) };
        } catch (e) {
          // If server (whatever is executing the exposed method) throws during
          // the execution, we want to propagate error to the client (whatever
          // issued the call) and re-throw there. We will do this with a special
          // return type.
          return { type: RPCMessageTypes.Error, payload: serializeError(e) };
        }
      },
      getRPCOptions(messageBus)
    );
    (val as any).close = close;
  });
  Object.defineProperty(obj, close, {
    enumerable: false,
    value() {
      Object.values(obj).forEach((fn) => {
        fn.close();
      });
    }
  });
  return obj as Exposed<O>;
}

export type Caller<
  Impl,
  Keys extends keyof Impl = keyof Impl
> = CancelableMethods<Pick<Impl, Keys>> & { [cancel]: () => void };

export function createCaller<Impl extends {}>(
  methodNames: Extract<keyof Impl, string>[],
  messageBus: RPCMessageBus
): Caller<Impl, typeof methodNames[number]> {
  const obj = {};
  const inflight = new Set<CancelablePromise<unknown>>();
  methodNames.forEach((name) => {
    const c = caller(name as string, getRPCOptions(messageBus));
    (obj as any)[name] = async(...args: unknown[]) => {
      const promise = c(...args);
      inflight.add(promise);
      const result = (await promise) as RPCError | RPCMessage;
      inflight.delete(promise);
      if (isRPCError(result)) throw deserializeError(result.payload);
      return result.payload;
    };
  });
  Object.defineProperty(obj, cancel, {
    enumerable: false,
    value() {
      for (const cancelable of inflight) {
        cancelable.cancel();
        inflight.delete(cancelable);
      }
    }
  });
  return obj as Caller<Impl, typeof methodNames[number]>;
}

