import {
  ChildProcess,
  Serializable,
  spawn,
  SpawnOptions,
  StdioNull,
  StdioPipe
} from 'child_process';
import { once } from 'events';

export async function kill(
  childProcess: ChildProcess,
  code: NodeJS.Signals | number = 'SIGTERM'
) {
  childProcess.kill(code);
  if (childProcess.exitCode === null && childProcess.signalCode === null) {
    await once(childProcess, 'exit');
  }
}

export default function spawnChildFromSource(
  src: string,
  spawnOptions: Omit<SpawnOptions, 'stdio'> = {},
  timeoutMs?: number,
  _stdout: StdioNull | StdioPipe = 'inherit',
  _stderr: StdioNull | StdioPipe = 'inherit'
): Promise<ChildProcess> {
  return new Promise(async(resolve, reject) => {
    const readyToken = Date.now().toString(32);

    const childProcess = spawn(process.execPath, {
      stdio: ['pipe', _stdout, _stderr, 'ipc'],
      ...spawnOptions
    });

    if (!childProcess.stdin) {
      await kill(childProcess);

      return reject(
        new Error("Can't write src to the spawned process, missing stdin")
      );
    }

    // eslint-disable-next-line prefer-const
    let timeoutId: NodeJS.Timeout | null;

    function cleanupListeners() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (childProcess.stdin) {
        childProcess.stdin.off('error', onWriteError);
      }
      childProcess.off('message', onMessage);
      childProcess.off('exit', onExit);
    }

    async function onExit(exitCode: number | null) {
      if (exitCode && exitCode > 0) {
        cleanupListeners();
        reject(new Error('Child process exited with error before starting'));
      }
    }

    /* really hard to reproduce in tests and coverage is not happy */
    /* istanbul ignore next */
    async function onWriteError(error: Error) {
      cleanupListeners();
      await kill(childProcess);
      reject(error);
    }

    async function onTimeout() {
      cleanupListeners();
      await kill(childProcess);
      reject(new Error('Timed out while waiting for child process to start'));
    }

    function onMessage(data: Serializable) {
      if (data === readyToken) {
        cleanupListeners();
        resolve(childProcess);
      }
    }

    childProcess.on('message', onMessage);
    childProcess.on('exit', onExit);
    childProcess.stdin.on('error', onWriteError);

    childProcess.stdin.write(src);
    childProcess.stdin.write(`;process.send(${JSON.stringify(readyToken)})`);
    childProcess.stdin.end();

    timeoutId =
      timeoutMs !== undefined ? setTimeout(onTimeout, timeoutMs) : null;
  });
}
