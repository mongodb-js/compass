import { useEffect, useRef, useState } from 'react';

/**
 * React useState, but the value is persisted in Web API compatible Storage and
 * initial state is picked up from Storage if exists
 *
 * @param id storage key
 * @param initialValue initial value to use if one is not available
 * @param storage
 * @returns
 */
function usePersistedState<S>(
  id: string,
  initialValue: S | (() => S),
  storage: Storage = globalThis.localStorage
) {
  const idRef = useRef(id);
  const storageRef = useRef(storage);
  const [state, setState] = useState<S>(() => {
    const initialStored = storageRef.current.getItem(idRef.current);
    if (initialStored) {
      try {
        return JSON.parse(initialStored);
      } catch (e) {
        throw new Error(
          'Failed to parse stored value, usePersistedState only supports serializeable values. ' +
            (e as Error).message
        );
      }
    }
    if (typeof initialValue === 'function') {
      return (initialValue as () => S)();
    }
    return initialValue;
  });
  useEffect(() => {
    storageRef.current.setItem(idRef.current, JSON.stringify(state));
  }, [state]);
  return [state, setState] as const;
}

export { usePersistedState };
