'use strict';
const hadronBuild = require('hadron-build');
const commands = hadronBuild;
const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

const debug = require('debug')('hadron-build:test:test');

chai.use(require('sinon-chai'));

describe('hadron-build', function () {
  it('should export commands as named exports', function () {
    expect(hadronBuild).to.be.an('object');
    expect(hadronBuild).to.have.property('info');
    expect(hadronBuild).to.have.property('release');
    expect(hadronBuild).to.have.property('upload');
    expect(hadronBuild).to.have.property('download');
  });

  describe('::test', function () {
    const DEFAULT_ARGS = {
      _: [],
      $0: 'hadron-build',
      help: false,
      unit: false,
      enzyme: false,
      main: false,
      renderer: false,
      functional: false,
      release: false,
    };

    const cwd = process.cwd();

    before(function () {
      debug('before');
      process.chdir('./test/fixtures/hadron-app');
    });

    after(function () {
      process.chdir(cwd);
    });

    describe('::getSpawnJobs', function () {
      it.skip('should return arguments for requested suite jobs', function () {
        const argv = _.defaults(
          {
            unit: true,
            enzyme: true,
            main: true,
            renderer: true,
            functional: true,
          },
          DEFAULT_ARGS
        );
        expect(commands.test.getSpawnJobs(argv)).to.deep.equal({
          unit: ['--sort', '--recursive', './test/unit'],
          enzyme: ['--sort', '--recursive', './test/enzyme'],
          main: ['--sort', '--recursive', './test/main'],
          renderer: ['--sort', '--renderer', '--recursive', './test/renderer'],
          functional: ['--sort', './test/functional'],
        });
      });
    });
    describe('::getMochaArgs', function () {
      context('when the arguments are default', function () {
        it.skip('should allow pass through of mocha cli options', function () {
          var argv = _.defaults(
            {
              grep: '#spectron',
            },
            DEFAULT_ARGS
          );

          expect(commands.test.getMochaArgs(argv)).to.deep.equal([
            '--sort',
            '--grep',
            '#spectron',
          ]);
        });
      });
    });

    describe('::handler', function () {
      it('should set `NODE_ENV` to testing');
      it(
        'should set the TEST_WITH_PREBUILT environment variable if --release specified'
      );
      it('should remove the user-data directory');
      it('should spawn electron-mocha');
    });
  });
});
