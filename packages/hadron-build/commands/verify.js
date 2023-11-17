/**
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js or npm?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */

const semver = require('semver');
const cli = require('mongodb-js-cli')('hadron-build:verify');
const { promisify } = require('util');
const run = require('./../lib/run');
const runAsync = promisify(run);

exports.command = 'verify [options]';
exports.describe = 'Verify the current environment meets the app\'s requirements.';

exports.builder = {
  nodejs_version: {
    describe: 'What version of node.js is required for this app?',
    default: '^7.4.0'
  },
  npm_version: {
    describe: 'What version of npm is required for this app?',
    default: '^4.0.0'
  }
};

exports.tasks = (argv) => {
  return exports.checkNpmAndNodejsVersions(argv);
};

exports.handler = (argv) => {
  exports.tasks(argv).catch((err) => cli.abortIfError(err));
};

exports.checkNpmAndNodejsVersions = async(opts) => {
  const expectNodeVersion = opts.nodejs_version;
  const expectNpmVersion = opts.npm_version;
  const args = ['version', '--json', '--loglevel', 'error'];
  const stdout = await runAsync('npm', args, {env: process.env});
  const versions = JSON.parse(stdout);

  if (!semver.satisfies(versions.node, expectNodeVersion)) {
    return new Error(`Your current node.js (v${versions.node}) ` +
      `does not satisfy the version required by this project (v${expectNodeVersion}).`);
  } else if (!semver.satisfies(versions.npm, expectNpmVersion)) {
    return new Error(`Your current npm (v${versions.npm}) ` +
      `does not meet the requirement ${expectNpmVersion}.`);
  }

  return versions;
};
