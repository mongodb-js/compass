'use strict';

const Router = require('./router');
const EventEmitter = require('events');
const { CONNECTION_TYPE_VALUES } = require('mongodb-connection-model');

/**
 * Instantiate a new DataService object.
 *
 * @constructor
 * @param {Connection} connection - The Connection model.
 */
class DataService extends EventEmitter {

  /**
   * Instantiate a new DataService object.
   *
   * @constructor
   * @param {Object} model - The Connection model or object.
   */
  constructor(model) {
    super();
    this.client = null;
    if (model.connectionType !== CONNECTION_TYPE_VALUES.NODE_DRIVER) {
      const WebClient = require('./web-client');
      this.client = new WebClient(model);
    } else {
      const NativeClient = require('./native-client');
      this.client = new NativeClient(model)
        .on('status', (evt) => this.emit('status', evt))
        .on('serverDescriptionChanged', (evt) => this.emit('serverDescriptionChanged', evt))
        .on('serverOpening', (evt) => this.emit('serverOpening', evt))
        .on('serverClosed', (evt) => this.emit('serverClosed', evt))
        .on('topologyOpening', (evt) => this.emit('topologyOpening', evt))
        .on('topologyClosed', (evt) => this.emit('topologyClosed', evt))
        .on('topologyDescriptionChanged', (evt) => this.emit('topologyDescriptionChanged', evt));
    }
    this.router = new Router();
  }

  /**
   * Get the kitchen sink information about a collection.
   *
   * @param {String} ns - The namespace.
   * @param {object} options - The options.
   * @param {Function} callback - The callback.
   */
  collection(ns, options, callback) {
    this.client.collectionDetail(ns, callback);
  }

  /**
   * Get the stats for a collection.
   *
   * @param {String} databaseName - The database name.
   * @param {String} collectionName - The collection name.
   * @param {Function} callback - The callback.
   */
  collectionStats(databaseName, collectionName, callback) {
    this.client.collectionStats(databaseName, collectionName, callback);
  }

  /**
   * Execute a command.
   *
   * @param {String} databaseName - The db name.
   * @param {Object} comm - The command.
   * @param {Function} callback - The callback.
   */
  command(databaseName, comm, callback) {
    this.client.command(databaseName, comm, callback);
  }

  /**
   * Is the data service allowed to perform write operations.
   *
   * @returns {Boolean} If the data service is writable.
   */
  isWritable() {
    return this.client.isWritable;
  }

  /**
   * Is the data service connected to a mongos.
   *
   * @returns {Boolean} If the data service is connected to a mongos.
   */
  isMongos() {
    return this.client.isMongos;
  }

  /**
   * Executes a buildInfo command on the currently connected instance.
   *
   * @param {Function} callback - The callback.
   */
  buildInfo(callback) {
    this.client.buildInfo(callback);
  }

  /**
   * Executes a hostInfo command on the currently connected instance.
   *
   * @param {Function} callback - The callback.
   */
  hostInfo(callback) {
    this.client.hostInfo(callback);
  }

  /**
   * Executes a connectionStatus command on the currently connected instance.
   *
   * @param {Function} callback - The callback.
   */
  connectionStatus(callback) {
    this.client.connectionStatus(callback);
  }

  /**
   * Executes a usersInfo command on the provided authenticationDatabase.
   *
   * @param {String} authenticationDatabase - The database name.
   * @param {object} options - Options passed to NativeClient.usersInfo method.
   * @param {Function} callback - The callback.
   */
  usersInfo(authenticationDatabase, options, callback) {
    this.client.usersInfo(authenticationDatabase, options, callback);
  }

  /**
   * List all collections for a database.
   *
   * @param {String} databaseName - The database name.
   * @param {Object} filter - The filter.
   * @param {Function} callback - The callback.
   */
  listCollections(databaseName, filter, callback) {
    this.client.listCollections(databaseName, filter, callback);
  }

  /**
   * List all databases on the currently connected instance.
   *
   * @param {Function} callback - The callback.
   */
  listDatabases(callback) {
    this.client.listDatabases(callback);
  }

  /**
   * Connect to the server.
   *
   * @param {function} done - The callback function.
   */
  connect(done) {
    this.client.connect((err) => {
      if (err) {
        return done(err);
      }
      done(null, this);
      this.emit('readable');
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
    this.client.count(ns, filter, options, callback);
  }

  /**
   * Creates a collection
   *
   * @param {String} ns - The namespace.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  createCollection(ns, options, callback) {
    this.client.createCollection(ns, options, callback);
  }

  /**
   * Creates an index
   *
   * @param {String} ns - The namespace.
   * @param {Object} spec - The index specification.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  createIndex(ns, spec, options, callback) {
    this.client.createIndex(ns, spec, options, callback);
  }

  /**
   * Get the kitchen sink information about a database and all its collections.
   *
   * @param {String} name - The database name.
   * @param {object} options - The query options.
   * @param {Function} callback - The callback.
   */
  database(name, options, callback) {
    this.client.databaseDetail(name, callback);
  }

  /**
   * Delete a single document from the collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  deleteOne(ns, filter, options, callback) {
    this.client.deleteOne(ns, filter, options, callback);
  }

  /**
   * Deletes multiple documents from a collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  deleteMany(ns, filter, options, callback) {
    this.client.deleteMany(ns, filter, options, callback);
  }

  /**
   * Disconnect the service.
   */
  disconnect(callback) {
    this.client.disconnect(callback);
  }

  /**
   * Drops a collection from a database
   *
   * @param {String} ns - The namespace.
   * @param {Function} callback - The callback.
   */
  dropCollection(ns, callback) {
    this.client.dropCollection(ns, callback);
  }

  /**
   * Drops a database
   *
   * @param {String} name - The database name.
   * @param {Function} callback - The callback.
   */
  dropDatabase(name, callback) {
    this.client.dropDatabase(name, callback);
  }

  /**
   * Drops an index from a collection
   *
   * @param {String} ns - The namespace.
   * @param {String} name - The index name.
   * @param {Function} callback - The callback.
   */
  dropIndex(ns, name, callback) {
    this.client.dropIndex(ns, name, callback);
  }

  /**
   * Execute an aggregation framework pipeline with the provided options on the
   * collection.
   *
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} pipeline - The aggregation pipeline.
   * @param {Object} options - The aggregation options.
   * @param {Function} callback - The callback function.
   * @return {(null|AggregationCursor)}
   */
  aggregate(ns, pipeline, options, callback) {
    return this.client.aggregate(ns, pipeline, options, callback);
  }

  /**
   * Find documents for the provided filter and options on the collection.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The query filter.
   * @param {Object} options - The query options.
   * @param {Function} callback - The callback function.
   */
  find(ns, filter, options, callback) {
    this.client.find(ns, filter, options, callback);
  }

  /**
   * Fetch documents for the provided filter and options on the collection.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The query filter.
   * @param {Object} options - The query options.
   *
   * @returns {Cursor} The cursor.
   */
  fetch(ns, filter, options) {
    return this.client.fetch(ns, filter, options);
  }

  /**
   * Find one document and replace it with the replacement.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The filter.
   * @param {Object} replacement - The replacement doc.
   * @param {Object} options - The query options.
   * @param {Function} callback - The callback.
   */
  findOneAndReplace(ns, filter, replacement, options, callback) {
    this.client.findOneAndReplace(ns, filter, replacement, options, callback);
  }

  /**
   * Returns explain plan for the provided filter and options on the collection.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The query filter.
   * @param {Object} options - The query options.
   * @param {Function} callback - The callback function.
   */
  explain(ns, filter, options, callback) {
    this.client.explain(ns, filter, options, callback);
  }

  /**
   * Get some data from the service in a RESTful manner.
   *
   * @param {String} url - The RESTful url.
   * @param {Object} options - The options.
   * @param {function} callback - The callback.
   *
   * @return {Object} The result of the delegated call.
   */
  get(url, options, callback) {
    var route = this.router.resolve(url);
    var args = this._generateArguments(route.args, options, callback);
    return this[route.method].apply(this, args);
  }

  /**
   * Get the indexes for the collection.
   *
   * @param {String} ns - The collection namespace.
   * @param {Object} options - The options (unused).
   * @param {Function} callback - The callback.
   */
  indexes(ns, options, callback) {
    this.client.indexes(ns, callback);
  }

  /**
   * Get the current instance details.
   *
   * @param {Object} options - The options.
   * @param {Function} callback - The callback function.
   */
  instance(options, callback) {
    this.client.instance(callback);
  }

  /**
   * Insert a single document into the database.
   *
   * @param {String} ns - The namespace.
   * @param {Object} doc - The document to insert.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  insertOne(ns, doc, options, callback) {
    this.client.insertOne(ns, doc, options, callback);
  }

  /**
   * Inserts multiple documents into the collection.
   *
   * @param {String} ns - The namespace.
   * @param {Array} docs - The documents to insert.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  insertMany(ns, docs, options, callback) {
    this.client.insertMany(ns, docs, options, callback);
  }

  /**
   * Inserts multiple documents into the collection.
   *
   * @param {String} ns - The namespace.
   * @param {Array} docs - The documents to insert.
   * @param {Object} options - The options.
   *
   * @returns {Promise} The promise.
   */
  putMany(ns, docs, options) {
    return this.client.putMany(ns, docs, options);
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
    return this.client.sample(ns, options);
  }

  /**
   * Update a collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} flags - The flags.
   * @param {Function} callback - The callback.
   */
  updateCollection(ns, flags, callback) {
    this.client.updateCollection(ns, flags, callback);
  }

  /**
   * Update a single document in the collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} update - The update.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  updateOne(ns, filter, update, options, callback) {
    this.client.updateOne(ns, filter, update, options, callback);
  }

  /**
   * Updates multiple documents in the collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} update - The update.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  updateMany(ns, filter, update, options, callback) {
    this.client.updateMany(ns, filter, update, options, callback);
  }

  /**
   * Returns the results of currentOp.
   *
   * @param {Boolean} includeAll - if true also list currently idle operations in the result.
   * @param {Function} callback - The callback.
   */
  currentOp(includeAll, callback) {
    this.client.currentOp(includeAll, callback);
  }

  /**
   * Returns the result of serverStats.
   *
   * @param {function} callback - the callback.
   */
  serverstats(callback) {
    this.client.serverStats(callback);
  }

  /**
   * Get the collection stats plus sharding distribution information. This merges
   * the shard distribution statistics under the "shards" array that was a result
   * of the collStats command.
   *
   * @param {String} ns - The namespace.
   * @param {Function} callback - The callback.
   */
  shardedCollectionDetail(ns, callback) {
    this.client.shardedCollectionDetail(ns, callback);
  }

  /**
   * Returns the result of top.
   *
   * @param {function} callback - the callback.
   */
  top(callback) {
    this.client.top(callback);
  }

  /**
   * When Node supports ES6 default values for arguments, this can go away.
   *
   * @param {Array} args - The route arguments.
   * @param {Object} options - The options passed to the method.
   * @param {Function} callback - The callback.
   *
   * @return {Array} The generate arguments.
   */
  _generateArguments(args, options, callback) {
    options = options || {};
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    args.push.apply(args, [options, callback]);
    return args;
  }
}

module.exports = DataService;
