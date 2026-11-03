import { abortable } from '@mongodb-js/compass-events';

// timers/promises would do this with { signal }, but compass-web maps it to
// timers-browserify, which has no promise API.
export async function cancellableWait(
  ms: number,
  signal: AbortSignal
): Promise<void> {
  await abortable(new Promise((resolve) => setTimeout(resolve, ms)), {
    signal,
  });
}
