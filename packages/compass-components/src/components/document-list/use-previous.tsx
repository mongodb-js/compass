import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  // this file goes away in https://github.com/mongodb-js/compass/pull/7614
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}
