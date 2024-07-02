import type { ChildProcess } from 'child_process';
import type { Exposed } from './rpc';
import { exposeAll, close } from './rpc';
import type { WorkerRuntime } from './index';
import { deserializeEvaluationResult } from './serializer';
import type { RuntimeEvaluationListener } from '@mongosh/browser-runtime-core';

export class ChildProcessEvaluationListener {
  exposedListener: Exposed<
    Required<
      Omit<RuntimeEvaluationListener, 'onLoad' | 'getCryptLibraryOptions'>
    >
  >;

  constructor(workerRuntime: WorkerRuntime, childProcess: ChildProcess) {
    this.exposedListener = exposeAll(
      {
        onPrompt(question, type) {
          return (
            workerRuntime.evaluationListener?.onPrompt?.(question, type) ?? ''
          );
        },
        onPrint(values) {
          values = values.map(deserializeEvaluationResult);
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
      childProcess
    );
  }

  terminate() {
    this.exposedListener[close]();
  }
}
