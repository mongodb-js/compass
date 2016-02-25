var semver = require('semver');
var async = require('async');
var _ = require('lodash');
var pkg = require('../../package.json');
var format = require('util').format;
var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');

var debug = require('debug')('mongodb-compass:migrations:index');

function getPreviousVersion(done) {
  var MiniPrefModel = Model.extend(storageMixin, {
    extraProperties: 'ignore',
    idAttribute: 'id',
    namespace: 'Preferences',
    storage: {
      backend: 'local',
      appName: pkg.product_name
    },
    props: {
      id: ['string', true, 'General'],
      lastKnownVersion: ['string', false, '']
    }
  });

  var miniPrefs = new MiniPrefModel();
  miniPrefs.once('sync', function(ret) {
    done(null, ret.lastKnownVersion || '0.0.0');
  });
  miniPrefs.fetch();
}

function migrate(done) {
  var tasks;
  getPreviousVersion(function(err, previousVersion) {
    if (err) {
      done(err);
    }
    // strip any prerelease parts off
    var currentVersion = pkg.version.split('-')[0];
    if (semver.lt(previousVersion, currentVersion)) {
      // pick migration tasks for upgrade
      debug('upgrading schema from version', previousVersion, 'to version', currentVersion);
      tasks = _.pick(module.exports.migrations, function(fn, version) {
        return semver.gt(version, previousVersion) &&
               semver.lte(version, currentVersion);
      });
      tasks = _.mapValues(tasks, function(fn) {
        return fn.bind(null, previousVersion, currentVersion);
      });
      debug('executing migration steps for versions %j', _.keys(tasks));
      return async.series(tasks, done);
    }
    if (semver.gt(previousVersion, currentVersion)) {
      // check if the downgrade is compatible with the schema
      tasks = _.pick(module.exports.migrations, function(fn, version) {
        return semver.gt(version, currentVersion) &&
               semver.lte(version, previousVersion);
      });
      if (_.keys(tasks).length > 0) {
        // schema incompatible, return error
        return done(new Error(format('Downgrade from version %s to %s'
          + ' not possible due to schema incompatibilities.', previousVersion,
          currentVersion)));
      }
    }
    done(null, {});
  });
}

module.exports = migrate;
module.exports.migrations = {
  '1.1.2': require('./1.1.2')
};
