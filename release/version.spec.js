const { expect } = require('chai');
const {
  getMajorMinor,
  sameMajorAndMinor,
  extractFromString
} = require('./version');

describe('version', () => {
  describe('getMajorMinor', () => {
    it('returns major and minor form a string', () => {
      expect(getMajorMinor('1.2.0')).to.deep.equal([1, 2]);
      expect(getMajorMinor('1.22.0')).to.deep.equal([1, 22]);
      expect(getMajorMinor('22.22.0')).to.deep.equal([22, 22]);
      expect(getMajorMinor('1.2-releases')).to.deep.equal([1, 2]);
      expect(getMajorMinor('1.2.0-beta.0')).to.deep.equal([1, 2]);
    });
  });

  describe('sameMajorAndMinor', () => {
    it('returns true only if major and minor are the same', () => {
      expect(sameMajorAndMinor('1.2.0', '1.2.0')).to.be.true;
      expect(sameMajorAndMinor('1.2.0', '1.2.1')).to.be.true;
      expect(sameMajorAndMinor('1.2.1', '1.2.1')).to.be.true;
      expect(sameMajorAndMinor('1.22.1-beta.0', '1.22.5-beta.1')).to.be.true;
      expect(sameMajorAndMinor('1.3.0', '1.2.0')).to.be.false;
      expect(sameMajorAndMinor('2.2.0', '1.2.1')).to.be.false;
      expect(sameMajorAndMinor('3.4.1', '1.2.1')).to.be.false;
      expect(sameMajorAndMinor('1.25.1-beta.0', '1.22.5-beta.1')).to.be.false;
    });
  });

  describe('extractFromString', () => {
    it('gets the correct version', () => {
      const ids = [
        '1.22.1',
        '1.22.1-readonly',
        '1.22.1-isolated',
        '1.23.0-beta.4',
        '1.23.0-beta.4-readonly',
        '1.23.0-beta.4-isolated',
      ];

      expect(ids.map(extractFromString)).to.deep.equal([
        '1.22.1',
        '1.22.1',
        '1.22.1',
        '1.23.0-beta.4',
        '1.23.0-beta.4',
        '1.23.0-beta.4',
      ]);
    });
  });
});
