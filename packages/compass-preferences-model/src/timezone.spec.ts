import { expect } from 'chai';
import {
  TIMEZONES,
  SYSTEM_TIMEZONE,
  TIMEZONE_OPTIONS,
  getUtcOffset,
  isSupportedTimezone,
  timezoneObservesDaylightSavings,
} from './timezone';
import { storedUserPreferencesProps } from './preferences-schema';

function filterSystemTimezone(...candidates: string[]): string {
  const timeZone = candidates.find((tz) => tz !== SYSTEM_TIMEZONE);
  if (!timeZone) {
    throw new Error('No suitable timezone for this test');
  }
  return timeZone;
}

describe('timezone', function () {
  describe('TIMEZONES', function () {
    it('lists UTC first and the system timezone second', function () {
      expect(TIMEZONES[0]).to.equal('UTC');
      if (SYSTEM_TIMEZONE !== 'UTC') {
        expect(TIMEZONES[1]).to.equal(SYSTEM_TIMEZONE);
      }
    });

    it('does not contain duplicates', function () {
      expect(new Set(TIMEZONES).size).to.equal(TIMEZONES.length);
    });
  });

  describe('isSupportedTimezone', function () {
    it('accepts known timezones', function () {
      expect(isSupportedTimezone('UTC')).to.equal(true);
      expect(isSupportedTimezone('Europe/Berlin')).to.equal(true);
    });

    it('rejects unknown timezones', function () {
      expect(isSupportedTimezone('Not/AZone')).to.equal(false);
      expect(isSupportedTimezone('')).to.equal(false);
    });

    it('accepts timezones that are not in the TIMEZONES list but are still valid', function () {
      expect(isSupportedTimezone('America/Indiana/Indianapolis')).to.equal(
        true
      );
      expect(isSupportedTimezone('Asia/Kolkata')).to.equal(true);
    });
  });

  describe('getUtcOffset', function () {
    it('reports UTC as a signed zero offset rather than GMT', function () {
      expect(getUtcOffset('UTC')).to.equal('UTC+00:00');
    });

    it('formats offsets with a UTC prefix', function () {
      // Testing against a timezone that does not observe daylight
      // savings to avoid flakiness in the test.
      expect(getUtcOffset('Africa/Algiers')).to.equal('UTC+01:00');
      expect(getUtcOffset('Pacific/Marquesas')).to.equal('UTC-09:30');
    });
  });

  describe('timezoneObservesDaylightSavings', function () {
    it('detects northern hemisphere daylight savings', function () {
      expect(timezoneObservesDaylightSavings('Europe/Berlin')).to.equal(true);
      expect(timezoneObservesDaylightSavings('America/New_York')).to.equal(
        true
      );
    });

    it('detects southern hemisphere daylight savings', function () {
      expect(timezoneObservesDaylightSavings('Australia/Sydney')).to.equal(
        true
      );
      expect(timezoneObservesDaylightSavings('Pacific/Auckland')).to.equal(
        true
      );
    });

    it('returns false for timezones without daylight savings', function () {
      expect(timezoneObservesDaylightSavings('UTC')).to.equal(false);
      expect(timezoneObservesDaylightSavings('Africa/Algiers')).to.equal(false);
      expect(timezoneObservesDaylightSavings('America/Phoenix')).to.equal(
        false
      );
    });
  });

  describe('TIMEZONE_OPTIONS', function () {
    it('returns one option per supported timezone', function () {
      expect(Object.keys(TIMEZONE_OPTIONS)).to.deep.equal(TIMEZONES);
    });

    it('labels UTC without an offset prefix', function () {
      expect(TIMEZONE_OPTIONS['UTC']).to.deep.equal({
        label: 'UTC+00:00',
        description: 'Coordinated Universal Time',
        glyph: undefined,
      });
    });

    it('labels other timezones with their offset', function () {
      expect(TIMEZONE_OPTIONS['Africa/Algiers'].label).to.equal(
        '(UTC+01:00) - Africa/Algiers'
      );
    });

    it('marks daylight savings timezones with a glyph and description', function () {
      const timeZone = filterSystemTimezone(
        'Europe/Berlin',
        'America/New_York'
      );
      expect(TIMEZONE_OPTIONS[timeZone].glyph).to.equal('Sun');
      expect(TIMEZONE_OPTIONS[timeZone].description).to.equal(
        'Observes daylight savings.'
      );
    });

    it('leaves non-daylight-savings timezones without a glyph', function () {
      const timeZone = filterSystemTimezone(
        'Africa/Algiers',
        'America/Phoenix'
      );
      expect(TIMEZONE_OPTIONS[timeZone].glyph).to.equal(undefined);
    });

    it('describes the system timezone', function () {
      if (SYSTEM_TIMEZONE === 'UTC') {
        return this.skip();
      }
      expect(TIMEZONE_OPTIONS[SYSTEM_TIMEZONE].description).to.equal(
        "Your system's timezone"
      );
    });
  });

  describe('timezone preference validator', function () {
    const { validator } = storedUserPreferencesProps.timezone;

    it('defaults to UTC', function () {
      expect(validator.parse(undefined)).to.equal('UTC');
    });

    it('accepts supported timezones', function () {
      expect(validator.parse('Europe/Berlin')).to.equal('Europe/Berlin');
    });

    it('rejects unknown timezones', function () {
      expect(() => validator.parse('Not/AZone')).to.throw(
        'Not a supported IANA timezone name'
      );
    });
  });
});
