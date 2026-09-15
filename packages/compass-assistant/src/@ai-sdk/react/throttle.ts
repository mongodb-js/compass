// Copyright 2023 Vercel, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/** A fixed wait in ms, or a function resolving one at call time. */
export type ThrottleWait = number | (() => number);

export interface ThrottledCallback {
  (): void;
  cancel: () => void;
}

/**
 * The first call runs immediately; calls during the wait collapse into a single
 * trailing call. Replaces upstream's `throttleit`, which supports neither a
 * varying wait nor cancellation.
 */
export function throttle(
  fn: () => void,
  waitMs: ThrottleWait | undefined
): ThrottledCallback {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastRunAt: number | undefined;

  const run = () => {
    timer = undefined;
    lastRunAt = Date.now();
    fn();
  };

  const throttled = () => {
    if (waitMs === undefined) {
      fn();
      return;
    }
    // The scheduled trailing call will read the latest state.
    if (timer !== undefined) {
      return;
    }
    const wait = typeof waitMs === 'function' ? waitMs() : waitMs;
    const elapsed = lastRunAt === undefined ? Infinity : Date.now() - lastRunAt;

    if (elapsed >= wait) {
      run();
    } else {
      timer = setTimeout(run, wait - elapsed);
    }
  };

  throttled.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return throttled;
}
