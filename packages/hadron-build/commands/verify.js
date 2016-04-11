'use strict';

/**
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js, npm or Python?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */
const _ = require('lodash');
const semver = require('semver');
const run = require('electron-installer-run');
const abortIfError = require('../lib/abort-if-error');
const pkg = require('../lib/package');
const pythonChecker = require('check-python');

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
  exports.tasks(argv).catch((err) => abortIfError(err));
};

exports.checkPythonVersion = () => {
  const p = new Promise();
  pythonChecker((err) => {
    if (err) return p.reject(err);
    p.resolve();
  });
  return p;
};

exports.checkNpmAndNodejsVersions = (opts) => {
  const p = new Promise();
  const expectNodeVersion = opts.nodejs_version;
  const expectNpmVersion = opts.npm_version;
  const args = ['version', '--json', '--loglevel', 'error'];
  run('npm', args, {env: process.env}, (err, stdout) => {
    if (err) return p.reject(err);

    const versions = JSON.parse(stdout);

    /**
     * TODO (imlucas) Improve language and provide links to fix issues.
     */
    if (!semver.satisfies(versions.node, expectNodeVersion)) {
      p.reject(new Error(`Your current node.js (v${versions.node}) ` +
        `does not satisfy the version required by this project (v%s).`));
    } else if (!semver.satisfies(versions.npm, expectNpmVersion)) {
      p.reject(new Error(`Your current npm (v${versions.npm}) ` +
        `does not meet the requirement ${expectNpmVersion}.`));
    }

    p.resolve(versions);
  });
  return p;
};
