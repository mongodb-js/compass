import { spawn, spawnSync, type SpawnOptions } from 'node:child_process';
import createDebug from 'debug';

const debug = createDebug('compass:smoketests:execute');

export class ExecuteFailure extends Error {
  constructor(
    public command: string,
    public args: string[],
    public status: number | null,
    public signal: NodeJS.Signals | null
  ) {
    const commandDetails = `${command} ${args.join(' ')}`;
    const statusDetails = `status = ${status || 'null'}`;
    const signalDetails = `signal = ${signal || 'null'})`;
    super(`${commandDetails} exited with ${statusDetails} ${signalDetails}`);
  }
}

export function execute(
  command: string,
  args: string[],
  options?: SpawnOptions
) {
  const { status, signal } = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  if (status !== 0 || signal !== null) {
    throw new ExecuteFailure(command, args, status, signal);
  }
}

export function executeAsync(
  command: string,
  args: string[],
  options?: SpawnOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    debug(command, ...args);
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });
    const killChild = () => child.kill();
    const interruptChild = () => child.kill('SIGINT');
    process.once('exit', killChild);
    process.once('SIGINT', interruptChild);
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      process.off('exit', killChild);
      process.off('SIGINT', interruptChild);
      if (code !== null) {
        if (code === 0) {
          resolve();
        } else {
          reject(new ExecuteFailure(command, args, code, null));
        }
      } else {
        if (signal !== null) {
          reject(new ExecuteFailure(command, args, null, signal));
        } else {
          // shouldn't happen
          reject(new ExecuteFailure(command, args, null, null));
        }
      }
    });
  });
}
