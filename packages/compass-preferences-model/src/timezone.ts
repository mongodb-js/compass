export const TIMEZONES = [
  ...new Set(['UTC', ...Intl.supportedValuesOf('timeZone')]),
];

function getUtcOffset(timeZone: string): string | undefined {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date());
  const offset = parts.find((p) => p.type === 'timeZoneName')?.value;
  return offset === 'GMT' ? 'UTC+00:00' : offset?.replace('GMT', 'UTC');
}

export const TIMEZONE_OPTIONS = Object.fromEntries(
  TIMEZONES.map((tz) => {
    return [
      tz,
      {
        label: tz,
        description:
          tz === 'UTC' ? 'Coordinated Universal Time' : getUtcOffset(tz) ?? '',
      },
    ];
  })
);
