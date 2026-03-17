import { useState } from 'react';

/**
 * Helper hook that takes any value and stores it during the initial render.
 * After that the initial value is returned and is never changed again

 * @param val Any value that needs to be preserved unchanged after initial
 * component render
 * @returns
 */
export function useInitialValue<T>(val: T | (() => T)): T {
  const [initialVal] = useState(val);
  return initialVal;
}
