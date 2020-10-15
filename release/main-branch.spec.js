const { expect } = require('chai');
const {
  isMainBranch,
} = require('./main-branch');

describe('main-branch', () => {
  describe('isMainBranch', () => {
    it('returns true only if branch is master', () => {
      expect(isMainBranch('master')).to.be.true;
      expect(isMainBranch('beta')).to.be.false;
      expect(isMainBranch('release/1.2.33')).to.be.false;
      expect(isMainBranch('1.22-releases')).to.be.false;
    });
  });
});
