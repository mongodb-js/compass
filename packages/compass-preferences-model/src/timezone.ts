import type { GlyphName } from '@mongodb-js/compass-components';

function getTimezoneLongOffset(
  timeZone: string,
  date: Date = new Date()
): string | undefined {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value;
  } catch {
    // Intl throws a RangeError for timezones that are unknown to the system
    return undefined;
  }
}

export function getUtcOffset(timeZone: string): string | undefined {
  const offset = getTimezoneLongOffset(timeZone);
  return offset === 'GMT' ? 'UTC+00:00' : offset?.replace('GMT', 'UTC');
}

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
    ...Intl.supportedValuesOf('timeZone'),
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

let timezoneOptions: Record<string, TimezoneOption> | undefined;

/**
 * Builds the timezone dropdown options. There are ~450 timezones and building
 * the label for each one requires constructing several `Intl.DateTimeFormat`
 * instances, so this is computed lazily and memoized.
 */
export function getTimezoneOptions(): Record<string, TimezoneOption> {
  return (timezoneOptions ??= Object.fromEntries(
    TIMEZONES.map((tz): [string, TimezoneOption] => {
      const observesDaylightSavings = timezoneObservesDaylightSavings(tz);

      const label =
        tz === 'UTC' ? 'UTC±00:00' : `(${getUtcOffset(tz) ?? ''}) - ${tz}`;
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
  ));
}
