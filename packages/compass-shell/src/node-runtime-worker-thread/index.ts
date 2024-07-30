/* istanbul ignore file */
/* ^^^ we test the dist directly, so istanbul can't calculate the coverage correctly */

import type {
  Runtime,
  RuntimeEvaluationListener,
  RuntimeEvaluationResult,
} from '@mongosh/browser-runtime-core';
import type { MongoshBus } from '@mongosh/types';
import { EventEmitter, once } from 'events';
import type { Caller } from './rpc';
import { createCaller, cancel, exposeAll } from './rpc';
import type { WorkerRuntime as WorkerThreadWorkerRuntime } from './worker-runtime';
import type { CompassServiceProvider } from '@mongosh/service-provider-server';
import type { InterruptHandle } from 'interruptor';
import { interrupt as nativeInterrupt } from 'interruptor';
import { WorkerThreadEvaluationListener } from './worker-thread-evaluation-listener';
import { WorkerProcessMongoshBus } from './worker-process-mongosh-bus';

type DevtoolsConnectOptions = Parameters<
  typeof CompassServiceProvider['connect']
>[1];
type WorkerThreadRuntime = Caller<WorkerThreadWorkerRuntime>;

function createWorker() {
  const workerProcess = new Worker(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TODO: this message handling
    new URL('./worker-runtime.ts', import.meta.url)
  );

  return workerProcess;
}

const workerReadyPromise = async (workerProcess: Worker): Promise<void> => {
  const waitForReadyMessage = async () => {
    let msg: {
      data: string;
    };
    while (([msg] = await once(workerProcess, 'message'))) {
      if (msg?.data === 'ready') return;
    }
  };

  const waitForError = async () => {
    const [err] = await once(workerProcess, 'error');
    if (err) {
      // TODO: These errors from a web worker might be immutable.
      err.message = `Worker thread failed to start with the following error: ${err.message}`;
      throw err;
    }
  };

  await Promise.race([waitForReadyMessage(), waitForError()]);
};

class WorkerRuntime implements Runtime {
  private initOptions: {
    uri: string;
    driverOptions: DevtoolsConnectOptions;
    cliOptions: { nodb?: boolean };
    workerOptions: WorkerOptions;
  };

  evaluationListener: RuntimeEvaluationListener | null = null;

  private eventEmitter: MongoshBus;

  private workerProcess!: Worker;

  private workerProcessRuntime!: WorkerThreadRuntime;

  private initWorkerPromise: Promise<void>;

  private workerThreadEvaluationListener!: WorkerThreadEvaluationListener;

  private workerProcessMongoshBus!: WorkerProcessMongoshBus;

  constructor(
    uri: string,
    driverOptions: DevtoolsConnectOptions,
    cliOptions: { nodb?: boolean } = {},
    workerOptions: WorkerOptions = {},
    eventEmitter: MongoshBus = new EventEmitter()
  ) {
    this.initOptions = { uri, driverOptions, cliOptions, workerOptions };
    this.eventEmitter = eventEmitter;
    this.initWorkerPromise = this.initWorker();
  }

  private async initWorker() {
    const workerProcess = createWorker();

    this.workerProcess = workerProcess;
    workerProcess.onerror = (/* event */) => {
      // TODO: Do we want some special error handling here? Maybe an on unexpected error catch in the web worker also?
    };

    await workerReadyPromise(this.workerProcess);

    const { interrupt } = createCaller(['interrupt'], workerProcess);

    let interruptHandle: InterruptHandle | null = null;

    this.workerProcessRuntime = Object.assign(
      createCaller(
        [
          'init',
          'evaluate',
          'getCompletions',
          'getShellPrompt',
          'setEvaluationListener',
          'interrupt',
        ],
        workerProcess
      ),
      {
        interrupt(): boolean {
          if (interruptHandle) {
            nativeInterrupt(interruptHandle);
            return true;
          }

          return interrupt();
        },
      }
    );

    this.workerThreadEvaluationListener = new WorkerThreadEvaluationListener(
      this,
      workerProcess
    );

    exposeAll(
      {
        onRunInterruptible(handle: InterruptHandle | null) {
          interruptHandle = handle;
        },
      },
      workerProcess
    );

    this.workerProcessMongoshBus = new WorkerProcessMongoshBus(
      this.eventEmitter,
      workerProcess
    );

    await this.workerProcessRuntime.init(
      this.initOptions.uri,
      this.initOptions.driverOptions,
      this.initOptions.cliOptions
    );
  }

  async evaluate(code: string): Promise<RuntimeEvaluationResult> {
    await this.initWorkerPromise;
    return await this.workerProcessRuntime.evaluate(code);
  }

  async getCompletions(code: string) {
    await this.initWorkerPromise;
    return await this.workerProcessRuntime.getCompletions(code);
  }

  async getShellPrompt() {
    await this.initWorkerPromise;
    return await this.workerProcessRuntime.getShellPrompt();
  }

  setEvaluationListener(listener: RuntimeEvaluationListener | null) {
    const prev = this.evaluationListener;
    this.evaluationListener = listener;
    return prev;
  }

  async terminate() {
    try {
      await this.initWorkerPromise;
    } catch {
      // In case the worker thread encountered an error during init
      // we still want to clean up whatever possible.
    }

    if (this.workerProcessRuntime) {
      this.workerProcessRuntime[cancel]();
    }

    if (this.workerProcess) {
      this.workerProcess.terminate();
    }

    if (this.workerThreadEvaluationListener) {
      this.workerThreadEvaluationListener.terminate();
    }

    if (this.workerProcessMongoshBus) {
      this.workerProcessMongoshBus.terminate();
    }
  }

  async interrupt() {
    await this.initWorkerPromise;
    return this.workerProcessRuntime.interrupt();
  }

  async waitForRuntimeToBeReady() {
    await this.initWorkerPromise;
  }
}

export { WorkerRuntime };
