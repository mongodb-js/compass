/**
 * pass in a a driver database handle and get index details back.
 * @param  {Mongo.db}   db     database handle from the node driver
 * @param  {Function} done     callback
 */

var _ = require('lodash');
var async = require('async');
var mongodbNS = require('mongodb-ns');
var callbackify = require('util').callbackify;
var isNotAuthorizedError = require('mongodb-js-errors').isNotAuthorized;

var debug = require('debug')('mongodb-index-model:fetch');

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
 * @param  {object}   results    results from async.auto
 * @param  {Function} done       callback
 */
function getIndexes(results, done) {
  var client = results.client;
  var ns = mongodbNS(results.namespace);
  var coll = client
    .db(ns.database)
    .collection(ns.collection);
  callbackify(coll.indexes.bind(coll))(function(err, indexes) {
    if (err) {
      debug('getIndexes failed!', err);
      done(err);
      return;
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
 * @param  {object}   results    results from async.auto
 * @param  {Function} done       callback
 */
function getIndexStats(results, done) {
  var client = results.client;
  var ns = mongodbNS(results.namespace);
  var pipeline = [
    { $indexStats: {} },
    {
      $project: {
        name: 1,
        usageHost: '$host',
        usageCount: '$accesses.ops',
        usageSince: '$accesses.since'
      }
    }
  ];
  debug('Getting $indexStats for %s', results.namespace);
  var collection = client.db(ns.database).collection(ns.collection);
  var cursor = collection.aggregate(pipeline, { cursor: {} });
  callbackify(cursor.toArray.bind(cursor))(function(err, res) {
    if (err) {
      if (isNotAuthorizedError(err)) {
        debug('Not authorized to get index stats', err);
        /**
         * In the 3.2 server, `readWriteAnyDatabase@admin` does not grant sufficient privileges for $indexStats.
         * The `clusterMonitor` role is required to run $indexStats.
         * @see https://jira.mongodb.org/browse/INT-1520
         */
        return done(null, {});
      }

      if (err.message.match(/Unrecognized pipeline stage name/)) {
        debug('$indexStats not yet supported, return empty document', err);
        return done(null, {});
      }
      debug('Unknown error while getting index stats!', err);
      return done(err);
    }
    res = _.mapKeys(res, function(stat) {
      return stat.name;
    });
    done(null, res);
  });
}

/**
 * get index sizes via `db.collection.stats()` (`indexSizes` field)
 * @param  {object}   results    results from async.auto
 * @param  {Function} done       callback
 */

function getIndexSizes(results, done) {
  var client = results.client;
  var ns = mongodbNS(results.namespace);
  debug('Getting index sizes for %s', results.namespace);
  var coll = client
    .db(ns.database)
    .collection(ns.collection);
  callbackify(coll.stats.bind(coll))(function(err, res) {
    if (err) {
      if (isNotAuthorizedError(err)) {
        debug(
          'Not authorized to get collection stats.  Returning default for indexSizes {}.'
        );
        return done(null, {});
      }
      debug('Error getting index sizes for %s', results.namespace, err);
      return done(err);
    }

    res = _.mapValues(res.indexSizes, function(size) {
      return { size: size };
    });
    debug('Got index sizes for %s', results.namespace, res);
    done(null, res);
  });
}

/**
 * merge all information together for each index
 * @param  {object}   results    results from async.auto
 * @param  {Function} done       callback
 */
function combineStatsAndIndexes(results, done) {
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
 * @param  {MongoClient} client      handle from mongodb driver
 * @param  {String} namespace    namespace for which to get indexes
 * @param  {Function} done       callback
 */
function getIndexDetails(client, namespace, done) {
  var tasks = {
    client: attach.bind(null, client),
    namespace: attach.bind(null, namespace),
    getIndexes: ['client', 'namespace', getIndexes],
    getIndexStats: ['client', 'namespace', getIndexStats],
    getIndexSizes: ['client', 'namespace', getIndexSizes],
    indexes: [
      'getIndexes',
      'getIndexStats',
      'getIndexSizes',
      combineStatsAndIndexes
    ]
  };
  debug('Getting index details for namespace %s', namespace);
  async.auto(tasks, function(err, results) {
    if (err) {
      debug('Failed to get index details for namespace %s', namespace, err);
      return done(err);
    }
    debug('Index details for namespace %s', namespace, results.indexes);
    // all info was collected in indexes
    return done(null, results.indexes);
  });
}

module.exports = getIndexDetails;
