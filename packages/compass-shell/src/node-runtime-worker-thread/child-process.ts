import type {
  Completion,
  Runtime,
  RuntimeEvaluationResult,
} from '@mongosh/browser-runtime-core';
import { ElectronRuntime } from '@mongosh/browser-runtime-electron';
import type { ServiceProvider } from '@mongosh/service-provider-core';
import { CompassServiceProvider } from '@mongosh/service-provider-server';
import { exposeAll } from './rpc';
import {
  serializeEvaluationResult,
  deserializeConnectOptions,
} from './serializer';
import type { UNLOCKED } from './lock';
import { Lock } from './lock';
import type { InterruptHandle } from 'interruptor';
import { runInterruptible, interrupt as nativeInterrupt } from 'interruptor';

type DevtoolsConnectOptions = Parameters<
  typeof CompassServiceProvider['connect']
>[1];

let runtime: Runtime | null = null;
let provider: ServiceProvider | null = null;
let interruptHandle: InterruptHandle | null = null;

const evaluationLock = new Lock();

function ensureRuntime(methodName: string): Runtime {
  if (!runtime) {
    throw new Error(
      `Can't call ${methodName} before shell runtime is initiated`
    );
  }

  return runtime;
}

export type WorkerRuntime = Runtime & {
  init(
    uri: string,
    driverOptions?: DevtoolsConnectOptions,
    cliOptions?: { nodb?: boolean }
  ): Promise<void>;

  interrupt(): boolean;
};

const workerRuntime: WorkerRuntime = {
  async init(
    uri: string,
    driverOptions: DevtoolsConnectOptions,
    cliOptions: { nodb?: boolean } = {}
  ) {
    // XXX The types here work out fine, and tsc accepts this code
    // without 'as any'. However, since a change to the driver's
    // .find() method signature (https://github.com/mongodb/node-mongodb-native/commit/307d623ea597c5d89c548b6731bd692fec7a8047)
    // the webpack integration build fails with:
    // [tsl] ERROR in /home/addaleax/src/mongosh/packages/node-runtime-worker-thread/src/worker-runtime.ts(88,5)
    //       TS2589: Type instantiation is excessively deep and possibly infinite.
    // I could not figure out why exactly that was the case, so 'as any'
    // will have to do for now.
    provider = await (CompassServiceProvider as any).connect(
      uri,
      deserializeConnectOptions(driverOptions),
      cliOptions,
      process
    );
    runtime = new ElectronRuntime(provider as ServiceProvider, process);
  },

  async evaluate(code: string) {
    if (evaluationLock.isLocked()) {
      throw new Error(
        "Can't run another evaluation while the previous is not finished"
      );
    }

    let interrupted = true;
    let evaluationPromise: void | Promise<RuntimeEvaluationResult>;
    const previousRequireCache = Object.keys(require.cache);

    try {
      evaluationPromise = runInterruptible((handle) => {
        try {
          interruptHandle = handle;
          return ensureRuntime('evaluate').evaluate(code);
        } finally {
          interrupted = false;
        }
      });
    } finally {
      interruptHandle = null;

      if (interrupted) {
        // If we were interrupted, we can't know which newly require()ed modules
        // have successfully been loaded, so we restore everything to its
        // previous state.
        for (const key of Object.keys(require.cache)) {
          if (!previousRequireCache.includes(key)) {
            delete require.cache[key];
          }
        }
      }
    }

    let result: void | RuntimeEvaluationResult | UNLOCKED;

    try {
      result = await Promise.race([evaluationPromise, evaluationLock.lock()]);
    } finally {
      evaluationLock.unlock();
    }

    if (evaluationLock.isUnlockToken(result)) {
      throw new Error('Async script execution was interrupted');
    }

    if (typeof result === 'undefined' || interrupted === true) {
      throw new Error('Script execution was interrupted');
    }

    return serializeEvaluationResult(result);
  },

  getCompletions(code: string): Promise<Completion[]> {
    return ensureRuntime('getCompletions').getCompletions(code);
  },

  getShellPrompt(): Promise<string> {
    return ensureRuntime('getShellPrompt').getShellPrompt();
  },

  setEvaluationListener() {
    throw new Error(
      'Evaluation listener can not be directly set on the worker runtime'
    );
  },

  interrupt() {
    if (interruptHandle) {
      nativeInterrupt(interruptHandle);
    }
    return evaluationLock.unlock();
  },
};

exposeAll(workerRuntime, process);

// eslint-disable-next-line no-restricted-syntax
process.nextTick(() => {
  process.send?.('ready');
});
