var semver = require('semver');
var async = require('async');
var _ = require('lodash');
var format = require('util').format;

var debug = require('debug')('app-migrations');

function migrate(migrations) {
  return function(previousVersion, currentVersion, done) {
    var tasks;
    if (semver.lt(previousVersion, currentVersion)) {
      // pick migration tasks for upgrade
      debug('upgrading from version', previousVersion, 'to version', currentVersion);
      tasks = _.pickBy(migrations, function(fn, version) {
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
      tasks = _.pickBy(migrations, function(fn, version) {
        return semver.gt(version, currentVersion) &&
               semver.lte(version, previousVersion);
      });
      if (_.keys(tasks).length > 0) {
        // schema incompatible, return error
        return done(new Error(format('Downgrade from version %s to %s'
          + ' not possible.', previousVersion, currentVersion)));
      }
    }
    done(null, {});
  };
}

/**
 *
 * @api public
 */
module.exports = migrate;
