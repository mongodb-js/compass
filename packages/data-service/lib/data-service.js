'use strict';

const NativeClient = require('./native-client');

/**
 * Instantiate a new DataService object.
 *
 * @constructor
 * @param {Connection} connection - The Connection model.
 */
class DataService {

  /**
   * Instantiate a new DataService object.
   *
   * @constructor
   * @param {Connection} connection - The Connection model.
   */
  constructor(connection) {
    this.client = new NativeClient(connection);
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
    return this.client.count(ns, filter, options);
  }

  /**
   * Get a list of databases for the server.
   *
   * @returns {Promise} The list of databases.
   */
  databases() {
    return this.client.databases();
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
    return this.client.find(ns, filter, options);
  }
}

module.exports = DataService;
