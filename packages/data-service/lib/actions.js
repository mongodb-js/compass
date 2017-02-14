'use strict';

const Reflux = require('reflux');

/**
 * The actions that are handled by the data service.
 */
const Actions = Reflux.createActions([
  'aggregate',
  'aggregateComplete',
  'connect',
  'connectComplete',
  'count',
  'countComplete',
  'createCollection',
  'createCollectionComplete',
  'createIndex',
  'createIndexComplete',
  'currentOp',
  'currentOpComplete',
  'deleteMany',
  'deleteManyComplete',
  'deleteOne',
  'deleteOneComplete',
  'dropCollection',
  'dropCollectionComplete',
  'dropDatabase',
  'dropDatabaseComplete',
  'dropIndex',
  'dropIndexComplete',
  'explain',
  'explainComplete',
  'find',
  'findComplete',
  'findOneAndReplace',
  'findOneAndReplaceComplete',
  'getCollection',
  'getCollectionComplete',
  'getDatabase',
  'getDatabaseComplete',
  'getInstance',
  'getInstanceComplete',
  'insertMany',
  'insertManyComplete',
  'insertOne',
  'insertOneComplete',
  'listCollections',
  'listCollectionsComplete',
  'listIndexes',
  'listIndexesComplete',
  'serverStats',
  'serverStatsComplete',
  'top',
  'topComplete',
  'updateCollection',
  'updateCollectionComplete',
  'updateMany',
  'updateManyComplete',
  'updateOne',
  'updateOneComplete'
]);

module.exports = Actions;
