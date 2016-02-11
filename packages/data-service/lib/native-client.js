var MongoClient = require('mongodb').MongoClient;

/**
 * Instantiate a new NativeClient object.
 */
function NativeClient(connection) {
  this.connection = connection;
  var client = this;
  MongoClient.connect(this.connection.driver_url).then(function(database) {
    client.setDatabase(database);
  });
}

/**
 * The NativeClient API.
 */
NativeClient.prototype = (function() {
  /**
   * Get the collection name from a namespace.
   */
  var collectionName = function(ns) {
    return ns.split('.')[1];
  };

  /**
   * Get the database name from a namespace.
   */
  var databaseName = function(ns) {
    return ns.split('.')[0];
  };

  return {
    constructor: NativeClient,

    /**
     * Find documents for the provided filter and options on the collection.
     */
    find: function(ns, filter, options) {
      return this.database
        .db(databaseName(ns))
        .collection(collectionName(ns))
        .find(filter, options);
    },

    /**
     * Set the database on the client once the connection is made.
     */
    setDatabase: function(database) {
      this.database = database;
    }
  };
})();

module.exports = NativeClient;
