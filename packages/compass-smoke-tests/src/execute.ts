import assert from 'node:assert/strict';
import { spawnSync, type SpawnOptions } from 'node:child_process';

export function execute(
  command: string,
  args: string[],
  options?: SpawnOptions
) {
  const { status, signal } = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  assert(
    status === 0 && signal === null,
    `${command} ${args.join(' ')} exited with (status = ${
      status || 'null'
    }, signal = ${signal || 'null'})`
  );
}
