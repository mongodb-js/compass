/* eslint no-console:0 */
var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var fs = require('fs');
var chalk = require('chalk');
var figures = require('figures');
var packager = require('electron-packager');
var debug = require('debug')('scout:tasks:linux');

var APP_PATH = path.resolve(__dirname, '../dist/MongoDBCompass-linux-x64');
module.exports.ELECTRON = path.join(APP_PATH, 'MongoDBCompass');
module.exports.RESOURCES = path.join(APP_PATH, 'resources');

var PACKAGER_CONFIG = {
  name: 'MongoDBCompass',
  dir: path.resolve(__dirname, '../build'),
  out: path.resolve(__dirname, '../dist'),
  platform: 'linux',
  arch: 'x64',
  version: pkg.electron_version,
  overwrite: true,
  prune: true
};

module.exports.build = function(done) {
  fs.exists(APP_PATH, function(exists) {
    if (exists) {
      debug('.app already exists.  skipping packager run.');
      return done(null, false);
    }
    debug('running packager to create electron binaries...');
    packager(PACKAGER_CONFIG, function(err, res) {
      if (err) {
        return done(err);
      }
      debug('Packager result', res);
      done(null, true);
    });
  });
};

module.exports.installer = function(done) {
  console.warn(chalk.red.yellow(figures.warning),
    ' Linux installers coming soon!');
  return done();
};
