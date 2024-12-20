import type { SpawnSyncReturns } from 'child_process';

export function assertSpawnSyncResult(
  result: SpawnSyncReturns<string>,
  name: string
) {
  if (result.status === null) {
    if (result.signal !== null) {
      throw new Error(`${name} terminated due to signal ${result.signal}`);
    }

    // not supposed to be possible to get here, but just in case
    throw new Error(`${name} terminated with no status or signal`);
  }

  if (result.status !== 0) {
    throw new Error(`${name} failed with exit code ${result.status}`);
  }
}
