/* istanbul ignore file */
/* ^^^ we test the dist directly, so isntanbul can't calculate the coverage correctly */

/**
 * This proxy is needed as a workaround for the old electron verison "bug" where
 * due to the electron runtime being a chromium, not just node (even with
 * `ELECTRON_RUN_AS_NODE` enabled), SIGINT doesn't break code execution. This is
 * fixed in the later versions of electron/node but we are still on the older
 * one, we have to have this proxy in place
 *
 * @todo as soon as we update electron version in compass, we can get rid of
 * this part of the worker runtime as it becomes redundant
 *
 * @see {@link https://github.com/nodejs/node/pull/36344}
 */
import { once } from 'events';
import { SHARE_ENV, Worker } from 'worker_threads';
import path from 'path';
import { exposeAll, createCaller } from './rpc';
import { InterruptHandle, interrupt as nativeInterrupt } from 'interruptor';

const workerRuntimeSrcPath =
  process.env.WORKER_RUNTIME_SRC_PATH_DO_NOT_USE_THIS_EXCEPT_FOR_TESTING ||
  path.resolve(__dirname, 'worker-runtime.js');

const workerProcess = new Worker(workerRuntimeSrcPath, { env: SHARE_ENV });

const workerReadyPromise: Promise<void> = (async() => {
  const waitForReadyMessage = async() => {
    let msg: string;
    while (([msg] = await once(workerProcess, 'message'))) {
      if (msg === 'ready') return;
    }
  };

  const waitForError = async() => {
    const [err] = await once(workerProcess, 'error');
    if (err) {
      err.message = `Worker thread failed to start with the following error: ${err.message}`;
      throw err;
    }
  };

  await Promise.race([
    waitForReadyMessage(),
    waitForError()
  ]);
})();

// We expect the amount of listeners to be more than the default value of 10 but
// probably not more than ~25 (all exposed methods on
// ChildProcessEvaluationListener and ChildProcessMongoshBus + any concurrent
// in-flight calls on ChildProcessRuntime) at once
process.setMaxListeners(25);
workerProcess.setMaxListeners(25);


let interruptHandle: InterruptHandle | null = null;

const { interrupt } = createCaller(['interrupt'], workerProcess);

const worker = Object.assign(
  createCaller(
    ['init', 'evaluate', 'getCompletions', 'getShellPrompt'],
    workerProcess
  ),
  {
    interrupt(): boolean {
      if (interruptHandle) {
        nativeInterrupt(interruptHandle);
        return true;
      }

      return interrupt();
    }
  }
);

function waitForWorkerReadyProxy<T extends Function>(fn: T): T {
  return new Proxy(fn, {
    async apply(target, thisArg, argumentsList) {
      await workerReadyPromise;
      return target.call(thisArg, ...Array.from(argumentsList));
    }
  });
}

// Every time parent process wants to request something from worker through
// proxy, we want to make sure worker process is ready
(Object.keys(worker) as (keyof typeof worker)[]).forEach((key) => {
  worker[key] = waitForWorkerReadyProxy(worker[key]);
});

exposeAll(worker, process);

const evaluationListener = Object.assign(
  createCaller(
    ['onPrint', 'onPrompt', 'getConfig', 'setConfig', 'listConfigOptions', 'onClearCommand', 'onExit'],
    process
  ),
  {
    onRunInterruptible(handle: InterruptHandle | null) {
      interruptHandle = handle;
    }
  }
);

exposeAll(evaluationListener, workerProcess);

const messageBus = createCaller(['emit', 'on'], process);

exposeAll(messageBus, workerProcess);

process.nextTick(() => {
  // eslint-disable-next-line chai-friendly/no-unused-expressions
  process.send?.('ready');
});
