import { expect } from 'chai';
import { capMaxTimeMSAtPreferenceLimit } from './maxtimems';

function makePrefs(maxTimeMS: number | undefined) {
  return { getPreferences: () => ({ maxTimeMS }) };
}

describe('capMaxTimeMSAtPreferenceLimit', function () {
  context('when both value and preference are non-zero numbers', function () {
    it('returns the preference limit when it is stricter', function () {
      expect(capMaxTimeMSAtPreferenceLimit(makePrefs(3000), 5000)).to.equal(
        3000
      );
    });

    it('returns the value when it is stricter', function () {
      expect(capMaxTimeMSAtPreferenceLimit(makePrefs(5000), 3000)).to.equal(
        3000
      );
    });
  });

  context('when maxTimeMS preference is 0 (no limit)', function () {
    it('returns the value instead of 0 so the operation does not run forever', function () {
      expect(capMaxTimeMSAtPreferenceLimit(makePrefs(0), 5000)).to.equal(5000);
    });
  });

  context('when the incoming value is 0 (no limit)', function () {
    it('returns the preference limit so the operation does not run forever', function () {
      expect(capMaxTimeMSAtPreferenceLimit(makePrefs(5000), 0)).to.equal(5000);
    });
  });

  context('when both value and preference are 0', function () {
    it('returns 0', function () {
      expect(capMaxTimeMSAtPreferenceLimit(makePrefs(0), 0)).to.equal(0);
    });
  });

  context('when preference is not set', function () {
    it('returns the original value unchanged', function () {
      expect(
        capMaxTimeMSAtPreferenceLimit(makePrefs(undefined), 5000)
      ).to.equal(5000);
    });

    it('passes through non-number values unchanged', function () {
      expect(
        capMaxTimeMSAtPreferenceLimit(makePrefs(undefined), 'some-value')
      ).to.equal('some-value');
    });
  });

  context('when value is not a number', function () {
    it('returns the preference limit', function () {
      expect(
        capMaxTimeMSAtPreferenceLimit(makePrefs(3000), 'some-value')
      ).to.equal(3000);
    });
  });
});
