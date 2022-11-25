import { formatDate } from '../utils/format-date';

import { useState, useEffect } from 'react';

export function useFormattedDate(timestamp: number) {
  const [formattedDate, setFormattedDate] = useState(() =>
    formatDate(timestamp)
  );

  useEffect(() => {
    setFormattedDate(formatDate(timestamp));
    const interval = setInterval(() => {
      setFormattedDate(formatDate(timestamp));
    }, 1000 * 60);
    return () => {
      clearInterval(interval);
    };
  }, [timestamp]);

  return formattedDate;
}
