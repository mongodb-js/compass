import { ChildProcess } from 'child_process';
import { exposeAll, Exposed, close } from './rpc';
import type { WorkerRuntime } from './index';
import { RuntimeEvaluationListener } from '@mongosh/browser-runtime-core';

export class ChildProcessEvaluationListener {
  exposedListener: Exposed<Required<Omit<RuntimeEvaluationListener, 'onLoad' | 'startMongocryptd'>>>;

  constructor(workerRuntime: WorkerRuntime, childProcess: ChildProcess) {
    this.exposedListener = exposeAll(
      {
        onPrompt(question, type) {
          return (
            workerRuntime.evaluationListener?.onPrompt?.(question, type) ?? ''
          );
        },
        onPrint(values) {
          return workerRuntime.evaluationListener?.onPrint?.(values);
        },
        setConfig(key, value) {
          return workerRuntime.evaluationListener?.setConfig?.(key, value) ?? Promise.resolve('ignored');
        },
        getConfig(key) {
          return workerRuntime.evaluationListener?.getConfig?.(key) as any;
        },
        listConfigOptions() {
          return workerRuntime.evaluationListener?.listConfigOptions?.() as any;
        },
        onClearCommand() {
          return workerRuntime.evaluationListener?.onClearCommand?.();
        },
        onExit() {
          return (
            workerRuntime.evaluationListener?.onExit?.() ??
            (Promise.resolve() as Promise<never>)
          );
        }
      },
      childProcess
    );
  }

  terminate() {
    this.exposedListener[close]();
  }
}
