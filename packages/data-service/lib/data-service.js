'use strict';

const debug = require('debug')('mongodb-data-service:data-service');
const NativeClient = require('./native-client');
const Router = require('./router');
const EventEmitter = require('events');

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
    this.client = new NativeClient(model).on('status', (evt) => this.emit('status', evt));
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
    debug(`#collection: ${ns}: options: ${options}`);
    this.client.collectionDetail(ns, callback);
  }

  /**
   * List all collections for a database.
   *
   * @param {String} databaseName - The database name.
   * @param {Object} filter - The filter.
   * @param {Function} callback - The callback.
   */
  listCollections(databaseName, filter, callback) {
    debug(`Listing collections: ${databaseName}, filter: ${filter}`);
    this.client.listCollections(databaseName, filter, callback);
  }

  /**
   * Connect to the server.
   *
   * @param {function} done - The callback function.
   */
  connect(done) {
    debug('Connecting...');
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
    debug(`#count: ${ns}, filter: ${filter}, options: ${options}`);
    this.client.count(ns, filter, options, callback);
  }

  /**
   * Get the kitchen sink information about a database and all its collections.
   *
   * @param {String} name - The database name.
   * @param {object} options - The query options.
   * @param {Function} callback - The callback.
   */
  database(name, options, callback) {
    debug(`#database: ${name}, options: ${options}`);
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
    debug(`#deleteOne: ${ns}, filter: ${filter}`);
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
    debug(`#deleteMany: ${ns}, filter: ${filter}`);
    this.client.deleteMany(ns, filter, options, callback);
  }

  /**
   * Disconnect the service.
   */
  disconnect() {
    this.client.disconnect();
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
    debug(`#find: ${ns}, filter: ${filter}, options: ${options}`);
    this.client.find(ns, filter, options, callback);
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
    debug(`#findOneAndReplace: ${ns}, filter: ${filter}, replacement: ${replacement}, options: ${options}`);
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
    debug(`#explain: ${ns}, filter: ${filter}, options: ${options}`);
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
    debug(`#get: ${url}, options: ${options}`);
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
    debug(`#instance: ${options}`);
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
    debug(`#insertOne: ${ns}, doc: ${doc}`);
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
    debug(`#insertMany: ${ns}, docs: ${docs}`);
    this.client.insertMany(ns, docs, options, callback);
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
    debug(`#sample: ${ns}, options: ${options}`);
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
    debug(`#updateCollection: ${ns}, flags: ${flags}`);
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
    debug(`#updateOne: ${ns}, filter: ${filter}, update: ${update}`);
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
    debug(`#updateMany: ${ns}, filter: ${filter}, update: ${update}`);
    this.client.updateMany(ns, filter, update, options, callback);
  }

  /**
   * Returns the results of currentOp.
   *
   * @param {Boolean} includeAll - if true also list currently idle operations in the result.
   * @param {Function} callback - The callback.
   */
  currentOp(includeAll, callback) {
    debug(`#currentOp: ${includeAll}`);
    this.client.currentOp(includeAll, callback);
  }

  /**
   * Returns the result of serverStats.
   *
   * @param {function} callback - the callback.
   */
  serverstats(callback) {
    debug('#serverstats');
    this.client.serverStats(callback);
  }

  /**
   * Returns the result of top.
   *
   * @param {function} callback - the callback.
   */
  top(callback) {
    debug('#top');
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
