#!/usr/bin/env node

var electronVersionOption = require('./config').options.electron_version;

var cli = require('mongodb-js-cli')('mongodb-compass:scripts:postinstall');
cli.yargs.usage('$0 [options]')
  .option('electron_version', electronVersionOption)
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

if (process.env.EVERGREEN) {
  cli.info('enabling debug on evergreen for ' +
    'https://jira.mongodb.org/browse/INT-1229');
  require('debug').enable('ele*,mon*');
}

var argv = cli.argv;
var run = require('electron-installer-run');

/**
 * @see https://github.com/atom/electron/blob/master/docs/tutorial/using-native-node-modules.md#the-npm-way
 */
process.env.npm_config_disturl = 'https://atom.io/download/atom-shell';
process.env.npm_config_target = argv.electron_version;
process.env.npm_config_runtime = 'electron';
process.env.HOME = '~/.electron-gyp';

if (process.platform === 'win32') {
  cli.info('Rebuilding native addons for Windows');
  run('npm', ['rebuild'], {env: process.env}, function(err) {
    cli.abortIfError(err);
    process.exit(0);
  });
}
