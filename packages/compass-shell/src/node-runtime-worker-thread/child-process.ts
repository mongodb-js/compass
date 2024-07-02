/* istanbul ignore file */
/* ^^^ we test the dist directly, so isntanbul can't calculate the coverage correctly */

import type {
  Completion,
  Runtime,
  RuntimeEvaluationListener,
  RuntimeEvaluationResult,
} from '@mongosh/browser-runtime-core';
import { ElectronRuntime } from '@mongosh/browser-runtime-electron';
import type { ServiceProvider } from '@mongosh/service-provider-core';
import { CompassServiceProvider } from '@mongosh/service-provider-server';
import { exposeAll, createCaller } from './rpc';
import {
  serializeEvaluationResult,
  deserializeConnectOptions,
} from './serializer';
import type { MongoshBus } from '@mongosh/types';
import type { UNLOCKED } from './lock';
import { Lock } from './lock';

type DevtoolsConnectOptions = Parameters<
  typeof CompassServiceProvider['connect']
>[1];
type EvaluationResult = void | RuntimeEvaluationResult | UNLOCKED;

let runtime: Runtime | null = null;
let provider: ServiceProvider | null = null;

const evaluationLock = new Lock();

function ensureRuntime(methodName: string): Runtime {
  if (!runtime) {
    throw new Error(
      `Can't call ${methodName} before shell runtime is initiated`
    );
  }

  return runtime;
}

const evaluationListener = createCaller<RuntimeEvaluationListener>(
  [
    'onPrint',
    'onPrompt',
    'getConfig',
    'setConfig',
    'resetConfig',
    'validateConfig',
    'listConfigOptions',
    'onClearCommand',
    'onExit',
  ],
  process,
  {
    onPrint: function (
      results: RuntimeEvaluationResult[]
    ): RuntimeEvaluationResult[][] {
      // We're transforming an args array, so we have to return an array of
      // args. onPrint only takes one arg which is an array of
      // RuntimeEvaluationResult so in this case it will just return a
      // single-element array that itself is an array.
      return [results.map(serializeEvaluationResult)];
    },
  }
);

const messageBus: MongoshBus = Object.assign(createCaller(['emit'], process), {
  on() {
    throw new Error("Can't call `on` method on worker runtime MongoshBus");
  },
  once() {
    throw new Error("Can't call `once` method on worker runtime MongoshBus");
  },
});

export type WorkerRuntime = Runtime & {
  init(
    uri: string,
    driverOptions?: DevtoolsConnectOptions,
    cliOptions?: { nodb?: boolean }
  ): Promise<void>;
};

// If we were interrupted, we can't know which newly require()ed modules
// have successfully been loaded, so we restore everything to its
// previous state.
function clearRequireCache(previousRequireCache: string[]) {
  for (const key of Object.keys(require.cache)) {
    if (!previousRequireCache.includes(key)) {
      delete require.cache[key];
    }
  }
}

function throwIfInterrupted(
  result: EvaluationResult,
  previousRequireCache: string[]
): asserts result is RuntimeEvaluationResult {
  if (evaluationLock.isUnlockToken(result)) {
    clearRequireCache(previousRequireCache);
    throw new Error('Async script execution was interrupted');
  }

  if (typeof result === 'undefined') {
    clearRequireCache(previousRequireCache);
    throw new Error('Script execution was interrupted');
  }
}

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
      messageBus
    );
    runtime = new ElectronRuntime(provider as ServiceProvider, messageBus);
    runtime.setEvaluationListener(evaluationListener);
  },

  async evaluate(code: string) {
    if (evaluationLock.isLocked()) {
      throw new Error(
        "Can't run another evaluation while the previous is not finished"
      );
    }

    const previousRequireCache = Object.keys(require.cache);
    let result: EvaluationResult;

    try {
      result = await Promise.race([
        ensureRuntime('evaluate').evaluate(code),
        evaluationLock.lock(),
      ]);
    } finally {
      evaluationLock.unlock();
    }
    throwIfInterrupted(result, previousRequireCache);
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
};

exposeAll(workerRuntime, process);

// For async tasks, then an interrupt is received, we need to unlock the
// evaluation lock so that it resolves and workerRuntime.evaluate throws.
process.on('SIGINT', () => {
  evaluationLock.unlock();
});

process.nextTick(() => {
  process.send?.('ready');
});
