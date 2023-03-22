import type { RefObject } from 'react';
import { useMemo } from 'react';
import { useRef, useEffect } from 'react';

const kValueChanged = Symbol('Value changed');

// Creates a memo array from passed value, by either wraping value in array or
// just returning as-is if value is already an array.
function useMemoDependencies(value: unknown): unknown[] {
  return useMemo(
    () => {
      return Array.isArray(value) ? value : [value];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Array.isArray(value) ? value : [value]
  );
}

/**
 * Runs an effect, but only after the value changes for the first time (skipping
 * the first "onMount" effect)
 *
 * Returns a ref for the initial value
 */
export function useEffectOnChange<T>(
  fn: React.EffectCallback,
  val: T
): RefObject<T> {
  // Keep the initial value as a ref so we can check against it in effect when
  // the current value changes
  const initial = useRef<T | symbol>(val);
  const effect = useRef(fn);
  effect.current = fn;
  useEffect(() => {
    // We check if value doesn't match the initial one to avoid running effect
    // for the first mount
    if (val !== initial.current) {
      // After we detected at least one change in value, we set the initial to a
      // symbol so that the current value is never equal to it anymore
      initial.current = kValueChanged;
      return effect.current();
    }
  }, useMemoDependencies(val));
  // Return a readonly ref value
  return useRef(val);
}
