import { expect } from 'chai';
import { formatBSONDate } from './format-bson-date';

describe('formatBSONDate', function () {
  const date = new Date('2024-01-15T12:30:45.123Z');
  const usecases = [
    {
      title: 'defaults to UTC',
      input: [date],
      expected: '2024-01-15T12:30:45.123+00:00',
    },
    {
      title: 'formats a positive offset',
      input: [date, 'Europe/Berlin'],
      expected: '2024-01-15T13:30:45.123+01:00',
    },
    {
      title: 'formats a negative offset',
      input: [date, 'America/New_York'],
      expected: '2024-01-15T07:30:45.123-05:00',
    },
    {
      title: 'formats a zero offset timezone with an explicit offset',
      input: [date, 'Europe/London'],
      expected: '2024-01-15T12:30:45.123+00:00',
    },
    {
      title: 'accounts for daylight saving time',
      input: [new Date('2024-07-15T12:30:45.123Z'), 'Europe/London'],
      expected: '2024-07-15T13:30:45.123+01:00',
    },
    {
      title: 'accounts for daylight saving time - positive offset',
      input: [new Date('2024-07-15T12:30:45.123Z'), 'Europe/Berlin'],
      expected: '2024-07-15T14:30:45.123+02:00',
    },
    {
      title:
        'rolls the date over when the offset crosses midnight - before midnight',
      input: [new Date('2024-01-15T23:30:00.000Z'), 'Asia/Tokyo'],
      expected: '2024-01-16T08:30:00.000+09:00',
    },
    {
      title:
        'rolls the date over when the offset crosses midnight - after midnight',
      input: [new Date('2024-01-15T00:30:00.000Z'), 'America/Los_Angeles'],
      expected: '2024-01-14T16:30:00.000-08:00',
    },
    {
      title: 'formats midnight as 00 and not 24',
      input: [new Date('2024-01-15T00:00:00.000Z'), 'Europe/London'],
      expected: '2024-01-15T00:00:00.000+00:00',
    },
    {
      title: 'accepts a timestamp number',
      input: [date.valueOf(), 'Europe/Berlin'],
      expected: '2024-01-15T13:30:45.123+01:00',
    },
    {
      title: 'falls back to UTC for an unknown timezone',
      input: [date, 'Not/AZone'],
      expected: '2024-01-15T12:30:45.123+00:00',
    },
    {
      title: 'returns the raw date string for a non representable date',
      input: [Number.MAX_SAFE_INTEGER, 'Europe/Berlin'],
      expected: 'Invalid Date',
    },
    {
      title: 'returns the raw date string for a non representable date - NaN',
      input: [NaN],
      expected: 'Invalid Date',
    },
  ] as const;

  for (const { title, input, expected } of usecases) {
    it(title, function () {
      const [date, timezone] = input;
      expect(formatBSONDate(date, timezone)).to.eq(expected);
    });
  }
});
