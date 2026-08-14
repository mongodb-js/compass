function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function formatBSONDate(
  value: Date | number | string,
  timezone = 'UTC'
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.valueOf())) {
    return 'Invalid Date';
  }

  const timeZone = isValidTimezone(timezone) ? timezone : 'UTC';

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPart['type']) =>
      parts.find((part) => part.type === type)?.value ?? '';

    return (
      `${get('month')} ${get('day')}, ${get('year')}, ` +
      `${get('hour')}:${get('minute')}:${get('second')} ` +
      `${get('dayPeriod')} ${get('timeZoneName')}`
    );
  } catch {
    return 'Invalid Date';
  }
}
