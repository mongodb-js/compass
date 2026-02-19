const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
const relativeDateFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

const absoluteDateFormatter = new Intl.DateTimeFormat('en', {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DurationFormat = (Intl as any).DurationFormat;

  // Fallback for environments that don't support Intl.DurationFormat (e.g. older Node versions in tests)
  if (!DurationFormat) {
    const parts: string[] = [];
    if (weeks > 0) parts.push(`${weeks}w`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  return new DurationFormat(undefined, { style: 'narrow' }).format({
    weeks,
    days,
    hours,
    minutes,
    seconds,
  });
}
