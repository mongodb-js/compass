const { expect } = require('chai');
const {
  newBetaVersion,
  newGaVersion
} = require('./bump');

describe('bump', () => {
  describe('newBetaVersion', () => {
    it('returns new beta for a newly promoted release branch', () => {
      expect(newBetaVersion('1.21.0', '1.22-releases')).to.equal('1.22.0-beta.0');
    });

    it('bumps beta for a previous beta', () => {
      expect(newBetaVersion('1.22.0-beta.0', '1.22-releases')).to.equal('1.22.0-beta.1');
    });

    it('bumps beta for a previous ga', () => {
      expect(newBetaVersion('1.22.0', '1.22-releases')).to.equal('1.22.1-beta.0');
    });
  });

  describe('newGaVersion', () => {
    it('returns new ga version for a newly promoted release branch', () => {
      expect(newGaVersion('1.21.0', '1.22-releases')).to.equal('1.22.0');
    });

    it('bumps beta to new ga', () => {
      expect(newGaVersion('1.22.0-beta.0', '1.22-releases')).to.equal('1.22.0');
    });

    it('bumps ga a new ga', () => {
      expect(newGaVersion('1.22.0', '1.22-releases')).to.equal('1.22.1');
    });
  });
});
