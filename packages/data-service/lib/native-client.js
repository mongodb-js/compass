var MongoClient = require('mongodb').MongoClient;

/**
 * Instantiate a new NativeClient object.
 *
 * @constructor
 * @param {Connection} connection - The Connection model.
 */
function NativeClient(connection) {
  this.connection = connection;
  this.connect();
}

/**
 * The NativeClient API.
 */
NativeClient.prototype = (function() {
  /**
   * Get the collection name from a namespace.
   *
   * @param {string} ns - The namespace in database.collection format.
   * @returns {string} The collection name.
   */
  var collectionName = function(ns) {
    return ns.split('.')[1];
  };

  /**
   * Get the database name from a namespace.
   *
   * @param {string} ns - The namespace in database.collection format.
   * @returns {string} The database name.
   */
  var databaseName = function(ns) {
    return ns.split('.')[0];
  };

  /**
   * Get the collection to operate on.
   *
   * @param {string} ns - The namespace.
   * @returns {Collection} The collection.
   */
  var collection = function(ns) {
    return this.database.db(databaseName(ns)).collection(collectionName(ns));
  };

  return {
    constructor: NativeClient,

    /**
     * Connect to the server.
     *
     * @param {function} done - The callback function.
     * @returns {Promise} The client promise.
     */
    connect: function() {
      return MongoClient.connect(this.connection.driver_url).then(function(database) {
        this.database = database;
      }.bind(this));
    },

    /**
     * Count the number of documents in the collection for the provided filter
     * and options.
     *
     * @param {string} ns - The namespace to search on.
     * @param {object} filter - The filter.
     * @param {object} options - The query options.
     * @returns {Promise} The count.
     */
    count: function(ns, filter, options) {
      return collection.call(this, ns).count(filter, options);
    },

    /**
     * Get a list of databases for the server.
     *
     * @returns {Promise} The list of databases.
     */
    databases: function() {
      return this.database.admin().listDatabases();
    },

    /**
     * Find documents for the provided filter and options on the collection.
     *
     * @param {string} ns - The namespace to search on.
     * @param {object} filter - The filter.
     * @param {object} options - The query options.
     * @returns {Cursor} The cursor.
     */
    find: function(ns, filter, options) {
      return collection.call(this, ns).find(filter, options);
    }
  };
})();

module.exports = NativeClient;
