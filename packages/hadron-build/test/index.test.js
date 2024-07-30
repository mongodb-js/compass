'use strict';
const hadronBuild = require('../');
const commands = hadronBuild;
const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

const debug = require('debug')('hadron-build:test:test');

chai.use(require('sinon-chai'));

describe('hadron-build', () => {
  it('should export a default function', () => {
    expect(hadronBuild).to.be.a('function');
  });

  describe('::release', () => {
    it('should include options from commands::verify', () => {
      expect(commands.release.builder).to.have.property('nodejs_version');
      expect(commands.release.builder).to.have.property('npm_version');
    });
  });

  describe('::test', () => {
    const DEFAULT_ARGS = {
      _: [],
      $0: 'hadron-build',
      help: false,
      unit: false,
      enzyme: false,
      main: false,
      renderer: false,
      functional: false,
      release: false
    };

    const cwd = process.cwd();

    before(() => {
      debug('before');
      process.chdir('./test/fixtures/hadron-app');
    });

    after(() => {
      process.chdir(cwd);
    });

    describe('::getSpawnJobs', () => {
      it.skip('should return arguments for requested suite jobs', () => {
        const argv = _.defaults({
          unit: true,
          enzyme: true,
          main: true,
          renderer: true,
          functional: true
        }, DEFAULT_ARGS);
        expect(commands.test.getSpawnJobs(argv)).to.deep.equal({
          unit: ['--sort', '--recursive', './test/unit'],
          enzyme: ['--sort', '--recursive', './test/enzyme'],
          main: ['--sort', '--recursive', './test/main'],
          renderer: ['--sort', '--renderer', '--recursive', './test/renderer'],
          functional: ['--sort', './test/functional']
        });
      });
    });
    describe('::getMochaArgs', () => {
      context('when the arguments are default', () => {
        it.skip('should allow pass through of mocha cli options', () => {
          var argv = _.defaults({
            grep: '#spectron'
          }, DEFAULT_ARGS);

          expect(commands.test.getMochaArgs(argv)).to.deep.equal([
            '--sort', '--grep', '#spectron'
          ]);
        });
      });
    });

    describe('::handler', () => {
      it('should set `NODE_ENV` to testing');
      it('should set the TEST_WITH_PREBUILT environment variable if --release specified');
      it('should remove the user-data directory');
      it('should spawn electron-mocha');
    });
  });

  describe('::verify', () => {
    it('should have a `nodejs_version` option', () => {
      expect(commands.verify.builder).to.have.property('nodejs_version');
    });

    it('should have a `npm_version` option', () => {
      expect(commands.verify.builder).to.have.property('npm_version');
    });

    it('should use `engines.node` for the default `nodejs_version` option');

    it('should use `engines.npm` for the default `npm_version` option');

    describe('::handler', () => {
      it('should check the environment\'s npm installation');
      it('should check the environment\'s node.js installation');
    });
  });
});
