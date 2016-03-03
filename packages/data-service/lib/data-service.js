'use strict';

const NativeClient = require('./native-client');
const EventEmitter = require('events');

/**
 * Constants for generated events.
 */
const Events = {
  Readable: 'DataService:Readable',
  Error: 'DataService:Error'
};

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
    this.client = new NativeClient(model);
  }

  /**
   * Connect to the server.
   *
   * @param {function} callback - The callback function.
   */
  connect(callback) {
    this.client.connect((error) => {
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
    this.client.count(ns, filter, options, callback);
  }

  /**
   * Get a list of databases for the server.
   *
   * @param {function} callback - The callback function.
   */
  databases(callback) {
    this.client.databases(callback);
  }

  /**
   * Find documents for the provided filter and options on the collection.
   *
   * @param {string} ns - The namespace to search on.
   * @param {object} filter - The filter.
   * @param {object} options - The query options.
   * @param {function} callback - The callback function.
   */
  find(ns, filter, options, callback) {
    this.client.find(ns, filter, options, callback);
  }
}

module.exports = DataService;
module.exports.Events = Events;
