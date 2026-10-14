import { EventEmitter } from 'events';
import { listen, waitUntil } from '@mongodb-js/compass-utils';
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
  private initPromise: Promise<void>;
  /**
   * Aborted, with the reason, once the session can no longer work: the
   * utility reported an error or the port closed (utility process gone).
   */
  private failure = new AbortController();
  /** Everything the session owns, released in reverse by `terminate` */
  private disposables = new DisposableStack();

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
    this.disposables.adopt(port, (port) => {
      port.postMessage({ meta: 'terminate' } satisfies ShellMetaRequest);
      port.close();
    });
    this.disposables.use(
      listen(port, 'message', ({ data }: MessageEvent) => {
        if (isShellMeta(data) && data.meta === 'error') this.fail(data.error);
      })
    );
    this.disposables.use(
      listen(port, 'close', () =>
        this.fail(new Error('The embedded shell utility process went away'))
      )
    );
    this.initPromise = this.init(uri, driverOptions, cliOptions, workerOptions);
  }

  private send(request: ShellMetaRequest) {
    this.port.postMessage(request);
  }

  /** Rejects whatever is waiting on the session, now and from here on. */
  private fail(error: Error) {
    if (this.failure.signal.aborted) return;
    this.failure.abort(error);
    // Calls already sent will never get a reply
    this.rpc?.[cancel]();
  }

  private async init(
    uri: string,
    driverOptions: DriverOptions,
    cliOptions: { nodb?: boolean },
    workerOptions: { name?: string }
  ) {
    const ready = waitUntil(
      this.port,
      'message',
      ({ data }: MessageEvent) => data === 'ready',
      { signal: this.failure.signal }
    );
    this.port.start();
    this.send({ meta: 'spawn', workerOptions });
    await ready;

    // The port stands in for the Worker these were written against
    const bus = this.port as unknown as Worker;
    const rpc = (this.rpc = createCaller([...rpcMethods], bus));
    this.disposables.defer(() => rpc[cancel]());
    this.disposables.adopt(
      new WorkerThreadEvaluationListener(this as unknown as WorkerRuntime, bus),
      (bridge) => bridge.terminate()
    );
    this.disposables.adopt(
      new WorkerProcessMongoshBus(this.eventEmitter, bus),
      (bridge) => bridge.terminate()
    );

    await this.rpc.init(
      uri,
      serializeConnectOptions(driverOptions),
      cliOptions
    );
  }

  private async ready() {
    await this.initPromise;
    this.failure.signal.throwIfAborted();
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
    const reply = waitUntil(
      this.port,
      'message',
      ({ data }: MessageEvent) =>
        isShellMeta(data) && data.meta === 'interrupted',
      { signal: this.failure.signal }
    );
    this.send({ meta: 'interrupt' });
    // Nothing interruptible was running natively; ask the worker itself, as
    // WorkerRuntime does
    const [{ data }] = await reply;
    return (
      (data as { interrupted: boolean }).interrupted || (await rpc.interrupt())
    );
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
    this.disposables.dispose();
  }
}
