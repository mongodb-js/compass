/* istanbul ignore file */
/* ^^^ we test the dist directly, so isntanbul can't calculate the coverage correctly */

import { ChildProcess, spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { MongoClientOptions } from '@mongosh/service-provider-core';
import {
  Runtime,
  RuntimeEvaluationListener,
  RuntimeEvaluationResult
} from '@mongosh/browser-runtime-core';
import { MongoshBus } from '@mongosh/types';
import path from 'path';
import { EventEmitter, once } from 'events';
import { kill } from './spawn-child-from-source';
import { Caller, createCaller, cancel } from './rpc';
import { ChildProcessEvaluationListener } from './child-process-evaluation-listener';
import type { WorkerRuntime as WorkerThreadWorkerRuntime } from './worker-runtime';
import { deserializeEvaluationResult } from './serializer';
import { ChildProcessMongoshBus } from './child-process-mongosh-bus';

type ChildProcessRuntime = Caller<WorkerThreadWorkerRuntime>;

function parseStderrToError(str: string): Error | null {
  const [, errorMessageWithStack] = str
    .split(/^\s*\^\s*$/m)
    .map((part) => part.trim());

  if (errorMessageWithStack) {
    const e = new Error();
    const errorHeader =
      errorMessageWithStack.substring(
        0,
        errorMessageWithStack.search(/^\s*at/m)
      ) || errorMessageWithStack;

    const [name, ...message] = errorHeader.split(': ');

    e.name = name;
    e.message = message.join(': ').trim();
    e.stack = errorMessageWithStack;

    return e;
  }

  return null;
}

class WorkerRuntime implements Runtime {
  private initOptions: {
    uri: string;
    driverOptions: MongoClientOptions;
    cliOptions: { nodb?: boolean };
    spawnOptions: SpawnOptionsWithoutStdio;
  };

  evaluationListener: RuntimeEvaluationListener | null = null;

  private eventEmitter: MongoshBus;

  private childProcessMongoshBus!: ChildProcessMongoshBus;

  private childProcessEvaluationListener!: ChildProcessEvaluationListener;

  private childProcess!: ChildProcess;

  private childProcessRuntime!: ChildProcessRuntime;

  private initWorkerPromise: Promise<void>;

  private childProcessProxySrcPath: string =
    process.env
      .CHILD_PROCESS_PROXY_SRC_PATH_DO_NOT_USE_THIS_EXCEPT_FOR_TESTING ||
    path.resolve(__dirname, 'child-process-proxy.js');

  constructor(
    uri: string,
    driverOptions: MongoClientOptions = {},
    cliOptions: { nodb?: boolean } = {},
    spawnOptions: SpawnOptionsWithoutStdio = {},
    eventEmitter: MongoshBus = new EventEmitter()
  ) {
    this.initOptions = { uri, driverOptions, cliOptions, spawnOptions };
    this.eventEmitter = eventEmitter;
    this.initWorkerPromise = this.initWorker();
  }

  private async initWorker() {
    const { uri, driverOptions, cliOptions, spawnOptions } = this.initOptions;

    this.childProcess = spawn(
      process.execPath,
      [this.childProcessProxySrcPath],
      {
        stdio: ['inherit', 'inherit', 'pipe', 'ipc'],
        ...spawnOptions
      }
    );

    const waitForReadyMessage = async() => {
      let msg: string;
      while (([msg] = await once(this.childProcess, 'message'))) {
        if (msg === 'ready') return;
      }
    };

    let spawnError = '';

    // eslint-disable-next-line chai-friendly/no-unused-expressions
    this.childProcess?.stderr?.setEncoding('utf8')?.on('data', (chunk) => {
      spawnError += chunk;
    });

    const waitForError = async() => {
      const [exitCode] = await once(this.childProcess, 'exit');

      if (exitCode) {
        let error = parseStderrToError(spawnError);

        if (error) {
          error.message = `Child process failed to start with the following error: ${error.message}`;
        } else {
          error = new Error(
            `Worker runtime failed to start: child process exited with code ${exitCode}`
          );
        }

        throw error;
      }
    };

    await Promise.race([waitForReadyMessage(), waitForError()]);

    // We expect the amount of listeners to be more than the default value of 10
    // but probably not more than ~25 (all exposed methods on
    // ChildProcessEvaluationListener and ChildProcessMongoshBus + any
    // concurrent in-flight calls on ChildProcessRuntime) at once
    this.childProcess.setMaxListeners(25);

    this.childProcessRuntime = createCaller(
      [
        'init',
        'evaluate',
        'getCompletions',
        'setEvaluationListener',
        'getShellPrompt',
        'interrupt'
      ],
      this.childProcess
    );

    this.childProcessEvaluationListener = new ChildProcessEvaluationListener(
      this,
      this.childProcess
    );

    this.childProcessMongoshBus = new ChildProcessMongoshBus(
      this.eventEmitter,
      this.childProcess
    );

    await this.childProcessRuntime.init(uri, driverOptions, cliOptions);
  }

  async evaluate(code: string): Promise<RuntimeEvaluationResult> {
    await this.initWorkerPromise;
    return deserializeEvaluationResult(
      await this.childProcessRuntime.evaluate(code)
    );
  }

  async getCompletions(code: string) {
    await this.initWorkerPromise;
    return await this.childProcessRuntime.getCompletions(code);
  }

  async getShellPrompt() {
    await this.initWorkerPromise;
    return await this.childProcessRuntime.getShellPrompt();
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
      // In case child process encountered an error during init we still want
      // to clean up whatever possible
    }

    await kill(this.childProcess);

    if (this.childProcessRuntime) {
      this.childProcessRuntime[cancel]();
    }

    if (this.childProcessEvaluationListener) {
      this.childProcessEvaluationListener.terminate();
    }

    if (this.childProcessMongoshBus) {
      this.childProcessMongoshBus.terminate();
    }
  }

  async interrupt() {
    await this.initWorkerPromise;
    return this.childProcessRuntime.interrupt();
  }

  async waitForRuntimeToBeReady() {
    await this.initWorkerPromise;
  }
}

export { WorkerRuntime };
