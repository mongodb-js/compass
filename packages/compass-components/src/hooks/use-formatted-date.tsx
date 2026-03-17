import { formatDate } from '../utils/format-date';

import { useState, useEffect } from 'react';
import { useSyncStateOnPropChange } from './use-sync-state-on-prop-change';

export function useFormattedDate(timestamp: number): string;
export function useFormattedDate(timestamp?: number): string | undefined;
export function useFormattedDate(timestamp?: number): string | undefined {
  const [formattedDate, setFormattedDate] = useState(() =>
    typeof timestamp === 'number' ? formatDate(timestamp) : undefined
  );
  useSyncStateOnPropChange(() => {
    setFormattedDate(
      typeof timestamp === 'number' ? formatDate(timestamp) : undefined
    );
  }, [timestamp]);
  useEffect(() => {
    const interval = setInterval(() => {
      setFormattedDate(
        typeof timestamp === 'number' ? formatDate(timestamp) : undefined
      );
    }, 1000 * 60);
    return () => {
      clearInterval(interval);
    };
  }, [timestamp]);

  return formattedDate;
}
