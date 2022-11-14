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
