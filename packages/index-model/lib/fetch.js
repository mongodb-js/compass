/**
 * pass in a a driver database handle and get index details back.
 * @param  {Mongo.db}   db     database handle from the node driver
 * @param  {Function} done     callback
 */

var _ = require('lodash');
var async = require('async');
var mongodbNS = require('mongodb-ns');
var isNotAuthorizedError = require('mongodb-js-errors').isNotAuthorized;

// var debug = require('debug')('mongodb-index-model:fetch');

/**
 * helper function to attach objects to the async.auto task structure.
 * @param  {any}   anything  pass in any variable to attach it to the name
 * @param  {Function} done   callback function.
 */
function attach(anything, done) {
  done(null, anything);
}

/**
 * get basic index information via `db.collection.indexes()`
 * @param  {Function} done       callback
 * @param  {object}   results    results from async.auto
 */
function getIndexes(done, results) {
  var db = results.db;
  var ns = mongodbNS(results.namespace);
  db.db(ns.database).collection(ns.collection).indexes(function(err, indexes) {
    if (err) {
      done(err);
    }
    // add ns field to each index
    _.each(indexes, function(idx) {
      idx.ns = ns.ns;
    });
    done(null, indexes);
  });
}

/**
 * get index statistics via `db.collection.aggregate({$indexStats: {}})`
 * @param  {Function} done       callback
 * @param  {object}   results    results from async.auto
 */
function getIndexStats(done, results) {
  var db = results.db;
  var ns = mongodbNS(results.namespace);
  var pipeline = [
    { $indexStats: { } },
    { $project: { name: 1, usageHost: '$host', usageCount: '$accesses.ops', usageSince: '$accesses.since' } }
  ];
  var collection = db.db(ns.database).collection(ns.collection);
  collection.aggregate(pipeline, function(err, res) {
    if (err) {
      if (isNotAuthorizedError(err)) {
        /**
         * In the 3.2 server, `readWriteAnyDatabase@admin` does not grant sufficient privileges for $indexStats.
         * The `clusterMonitor` role is required to run $indexStats.
         * @see https://jira.mongodb.org/browse/INT-1520
         */
        return done(null, {});
      }

      if (err.message.match(/Unrecognized pipeline stage name/)) {
        // $indexStats not yet supported, return empty document
        return done(null, {});
      }
      done(err);
    }
    res = _.mapKeys(res, function(stat) {
      return stat.name;
    });
    done(null, res);
  });
}

/**
 * get index sizes via `db.collection.stats()` (`indexSizes` field)
 * @param  {Function} done       callback
 * @param  {object}   results    results from async.auto
 */

function getIndexSizes(done, results) {
  var db = results.db;
  var ns = mongodbNS(results.namespace);
  db.db(ns.database).collection(ns.collection).stats(function(err, res) {
    if (err) {
      done(err);
    }
    res = _.mapValues(res.indexSizes, function(size) {
      return {size: size};
    });
    done(null, res);
  });
}

/**
 * merge all information together for each index
 * @param  {Function} done       callback
 * @param  {object}   results    results from async.auto
 */
function combineStatsAndIndexes(done, results) {
  var indexes = results.getIndexes;
  var stats = results.getIndexStats;
  var sizes = results.getIndexSizes;
  _.each(indexes, function(idx, i) {
    _.assign(indexes[i], stats[idx.name]);
    _.assign(indexes[i], sizes[idx.name]);
  });
  done(null, indexes);
}

/**
 * get basic index information via `db.collection.indexes()`
 * @param  {MongoClient} db      db handle from mongodb driver
 * @param  {String} namespace    namespace for which to get indexes
 * @param  {Function} done       callback
 */
function getIndexDetails(db, namespace, done) {
  var tasks = {
    db: attach.bind(null, db),
    namespace: attach.bind(null, namespace),
    getIndexes: ['db', 'namespace', getIndexes],
    getIndexStats: ['db', 'namespace', getIndexStats],
    getIndexSizes: ['db', 'namespace', getIndexSizes],
    indexes: ['getIndexes', 'getIndexStats', 'getIndexSizes', combineStatsAndIndexes]
  };

  async.auto(tasks, function(err, results) {
    if (err) {
      // report error
      return done(err);
    }
    // all info was collected in indexes
    return done(null, results.indexes);
  });
}


module.exports = getIndexDetails;
