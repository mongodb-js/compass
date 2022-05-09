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

describe('branches', function() {
  if (!!process.env.EVERGREEN && process.platform === 'darwin') {
    // These tests are not working well on Evergreen macOS machines and we will
    // skip them for now (they will run in GitHub CI)
    // eslint-disable-next-line no-console
    console.warn('Skipping release tests on Evergreen macOS machine');
    return;
  }

  describe('isMainBranch', function() {
    it('returns true only if branch is main', function() {
      expect(isMainBranch('main')).to.be.true;
      expect(isMainBranch('beta')).to.be.false;
      expect(isMainBranch('release/1.2.33')).to.be.false;
      expect(isMainBranch('1.22-releases')).to.be.false;
    });
  });

  describe('isReleaseBranch', function() {
    it('returns true only for a release branch', function() {
      expect(isReleaseBranch('main')).to.be.false;
      expect(isReleaseBranch('beta')).to.be.false;
      expect(isReleaseBranch('release/1.2.33')).to.be.false;
      expect(isReleaseBranch('1.22-releases')).to.be.true;
      expect(isReleaseBranch('1.0-releases')).to.be.true;
    });
  });

  describe('buildReleaseBranchName', function() {
    it('returns a release branch name from version', function() {
      expect(buildReleaseBranchName('1.2')).to.equal('1.2-releases');
    });
  });

  describe('getFirstBeta', function() {
    it('throws if not release branch', function() {
      expect(() => {
        getFirstBeta('somebranch');
      }).to.throw('not a release branch');
    });

    it('returns the first beta for a release branch', function() {
      expect(getFirstBeta('1.22-releases')).to.equal('1.22.0-beta.0');
      expect(getFirstBeta('1.2-releases')).to.equal('1.2.0-beta.0');
    });
  });

  describe('getFirstGa', function() {
    it('throws if not release branch', function() {
      expect(() => {
        getFirstGa('somebranch');
      }).to.throw('not a release branch');
    });

    it('returns the first beta for a release branch', function() {
      expect(getFirstGa('1.22-releases')).to.equal('1.22.0');
      expect(getFirstGa('1.2-releases')).to.equal('1.2.0');
    });
  });

  describe('hasVersion', function() {
    it('returns true if matching', function() {
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

    it('returns false if not matching', function() {
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

  describe('lt', function() {
    it('returns true only if branch is lower than version', function() {
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
