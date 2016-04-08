'use strict';

/**
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js, npm or Python?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */
const async = require('async');
const semver = require('semver');
const format = require('util').format;
const run = require('electron-installer-run');
const abortIfError = require('../lib/abort-if-error');
const debug = require('debug')('hadron-build:commands:verify');

exports.builder = {
  nodejs_version: {
    describe: 'What version of node.js is required for this app?',
    default: process.env.npm_package_engines_node
  },
  npm_version: {
    describe: 'What version of npm is required for this app?',
    default: process.env.npm_package_engines_npm
  }
};

exports.tasks = function(argv) {
  return [
    exports.checkPythonVersion.bind(null, argv),
    exports.checkNpmAndNodejsVersions.bind(null, argv)
  ];
};

exports.handler = function(argv) {
  async.series(exports.tasks(argv), function(err) {
    abortIfError(err);
  });
};

exports.checkPythonVersion = require('check-python');

exports.checkNpmAndNodejsVersions = function(opts, done) {
  run('npm', ['version', '--json', '--loglevel', 'error'], {
    env: process.env
  }, function(err, stdout) {
    if (err) {
      return done(err);
    }

    var versions = JSON.parse(stdout);
    /**
     * TODO (imlucas) Improve language and provide links to fix issues.
     */
    if (!semver.satisfies(versions.node, opts.nodejs_version)) {
      return done(new Error(format(
        'Your current node.js (v%s) does not satisfy the version required by this project (v%s).',
        versions.node, opts.nodejs_version
      )));
    }

    debug(format(
      'Your installed version of node.js (v%s) satisfies the version required by this project (v%s).',
      versions.node, opts.nodejs_version));

    if (!semver.satisfies(versions.npm, opts.npm_version)) {
      return done(new Error(format(
        'Your current npm (v%s) does not meet the requirement `%s`.',
        versions.npm, opts.npm_version)));
    }

    debug(format(
      'Your installed version of npm (v%s) meets the requirement.',
      versions.npm, opts.npm_version));
    done(null, versions);
  });
};
