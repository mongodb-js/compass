// Formatted in UTC to stay on the same basis as the ISO timestamps in the
// tooltips: formatting in local time let a cell and its own tooltip disagree
// by a day (2026-10-07T02:30:00Z reads as Oct 06 in America/Los_Angeles).
const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: '2-digit',
  year: 'numeric',
});

export const formatUsageSince = (since: Date): string => {
  return dateFormat
    .formatToParts(since)
    .filter((part) => part.type !== 'literal')
    .map((part) => part.value)
    .join(' ');
};
