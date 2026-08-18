const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;

const relativeDateFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

const absoluteDateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'long',
});

const formatScale = {
  second: SECOND,
  minute: MINUTE,
  hour: HOUR,
  day: DAY,
  week: WEEK,
};

export function formatDate(date: number): string {
  const timeDiff = Date.now() - date;
  let formatType: keyof typeof formatScale | null = null;

  if (timeDiff < MINUTE) {
    formatType = 'second';
  } else if (timeDiff < HOUR) {
    formatType = 'minute';
  } else if (timeDiff < DAY) {
    formatType = 'hour';
  } else if (timeDiff < WEEK) {
    formatType = 'day';
  } else if (timeDiff < MONTH) {
    formatType = 'week';
  } else {
    return absoluteDateFormatter.format(date);
  }

  return relativeDateFormatter.format(
    -Math.round(timeDiff / formatScale[formatType]),
    formatType
  );
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
const SECONDS_PER_WEEK = 7 * SECONDS_PER_DAY;

export function formatDuration(secs: number): string {
  const seconds = secs % SECONDS_PER_MINUTE;
  const minutes = Math.floor((secs % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const hours = Math.floor((secs % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const days = Math.floor((secs % SECONDS_PER_WEEK) / SECONDS_PER_DAY);
  const weeks = Math.floor(secs / SECONDS_PER_WEEK);

  // @ts-expect-error: DurationFormat is not in our target TS yet, this should fail when we update
  return new Intl.DurationFormat(undefined, { style: 'narrow' }).format({
    weeks,
    days,
    hours,
    minutes,
    seconds,
  });
}

/**
 * Remove the timezone offset from the date value (for html picker).
 *
 * The native datetime-local input has no timezone and works with local
 * wall-clock time, while document dates are displayed in UTC. We format
 * the date value so that picker can display the correct date-time.
 */
export function convertToPickerDateTime(value: string): string {
  const date = new Date(value);
  if (isNaN(date.valueOf())) {
    return '';
  }
  // YYYY-MM-DDTHH:mm:ss.sss (remove zone and offset)
  const iso = date.toISOString();
  return iso.slice(0, 23);
}

/**
 * Adds the UTC timezone offset to the date value (for document).
 *
 * Native datetime-local input returns a value in local wall-clock time
 * and does not support timezones. The value selected for our use-case
 * is something like `2024-06-05T12:34:56.789`. We append a `Z` to the value
 * to make it UTC and then return as an ISO string with `+00:00` timezone offset.
 */
export function convertFromPickerDateTime(value: string): string {
  const date = new Date(`${value}Z`);
  if (isNaN(date.valueOf())) {
    return value;
  }
  return date.toISOString().replace('Z', '+00:00');
}
