import { formatDate } from '../utils/format-date';

import { useState, useEffect } from 'react';

export function useFormattedDate(timestamp?: number) {
  const [formattedDate, setFormattedDate] = useState(
    () => timestamp && formatDate(timestamp)
  );

  useEffect(() => {
    setFormattedDate(timestamp && formatDate(timestamp));
    const interval = setInterval(() => {
      setFormattedDate(timestamp && formatDate(timestamp));
    }, 1000 * 60);
    return () => {
      clearInterval(interval);
    };
  }, [timestamp]);

  return formattedDate;
}
