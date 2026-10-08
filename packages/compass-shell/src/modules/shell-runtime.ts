import { EventEmitter } from 'events';
import type {
  Runtime,
  RuntimeEvaluationListener,
  RuntimeEvaluationResult,
} from '@mongosh/browser-runtime-core';
import type { WorkerRuntime } from '@mongosh/node-runtime-worker-thread';
import type { WorkerRuntime as WorkerThreadWorkerRuntime } from '@mongosh/node-runtime-worker-thread/dist/worker-runtime';
import type { Caller } from '@mongosh/node-runtime-worker-thread/dist/rpc';
import {
  cancel,
  createCaller,
} from '@mongosh/node-runtime-worker-thread/dist/rpc';
import {
  deserializeEvaluationResult,
  serializeConnectOptions,
} from '@mongosh/node-runtime-worker-thread/dist/serializer';
import { WorkerThreadEvaluationListener } from '@mongosh/node-runtime-worker-thread/dist/worker-thread-evaluation-listener';
import { WorkerProcessMongoshBus } from '@mongosh/node-runtime-worker-thread/dist/worker-process-mongosh-bus';
import type { ShellMetaRequest } from '../utility/protocol';
import { isShellMeta } from '../utility/protocol';

type DriverOptions = ConstructorParameters<typeof WorkerRuntime>[1];

const rpcMethods = [
  'init',
  'evaluate',
  'getCompletions',
  'getShellPrompt',
  'setEvaluationListener',
  'interrupt',
] as const;

/**
 * Renderer side of the embedded shell. Mirrors `WorkerRuntime` from
 * `@mongosh/node-runtime-worker-thread`, but the worker lives in the
 * embedded-shell utility process: `port` reaches it, the runtime's RPC goes
 * over the port as it would to a Worker, and the operations on the worker
 * itself (start, interrupt, terminate) are meta messages the utility handles.
 * This keeps `interruptor` and `worker_threads` out of the renderer.
 */
export class ShellRuntime implements Runtime {
  evaluationListener: RuntimeEvaluationListener | null = null;
  /** Read by the shell store (`runtime['eventEmitter']`), as with WorkerRuntime */
  private eventEmitter: EventEmitter;
  private port: MessagePort;
  private rpc?: Caller<WorkerThreadWorkerRuntime, (typeof rpcMethods)[number]>;
  private evaluationListenerBridge?: WorkerThreadEvaluationListener;
  private mongoshBusBridge?: WorkerProcessMongoshBus;
  private initPromise: Promise<void>;

  constructor(
    port: MessagePort,
    uri: string,
    driverOptions: DriverOptions,
    cliOptions: { nodb?: boolean } = {},
    workerOptions: { name?: string } = {},
    eventEmitter: EventEmitter = new EventEmitter()
  ) {
    this.port = port;
    this.eventEmitter = eventEmitter;
    this.initPromise = this.init(uri, driverOptions, cliOptions, workerOptions);
  }

  private send(request: ShellMetaRequest) {
    this.port.postMessage(request);
  }

  /** Resolves with the first message `pick` matches. */
  private async waitUntil<T>(
    pick: (data: unknown) => T | undefined
  ): Promise<T> {
    const { promise, resolve, reject } = Promise.withResolvers<T>();

    const removeListener = new AbortController();
    const { signal } = removeListener;

    const onMessage = ({ data }: MessageEvent) => {
      if (isShellMeta(data) && data.meta === 'error') {
        reject(data.error);
        return;
      }
      const picked = pick(data);
      if (picked !== undefined) {
        resolve(picked);
      }
    };

    this.port.addEventListener('message', onMessage, { signal });
    return await promise.finally(() => removeListener.abort());
  }

  private async init(
    uri: string,
    driverOptions: DriverOptions,
    cliOptions: { nodb?: boolean },
    workerOptions: { name?: string }
  ) {
    const ready = this.waitUntil((data) =>
      data === 'ready' ? true : undefined
    );
    this.port.start();
    this.send({ meta: 'spawn', workerOptions });
    await ready;

    // The port stands in for the Worker these were written against
    const bus = this.port as unknown as Worker;
    this.rpc = createCaller([...rpcMethods], bus);
    this.evaluationListenerBridge = new WorkerThreadEvaluationListener(
      this as unknown as WorkerRuntime,
      bus
    );
    this.mongoshBusBridge = new WorkerProcessMongoshBus(this.eventEmitter, bus);

    await this.rpc.init(
      uri,
      serializeConnectOptions(driverOptions),
      cliOptions
    );
  }

  private async ready() {
    await this.initPromise;
    if (!this.rpc) {
      throw new Error('Shell runtime is not initialized');
    }
    return this.rpc;
  }

  async evaluate(code: string): Promise<RuntimeEvaluationResult> {
    const rpc = await this.ready();
    return deserializeEvaluationResult(await rpc.evaluate(code));
  }

  async getCompletions(code: string) {
    const rpc = await this.ready();
    return await rpc.getCompletions(code);
  }

  async getShellPrompt() {
    const rpc = await this.ready();
    return await rpc.getShellPrompt();
  }

  setEvaluationListener(listener: RuntimeEvaluationListener | null) {
    const prev = this.evaluationListener;
    this.evaluationListener = listener;
    return prev;
  }

  async interrupt(): Promise<boolean> {
    const rpc = await this.ready();
    const reply = this.waitUntil((data) =>
      isShellMeta(data) && data.meta === 'interrupted'
        ? data.interrupted
        : undefined
    );
    this.send({ meta: 'interrupt' });
    // Nothing interruptible was running natively; ask the worker itself, as
    // WorkerRuntime does
    return (await reply) || (await rpc.interrupt());
  }

  async waitForRuntimeToBeReady() {
    await this.initPromise;
  }

  async terminate() {
    try {
      await this.initPromise;
    } catch {
      // Still clean up whatever got set up if the worker failed to start
    }
    this.rpc?.[cancel]();
    this.evaluationListenerBridge?.terminate();
    this.mongoshBusBridge?.terminate();
    this.send({ meta: 'terminate' });
    this.port.close();
  }
}
