const chai = require('chai');
const { spy } = require('sinon');
const { sign, getSignedFilename } = require('../lib/signtool');
const expect = chai.expect;

describe('hadron-build::signtool', () => {
  describe('sign', () => {
    let garasign;
    beforeEach(function() {
      garasign = spy();
    });
    it('does not sign when credentials are not set', async() => {
      await sign('test/fixtures/foo', garasign);
      expect(garasign.called).to.be.false;
    });

    context('when credentials are set', function() {
      beforeEach(function() {
        process.env.GARASIGN_USERNAME = 'username';
        process.env.GARASIGN_PASSWORD = 'password';
        process.env.ARTIFACTORY_USERNAME = 'username';
        process.env.ARTIFACTORY_PASSWORD = 'password';
      });

      afterEach(function() {
        [
          'GARASIGN_USERNAME',
          'GARASIGN_PASSWORD',
          'ARTIFACTORY_USERNAME',
          'ARTIFACTORY_PASSWORD',
          'EVERGREEN_BUILD_VARIANT'
        ].forEach((key) => delete process.env[key]);
      });

      it('signs ubuntu artifacts locally using gpg', async() => {
        process.env.EVERGREEN_BUILD_VARIANT = 'ubuntu';
        await sign('test/fixtures/foo', garasign);

        expect(garasign.calledOnce).to.be.true;
        expect(garasign.firstCall.args).to.deep.equal(['test/fixtures/foo', {
          client: 'local',
          signingMethod: 'gpg',
        }]);
      });

      it('signs windows exe remotely using jsign', async() => {
        process.env.EVERGREEN_BUILD_VARIANT = 'windows';
        await sign('test/fixtures/foo.exe', garasign);

        expect(garasign.calledOnce).to.be.true;
        expect(garasign.firstCall.args).to.deep.equal(['test/fixtures/foo.exe', {
          client: 'remote',
          signingMethod: 'jsign',
          // These are the signing server creds
          host: undefined,
          port: undefined,
          privateKey: undefined,
          username: undefined,
        }]);
      });

      it('signs windows msi remotely using jsign', async() => {
        process.env.EVERGREEN_BUILD_VARIANT = 'windows';
        await sign('test/fixtures/foo.msi', garasign);

        expect(garasign.calledOnce).to.be.true;
        expect(garasign.firstCall.args).to.deep.equal(['test/fixtures/foo.msi', {
          client: 'remote',
          signingMethod: 'jsign',
          // These are the signing server creds
          host: undefined,
          port: undefined,
          privateKey: undefined,
          username: undefined,
        }]);
      });

      it('signs everything remotely using gpg', async() => {
        await sign('test/fixtures/foo', garasign);

        expect(garasign.calledOnce).to.be.true;
        expect(garasign.firstCall.args).to.deep.equal(['test/fixtures/foo', {
          client: 'remote',
          signingMethod: 'gpg',
          // These are the signing server creds
          host: undefined,
          port: undefined,
          privateKey: undefined,
          username: undefined,
        }]);
      });
    });
  });

  describe('getSignedFilename', function() {
    it('adds .sig to the file name', function() {
      ['.zip', '.gz', '.deb', '.rpm'].map((ext) => {
        expect(getSignedFilename(`foo${ext}`)).to.equal(`foo${ext}.sig`);
      });
    });
  });
});
