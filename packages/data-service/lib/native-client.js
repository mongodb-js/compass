'use strict';

const createConnection = require('mongodb-connection-model').connect;
const getInstance = require('mongodb-instance-model').fetch;
const createSampleStream = require('mongodb-collection-sample');

/**
 * The native client class.
 */
class NativeClient {

  /**
   * Get the collection name from a namespace.
   *
   * @param {string} ns - The namespace in database.collection format.
   * @returns {string} The collection name.
   */
  collectionName(ns) {
    return ns.split('.')[1];
  }

  /**
   * Get the database name from a namespace.
   *
   * @param {string} ns - The namespace in database.collection format.
   * @returns {string} The database name.
   */
  databaseName(ns) {
    return ns.split('.')[0];
  }

  /**
   * Get the collection to operate on.
   *
   * @param {string} ns - The namespace.
   * @returns {Collection} The collection.
   */
  collection(ns) {
    return this.database.db(this.databaseName(ns)).collection(this.collectionName(ns));
  }

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
    this.collection(ns).count(filter, options, callback);
  }

  /**
   * Get a list of databases for the server.
   *
   * @param {function} callback - The callback function.
   */
  databases(callback) {
    this.database.admin().listDatabases(callback);
  }

  /**
   * Find documents for the provided filter and options on the collection.
   *
   * @param {string} ns - The namespace to search on.
   * @param {object} filter - The filter.
   * @param {object} options - The query options.
   *
   * @returns {Cursor} The cursor.
   */
  find(ns, filter, options) {
    return this.collection(ns).find(filter, options);
  }

  /**
   * Get the current instance details.
   *
   * @param {function} callback - The callback function.
   */
  instance(callback) {
    getInstance(this.database, callback);
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
    return createSampleStream(this.database, this.collectionName(ns), options);
  }
}

module.exports = NativeClient;
