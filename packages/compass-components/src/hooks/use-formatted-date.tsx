import { formatDate } from '../utils/format-date';

import { useState, useEffect } from 'react';

export function useFormattedDate(timestamp: undefined): undefined;
export function useFormattedDate(timestamp: number): string;
export function useFormattedDate(timestamp?: number): string | undefined;
export function useFormattedDate(timestamp?: number): string | undefined {
  const [formattedDate, setFormattedDate] = useState(() =>
    typeof timestamp === 'number' ? formatDate(timestamp) : undefined
  );

  useEffect(() => {
    setFormattedDate(
      typeof timestamp === 'number' ? formatDate(timestamp) : undefined
    );
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
