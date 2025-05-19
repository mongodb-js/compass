import { expect } from 'chai';
import { isEndOfLifeVersion } from './end-of-life-server';

describe('isEndOfLifeVersion', function () {
  const LATEST_END_OF_LIFE_VERSION = '4.4.x';

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

  it('returns true for v4.4 and below', () => {
    expectVersions(
      ['4.4.0', '4.3.0', '4.0', '4.0-beta.0', '1.0.0', '0.0.1', '3.999.0'],
      true
    );
  });

  it('returns true for v4.5 and above', () => {
    expectVersions(
      ['4.5.0', '5.0.0', '5.0.25', '6.0.0', '7.0.0', '8.0.0'],
      false
    );
  });
});
