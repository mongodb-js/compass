'use strict';

const MongoClient = require('mongodb').MongoClient;

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
   * @param {Connection} connection - The Connection model.
   */
  constructor(connection) {
    this.connection = connection;
    this.connect();
  }

  /**
   * Connect to the server.
   *
   * @param {function} done - The callback function.
   * @returns {Promise} The client promise.
   */
  connect() {
    return MongoClient.connect(this.connection.driver_url).then((database) => {
      this.database = database;
    });
  }

  /**
   * Count the number of documents in the collection for the provided filter
   * and options.
   *
   * @param {string} ns - The namespace to search on.
   * @param {object} filter - The filter.
   * @param {object} options - The query options.
   * @returns {Promise} The count.
   */
  count(ns, filter, options) {
    return this.collection(ns).count(filter, options);
  }

  /**
   * Get a list of databases for the server.
   *
   * @returns {Promise} The list of databases.
   */
  databases() {
    return this.database.admin().listDatabases();
  }

  /**
   * Find documents for the provided filter and options on the collection.
   *
   * @param {string} ns - The namespace to search on.
   * @param {object} filter - The filter.
   * @param {object} options - The query options.
   * @returns {Cursor} The cursor.
   */
  find(ns, filter, options) {
    return this.collection(ns).find(filter, options);
  }
}

module.exports = NativeClient;
