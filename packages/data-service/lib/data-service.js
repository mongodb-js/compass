'use strict';

const debug = require('debug')('mongodb-data-service:data-service');
const NativeClient = require('./native-client');
const SshTunnelConnector = require('./ssh-tunnel-connector');
const Router = require('./router');
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
    this.model = model;
    this.client = new NativeClient(model);
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
   * Connect to the server.
   *
   * @param {function} callback - The callback function.
   */
  connect(callback) {
    debug('Connecting to MongoDB.');
    new SshTunnelConnector(this.model.ssh_tunnel_options).connect((tunnelError) => {
      if (tunnelError) {
        process.nextTick(() => {
          this.emit(Events.Error, tunnelError);
        });
        return callback(tunnelError, this);
      }
      this.client.connect((error) => {
        debug('Data Service is readable.');
        process.nextTick(() => {
          this.emit(Events.Readable);
        });
        return callback(error, this);
      });
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
module.exports.Events = Events;
