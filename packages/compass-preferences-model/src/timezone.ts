import type { GlyphName } from '@mongodb-js/compass-components';

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

export function getUtcOffset(timeZone: string): string | undefined {
  const offset = getTimezoneLongOffset(timeZone);
  return offset === 'GMT' ? 'UTC+00:00' : offset?.replace('GMT', 'UTC');
}

/**
 * Detects daylight savings time by comparing the timezone's UTC offset on
 * January 1 and July 1 of the current year. A different offset indicates
 * a seasonal clock change.
 *
 * Using UTC dates keeps interpretation independent of the system timezone.
 */
export function timezoneObservesDaylightSavings(timeZone: string): boolean {
  const year = new Date().getFullYear();
  const janOffset = getTimezoneLongOffset(
    timeZone,
    new Date(Date.UTC(year, 0, 1))
  );
  const julyOffset = getTimezoneLongOffset(
    timeZone,
    new Date(Date.UTC(year, 6, 1))
  );
  return janOffset !== julyOffset;
}

export const SYSTEM_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const TIMEZONES = [
  ...new Set([
    'UTC', // Always show UTC as first option
    SYSTEM_TIMEZONE, // Followed by the system timezone
    ...(Intl.supportedValuesOf?.('timeZone') ?? []),
  ]),
];

export function isSupportedTimezone(timeZone: string): boolean {
  return TIMEZONES.includes(timeZone);
}

export type TimezoneOption = {
  label: string;
  description?: string;
  glyph?: GlyphName;
};

export const TIMEZONE_OPTIONS = Object.fromEntries(
  TIMEZONES.map((tz): [string, TimezoneOption] => {
    const observesDaylightSavings = timezoneObservesDaylightSavings(tz);

    const label =
      tz === 'UTC' ? 'UTC+00:00' : `(${getUtcOffset(tz) ?? ''}) - ${tz}`;
    const description =
      tz === 'UTC'
        ? 'Coordinated Universal Time'
        : tz === SYSTEM_TIMEZONE
        ? "Your system's timezone"
        : observesDaylightSavings
        ? 'Observes daylight savings.'
        : undefined;

    return [
      tz,
      {
        label,
        description,
        glyph: observesDaylightSavings ? 'Sun' : undefined,
      },
    ];
  })
);
