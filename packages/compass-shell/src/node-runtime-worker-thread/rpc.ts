import { expose, caller } from 'postmsg-rpc';
import type { PostmsgRpcOptions } from 'postmsg-rpc';

type RPCMessageBus = {
  postMessage: typeof Worker.prototype['postMessage'];
  addEventListener: typeof Worker.prototype['addEventListener'];
  removeEventListener: typeof Worker.prototype['addEventListener'];
};

enum RPCMessageTypes {
  Message,
  Error,
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

function getRPCOptions(messageBus: RPCMessageBus): PostmsgRpcOptions {
  return {
    addListener: messageBus.addEventListener.bind(messageBus),
    removeListener: messageBus.removeEventListener.bind(messageBus),
    postMessage(data) {
      return messageBus.postMessage(data);
    },
    getMessageData(data) {
      return (data as { data?: unknown })?.data ?? data;
    },
  };
}

export const close = Symbol('@@rpc.close');

export const cancel = Symbol('@@rpc.cancel');

export type Exposed<T> = { [k in keyof T]: T[k] & { close(): void } } & {
  [close]: () => void;
};

export function exposeAll<O>(obj: O, messageBus: RPCMessageBus): Exposed<O> {
  Object.entries(obj as Record<string, any>).forEach(([key, val]) => {
    const { close } = expose(
      key,
      async (...args: unknown[]) => {
        try {
          return { type: RPCMessageTypes.Message, payload: await val(...args) };
        } catch (e: any) {
          // If server (whatever is executing the exposed method) throws during
          // the execution, we want to propagate error to the client (whatever
          // issued the call) and re-throw there. We will do this with a special
          // return type.
          // TODO: Error msg
          return { type: RPCMessageTypes.Error, payload: e };
        }
      },
      getRPCOptions(messageBus)
    );
    val.close = close;
  });
  Object.defineProperty(obj, close, {
    enumerable: false,
    value() {
      Object.values(obj as Record<string, { close: () => void }>).forEach(
        (fn) => {
          fn.close();
        }
      );
    },
  });
  return obj as Exposed<O>;
}

export type Caller<
  Impl,
  Keys extends keyof Impl = keyof Impl
> = CancelableMethods<Pick<Impl, Keys>> & { [cancel]: () => void };

export function createCaller<Impl extends object>(
  methodNames: Extract<keyof Impl, string>[],
  messageBus: RPCMessageBus,
  processors: Partial<
    Record<typeof methodNames[number], (...input: any[]) => any[]>
  > = {}
): Caller<Impl, typeof methodNames[number]> {
  const obj = {};
  const inflight = new Set<CancelablePromise<unknown>>();
  methodNames.forEach((name) => {
    const c = caller(name as string, getRPCOptions(messageBus));
    (obj as any)[name] = async (...args: unknown[]) => {
      const processed =
        typeof processors[name] === 'function'
          ? processors[name]?.(...args)
          : args;
      const promise = c(...(processed as any[]));
      inflight.add(promise);
      const result = (await promise) as RPCError | RPCMessage;
      inflight.delete(promise);
      if (isRPCError(result)) throw result.payload;
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
    },
  });
  return obj as Caller<Impl, typeof methodNames[number]>;
}
