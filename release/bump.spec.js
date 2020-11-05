const { expect } = require('chai');
const {
  newBeta,
  newGa
} = require('./bump');

describe('bump', () => {
  describe('newBeta', () => {
    it('returns new beta for a newly promoted release branch', () => {
      expect(newBeta('1.21.0', '1.22-releases')).to.equal('1.22.0-beta.0');
    });

    it('bumps beta for a previous beta', () => {
      expect(newBeta('1.22.0-beta.0', '1.22-releases')).to.equal('1.22.0-beta.1');
    });

    it('bumps beta for a previous ga', () => {
      expect(newBeta('1.22.0', '1.22-releases')).to.equal('1.22.1-beta.0');
    });
  });

  describe('newGa', () => {
    it('returns new ga version for a newly promoted release branch', () => {
      expect(newGa('1.21.0', '1.22-releases')).to.equal('1.22.0');
    });

    it('bumps beta to new ga', () => {
      expect(newGa('1.22.0-beta.0', '1.22-releases')).to.equal('1.22.0');
    });

    it('bumps ga to a new ga', () => {
      expect(newGa('1.22.0', '1.22-releases')).to.equal('1.22.1');
    });
  });
});
