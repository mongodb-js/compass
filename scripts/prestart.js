#!/usr/bin/env node

/**
 * ## prestart
 *
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js or npm?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */

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
  process.env.DEBUG = '*';
}

var argv = cli.argv;
var semver = require('semver');
var format = require('util').format;
var run = require('electron-installer-run');

cli.spinner('verifying current environment meets requirements');
run('npm', ['version', '--json', '--loglevel', 'error'], {env: process.env}, function(err, stdout) {
  cli.abortIfError(err);

  var versions = JSON.parse(stdout);
  /**
   * TODO (imlucas) Improve language and provide links to fix issues.
   */
  if (!semver.satisfies(versions.node, argv.nodejs_version)) {
    var nodeMessage = format('Your current nodejs (v%s) does not meet the requirement `%s`.',
      versions.node, argv.nodejs_version);
    cli.abort(nodeMessage);
  } else {
    cli.ok(format('Your installed version of nodejs (v%s) meets the requirement `%s`.',
      versions.node, argv.nodejs_version));
  }

  if (!semver.satisfies(versions.npm, argv.npm_version)) {
    var npmMessage = format('Your current npm (v%s) does not meet the requirement `%s`.',
      versions.npm, argv.npm_version);
    cli.abort(npmMessage);
  } else {
    cli.ok(format('Your installed version of npm (v%s) meets the requirement.',
      versions.npm, argv.npm_version));
  }

  /**
   * TODO (imlucas) Also check Python requirements like atom team does.
   * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
   */
  cli.ok('Environment verified as sane!');
});
