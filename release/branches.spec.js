const { expect } = require('chai');
const {
  isMainBranch,
  isReleaseBranch,
  buildReleaseBranchName
} = require('./branches');

describe('branches', () => {
  describe('isMainBranch', () => {
    it('returns true only if branch is master', () => {
      expect(isMainBranch('master')).to.be.true;
      expect(isMainBranch('beta')).to.be.false;
      expect(isMainBranch('release/1.2.33')).to.be.false;
      expect(isMainBranch('1.22-releases')).to.be.false;
    });
  });

  describe('isReleaseBranch', () => {
    it('returns true only for a release branch', () => {
      expect(isReleaseBranch('master')).to.be.false;
      expect(isReleaseBranch('beta')).to.be.false;
      expect(isReleaseBranch('release/1.2.33')).to.be.false;
      expect(isReleaseBranch('1.22-releases')).to.be.true;
      expect(isReleaseBranch('1.0-releases')).to.be.true;
    });
  });

  describe('buildReleaseBranchName', () => {
    it('returns a release branch name from version', () => {
      expect(buildReleaseBranchName('1.2')).to.equal('1.2-releases');
    });
  });
});
