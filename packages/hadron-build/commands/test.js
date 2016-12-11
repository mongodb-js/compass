'use strict';
/**
 * @see [Atom's spec-task.coffee](https://git.io/vaZIu)
 */
const path = require('path');
const spawn = require('child_process').spawn;
const which = require('which');
const _ = require('lodash');
const fs = require('fs-extra');

exports.command = 'test [options]';

exports.describe = 'Run app tests.';

exports.builder = {
  unit: {
    description: 'Only run the unit tests',
    default: false
  },
  functional: {
    description: 'Only run the functional tests',
    default: false
  },
  release: {
    description: 'Test using release assets',
    default: false
  },
  packages: {
    description: 'Only run the package tests',
    default: false
  }
};

exports.getMochaArgs = (argv) => {
  const args = [
    /**
     * TODO (imlucas) Using `--renderer` doesn't work
     * properly on Windows (process never exits, EPERM
     * cleaning up electron's resources dir).  Needs
     * further investigation.
     * '--renderer'
     */
  ];

  if (argv.unit) {
    args.push.apply(args, ['--invert', '--grep', 'spectron']);
  } else if (argv.functional) {
    args.push.apply(args, ['--grep', 'spectron']);
  } else if (argv.packages) {
    args.push.apply(args, ['--recursive']);
  }

  if (process.env.EVERGREEN) {
    args.push.apply(args, ['--reporter', 'mocha-evergreen-reporter']);
  }

  if (argv.packages) {
    args.push.apply(args, ['./src/internal-packages']);
  }

  const omitKeys = _.flatten([
    '$0',
    '_',
    'help',
    'debug',
    _.keys(exports.builder)
  ]);

  const argvPairs = _.chain(argv)
    .omit(omitKeys)
    .toPairs()
    .map(function(arg) {
      const dashes = arg[0].length === 1 ? '-' : '--';
      const updated = [];
      updated[0] = `${dashes}${arg[0]}`;

      if (!_.isBoolean(arg[1])) {
        updated[1] = arg[1];
      }
      return updated;
    })
    .flatten()
    .value();

  // pass all additional args to electron-mocha
  // (e.g. --grep, positional arguments, etc.)
  return _.concat(argvPairs, args);
}

exports.handler = (argv) => {
  if (!argv.release) {
    process.env.TEST_WITH_PREBUILT = '1';
  }

  /* Force the NODE_ENV to be testing */
  process.env.NODE_ENV = 'testing';

  /* eslint no-sync: 0 */
  fs.removeSync(path.resolve(process.cwd(), '.user-data'));
  /* eslint no-sync: 0 */
  fs.removeSync(path.resolve(process.cwd(), '.compiled-sources'));

  const ELECTRON_MOCHA = which.sync('electron-mocha');
  const proc = spawn(ELECTRON_MOCHA, exports.getMochaArgs(argv), {
    env: process.env,
    cwd: process.cwd
  });

  proc.stderr.pipe(process.stderr);
  proc.stdout.pipe(process.stdout);
  process.stdin.pipe(proc.stdin);
  proc.on('exit', process.exit);
};
