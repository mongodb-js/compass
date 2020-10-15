const { expect } = require('chai');
const {
  isReleaseBranch,
  buildReleaseBranchName
} = require('./release-branch');

describe('release-branch', () => {
  describe('isReleaseBranch', () => {
    it('returns true only for a release branch', () => {
      expect(isReleaseBranch('master')).to.be.false;
      expect(isReleaseBranch('beta')).to.be.false;
      expect(isReleaseBranch('release/1.2.33')).to.be.false;
      expect(isReleaseBranch('1.22-releases')).to.be.true;
    });
  });

  describe('buildReleaseBranchName', () => {
    it('returns a release branch name from version', () => {
      expect(buildReleaseBranchName('1.2')).to.equal('1.2-releases');
    });
  });
});
