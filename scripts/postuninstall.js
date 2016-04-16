#!/usr/bin/env node

/**
 * @see [Atom's clean-task.coffee](https://git.io/vaZLw)
 */

var cli = require('mongodb-js-cli')('mongodb-compass:scripts:postuninstall');
cli.yargs.usage('$0 [options]')
  .option('verbose', {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  })
  .help('help')
  .epilogue('a.k.a `make clean`');

if (cli.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

var del = require('del');
var async = require('async');
var path = require('path');

var COMPILED_LESS = path.join('src', 'app', 'compiled-less');
var COMPILE_CACHE = path.join('.compiled-sources');
var USER_DATA = path.join('.user-data');

cli.spinner('Removing build artifacts');
async.parallel(['dist/', 'node_modules/', COMPILED_LESS, COMPILE_CACHE, USER_DATA].map(function(p) {
  return function(cb) {
    del(path.join(__dirname, '..', p)).then(cb.bind(null, null));
  };
}), function(err) {
  cli.abortIfError(err);
  cli.ok('Build artifacts removed');
});
