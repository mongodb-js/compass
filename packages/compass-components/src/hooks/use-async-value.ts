import type { DependencyList } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useCurrentValueRef } from './use-current-value-ref';

export type AsyncValueResult<T> = {
  value: T | undefined;
  error: Error | undefined;
  pending: boolean;
};

function areDepsEqual(a: DependencyList | null, b: DependencyList): boolean {
  if (a === null || a.length !== b.length) {
    return false;
  }
  return a.every((dep, index) => Object.is(dep, b[index]));
}

export function useAsyncValue<T>(
  task: () => Promise<T>,
  deps: DependencyList
): AsyncValueResult<T> {
  const taskRef = useCurrentValueRef(task);
  const runIdRef = useRef(0);
  const [settled, setSettled] = useState<{
    deps: DependencyList;
    value?: T;
    error?: Error;
  } | null>(null);

  useEffect(() => {
    const runId = ++runIdRef.current;
    let cancelled = false;
    void taskRef
      .current()
      .then(
        (value) => ({ value }),
        (error: unknown) => ({
          error: error instanceof Error ? error : new Error(String(error)),
        })
      )
      .then((result) => {
        if (cancelled || runId !== runIdRef.current) {
          return;
        }
        setSettled({ deps, ...result });
      });
    return () => {
      cancelled = true;
    };
  }, deps);

  return {
    value: settled?.value,
    error: settled?.error,
    pending: !areDepsEqual(settled?.deps ?? null, deps),
  };
}
