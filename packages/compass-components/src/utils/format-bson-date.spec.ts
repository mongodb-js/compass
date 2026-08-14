import { expect } from 'chai';
import { formatBSONDate } from './format-bson-date';

describe('formatBSONDate', function () {
  const date = new Date('2024-01-15T12:30:45.123Z');
  const usecases = [
    {
      title: 'defaults to UTC',
      input: [date],
      expected: 'January 15, 2024, 12:30:45 PM UTC',
    },
    {
      title: 'formats a positive offset',
      input: [date, 'Europe/Berlin'],
      expected: 'January 15, 2024, 1:30:45 PM GMT+1',
    },
    {
      title: 'formats a negative offset',
      input: [date, 'America/New_York'],
      expected: 'January 15, 2024, 7:30:45 AM EST',
    },
    {
      title: 'formats a zero offset timezone with an explicit offset',
      input: [date, 'Europe/London'],
      expected: 'January 15, 2024, 12:30:45 PM GMT',
    },
    {
      title: 'accounts for daylight saving time',
      input: [new Date('2024-07-15T12:30:45.123Z'), 'Europe/London'],
      expected: 'July 15, 2024, 1:30:45 PM GMT+1',
    },
    {
      title: 'accounts for daylight saving time - positive offset',
      input: [new Date('2024-07-15T12:30:45.123Z'), 'Europe/Berlin'],
      expected: 'July 15, 2024, 2:30:45 PM GMT+2',
    },
    {
      title:
        'rolls the date over when the offset crosses midnight - before midnight',
      input: [new Date('2024-01-15T23:30:00.000Z'), 'Asia/Tokyo'],
      expected: 'January 16, 2024, 8:30:00 AM GMT+9',
    },
    {
      title:
        'rolls the date over when the offset crosses midnight - after midnight',
      input: [new Date('2024-01-15T00:30:00.000Z'), 'America/Los_Angeles'],
      expected: 'January 14, 2024, 4:30:00 PM PST',
    },
    {
      title: 'formats midnight as 00 and not 24',
      input: [new Date('2024-01-15T00:00:00.000Z'), 'Europe/London'],
      expected: 'January 15, 2024, 12:00:00 AM GMT',
    },
    {
      title: 'accepts a timestamp number',
      input: [date.valueOf(), 'Europe/Berlin'],
      expected: 'January 15, 2024, 1:30:45 PM GMT+1',
    },
    {
      title: 'falls back to UTC for an unknown timezone',
      input: [date, 'Not/AZone'],
      expected: 'January 15, 2024, 12:30:45 PM UTC',
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
