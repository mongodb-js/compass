import { expect } from 'chai';
import { formatDateWithTimezone } from './date-with-timezone-hint';

function normalizeSpaces(str: string): string {
  return str.replace(/[\u202f\u00a0]/g, ' ');
}

function isLocaleSupported(locale: string): boolean {
  return Intl.DateTimeFormat.supportedLocalesOf([locale]).length > 0;
}

describe('date-with-timezone-hint', function () {
  describe('formatDateWithTimezone', function () {
    const date = new Date('2024-01-15T12:30:45.123Z');
    const usecases = [
      {
        title: 'defaults to UTC',
        input: [date, undefined, 'en-US'],
        expected: 'January 15, 2024 at 12:30:45 PM UTC',
      },
      {
        title: 'formats a positive offset',
        input: [date, 'Europe/Berlin', 'en-US'],
        expected: 'January 15, 2024 at 1:30:45 PM GMT+1',
      },
      {
        title: 'formats a negative offset',
        input: [date, 'America/New_York', 'en-US'],
        expected: 'January 15, 2024 at 7:30:45 AM EST',
      },
      {
        title: 'formats a zero offset timezone with an explicit offset',
        input: [date, 'Europe/London', 'en-US'],
        expected: 'January 15, 2024 at 12:30:45 PM GMT',
      },
      {
        title: 'accounts for daylight saving time',
        input: [new Date('2024-07-15T12:30:45.123Z'), 'Europe/London', 'en-US'],
        expected: 'July 15, 2024 at 1:30:45 PM GMT+1',
      },
      {
        title: 'accounts for daylight saving time - positive offset',
        input: [new Date('2024-07-15T12:30:45.123Z'), 'Europe/Berlin', 'en-US'],
        expected: 'July 15, 2024 at 2:30:45 PM GMT+2',
      },
      {
        title:
          'rolls the date over when the offset crosses midnight - before midnight',
        input: [new Date('2024-01-15T23:30:00.000Z'), 'Asia/Tokyo', 'en-US'],
        expected: 'January 16, 2024 at 8:30:00 AM GMT+9',
      },
      {
        title:
          'rolls the date over when the offset crosses midnight - after midnight',
        input: [
          new Date('2024-01-15T00:30:00.000Z'),
          'America/Los_Angeles',
          'en-US',
        ],
        expected: 'January 14, 2024 at 4:30:00 PM PST',
      },
      {
        title: 'accepts a timestamp number',
        input: [date.valueOf(), 'Europe/Berlin', 'en-US'],
        expected: 'January 15, 2024 at 1:30:45 PM GMT+1',
      },
      {
        title: 'falls back to UTC for an unknown timezone',
        input: [date, 'Not/AZone', 'en-US'],
        expected: 'January 15, 2024 at 12:30:45 PM UTC',
      },
      {
        title: 'uses the locale date order, 24h clock and month name',
        input: [date, 'Europe/Berlin', 'de-DE'],
        expected: '15. Januar 2024 um 13:30:45 MEZ',
      },
      {
        title: 'uses the locale conventions - ja-JP',
        input: [date, 'Asia/Tokyo', 'ja-JP'],
        expected: '2024年1月15日 21:30:45 JST',
      },
      {
        title: 'uses the locale conventions - en-GB',
        input: [date, 'Europe/London', 'en-GB'],
        expected: '15 January 2024 at 12:30:45 GMT',
      },
      {
        title: 'returns `Invalid Date` for a non representable date',
        input: [Number.MAX_SAFE_INTEGER, 'Europe/Berlin', 'en-US'],
        expected: 'Invalid Date',
      },
      {
        title: 'returns `Invalid Date` for a non representable date - NaN',
        input: [NaN, undefined, 'en-US'],
        expected: 'Invalid Date',
      },
    ] as const;

    for (const { title, input, expected } of usecases) {
      it(title, function () {
        const [date, timezone, locale] = input;
        if (!isLocaleSupported(locale)) {
          return this.skip();
        }
        expect(
          normalizeSpaces(formatDateWithTimezone(date, timezone, locale))
        ).to.eq(expected);
      });
    }

    it('falls back to the runtime locale when none is provided', function () {
      const runtimeLocale = new Intl.DateTimeFormat().resolvedOptions().locale;
      expect(formatDateWithTimezone(date, 'UTC')).to.eq(
        formatDateWithTimezone(date, 'UTC', runtimeLocale)
      );
    });
  });
});
