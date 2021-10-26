const semver = require('semver');
const async = require('async');
const _ = require('lodash');
const format = require('util').format;
const { log, mongoLogId } = require('@mongodb-js/compass-logging').createLoggerAndTelemetry(
  'COMPASS-MIGRATIONS'
);

function migrate(migrations) {
  return function(previousVersion, currentVersion, done) {
    var tasks;
    if (semver.lt(previousVersion, currentVersion)) {
      // pick migration tasks for upgrade
      tasks = _.pickBy(migrations, function(fn, version) {
        return semver.gt(version, previousVersion) &&
               semver.lte(version, currentVersion);
      });
      tasks = _.mapValues(tasks, function(fn) {
        return fn.bind(null, previousVersion, currentVersion);
      });
      log.info(mongoLogId(1001000070), 'Migrations', 'Considering upgrade migration', {
        previousVersion,
        currentVersion,
        tasks: _.keys(tasks)
      });
      return async.series(tasks, done);
    }
    if (semver.gt(previousVersion, currentVersion)) {
      // check if the downgrade is compatible with the schema
      tasks = _.pickBy(migrations, function(fn, version) {
        return semver.gt(version, currentVersion) &&
               semver.lte(version, previousVersion);
      });
      const downgradePossible = _.keys(tasks).length > 0;
      log.info(mongoLogId(1001000071), 'Migrations', 'Encountered version downgrade', {
        previousVersion,
        currentVersion,
        downgradePossible
      });
      if (downgradePossible) {
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
