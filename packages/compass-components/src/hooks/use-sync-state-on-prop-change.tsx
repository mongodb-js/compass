import { useState } from 'react';

/**
 * Helper hook to update local component state based on the prop change. This is
 * recommended over calling `setState` directly inside effects, but **_is still
 * considered an antipattern_**. Please refer to the React documentation for the
 * guidance around how to avoid this pattern.
 *
 * @see {@link
 * https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes}
 * @deprecated React doesn't recommend this pattern, consider other approaches: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
 */
export function useSyncStateOnPropChange<T = unknown>(
  setStateFn: () => void,
  deps: T[],
  isEqual: (a: T, b: T) => boolean = (a, b) => {
    return a === b;
  }
) {
  const [prevDeps, setPrevDeps] = useState(deps);
  if (
    prevDeps.some((dep, index) => {
      return !isEqual(dep, deps[index]);
    })
  ) {
    setStateFn();
    setPrevDeps(deps);
  }
}
