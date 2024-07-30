import type { Exposed } from './rpc';
import { exposeAll, close } from './rpc';
import type { WorkerRuntime } from './index';
import type { RuntimeEvaluationListener } from '@mongosh/browser-runtime-core';

export class WorkerThreadEvaluationListener {
  exposedListener: Exposed<
    Required<
      Omit<RuntimeEvaluationListener, 'onLoad' | 'getCryptLibraryOptions'>
    >
  >;

  constructor(workerRuntime: WorkerRuntime, worker: Worker) {
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
          return (
            workerRuntime.evaluationListener?.setConfig?.(key, value) ??
            Promise.resolve('ignored')
          );
        },
        resetConfig(key) {
          return (
            workerRuntime.evaluationListener?.resetConfig?.(key) ??
            Promise.resolve('ignored')
          );
        },
        validateConfig(key, value) {
          return (
            workerRuntime.evaluationListener?.validateConfig?.(key, value) ??
            Promise.resolve(null)
          );
        },
        getConfig(key) {
          return workerRuntime.evaluationListener?.getConfig?.(key);
        },
        listConfigOptions() {
          return workerRuntime.evaluationListener?.listConfigOptions?.();
        },
        onClearCommand() {
          return workerRuntime.evaluationListener?.onClearCommand?.();
        },
        onExit(exitCode) {
          return (
            workerRuntime.evaluationListener?.onExit?.(exitCode) ??
            (Promise.resolve() as Promise<never>)
          );
        },
      },
      worker
    );
  }

  terminate() {
    this.exposedListener[close]();
  }
}
