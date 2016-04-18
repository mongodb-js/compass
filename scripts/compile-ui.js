var async = require('async');
var path = require('path');
var createCLI = require('mongodb-js-cli');
var cli = createCLI('mongodb-compass:scripts:compile-ui');
var LessCache = require('less-cache');
var fs = require('fs');

function generateLessCache(CONFIG, done) {
  var appDir = path.join(__dirname, '..', 'src', 'app');
  var cacheDir = path.join(appDir, 'compiled-less');
  var src = path.join(appDir, 'index.less');

  var callback = done;
  if (typeof CONFIG === 'function') {
    callback = CONFIG;
  }

  var lessCache = new LessCache({ cacheDir: cacheDir, resourcePath: appDir });

  fs.readFile(src, 'utf-8', function(err, contents) {
    if (err) {
      return done(err);
    }
    lessCache.cssForFile(src, contents);
    callback();
  });
}

module.exports.generateLessCache = generateLessCache;

function main() {
  async.series([
    generateLessCache
  ], function(err) {
    cli.abortIfError(err);
    cli.debug('Compiled application UI.');
    process.exit(0);
  });
}

/**
 * ## Main
 */
if (cli.argv.$0 && cli.argv.$0.indexOf('compile-ui.js') > -1) {
  main();
}
