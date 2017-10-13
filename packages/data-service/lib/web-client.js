const { StitchClient } = require('mongodb-stitch');
const toNS = require('mongodb-ns');

/**
 * A browser based client that wraps a stitch client instance.
 */
class WebClient {

  /**
   * Execute an aggregation framework pipeline with the provided options on the
   * collection. Async if called with a callback function, otherwise function
   * returns a cursor. For more details, see
   * http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#findaggregate
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} pipeline - The aggregation pipeline.
   * @param {Object} options - The aggregation options (ignored).
   * @param {Function} callback - The callback (optional)
   *
   * @return {(null|AggregationCursor)}
   */
  aggregate(ns, pipeline, options, callback) {
    this._getCollection(ns).aggregate(pipeline)
      .then((results) => {
        callback(null, results);
      }).catch((err) => {
        callback(err);
      });
  }

  /**
   * Instantiate a new WebClient object.
   *
   * @constructor
   * @param {Connection} model - The Connection model.
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Connect to the stitch server.
   *
   * @param {Function} callback - The callback.
   */
  connect(callback) {
    const options = {};
    if (this.model.stitchBaseUrl) {
      options.baseUrl = this.model.stitchBaseUrl;
    }
    this.stitchClient = new StitchClient(this.model.stitchClientAppId, options);
    this.stitchClient
      .login(this.model.mongodb_username, this.model.mongodb_password)
      .then(() => {
        callback(null, this.stitchClient);
      }).catch((err) => {
        callback(err);
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
    this._getCollection(ns).count(filter, options)
      .then((number) => {
        callback(null, number);
      }).catch((err) => {
        callback(err);
      });
  }

  /**
   * Delete a single document from the collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  deleteOne(ns, doc, options, callback) {
    this._getCollection(ns).deleteOne(doc)
      .then((result) => {
        callback(null, result);
      }).catch((err) => {
        callback(err);
      });
  }

  /**
   * Find documents for the provided filter and options on the collection.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The filter.
   * @param {Object} options - The query options.
   * @param {Function} callback - The callback.
   */
  find(ns, filter, options, callback) {
    this._getCollection(ns).find(filter, options)
      .then((results) => {
        callback(null, results);
      }).catch((err) => {
        callback(err);
      });
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
    this._getCollection(ns).insertOne(doc)
      .then((result) => {
        callback(null, result);
      }).catch((err) => {
        callback(err);
      });
  }

  _getCollection(ns) {
    const namespace = toNS(ns);
    const db = this.stitchClient.service('mongodb', 'mongodb1').db(namespace.database);
    return db.collection(namespace.collection);
  }
}

module.exports = WebClient;
