var async = require('async');
var fs = require('fs-extra');
var createCLI = require('mongodb-js-cli');
var config = require('./config');
var path = require('path');
var glob = require('glob');
var _ = require('lodash');
var CompileCache = require('hadron-compile-cache');

var cli = createCLI('mongodb-compass:scripts:compile-cache');

function cleanCompileCache(CONFIG, done) {
  fs.remove(path.resolve(CONFIG.dir, '.compiled-sources'), function() {
    done();
  });
}

function createCompileCache(CONFIG, done) {
  CompileCache.setHomeDirectory(CONFIG.dir);
  glob('src/**/*.{jade,jsx}', function(error, files) {
    cli.abortIfError(error);
    _.each(files, function(file) {
      var compiler = CompileCache.COMPILERS[path.extname(file)];
      CompileCache.compileFileAtPath(compiler, file);
    });
    done();
  });
}

function main() {
  config.get(cli, function(err, CONFIG) {
    cli.abortIfError(err);
    var tasks = [
      cleanCompileCache,
      createCompileCache
    ].map(function(task) {
      return _.partial(task, CONFIG);
    });

    async.series(tasks, function(_err) {
      cli.abortIfError(_err);
      cli.ok('compile cache successfully built');
    });
  });
}

/**
 * ## Main
 */
if (cli.argv.$0 && cli.argv.$0.indexOf('compile-cache.js') === -1) {
  module.exports = exports;
} else {
  main();
}

module.exports.cleanCompileCache = cleanCompileCache;
module.exports.createCompileCache = createCompileCache;
