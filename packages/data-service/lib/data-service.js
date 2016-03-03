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
 * Constants for routes.
 */
const Routes = {
  '/instance': 'instance'
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
      this.emit(Events.Readable);
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

  /**
   * Get some data from the service in a RESTful manner.
   *
   * @param {String} url - The RESTful url.
   * @param {Object} options - The options.
   * @param {function} callback - The callback.
   */
  get(url, options, callback) {
    console.log(url);
    console.log(options);
    this[Routes[url]].call(this, options, callback);
  }

  /**
   * Get the current instance details.
   *
   * @param {function} callback - The callback function.
   */
  instance(options, callback) {
    this.client.instance(callback);
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
}

module.exports = DataService;
module.exports.Events = Events;
