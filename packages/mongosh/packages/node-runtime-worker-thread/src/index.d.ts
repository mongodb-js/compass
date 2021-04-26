declare module 'postmsg-rpc' {
  export type ClientMessageData = {
    sender: 'postmsg-rpc/client';
    id: string;
    func: string;
    args?: unknown[] | string;
  };

  export type ServerMessageData = {
    sender: 'postmsg-rpc/server';
    id: string;
    res: unknown | string;
  };

  export type MessageData = ClientMessageData | ServerMessageData;

  export type PostmsgRpcOptions = {
    addListener(name: 'message', fn: Function): void;
    removeListener(name: 'message', fn: Function): void;
    postMessage(data: MessageData): void;
    getMessageData(message: unknown): unknown;
  };

  export function expose(
    funcName: string,
    func: Function,
    opts: PostmsgRpcOptions
  ): { close: () => void };

  type AsyncFn = (...args: unknown[]) => Promise<unknown>;

  export function caller<T extends AsyncFn = AsyncFn>(
    funcName: string,
    opts: PostmsgRpcOptions
  ): T extends (...args: infer Args) => Promise<infer Ret>
    ? (...args: Args) => CancelablePromise<Ret>
    : never;
}

declare module 'inline-entry-loader!*' {
  const entry: string;
  export default entry;
}

declare type Params<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

declare type CancelablePromise<T> = Promise<T> & { cancel(): void };

declare type CancelableMethods<T> = {
  [k in keyof T]: T[k] extends (...args: infer Args) => infer ReturnVal
    ? (
        ...args: Args
      ) => ReturnVal extends Promise<infer PromiseValue>
        ? CancelablePromise<PromiseValue>
        : CancelablePromise<ReturnVal>
    : T[k];
};
