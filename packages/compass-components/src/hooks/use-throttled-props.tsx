import { useEffect, useRef, useState } from 'react';

const DEFAULT_REFRESH_RATE_MS = 250;

export const useThrottledProps = <T extends Record<string, unknown>>(
  props: T,
  refreshRate: number = DEFAULT_REFRESH_RATE_MS
): T => {
  // Throttling mechanism for Component content updates.
  const lastUpdateMS = useRef(0);
  const pendingUpdate = useRef<NodeJS.Timeout | null>(null);
  const [throttledProps, setThrottledProps] = useState<T>(props);

  // Throttle props updating. This ensures we don't run
  // into broken state bugs with ReactFlow like COMPASS-9738.
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateMS.current;

    const updateProps = () => {
      lastUpdateMS.current = Date.now();
      setThrottledProps(props);
    };

    if (timeSinceLastUpdate >= refreshRate) {
      updateProps();
    } else {
      if (pendingUpdate.current) {
        clearTimeout(pendingUpdate.current);
      }

      // Schedule update for the remaining time.
      const remainingTime = refreshRate - timeSinceLastUpdate;
      pendingUpdate.current = setTimeout(updateProps, remainingTime);
    }

    return () => {
      if (pendingUpdate.current) {
        clearTimeout(pendingUpdate.current);
        pendingUpdate.current = null;
      }
    };
  }, [props, refreshRate]);

  return throttledProps;
};
