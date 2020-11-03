const { expect } = require('chai');
const {
  isMainBranch,
  isReleaseBranch,
  buildReleaseBranchName,
  getFirstBeta,
  getFirstGa,
  hasVersion,
  lt
} = require('./branch');

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

  describe('getFirstBeta', () => {
    it('throws if not release branch', () => {
      expect(() => {
        getFirstBeta('somebranch');
      }).to.throw('not a release branch');
    });

    it('returns the first beta for a release branch', () => {
      expect(getFirstBeta('1.22-releases')).to.equal('1.22.0-beta.0');
      expect(getFirstBeta('1.2-releases')).to.equal('1.2.0-beta.0');
    });
  });

  describe('getFirstGa', () => {
    it('throws if not release branch', () => {
      expect(() => {
        getFirstGa('somebranch');
      }).to.throw('not a release branch');
    });

    it('returns the first beta for a release branch', () => {
      expect(getFirstGa('1.22-releases')).to.equal('1.22.0');
      expect(getFirstGa('1.2-releases')).to.equal('1.2.0');
    });
  });

  describe('hasVersion', () => {
    it('returns true if matching', () => {
      expect(
        hasVersion('1.22-releases', '1.22.0')
      ).to.be.true;

      expect(
        hasVersion('1.22-releases', '1.22.1')
      ).to.be.true;

      expect(
        hasVersion('1.22-releases', '1.22.1-beta.0')
      ).to.be.true;
    });

    it('returns false if not matching', () => {
      expect(
        hasVersion('1.22-releases', '1.21.0')
      ).to.be.false;

      expect(
        hasVersion('1.22-releases', '1.21.0-beta.0')
      ).to.be.false;

      expect(
        hasVersion('1.22-releases', '1.23.0')
      ).to.be.false;

      expect(
        hasVersion('1.22-releases', '1.23.0-beta.0')
      ).to.be.false;
    });
  });

  describe('lt', () => {
    it('returns true only if branch is lower than version', () => {
      expect(lt('1.22-releases', '1.23.0')).to.be.true;
      expect(lt('1.22-releases', '2.0.0')).to.be.true;
      expect(lt('1.22-releases', '2.22.0')).to.be.true;
      expect(lt('1.22-releases', '1.22.0')).to.be.false;
      expect(lt('1.22-releases', '1.22.1')).to.be.false;
      expect(lt('1.22-releases', '1.22.0-beta.0')).to.be.false;
      expect(lt('1.23-releases', '1.22.0-beta.0')).to.be.false;
      expect(lt('2.22-releases', '1.22.0-beta.0')).to.be.false;
      expect(lt('2.22-releases', '1.23.0-beta.0')).to.be.false;
    });
  });
});
