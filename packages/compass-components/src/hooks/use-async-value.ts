import type { DependencyList } from 'react';
import { useEffect, useState } from 'react';
import { useCurrentValueRef } from './use-current-value-ref';

export type AsyncValueResult<T> = {
  value: T | undefined;
  error: Error | undefined;
  pending: boolean;
};

function areDepsEqual(a: DependencyList, b: DependencyList): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((dep, index) => Object.is(dep, b[index]));
}

/**
 * Only for async values derived from local component state (e.g. parsing user
 * input). Use redux when/where ever its possible and avoid depending of this
 * hook for managing async values within a component.
 *
 */
export function useAsyncValue<T>(
  task: () => Promise<T>,
  deps: DependencyList
): AsyncValueResult<T> {
  const taskRef = useCurrentValueRef(task);
  const [activeTask, setActiveTask] = useState({ deps, taskId: 0 });
  const [settled, setSettled] = useState<{
    taskId: number;
    value?: T;
    error?: Error;
  } | null>(null);

  // Deps equality alone can't tell runs apart (A -> B -> A), so every change
  // starts a new taskId. Updating state during render keeps `pending`
  // accurate on the very render where deps change.
  let taskId = activeTask.taskId;
  if (!areDepsEqual(activeTask.deps, deps)) {
    taskId = activeTask.taskId + 1;
    setActiveTask({ deps, taskId });
  }

  useEffect(() => {
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
        if (cancelled) {
          return;
        }
        setSettled({ taskId, ...result });
      });
    return () => {
      cancelled = true;
    };
  }, [taskRef, taskId]);

  return {
    value: settled?.value,
    error: settled?.error,
    pending: settled?.taskId !== taskId,
  };
}
