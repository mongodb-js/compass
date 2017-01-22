'use strict';
/* eslint no-console: 0 */

/**
 * @see [Atom's spec-task.coffee](https://git.io/vaZIu)
 */
const path = require('path');
const spawn = require('child_process').spawn;
const which = require('which');
const _ = require('lodash');
const async = require('async');
const fs = require('fs-extra');

const ELECTRON_MOCHA = which.sync('electron-mocha');
const TEST_SUITES = ['unit', 'enzyme', 'packages', 'main', 'renderer', 'functional'];

// const debug = require('debug')('hadron-build:test');

exports.command = 'test [options]';

exports.describe = 'Run app tests.';

exports.builder = {
  unit: {
    description: 'Run the unit tests.',
    default: false
  },
  enzyme: {
    description: 'Run enzyme tests for React components.',
    default: false
  },
  packages: {
    description: 'Run the individual internal-packages tests',
    default: false
  },
  main: {
    description: 'Run tests in the electron main process.',
    default: false
  },
  renderer: {
    description: 'Run tests in an electron renderer process.',
    default: false
  },
  functional: {
    description: 'Run the functional tests launching the app.',
    default: false
  },
  release: {
    description: 'Test using release assets',
    default: false
  }
};

// any extra arguments that certain suites require
const extraSuiteArgs = {
  renderer: ['--renderer'],
  packages: ['--recursive']
};

exports.getMochaArgs = (argv) => {
  const args = [];

  // for evergreen tests, switch to evergreen reporter
  if (process.env.EVERGREEN) {
    args.push.apply(args, ['--reporter', 'mocha-evergreen-reporter']);
  }

  const omitKeys = _.flatten([
    '$0',
    '_',
    'help',
    'debug',
    'recursive',
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
  return _.concat(args, argvPairs);
};

exports.getSpawnJobs = (argv) => {
  const spawnJobs = {};
  _.each(TEST_SUITES, (suite) => {
    // suite path and special handling of packages
    const suitePath = suite === 'packages' ? './src/internal-packages' : `./test/${suite}`;
    const mochaArgs = exports.getMochaArgs(argv);
    // add any extra arguments for suites, like e.g. --renderer
    if (_.get(extraSuiteArgs, suite)) {
      mochaArgs.push.apply(mochaArgs, extraSuiteArgs[suite]);
    }
    // add the path to test
    mochaArgs.push(suitePath);
    if (argv[suite]) {
      try {
        fs.accessSync(suitePath);
        spawnJobs[suite] = mochaArgs;
      } catch (e) {
        // do nothing if suite does not exist
      }
    }
  });
  return spawnJobs;
};

exports.handler = (argv) => {
  if (!argv.release) {
    process.env.TEST_WITH_PREBUILT = '1';
  }

  /* Force the NODE_ENV to be testing */
  process.env.NODE_ENV = 'testing';

  // avoid `kq_init: detected broken kqueue;` errors on MacOS Sierra,
  // @see https://github.com/tmux/tmux/issues/475
  if (process.platform === 'darwin') {
    process.env.EVENT_NOKQUEUE = '1';
  }

  // if no individual suites are selected, run all of them except `packages`
  if (!_.some(_.map(TEST_SUITES, (suite) => argv[suite]))) {
    _.each(TEST_SUITES, (suite) => {
      if (suite === 'packages') {
        return;
      }
      argv[suite] = true;
    });
  }

  /* eslint no-sync: 0 */
  fs.removeSync(path.resolve(process.cwd(), '.user-data'));
  /* eslint no-sync: 0 */
  fs.removeSync(path.resolve(process.cwd(), '.compiled-sources'));

  // run the requested test suites in correct order in individual processes
  const spawnJobs = _.mapValues(exports.getSpawnJobs(argv), (args, suite) => {
    return (cb) => {
      console.log(`Running ${suite} tests.`);
      const proc = spawn(ELECTRON_MOCHA, args, {
        env: process.env,
        cwd: process.cwd
      });
      proc.stderr.pipe(process.stderr);
      proc.stdout.pipe(process.stdout);
      process.stdin.pipe(proc.stdin);
      proc.on('exit', cb);
    };
  });

  if (_.isEmpty(spawnJobs)) {
    // if no individual suites are selected and no paths present, only run
    // a single test without specific paths. This is (electron-)mocha's
    // default behavior, we do not want to change that.
    const mochaArgs = exports.getMochaArgs(argv);
    const proc = spawn(ELECTRON_MOCHA, mochaArgs, {
      env: process.env,
      cwd: process.cwd
    });
    proc.stderr.pipe(process.stderr);
    proc.stdout.pipe(process.stdout);
    process.stdin.pipe(proc.stdin);
    proc.on('exit', process.exit);
  } else {
    return async.series(spawnJobs, (err) => {
      if (err) {
        process.exit(1);
      }
      process.exit(0);
    });
  }
};
