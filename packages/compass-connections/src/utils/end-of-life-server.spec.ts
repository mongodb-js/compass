import { expect } from 'chai';
import { isEndOfLifeVersion } from './end-of-life-server';

describe('isEndOfLifeVersion', function () {
  const LATEST_END_OF_LIFE_VERSION = '6.x';

  function expectVersions(versions: string[], expected: boolean) {
    for (const version of versions) {
      expect(isEndOfLifeVersion(version, LATEST_END_OF_LIFE_VERSION)).to.equal(
        expected,
        `Expected ${version} to be ${
          expected ? 'end of life' : 'not end of life'
        }`
      );
    }
  }

  it('returns true for versions below v7.0', () => {
    expectVersions(
      [
        '6.2',
        '6.0.2',
        '6.0.0',
        '4.4.0',
        '4.3.0',
        '4.0',
        '4.0-beta.0',
        '1.0.0',
        '0.0.1',
        '3.999.0',
      ],
      true
    );
  });

  it('returns false for v7.0 and above', () => {
    expectVersions(['7.0.0', '8.0.0'], false);
  });
});
