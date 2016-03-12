#!/usr/bin/env node

var electron_version = require('./config').options.electron_version;

var cli = require('mongodb-js-cli')('mongodb-compass:scripts:postinstall');
cli.yargs.usage('$0 [options]')
  .option('electron_version', electron_version)
  .option('verbose', {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  })
  .help('help')
  .epilogue('a.k.a. `make clean`');

if (cli.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

var argv = cli.argv;
var which = require('which');
var run = require('electron-installer-run');
var path = require('path');

/**
 * @see https://github.com/atom/electron/blob/master/docs/tutorial/using-native-node-modules.md#the-npm-way
 */
process.env.npm_config_disturl = 'https://atom.io/download/atom-shell';
process.env.npm_config_target = argv.electron_version;
process.env.npm_config_runtime = 'electron';
process.env.HOME = '~/.electron-gyp';

if (process.platform === 'win32') {
  cli.spinner('Rebuilding native addons for Windows');
  run('npm', ['rebuild'], {env: process.env}, function(err) {
    cli.abortIfError(err);
    process.exit(0);
  });
}

/**
 * TODO (imlucas) switch to using `electron-rebuild` as a module for more
 * fine grained control of conditions which require an actual rebuild
 * of native add-ons.  The current CLI implementation seems too greedy/eager
 * to rebuild all native add-ons and takes a long time.
 */
var args = [
  '--version',
  argv.electron_version,
  '--node-module-version',
  argv.electron_abi_version,
  '--module-dir',
  path.join(__dirname, '..', 'node_modules'),
  /**
   * @see https://github.com/electronjs/electron-rebuild#node-pre-gyp-workaround
   */
  '--pre-gyp-fix'
];

cli.spinner('Rebuilding native modules if needed');
run('electron-rebuild', args, {
  env: process.env
}, function(err) {
  cli.abortIfError(err);
  cli.ok('native modules (possibly) rebuilt for correct electron ABI version');
});
