#!/usr/bin/env node

/**
 * ## prestart
 *
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js or npm?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */
var pkg = require('../package.json');
var cli = require('mongodb-js-cli')('mongodb-compass:scripts:prestart');
cli.yargs.usage('$0 [options]')
  .option('verbose', {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  })
  .option('nodejs_version', {
    describe: 'What version of nodejs do we require be installed to work on Compass?',
    default: process.env.npm_package_engines_node || pkg.engines.node
  })
  .option('npm_version', {
    describe: 'What version of npm do we require be installed to work on Compass?',
    default: process.env.npm_package_engines_npm || pkg.engines.npm
  })
  .help('help');

if (cli.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

var argv = cli.argv;
var semver = require('semver');
var format = require('util').format;
var run = require('electron-installer-run');
var checkPython = require('check-python');
var async = require('async');

function checkNpmAndNodejs(done) {
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
    if (!semver.satisfies(versions.node, argv.nodejs_version)) {
      return done(new Error(format(
        'Your current nodejs (v%s) does not meet the requirement `%s`.',
        versions.node, argv.nodejs_version
      )));
    }

    cli.debug(format(
      'Your installed version of nodejs (v%s) meets the requirement `%s`.',
      versions.node, argv.nodejs_version));

    if (!semver.satisfies(versions.npm, argv.npm_version)) {
      return done(new Error(format(
        'Your current npm (v%s) does not meet the requirement `%s`.',
        versions.npm, argv.npm_version)));
    }

    cli.debug(format(
      'Your installed version of npm (v%s) meets the requirement.',
      versions.npm, argv.npm_version));
    done(null, versions);
  });
}

function main() {
  cli.spinner('verifying current environment meets requirements');
  async.series([
    checkPython,
    checkNpmAndNodejs
  ], function(err) {
    cli.abortIfError(err);
    cli.debug('Environment verified as sane!');
    process.exit(0);
  });
}

/**
 * ## Main
 */
if (cli.argv.$0 && cli.argv.$0.indexOf('prestart.js') > -1) {
  main();
}
