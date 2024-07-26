/* istanbul ignore file */
/* ^^^ we test the dist directly, so istanbul can't calculate the coverage correctly */

import type {
  Runtime,
  RuntimeEvaluationListener,
  RuntimeEvaluationResult,
} from '@mongosh/browser-runtime-core';
import type { MongoshBus } from '@mongosh/types';
import path from 'path';
import { EventEmitter, once } from 'events';
import type { Caller } from './rpc';
import { createCaller, cancel, exposeAll } from './rpc';
import type { WorkerRuntime as WorkerThreadWorkerRuntime } from './worker-runtime';
import {
  deserializeEvaluationResult,
  serializeConnectOptions,
} from './serializer';
import type { CompassServiceProvider } from '@mongosh/service-provider-server';
import { SHARE_ENV, Worker } from 'worker_threads';
import type { WorkerOptions } from 'worker_threads';
import type { InterruptHandle } from 'interruptor';
import { interrupt as nativeInterrupt } from 'interruptor';
import { WorkerThreadEvaluationListener } from './worker-thread-evaluation-listener';
import { WorkerProcessMongoshBus } from './worker-process-mongosh-bus';

type DevtoolsConnectOptions = Parameters<
  typeof CompassServiceProvider['connect']
>[1];
type WorkerThreadRuntime = Caller<WorkerThreadWorkerRuntime>;

const workerRuntimeSrcPath = path.resolve(__dirname, 'worker-runtime.js');

const workerReadyPromise = async (workerProcess: Worker): Promise<void> => {
  const waitForReadyMessage = async () => {
    let msg: string;
    while (([msg] = await once(workerProcess, 'message'))) {
      if (msg === 'ready') return;
    }
  };

  const waitForError = async () => {
    const [err] = await once(workerProcess, 'error');
    if (err) {
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
    const workerProcess = new Worker(
      process.env.WORKER_RUNTIME_SRC_PATH_DO_NOT_USE_THIS_EXCEPT_FOR_TESTING ||
        workerRuntimeSrcPath,
      { env: SHARE_ENV }
    );
    this.workerProcess = workerProcess;

    await workerReadyPromise(this.workerProcess);

    workerProcess.setMaxListeners(25);

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
      this.workerProcess
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
      this.workerProcess
    );

    await this.workerProcessRuntime.init(
      this.initOptions.uri,
      serializeConnectOptions(this.initOptions.driverOptions),
      this.initOptions.cliOptions
    );
  }

  async evaluate(code: string): Promise<RuntimeEvaluationResult> {
    await this.initWorkerPromise;
    return deserializeEvaluationResult(
      await this.workerProcessRuntime.evaluate(code)
    );
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
      await this.workerProcess.terminate();
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
