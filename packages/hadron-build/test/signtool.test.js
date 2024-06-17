'use strict';
const chai = require('chai');
const { spy } = require('sinon');
const { sign, getSignedFilename } = require('../lib/signtool');
const expect = chai.expect;

describe('hadron-build::signtool', () => {
  const CURRENT_SIGING_VARS = {
    GARASIGN_USERNAME: process.env.GARASIGN_USERNAME,
    GARASIGN_PASSWORD: process.env.GARASIGN_PASSWORD,
    ARTIFACTORY_USERNAME: process.env.ARTIFACTORY_USERNAME,
    ARTIFACTORY_PASSWORD: process.env.ARTIFACTORY_PASSWORD,
  };
  function setEnvVars(obj) {
    Object.keys(obj).forEach((key) => {
      if (obj[key]) {
        process.env[key] = obj[key];
      } else {
        delete process.env[key];
      }
    });
  }

  describe('sign', () => {
    let garasign;
    beforeEach(function() {
      garasign = spy();
    });
    context('when credentials are not set', function() {
      beforeEach(function() {
        setEnvVars(Object.fromEntries(Object.keys(CURRENT_SIGING_VARS).map((key) => [key, false])));
      });
      afterEach(function() {
        setEnvVars(CURRENT_SIGING_VARS);
      });
      it('does not sign when credentials are not set', async() => {
        await sign('test/fixtures/foo', garasign);
        expect(garasign.called).to.be.false;
      });
    });

    context('when credentials are set', function() {
      beforeEach(function() {
        // Set all the signing vars to a defined value
        setEnvVars(Object.fromEntries(Object.keys(CURRENT_SIGING_VARS).map((key) => [key, key])));
      });
      afterEach(function() {
        setEnvVars(CURRENT_SIGING_VARS);
      });

      it('signs windows exe remotely using jsign', async() => {
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
