import { spawnSync, type SpawnOptions } from 'node:child_process';

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
