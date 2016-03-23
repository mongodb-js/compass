#!/usr/bin/env node

/**
 * @see [Atom's spec-task.coffee](https://git.io/vaZIu)
 */

var cli = require('mongodb-js-cli')('mongodb-compass:scripts:test');
cli.yargs.usage('$0 [options]')
  .option('unit', {
    description: 'Only run the unit tests',
    default: false
  })
  .option('functional', {
    description: 'Only run the spectron functional tests',
    default: false
  })
  .option('release', {
    description: 'Test against the release build created by prepublish',
    default: false
  })
  .option('verbose', {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  })
  .help('help');

if (cli.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

var path = require('path');
var spawn = require('child_process').spawn;
var which = require('which');
var _ = require('lodash');
var fs = require('fs-extra');

var args = [
  /**
   * TODO (imlucas) Using `--renderer` doesn't work
   * properly on Windows (process never exits, EPERM
   * cleaning up electron's resources dir).  Needs
   * further investigation.
   * '--renderer'
   */
];

if (cli.argv.unit) {
  args.push.apply(args, ['--invert', '--grep', 'spectron']);
} else if (cli.argv.functional) {
  args.push.apply(args, ['--grep', 'spectron']);
}

if (!cli.argv.release) {
  process.env.TEST_WITH_PREBUILT = '1';
}

if (process.env.EVERGREEN) {
  args.push.apply(args, ['--reporter', 'mocha-evergreen-reporter']);
}

// pass all additional args to electron-mocha (e.g. --grep, positional arguments, etc.)
var otherOpts = _.filter(_.flatten(_.pairs(_.mapKeys(_.omit(cli.argv, 'unit',
  'functional', 'release', 'verbose', '$0', 'help', '_'), function(v, k) {
  return k.length === 1 ? '-' + k : '--' + k;
}))), function(el) {
  return !_.isBoolean(el);
});
args.push.apply(args, otherOpts);
args.push.apply(args, cli.argv._);

var opts = {
  env: process.env,
  cwd: path.join(__dirname, '..')
};

which('electron-mocha', function(err, bin) {
  fs.remove(path.resolve(__dirname, '..', '.user-data'), function() {
    cli.debug('Removed .user-data directory');
    cli.abortIfError(err);
    cli.debug('Using electron-mocha: ', bin);

    var proc = spawn(bin, args, opts);
    proc.stderr.pipe(process.stderr);
    proc.stdout.pipe(process.stdout);
    process.stdin.pipe(proc.stdin);

    proc.on('exit', function(code) {
      process.exit(code);
    });
  });
});
