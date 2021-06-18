const { map, isFunction, assignIn, assign } = require('lodash');
const async = require('async');
const EventEmitter = require('events');

const connect = require('mongodb-connection-model').connect;
const getIndexes = require('mongodb-index-model').fetch;
const parseNamespace = require('mongodb-ns');

const { getInstance } = require('./instance-detail-helper');

const debug = require('debug')('mongodb-data-service:native-client');

/**
 * The constant for a mongos.
 */
const SHARDED = 'Sharded';

/**
 * Single topology type.
 */
const SINGLE = 'Single';

/**
 * RS with primary.
 */
const RS_WITH_PRIMARY = 'ReplicaSetWithPrimary';

/**
 * Primary rs member.
 */
const RS_PRIMARY = 'RSPrimary';

/**
 * Standalone member.
 */
const STANDALONE = 'Standalone';

/**
 * Mongos.
 */
const MONGOS = 'Mongos';

/**
 * Writable server types.
 */
const WRITABLE_SERVER_TYPES = [RS_PRIMARY, STANDALONE, MONGOS];

/**
 * Writable topology types.
 */
const WRITABLE_TYPES = [SHARDED, SINGLE, RS_WITH_PRIMARY];

/**
 * Error message sustring for view operations.
 */
const VIEW_ERROR = 'is a view, not a collection';

/**
 * The system collection name.
 */
const SYSTEM = 'system';

/**
 * The admin database name.
 */
const ADMIN = 'admin';

/**
 * The default sample size.
 */
const DEFAULT_SAMPLE_SIZE = 1000;

/**
 *
 * @param {Map<K, V>} _map
 * @returns {V}
 */
function getFirstFromMap(_map) {
  return _map.values().next().value;
}

/**
 * The native client class.
 */
class NativeClient extends EventEmitter {
  /**
   * Instantiate a new NativeClient object.
   *
   * @constructor
   * @param {Connection} model - The Connection model.
   */
  constructor(model) {
    super();
    this.model = model;

    this.connectionOptions = null;
    this.tunnel = null;

    this.isWritable = false;
    this.isMongos = false;
    this._isConnecting = false;
  }

  isConnected() {
    // This is better than just returning internal `_isConnecting` as this
    // actually shows when the client is available on the NativeClient instance
    // and connected
    return !!this.client;
  }

  /**
   * Connect to the server.
   *
   * @param {function} done - The callback function.
   * @return {NativeClient}
   */
  connect(done) {
    debug('connecting...');

    if (this._isConnecting) {
      setImmediate(() => {
        done(
          new Error(
            'Connect method has been called more than once without disconnecting.'
          )
        );
      });

      return this;
    }

    // Not really true at that point, we are doing it just so we don't allow
    // simultaneous syncronous calls to the connect method
    this._isConnecting = true;

    connect(
      this.model,
      this.setupListeners.bind(this),
      (err, _client, tunnel, connectionOptions) => {
        if (err) {
          this._isConnecting = false;
          return done(this._translateMessage(err));
        }

        this.connectionOptions = connectionOptions;
        this.tunnel = tunnel;

        this.isWritable = this.client.isWritable;
        this.isMongos = this.client.isMongos;

        debug('connected!', {
          isWritable: this.isWritable,
          isMongos: this.isMongos
        });

        this.client.on('status', (evt) => this.emit('status', evt));
        this.database = this.client.db(this.model.ns || ADMIN);

        done(null, this);
      }
    );
    return this;
  }

  /**
   * Subscribe to SDAM monitoring events on the mongo client.
   *
   * @param {MongoClient} client - The driver client.
   */
  setupListeners(client) {
    this.client = client;

    if (client) {
      client.on('serverDescriptionChanged', evt => {
        debug('serverDescriptionChanged', evt);
        this.emit('serverDescriptionChanged', evt);
      });

      client.on('serverOpening', evt => {
        debug('serverOpening', arguments);
        this.emit('serverOpening', evt);
      });

      client.on('serverClosed', evt => {
        debug('serverClosed', arguments);
        this.emit('serverClosed', evt);
      });

      client.on('topologyOpening', evt => {
        debug('topologyOpening', arguments);
        this.emit('topologyOpening', evt);
      });

      client.on('topologyClosed', evt => {
        debug('topologyClosed', arguments);
        this.emit('topologyClosed', evt);
      });

      client.on('topologyDescriptionChanged', evt => {
        debug('topologyDescriptionChanged', arguments);
        client.isWritable = this._isWritable(evt);
        client.isMongos = this._isMongos(evt);
        debug('updated to', {
          isWritable: client.isWritable,
          isMongos: client.isMongos
        });

        this.emit('topologyDescriptionChanged', evt);
      });

      client.on('serverHeartbeatSucceeded', evt => {
        debug('serverHeartbeatSucceeded', arguments);
        this.emit('serverHeartbeatSucceeded', evt);
      });

      client.on('serverHeartbeatFailed', evt => {
        debug('serverHeartbeatFailed', arguments);
        this.emit('serverHeartbeatFailed', evt);
      });
    }
  }

  /**
   * Execute a command.
   *
   * @param {String} databaseName - The db name.
   * @param {Object} comm - The command.
   * @param {Function} callback - The callback.
   */
  command(databaseName, comm, callback) {
    var db = this._database(databaseName);
    db.command(comm, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Count the number of documents in the collection.
   *
   * @param {string} ns - The namespace to search on.
   * @param {object} options - The query options.
   * @param {function} callback - The callback function.
   */
  estimatedCount(ns, options, callback) {
    this._collection(ns).estimatedDocumentCount(options, callback);
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
    this._collection(ns).countDocuments(filter, options, callback);
  }

  /**
   * Get the kitchen sink information about a collection.
   *
   * @param {String} ns - The namespace.
   * @param {Function} callback - The callback.
   */
  collectionDetail(ns, callback) {
    async.parallel(
      {
        stats: this.collectionStats.bind(
          this,
          this._databaseName(ns),
          this._collectionName(ns)
        ),
        indexes: this.indexes.bind(this, ns)
      },
      (error, coll) => {
        if (error) {
          return callback(this._translateMessage(error));
        }
        callback(null, this._buildCollectionDetail(ns, coll));
      }
    );
  }

  /**
   * List all collections for a database.
   *
   * @param {String} databaseName - The database name.
   * @param {Object} filter - The filter.
   * @param {Function} callback - The callback.
   */
  listCollections(databaseName, filter, callback) {
    var db = this._database(databaseName);
    db.listCollections(filter, {}).toArray((error, data) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, data);
    });
  }

  /**
   * List all databases on the currently connected instance.
   *
   * @param {Function} callback - The callback.
   */
  listDatabases(callback) {
    this.database.admin().command({
      listDatabases: 1
    }, {
      readPreference: this.model.readPreference
    }, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result.databases);
    });
  }

  /**
   * Get the stats for all collections in the database.
   *
   * @param {String} databaseName - The database name.
   * @param {Function} callback - The callback.
   *
   * @returns {void}
   */
  collections(databaseName, callback) {
    if (databaseName === SYSTEM) {
      return callback(null, []);
    }
    this.collectionNames(databaseName, (error, names) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      async.parallel(
        map(names, name => {
          return done => {
            this.collectionStats(databaseName, name, done);
          };
        }),
        callback
      );
    });
  }

  /**
   * Get all the collection names for a database.
   *
   * @param {String} databaseName - The database name.
   * @param {Function} callback - The callback.
   */
  collectionNames(databaseName, callback) {
    this.listCollections(databaseName, {}, (error, collections) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      var names = map(collections, collection => {
        return collection.name;
      });
      callback(null, names);
    });
  }

  /**
   * Get the currentOp.
   *
   * @param {Boolean} includeAll - if true also list currently idle operations in the result.
   * @param {Function} callback - The callback.
   */
  currentOp(includeAll, callback) {
    this.database
      .admin()
      .command({ currentOp: 1, $all: includeAll }, (error, result) => {
        if (error) {
          this._database('admin')
            .collection('$cmd.sys.inprog')
            .findOne({ $all: includeAll }, (error2, result2) => {
              if (error2) {
                return callback(this._translateMessage(error2));
              }
              callback(null, result2);
            });
          return;
        }
        callback(null, result);
      });
  }

  /**
   * Call serverStatus on the admin database.
   *
   * @param {Function} callback - The callback.
   */
  serverStats(callback) {
    this.database.admin().serverStatus((error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Call top on the admin database.
   *
   * @param {Function} callback - The callback.
   */
  top(callback) {
    this.database.admin().command({ top: 1 }, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Get the stats for a collection.
   *
   * @param {String} databaseName - The database name.
   * @param {String} collectionName - The collection name.
   * @param {Function} callback - The callback.
   */
  collectionStats(databaseName, collectionName, callback) {
    var db = this._database(databaseName);
    db.command({ collStats: collectionName, verbose: true }, (error, data) => {
      if (error && !error.message.includes(VIEW_ERROR)) {
        return callback(this._translateMessage(error));
      }
      callback(
        null,
        this._buildCollectionStats(
          databaseName,
          collectionName,
          data || {}
        )
      );
    });
  }

  /**
   * Creates a collection
   *
   * @param {String} ns - The namespace.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  createCollection(ns, options, callback) {
    var collectionName = this._collectionName(ns);
    var db = this._database(this._databaseName(ns));
    db.createCollection(collectionName, options, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Creates an index
   *
   * @param {String} ns - The namespace.
   * @param {Object} spec - The index specification.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  createIndex(ns, spec, options, callback) {
    this._collection(ns).createIndex(spec, options, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Get the kitchen sink information about a database and all its collections.
   *
   * @param {String} name - The database name.
   * @param {Function} callback - The callback.
   */
  databaseDetail(name, callback) {
    async.parallel(
      {
        stats: this.databaseStats.bind(this, name),
        collections: this.collections.bind(this, name)
      },
      (error, db) => {
        if (error) {
          return callback(this._translateMessage(error));
        }
        callback(null, this._buildDatabaseDetail(name, db));
      }
    );
  }

  /**
   * Get the stats for a database.
   *
   * @param {String} name - The database name.
   * @param {Function} callback - The callback.
   */
  databaseStats(name, callback) {
    var db = this._database(name);
    db.command({ dbStats: 1 }, (error, data) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, this._buildDatabaseStats(data));
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
  deleteOne(ns, filter, options, callback) {
    this._collection(ns).deleteOne(filter, options, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Deletes multiple documents from the collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  deleteMany(ns, filter, options, callback) {
    this._collection(ns).deleteMany(filter, options, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Disconnect the client.
   * @param {Function} callback
   */
  disconnect(callback) {
    // This follows MongoClient behavior where calling `close` on client that is
    // not connected
    if (!this.client) {
      setImmediate(() => {
        callback();
      });
      return;
    }

    this.client.close(true, err => {
      if (this.tunnel) {
        debug('mongo client closed. shutting down ssh tunnel');
        this.tunnel.close().finally(() => {
          this._cleanup();
          debug('ssh tunnel stopped');
          callback(err);
        });
      } else {
        this._cleanup();
        return callback(err);
      }
    });
  }

  /**
   * Drops a collection from a database
   *
   * @param {String} ns - The namespace.
   * @param {Function} callback - The callback.
   */
  dropCollection(ns, callback) {
    this._collection(ns).drop((error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Drops a database
   *
   * @param {String} name - The database name.
   * @param {Function} callback - The callback.
   */
  dropDatabase(name, callback) {
    this._database(this._databaseName(name)).dropDatabase((error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Drops an index from a collection
   *
   * @param {String} ns - The namespace.
   * @param {String} name - The index name.
   * @param {Function} callback - The callback.
   */
  dropIndex(ns, name, callback) {
    this._collection(ns).dropIndex(name, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Execute an aggregation framework pipeline with the provided options on the
   * collection. Async if called with a callback function, otherwise function
   * returns a cursor. For more details, see
   * http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#aggregate
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} pipeline - The aggregation pipeline.
   * @param {Object} options - The aggregation options.
   * @param {Function} callback - The callback (optional)
   *
   * @return {(null|AggregationCursor)}
   */
  aggregate(ns, pipeline, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    const cursor = this._collection(ns).aggregate(pipeline, options);
    // async when a callback is provided
    if (isFunction(callback)) {
      process.nextTick(callback, null, cursor);
      return;
    }
    // otherwise return cursor
    return cursor;
  }

  /**
   * Find documents for the provided filter and options on the collection.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The filter.
   * @param {Object} options - The query options.
   * @param {Function} callback - The callback.
   */
  find(ns, filter = {}, options = {}, callback = () => {}) {
    // Workaround for https://jira.mongodb.org/browse/NODE-3173
    const sort = options.sort;
    delete options.sort;
    let cursor = this._collection(ns).find(filter, options);
    if (sort) {
      cursor = cursor.sort(sort);
    }
    cursor.toArray((error, documents) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, documents);
    });
  }

  /**
   * Fetch documents for the provided filter and options on the collection.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The filter.
   * @param {Object} options - The query options.
   *
   * @returns {Cursor} The cursor.
   */
  fetch(ns, filter, options) {
    return this._collection(ns).find(filter, options);
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
    this._collection(ns).findOneAndReplace(
      filter,
      replacement,
      options,
      (error, result) => {
        if (error) {
          return callback(this._translateMessage(error));
        }
        callback(null, result.value);
      }
    );
  }

  /**
   * Find one document and update it with the update operations.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The filter.
   * @param {Object} update - The update operations doc.
   * @param {Object} options - The query options.
   * @param {Function} callback - The callback.
   */
  findOneAndUpdate(ns, filter, update, options, callback) {
    this._collection(ns).findOneAndUpdate(
      filter,
      update,
      options,
      (error, result) => {
        if (error) {
          return callback(this._translateMessage(error));
        }
        callback(null, result.value);
      }
    );
  }

  /**
   * Returns explain plan for the provided filter and options on the collection.
   *
   * @param {String} ns - The namespace to search on.
   * @param {Object} filter - The query filter.
   * @param {Object} options - The query options, namely the explain verbosity,
   *                           e.g. {verbosity: 'allPlansExecution'}.
   * @param {Function} callback - The callback function.
   */
  explain(ns, filter, options, callback) {
    // @todo thomasr: driver explain() does not yet support verbosity,
    // once it does, should be passed along from the options object.
    this._collection(ns)
      .find(filter, options)
      .explain((error, explanation) => {
        if (error) {
          return callback(this._translateMessage(error));
        }
        callback(null, explanation);
      });
  }

  /**
   * Get the indexes for the collection.
   *
   * @param {String} ns - The collection namespace.
   * @param {Function} callback - The callback.
   */
  indexes(ns, callback) {
    getIndexes(this.client, ns, (error, data) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, data);
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
    this._collection(ns).insertOne(doc, options, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Inserts multiple documents into the database.
   *
   * @param {String} ns - The namespace.
   * @param {Array} docs - The documents to insert.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  insertMany(ns, docs, options, callback) {
    this._collection(ns).insertMany(docs, options, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Inserts multiple documents into the database.
   *
   * @param {String} ns - The namespace.
   * @param {Array} docs - The documents to insert.
   * @param {Object} options - The options.
   *
   * @returns {Promise} The promise.
   */
  putMany(ns, docs, options) {
    return this._collection(ns).insertMany(docs, options);
  }

  /**
   * Get the current instance details.
   *
   * @param {function} callback - The callback function.
   */
  instance(callback) {
    getInstance(this.client, this.database, (error, data) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, this._buildInstance(data));
    });
  }

  /**
   * Sample documents from the collection.
   *
   * @param {String} ns
   *  - The namespace to sample.
   * @param {Object} aggregationOptions
   *  - The sampling options.
   * @param {Object} aggregationOptions.query
   *  - The aggregation match stage. Won't be used if empty.
   * @param {Object} aggregationOptions.size
   *  - The size option for the match stage. Default to 1000
   * @param {Object} aggregationOptions.fields
   *  - The fields for the project stage. Won't be used if empty.
   * @param {Object} options
   *  - Driver options (ie. maxTimeMs, session, batchSize ...)
   * @return {Cursor} An AggregationCursor.
   */
  sample(ns, {
    query, size, fields
  } = {}, options = {}) {
    const pipeline = [];
    if (query && Object.keys(query).length > 0) {
      pipeline.push({
        $match: query
      });
    }

    pipeline.push({
      $sample: {
        size: size === 0 ? 0 : (size || DEFAULT_SAMPLE_SIZE)
      }
    });

    // add $project stage if projection (fields) was specified
    if (fields && Object.keys(fields).length > 0) {
      pipeline.push({
        $project: fields
      });
    }

    return this.aggregate(ns, pipeline, {
      allowDiskUse: true,
      ...options
    });
  }

  /**
   * Create a ClientSession that can be passed to commands.
   */
  startSession() {
    return this.client.startSession();
  }

  /**
   * Kill a session and terminate all in progress operations.
   * @param {ClientSession} clientSession
   *  - a ClientSession (can be created with startSession())
   */
  killSession(clientSession) {
    return this.database.admin().command({
      killSessions: [
        clientSession.id
      ]
    });
  }

  /**
   * Get the collection details for sharded collections.
   *
   * @param {String} ns - The full collection namespace.
   *
   * @param {Function} callback - The callback.
   */
  shardedCollectionDetail(ns, callback) {
    this.collectionDetail(ns, (error, data) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      if (!data.sharded) {
        return callback(null, data);
      }
      async.parallel(
        map(data.shards, (shardStats, shardName) => {
          return this._shardDistribution.bind(
            this,
            ns,
            shardName,
            data,
            shardStats
          );
        }),
        err => {
          if (err) {
            return callback(this._translateMessage(err));
          }
          callback(null, data);
        }
      );
    });
  }

  /**
   * Update a collection.
   *
   * @param {String} ns - The namespace.
   * @param {Object} flags - The flags.
   * @param {Function} callback - The callback.
   */
  updateCollection(ns, flags, callback) {
    var collectionName = this._collectionName(ns);
    var db = this._database(this._databaseName(ns));
    var collMod = { collMod: collectionName };
    var command = assignIn(collMod, flags);
    db.command(command, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
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
    this._collection(ns).updateOne(filter, update, options, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Updates multiple documents in the database.
   *
   * @param {String} ns - The namespace.
   * @param {Object} filter - The filter.
   * @param {Object} update - The update.
   * @param {Object} options - The options.
   * @param {Function} callback - The callback.
   */
  updateMany(ns, filter, update, options, callback) {
    this._collection(ns).updateMany(
      filter,
      update,
      options,
      (error, result) => {
        if (error) {
          return callback(this._translateMessage(error));
        }
        callback(null, result);
      }
    );
  }

  /**
   * Create a new view.
   * @param {String} name - The collectionName for the view.
   * @param {String} sourceNs - The source `<db>.<collectionOrViewName>` for the view.
   * @param {Array} pipeline - The agggregation pipeline for the view.
   * @param {Object} options - Options e.g. collation.
   * @param {Function} callback - The callback.
   * @option {Object} collation
   */
  createView(name, sourceNs, pipeline, options, callback) {
    options.viewOn = this._collectionName(sourceNs);
    options.pipeline = pipeline;

    this._database(this._databaseName(sourceNs)).createCollection(
      name,
      options,
      (error, result) => {
        if (error) {
          return callback(this._translateMessage(error));
        }
        callback(null, result);
      }
    );
  }
  /**
   * Update a view.
   * @param {String} name - The collectionName for the view.
   * @param {String} sourceNs - The source `<db>.<collectionOrViewName>` for the view.
   * @param {Array} pipeline - The agggregation pipeline for the view.
   * @param {Object} options - Options e.g. collation.
   * @param {Function} callback - The callback.
   * @option {Object} collation
   */
  updateView(name, sourceNs, pipeline, options, callback) {
    options.viewOn = this._collectionName(sourceNs);
    options.pipeline = pipeline;

    var collMod = { collMod: name };
    var command = assignIn(collMod, options);
    var db = this._database(this._databaseName(sourceNs));

    db.command(command, (error, result) => {
      if (error) {
        return callback(this._translateMessage(error));
      }
      callback(null, result);
    });
  }

  /**
   * Convenience for dropping a view as a passthrough to `dropCollection()`.
   *
   * @param {String} ns - The namespace.
   * @param {Function} callback - The callback.
   */
  dropView(ns, callback) {
    this.dropCollection(ns, callback);
  }

  /**
   * Merges the shard distribution information into the collection detail.
   *
   * @param {String} ns - The namespace.
   * @param {String} shardName - The shard name.
   * @param {Object} detail - The collection detail.
   * @param {Object} shardStats - The shard stats to merge into.
   * @param {Function} callback - The callback.
   */
  _shardDistribution(ns, shardName, detail, shardStats, callback) {
    var configDb = this._database('config');
    configDb
      .collection('shards')
      .findOne({ _id: shardName }, (error, shardDoc) => {
        if (error) {
          return callback(this._translateMessage(error));
        }
        configDb
          .collection('chunks')
          .count({ ns: ns, shard: shardName }, (err, chunkCount) => {
            if (err) {
              return callback(this._translateMessage(err));
            }
            assign(
              shardStats,
              this._buildShardDistribution(
                detail,
                shardStats,
                shardDoc,
                chunkCount
              )
            );
            callback(null);
          });
      });
  }

  /**
   * Builds the collection detail.
   *
   * @param {String} ns - The namespace.
   * @param {Object} data - The collection stats.
   *
   * @returns {Object} The collection detail.
   */
  _buildCollectionDetail(ns, data) {
    return assignIn(data.stats, {
      _id: ns,
      name: this._collectionName(ns),
      database: this._databaseName(ns),
      indexes: data.indexes
    });
  }

  /**
   * Build the shard distribution.
   *
   * @param {Object} detail - The collection details.
   * @param {Object} shardStats - The shard stats.
   * @param {Object} shardDoc - The shard doc.
   * @param {Integer} chunkCount - The chunk counts.
   *
   * @returns {Object} The details.
   */
  _buildShardDistribution(detail, shardStats, shardDoc, chunkCount) {
    return {
      host: shardDoc.host,
      shardData: shardStats.size,
      shardDocs: shardStats.count,
      estimatedDataPerChunk: shardStats.size / chunkCount,
      estimatedDocsPerChunk: Math.floor(shardStats.count / chunkCount),
      estimatedDataPercent:
        Math.floor((shardStats.size / detail.size || 0) * 10000) / 100,
      estimatedDocPercent:
        Math.floor((shardStats.count / detail.count || 0) * 10000) / 100
    };
  }

  /**
   * @todo: Durran: User JS style for keys, make builder.
   *
   * @param {String} databaseName - The name of the database.
   * @param {String} collectionName - The name of the collection.
   * @param {Object} data - The result of the collStats command.
   *
   * @return {Object} The collection stats.
   */
  _buildCollectionStats(databaseName, collectionName, data) {
    return {
      ns: databaseName + '.' + collectionName,
      name: collectionName,
      database: databaseName,
      is_capped: data.capped,
      max: data.max,
      is_power_of_two: data.userFlags === 1,
      index_sizes: data.indexSizes,
      document_count: data.count,
      document_size: data.size,
      storage_size: data.storageSize,
      index_count: data.nindexes,
      index_size: data.totalIndexSize,
      padding_factor: data.paddingFactor,
      extent_count: data.numExtents,
      extent_last_size: data.lastExtentSize,
      flags_user: data.userFlags,
      flags_system: data.systemFlags,
      max_document_size: data.maxSize,
      sharded: data.sharded || false,
      shards: data.shards || {},
      size: data.size,
      index_details: data.indexDetails || {},
      wired_tiger: data.wiredTiger || {},
    };
  }

  /**
   * Builds the database detail.
   *
   * @param {String} name - The database name.
   * @param {Object} db - The database statistics.
   *
   * @returns {Object} The database detail.
   */
  _buildDatabaseDetail(name, db) {
    return {
      _id: name,
      name: name,
      stats: db.stats,
      collections: db.collections
    };
  }

  /**
   * @todo: Durran: User JS style for keys, make builder.
   *
   * @param {Object} data - The result of the dbStats command.
   *
   * @return {Object} The database stats.
   */
  _buildDatabaseStats(data) {
    return {
      document_count: data.objects,
      document_size: data.dataSize,
      storage_size: data.storageSize,
      index_count: data.indexes,
      index_size: data.indexSize,
      extent_count: data.numExtents,
      file_size: data.fileSize,
      ns_size: data.nsSizeMB * 1024 * 1024
    };
  }

  /**
   * Build the instance detail.
   *
   * @param {Object} data The data.
   *
   * @returns {Object} The instance detail.
   */
  _buildInstance(data) {
    return assignIn(data, {
      _id: `${this.model.hostname}:${this.model.port}`,
      hostname: this.model.hostname,
      port: this.model.port
    });
  }

  /**
   * Get the collection to operate on.
   *
   * @param {string} ns - The namespace.
   * @returns {Collection} The collection.
   */
  _collection(ns) {
    return this._database(this._databaseName(ns)).collection(
      this._collectionName(ns)
    );
  }

  /**
   * Get the collection name from a namespace.
   *
   * @param {string} ns - The namespace in database.collection format.
   * @returns {string} The collection name.
   */
  _collectionName(ns) {
    return parseNamespace(ns).collection;
  }

  /**
   * Get the database name from a namespace.
   *
   * @param {string} ns - The namespace in database.collection format.
   * @returns {string} The database name.
   */
  _databaseName(ns) {
    return parseNamespace(ns).database;
  }

  /**
   * Get the database for the name.
   *
   * @param {String} name - The database name.
   *
   * @returns {DB} The database object.
   */
  _database(name) {
    return this.client.db(name);
  }

  /**
   * Determine if the ismaster response is for a writable server.
   *
   * @param {Object} evt - The topology description changed event.
   *
   * @returns {Boolean} If the server is writable.
   */
  _isWritable(evt) {
    const topologyType = evt.newDescription.type;
    // If type is SINGLE we must be connected to primary, standalone or mongos.
    if (topologyType === SINGLE) {
      const server = getFirstFromMap(evt.newDescription.servers);
      return server && WRITABLE_SERVER_TYPES.includes(server.type);
    }
    return WRITABLE_TYPES.includes(topologyType);
  }

  /**
   * Determine if we are connected to a mongos
   *
   * @param {Object} evt - The topology descriptiopn changed event.
   *
   * @returns {Boolean} If the server is a mongos.
   */
  _isMongos(evt) {
    return evt.newDescription.type === SHARDED;
  }

  /**
   * Translates the error message to something human readable.
   *
   * @param {Error} error - The error.
   *
   * @returns {Error} The error with message translated.
   */
  _translateMessage(error) {
    if (typeof error === 'string') {
      error = { message: error };
    } else {
      error.message = error.message || error.err || error.errmsg;
    }
    return error;
  }

  _cleanup() {
    this.client = null;
    this.connectionOptions = null;
    this.tunnel = null;
    this.isWritable = false;
    this.isMongos = false;
    this._isConnecting = false;
  }
}

function addDebugToClass(cls) {
  if (!debug.enabled) {
    return cls;
  }

  const proto = cls.prototype;
  for (const prop of Object.getOwnPropertyNames(proto)) {
    if (prop.startsWith('_')) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
    if (typeof descriptor.value !== 'function') {
      continue;
    }

    const orig = descriptor.value;
    descriptor.value = function(...args) {
      debug(`${prop}()`, args);
      if (args.length > 0 & typeof args[args.length - 1] === 'function') {
        const origCallback = args[args.length - 1];
        args[args.length - 1] = function(...callbackArgs) {
          debug(`${prop}()`, args, 'finished ->', callbackArgs);
          return origCallback.call(this, ...callbackArgs);
        };
      }
      return orig.call(this, ...args);
    };
    Object.defineProperty(proto, prop, descriptor);
  }
  return cls;
}

module.exports = addDebugToClass(NativeClient);
