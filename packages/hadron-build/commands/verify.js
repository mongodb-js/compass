'use strict';

/**
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js, npm or Python?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */
const Promise = require('bluebird');
const _ = require('lodash');
const semver = require('semver');
const run = Promise.promisify(require('electron-installer-run'));
const cli = require('mongodb-js-cli')('hadron-build:verify');
const pkg = require('../lib/package');
const checkPython = Promise.promisify(require('check-python'));

exports.command = 'verify [options]';
exports.describe = 'Verify the current environment meets the app\'s requirements.';

exports.builder = {
  nodejs_version: {
    describe: 'What version of node.js is required for this app?',
    default: _.get(pkg, 'engines.node') || '^5.0.0'
  },
  npm_version: {
    describe: 'What version of npm is required for this app?',
    default: _.get(pkg, 'engines.npm') || '^3.0.0'
  }
};

exports.tasks = (argv) => {
  return exports.checkPythonVersion()
    .then(() => exports.checkNpmAndNodejsVersions(argv));
};

exports.handler = (argv) => {
  exports.tasks(argv).catch((err) => cli.abortIfError(err));
};

exports.checkPythonVersion = () => checkPython();

exports.checkNpmAndNodejsVersions = (opts) => {
  const expectNodeVersion = opts.nodejs_version;
  const expectNpmVersion = opts.npm_version;
  const args = ['version', '--json', '--loglevel', 'error'];
  return run('npm', args, {env: process.env})
    .then((stdout) => {
      const versions = JSON.parse(stdout);

      /**
       * TODO (imlucas) Improve language and provide links to fix issues.
       */
      if (!semver.satisfies(versions.node, expectNodeVersion)) {
        return new Error(`Your current node.js (v${versions.node}) ` +
          `does not satisfy the version required by this project (v%s).`);
      } else if (!semver.satisfies(versions.npm, expectNpmVersion)) {
        return new Error(`Your current npm (v${versions.npm}) ` +
          `does not meet the requirement ${expectNpmVersion}.`);
      }

      return versions;
    });
};
