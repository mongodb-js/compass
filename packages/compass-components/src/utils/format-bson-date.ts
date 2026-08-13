const UTC_OFFSET_SUFFIX = '+00:00';

function toUTCString(date: Date): string {
  return date.toISOString().replace('Z', UTC_OFFSET_SUFFIX);
}

function normalizeTimezoneOffset(timeZoneName: string | undefined): string {
  if (!timeZoneName || timeZoneName === 'GMT') {
    return UTC_OFFSET_SUFFIX;
  }
  return timeZoneName.replace('GMT', '');
}

function formatInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    // returns offset references and offset - `GMT+02:00`
    timeZoneName: 'longOffset',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return (
    `${values.year.padStart(4, '0')}-${values.month}-${values.day}` +
    `T${values.hour}:${values.minute}:${values.second}.${values.fractionalSecond}` +
    normalizeTimezoneOffset(values.timeZoneName)
  );
}

export function formatBSONDate(
  value: Date | number | string,
  timezone = 'UTC'
): string {
  // BSON Date are uint64_t ms, JS Date only supports float64 ms, so some valid
  // BSON Dates are not representable in JS.
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return String(date);
  }
  if (timezone === 'UTC') {
    return toUTCString(date);
  }
  try {
    return formatInTimezone(date, timezone);
  } catch {
    // Intl.DateTimeFormat throws a RangeError on an unknown timezone identifier.
    return toUTCString(date);
  }
}
