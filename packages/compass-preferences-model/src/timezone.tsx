import React from 'react';
import { Icon } from '@mongodb-js/compass-components';

function getTimezoneLongOffset(
  timeZone: string,
  date: Date = new Date()
): string | undefined {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(date);
  return parts.find((p) => p.type === 'timeZoneName')?.value;
}

function getUtcOffset(timeZone: string): string | undefined {
  const offset = getTimezoneLongOffset(timeZone);
  return offset === 'GMT' ? 'UTC+00:00' : offset?.replace('GMT', 'UTC');
}

function timezoneObservesDaylightSavings(timeZone: string): boolean {
  const year = new Date().getFullYear();
  const january = new Date(Date.UTC(year, 0, 1));
  const july = new Date(Date.UTC(year, 6, 1));

  return (
    getTimezoneLongOffset(timeZone, january) !==
    getTimezoneLongOffset(timeZone, july)
  );
}

const SYSTEM_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const TIMEZONES = [
  ...new Set([
    'UTC', // Always show UTC as first option
    SYSTEM_TIMEZONE, // Followed by the system timezone
    ...Intl.supportedValuesOf('timeZone'),
  ]),
];

export const TIMEZONE_OPTIONS = Object.fromEntries(
  TIMEZONES.map((tz) => {
    const offset = getUtcOffset(tz);
    return [
      tz,
      {
        label: tz === 'UTC' ? 'UTC±00:00' : `(${offset}) - ${tz}`,
        glyph: timezoneObservesDaylightSavings(tz) ? (
          <Icon glyph="Sun" />
        ) : undefined,
        description:
          tz === 'UTC'
            ? 'Coordinated Universal Time'
            : tz === SYSTEM_TIMEZONE
            ? "Your System's Timezone"
            : undefined,
      },
    ];
  })
);
