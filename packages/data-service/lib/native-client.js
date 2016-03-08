'use strict';

const _ = require('lodash');
const async = require('async');
const createConnection = require('mongodb-connection-model').connect;
const getInstance = require('mongodb-instance-model').get;
const createSampleStream = require('mongodb-collection-sample');

/**
 * The native client class.
 */
class NativeClient {

  /**
   * Instantiate a new NativeClient object.
   *
   * @constructor
   * @param {Connection} model - The Connection model.
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Connect to the server.
   *
   * @param {function} callback - The callback function.
   */
  connect(callback) {
    createConnection(this.model, (error, database) => {
      this.database = database;
      callback(error, this);
    });
  }

  /**
   * Count the number of documents in the collection for the provided filter
   * and options.
   *
   * @param {string} ns - The namespace to search on.
   * @param {object} filter - The filter.
   * @param {object} options - The query options.
   * @param {function} callback - The callback function.
   */
  count(ns, filter, options, callback) {
    this._collection(ns).count(filter, options, callback);
  }

  /**
   * Get the kitchen sink information about a collection.
   *
   * @param {String} ns - The namespace.
   * @param {Function} callback - The callback.
   */
  collectionDetail(ns, callback) {
    async.parallel({
      stats: this.collectionStats.bind(this, this._databaseName(ns), this._collectionName(ns)),
      indexes: this.indexes.bind(this, ns)
    }, (error, coll) => {
      if (error) {
        return callback(error);
      }
      callback(null, this._buildCollectionDetail(ns, coll));
    });
  }

  /**
   * Get the stats for all collections in the database.
   *
   * @param {String} databaseName - The database name.
   * @param {Function} callback - The callback.
   */
  collections(databaseName, callback) {
    this.collectionNames(databaseName, (error, names) => {
      if (error) {
        return callback(error);
      }
      async.parallel(_.map(names, (name) => {
        return (done) => {
          this.collectionStats(databaseName, name, done);
        };
      }), callback);
    });
  }

  /**
   * Get all the collection names for a database.
   *
   * @param {String} databaseName - The database name.
   * @param {Function} callback - The callback.
   */
  collectionNames(databaseName, callback) {
    var db = this._database(databaseName);
    db.listCollections({}).toArray((error, data) => {
      if (error) {
        return callback(error);
      }
      var names = _.map(data, (collection) => {
        return collection.name;
      });
      callback(null, names);
    });
  }

  /**
   * Get the stats for a collection.
   *
   * @param {String} databaseName - The database name.
   * @param {String} collectionName - The collection name.
   * @param {Function} callback - The callback.
   */
  collectionStats(databaseName, collectionName, callback) {
    var db = this._database(databaseName);
    db.command({ collStats: collectionName, verbose: 1 }, (error, data) => {
      if (error) {
        return callback(error);
      }
      callback(null, this._buildCollectionStats(databaseName, collectionName, data));
    });
  }

  /**
   * Get the kitchen sink information about a database and all its collections.
   *
   * @param {String} name - The database name.
   * @param {Function} callback - The callback.
   */
  databaseDetail(name, callback) {
    async.parallel({
      stats: this.databaseStats.bind(this, name),
      collections: this.collections.bind(this, name)
    }, (error, db) => {
      if (error) {
        return callback(error);
      }
      callback(null, this._buildDatabaseDetail(name, db));
    });
  }

  /**
   * Get the stats for a database.
   *
   * @param {String} name - The database name.
   * @param {Function} callback - The callback.
   */
  databaseStats(name, callback) {
    var db = this._database(name);
    db.command({ dbStats: 1 }, (error, data) => {
      if (error) {
        return callback(error);
      }
      callback(null, this._buildDatabaseStats(data));
    });
  }

  /**
   * Find documents for the provided filter and options on the collection.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The filter.
   * @param {Object} options - The query options.
   * @param {Function} callback - The callback.
   */
  find(ns, filter, options, callback) {
    this._collection(ns).find(filter, options).toArray((error, documents) => {
      if (error) {
        return callback(error);
      }
      callback(null, documents);
    });
  }

  /**
   * Get the indexes for the collection.
   *
   * @param {String} ns - The collection namespace.
   * @param {Function} callback - The callback.
   */
  indexes(ns, callback) {
    var coll = this._collection(ns);
    coll.listIndexes({}).toArray((error, data) => {
      if (error) {
        return callback(error);
      }
      callback(null, data);
    });
  }

  /**
   * Get the current instance details.
   *
   * @param {function} callback - The callback function.
   */
  instance(callback) {
    getInstance(this.database, (error, data) => {
      if (error) {
        return callback(error);
      }
      callback(null, this._buildInstance(data));
    });
  }

  /**
   * Sample documents from the collection.
   *
   * @param {String} ns - The namespace to sample.
   * @param {Object} options - The sampling options.
   *
   * @return {Stream} The sample stream.
   */
  sample(ns, options) {
    var db = this._database(this._databaseName(ns));
    return createSampleStream(db, this._collectionName(ns), options);
  }

  /**
   * Builds the collection detail.
   *
   * @param {String} ns - The namespace.
   * @param {Object} data - The collection stats.
   *
   * @returns {Object} The collection detail.
   */
  _buildCollectionDetail(ns, data) {
    return _.assignIn(data.stats, {
      _id: ns,
      name: this._collectionName(ns),
      database: this._databaseName(ns),
      indexes: data.indexes
    });
  }

  /**
   * @todo: Durran: User JS style for keys, make builder.
   *
   * @param {String} databaseName - The name of the database.
   * @param {String} collectionName - The name of the collection.
   * @param {Object} data - The result of the collStats command.
   *
   * @return {Object} The collection stats.
   */
  _buildCollectionStats(databaseName, collectionName, data) {
    return {
      ns: databaseName + '.' + collectionName,
      name: collectionName,
      database: databaseName,
      is_capped: data.capped,
      max: data.max,
      is_power_of_two: data.userFlags === 1,
      index_sizes: data.indexSizes,
      document_count: data.count,
      document_size: data.size,
      storage_size: data.storageSize,
      index_count: data.nindexes,
      index_size: data.totalIndexSize,
      padding_factor: data.paddingFactor,
      extent_count: data.numExtents,
      extent_last_size: data.lastExtentSize,
      flags_user: data.userFlags,
      flags_system: data.systemFlags,
      max_document_size: data.maxSize,
      size: data.size,
      index_details: data.indexDetails || {},
      wired_tiger: data.wiredTiger || {}
    };
  }

  /**
   * Builds the database detail.
   *
   * @param {String} name - The database name.
   * @param {Object} db - The database statistics.
   *
   * @returns {Object} The database detail.
   */
  _buildDatabaseDetail(name, db) {
    return {
      _id: name,
      name: name,
      stats: db.stats,
      collections: db.collections
    };
  }

  /**
   * @todo: Durran: User JS style for keys, make builder.
   *
   * @param {Object} data - The result of the dbStats command.
   *
   * @return {Object} The database stats.
   */
  _buildDatabaseStats(data) {
    return {
      document_count: data.objects,
      document_size: data.dataSize,
      storage_size: data.storageSize,
      index_count: data.indexes,
      index_size: data.indexSize,
      extent_count: data.numExtents,
      file_size: data.fileSize,
      ns_size: data.nsSizeMB * 1024 * 1024
    };
  }

  /**
   * Build the instance detail.
   *
   * @param {Object} data The data.
   *
   * @returns {Object} The instance detail.
   */
  _buildInstance(data) {
    var splitHost = data._id.split(':');
    return _.assignIn(data, {
      hostname: splitHost[0],
      port: parseInt(splitHost[1], 10)
    });
  }

  /**
   * Get the collection to operate on.
   *
   * @param {string} ns - The namespace.
   * @returns {Collection} The collection.
   */
  _collection(ns) {
    return this._database(this._databaseName(ns)).collection(this._collectionName(ns));
  }

  /**
   * Get the collection name from a namespace.
   *
   * @param {string} ns - The namespace in database.collection format.
   * @returns {string} The collection name.
   */
  _collectionName(ns) {
    return ns.split('.')[1];
  }

  /**
   * Get the database name from a namespace.
   *
   * @param {string} ns - The namespace in database.collection format.
   * @returns {string} The database name.
   */
  _databaseName(ns) {
    return ns.split('.')[0];
  }

  /**
   * Get the database for the name.
   *
   * @param {String} name - The database name.
   *
   * @returns {DB} The database object.
   */
  _database(name) {
    return this.database.db(name);
  }
}

module.exports = NativeClient;
