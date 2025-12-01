import type React from 'react';
import { useRef } from 'react';

/**
 * Helper method to get a stable reference to the latest version of any value
 * passed to render
 * @param val value that will be stored in a ref and will continuously update to
 * current every render
 * @returns
 */
export function useCurrentValueRef<T>(val: T): React.MutableRefObject<T> {
  const valRef = useRef(val);
  // React doesn't recommend accessing refs in render, forcing ref access to be
  // limited to effects. While this approach mostly works fine, there is a
  // corner case where the returned value is accessed in a effect hook defined
  // before the `useCurrentValueRef` call. While miniscule, to make sure it
  // doesn't ever affects us, we are explicitly breaking out of the ref usage
  // recommendations here
  // eslint-disable-next-line react-hooks/refs
  valRef.current = val;
  return valRef;
}
