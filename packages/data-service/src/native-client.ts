import async from 'async';
import createDebug from 'debug';
import { EventEmitter } from 'events';
import { assignIn, isFunction, map } from 'lodash';
import {
  AggregateOptions,
  AggregationCursor,
  BulkWriteOptions,
  ClientSession,
  Collection,
  CollectionInfo,
  CollStats,
  ConnectionOptions,
  CountDocumentsOptions,
  CreateCollectionOptions,
  CreateIndexesOptions,
  Db,
  DeleteOptions,
  DeleteResult,
  Document,
  EstimatedDocumentCountOptions,
  Filter,
  FindCursor,
  FindOneAndReplaceOptions,
  FindOneAndUpdateOptions,
  FindOptions,
  IndexSpecification,
  InsertManyResult,
  InsertOneOptions,
  InsertOneResult,
  MongoClient,
  TopologyDescriptionChangedEvent,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
} from 'mongodb';
import { connect, ConnectionModel, SshTunnel } from 'mongodb-connection-model';
import { fetch as getIndexes, IndexDetails } from 'mongodb-index-model';
import parseNamespace from 'mongodb-ns';
import { getInstance } from './instance-detail-helper';
import {
  Callback,
  CollectionDetails,
  CollectionStats,
  Instance,
  InstanceDetails,
} from './types';

const debug = createDebug('mongodb-data-service:native-client');

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
 * The native client class.
 */
class NativeClient extends EventEmitter {
  readonly model: ConnectionModel;

  connectionOptions?: ConnectionOptions;
  tunnel?: SshTunnel;

  isWritable = false;
  isMongos = false;
  _isConnecting = false;

  private _client?: MongoClient;
  private _database?: Db;

  constructor(model: ConnectionModel) {
    super();
    this.model = model;
  }

  get database(): Db {
    if (!this._database) {
      throw new Error('NativeClient not yet initialized');
    }
    return this._database;
  }

  get client(): MongoClient {
    if (!this._client) {
      throw new Error('NativeClient not yet initialized');
    }
    return this._client;
  }

  isConnected(): boolean {
    // This is better than just returning internal `_isConnecting` as this
    // actually shows when the client is available on the NativeClient instance
    // and connected
    return !!this._client;
  }

  /**
   * Connect to the server.
   */
  connect(done: Callback<NativeClient>): NativeClient {
    debug('connecting...');

    if (this._isConnecting) {
      setImmediate(() => {
        // @ts-expect-error Callback without result...
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
      (
        err: Error,
        _client: MongoClient,
        tunnel: SshTunnel,
        connectionOptions: ConnectionOptions
      ) => {
        if (err) {
          this._isConnecting = false;
          // @ts-expect-error Callback without result...
          return done(this._translateMessage(err));
        }

        this.connectionOptions = connectionOptions;
        this.tunnel = tunnel;

        debug('connected!', {
          isWritable: this.isWritable,
          isMongos: this.isMongos,
        });

        this.client.on('status', (evt) => this.emit('status', evt));
        this._database = this.client.db(this.model.ns || ADMIN);

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
  setupListeners(client: MongoClient): void {
    this._client = client;

    if (client) {
      client.on('serverDescriptionChanged', (evt) => {
        debug('serverDescriptionChanged', evt);
        this.emit('serverDescriptionChanged', evt);
      });

      client.on('serverOpening', (...args) => {
        debug('serverOpening', args);
        this.emit('serverOpening', args[0]);
      });

      client.on('serverClosed', (...args) => {
        debug('serverClosed', args);
        this.emit('serverClosed', args[0]);
      });

      client.on('topologyOpening', (...args) => {
        debug('topologyOpening', args);
        this.emit('topologyOpening', args[0]);
      });

      client.on('topologyClosed', (...args) => {
        debug('topologyClosed', args);
        this.emit('topologyClosed', args[0]);
      });

      client.on('topologyDescriptionChanged', (...args) => {
        debug('topologyDescriptionChanged', args);
        this.isWritable = this._isWritable(args[0]);
        this.isMongos = this._isMongos(args[0]);
        debug('updated to', {
          isWritable: this.isWritable,
          isMongos: this.isMongos,
        });

        this.emit('topologyDescriptionChanged', args[0]);
      });

      client.on('serverHeartbeatSucceeded', (...args) => {
        debug('serverHeartbeatSucceeded', args);
        this.emit('serverHeartbeatSucceeded', args[0]);
      });

      client.on('serverHeartbeatFailed', (...args) => {
        debug('serverHeartbeatFailed', args);
        this.emit('serverHeartbeatFailed', args[0]);
      });
    }
  }

  /**
   * Execute a command.
   *
   * @param databaseName - The db name.
   * @param comm - The command.
   * @param callback - The callback.
   */
  command(
    databaseName: string,
    comm: Document,
    callback: Callback<Document>
  ): void {
    const db = this.client.db(databaseName);
    db.command(comm, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Count the number of documents in the collection.
   *
   * @param ns - The namespace to search on.
   * @param options - The query options.
   * @param callback - The callback function.
   */
  estimatedCount(
    ns: string,
    options: EstimatedDocumentCountOptions,
    callback: Callback<number>
  ): void {
    this._collection(ns).estimatedDocumentCount(options, (err, result) =>
      callback(err, result!)
    );
  }

  /**
   * Count the number of documents in the collection for the provided filter
   * and options.
   *
   * @param ns - The namespace to search on.
   * @param filter - The filter.
   * @param options - The query options.
   * @param callback - The callback function.
   */
  count(
    ns: string,
    filter: Filter<Document>,
    options: CountDocumentsOptions,
    callback: Callback<number>
  ): void {
    this._collection(ns).countDocuments(filter, options, (err, result) =>
      callback(err, result!)
    );
  }

  /**
   * Get the kitchen sink information about a collection.
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  collectionDetail(ns: string, callback: Callback<CollectionDetails>): void {
    // @ts-expect-error async typings are not nice :(
    async.parallel(
      {
        stats: this.collectionStats.bind(
          this,
          this._databaseName(ns),
          this._collectionName(ns)
        ),
        indexes: this.indexes.bind(this, ns),
      },
      (error, coll: { stats: CollectionStats; indexes: IndexDetails[] }) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, this._buildCollectionDetail(ns, coll));
      }
    );
  }

  /**
   * List all collections for a database.
   *
   * @param databaseName - The database name.
   * @param filter - The filter.
   * @param callback - The callback.
   */
  listCollections(
    databaseName: string,
    filter: Document,
    callback: Callback<CollectionInfo[]>
  ): void {
    const db = this.client.db(databaseName);
    db.listCollections(filter, {}).toArray((error, data) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, data!);
    });
  }

  /**
   * List all databases on the currently connected instance.
   *
   * @param callback - The callback.
   */
  listDatabases(callback: Callback<Document>): void {
    this.database.admin().command(
      {
        listDatabases: 1,
      },
      {
        readPreference: this.model.readPreference,
      },
      (error, result) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, result?.databases);
      }
    );
  }

  /**
   * Get the stats for all collections in the database.
   *
   * @param databaseName - The database name.
   * @param callback - The callback.
   */
  collections(
    databaseName: string,
    callback: Callback<CollectionStats[]>
  ): void {
    if (databaseName === SYSTEM) {
      return callback(null, []);
    }
    this.collectionNames(databaseName, (error, names) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      // @ts-expect-error async typings are not nice :(
      async.parallel(
        (names || []).map((name) => {
          return (done: Callback<CollectionStats>) => {
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
   * @param databaseName - The database name.
   * @param callback - The callback.
   */
  collectionNames(databaseName: string, callback: Callback<string[]>): void {
    this.listCollections(databaseName, {}, (error, collections) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      const names = collections?.map((c) => c.name);
      callback(null, names);
    });
  }

  /**
   * Get the currentOp.
   *
   * @param includeAll - if true also list currently idle operations in the result.
   * @param callback - The callback.
   */
  currentOp(includeAll: boolean, callback: Callback<Document>): void {
    this.database
      .admin()
      .command({ currentOp: 1, $all: includeAll }, (error, result) => {
        if (error) {
          this.client
            .db('admin')
            .collection('$cmd.sys.inprog')
            .findOne({ $all: includeAll }, (error2, result2) => {
              if (error2) {
                // @ts-expect-error Callback without result...
                return callback(this._translateMessage(error2));
              }
              callback(null, result2!);
            });
          return;
        }
        callback(null, result!);
      });
  }

  /**
   * Call serverStatus on the admin database.
   *
   * @param callback - The callback.
   */
  serverStats(callback: Callback<Document>): void {
    this.database.admin().serverStatus((error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Call top on the admin database.
   *
   * @param callback - The callback.
   */
  top(callback: Callback<Document>): void {
    this.database.admin().command({ top: 1 }, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Get the stats for a collection.
   *
   * @param databaseName - The database name.
   * @param collectionName - The collection name.
   * @param callback - The callback.
   */
  collectionStats(
    databaseName: string,
    collectionName: string,
    callback: Callback<CollectionStats>
  ): void {
    const db = this.client.db(databaseName);
    db.command({ collStats: collectionName, verbose: true }, (error, data) => {
      if (error && !error.message.includes(VIEW_ERROR)) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(
        null,
        this._buildCollectionStats(databaseName, collectionName, data || {})
      );
    });
  }

  /**
   * Creates a collection
   *
   * @param ns - The namespace.
   * @param options - The options.
   * @param callback - The callback.
   */
  createCollection(
    ns: string,
    options: CreateCollectionOptions,
    callback: Callback<Collection<Document>>
  ): void {
    const collectionName = this._collectionName(ns);
    const db = this.client.db(this._databaseName(ns));
    db.createCollection(collectionName, options, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Creates an index
   *
   * @param ns - The namespace.
   * @param spec - The index specification.
   * @param options - The options.
   * @param callback - The callback.
   */
  createIndex(
    ns: string,
    spec: IndexSpecification,
    options: CreateIndexesOptions,
    callback: Callback<string>
  ): void {
    this._collection(ns).createIndex(spec, options, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Get the kitchen sink information about a database and all its collections.
   *
   * @param name - The database name.
   * @param callback - The callback.
   */
  databaseDetail(name: string, callback: Callback<Document>): void {
    async.parallel(
      {
        stats: this.databaseStats.bind(this, name),
        collections: this.collections.bind(this, name),
      } as any,
      (error, db: any) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, this._buildDatabaseDetail(name, db));
      }
    );
  }

  /**
   * Get the stats for a database.
   *
   * @param name - The database name.
   * @param callback - The callback.
   */
  databaseStats(name: string, callback: Callback<Document>): void {
    const db = this.client.db(name);
    db.command({ dbStats: 1 }, (error, data) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, this._buildDatabaseStats(data || {}));
    });
  }

  /**
   * Delete a single document from the collection.
   *
   * @param ns - The namespace.
   * @param filter - The filter.
   * @param options - The options.
   * @param callback - The callback.
   */
  deleteOne(
    ns: string,
    filter: Filter<Document>,
    options: DeleteOptions,
    callback: Callback<DeleteResult>
  ): void {
    this._collection(ns).deleteOne(filter, options, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Deletes multiple documents from the collection.
   *
   * @param ns - The namespace.
   * @param filter - The filter.
   * @param options - The options.
   * @param callback - The callback.
   */
  deleteMany(
    ns: string,
    filter: Filter<Document>,
    options: DeleteOptions,
    callback: Callback<DeleteResult>
  ): void {
    this._collection(ns).deleteMany(filter, options, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Disconnect the client.
   * @param callback
   */
  disconnect(callback: Callback<never>): void {
    // This follows MongoClient behavior where calling `close` on client that is
    // not connected
    if (!this._client) {
      setImmediate(() => {
        // @ts-expect-error Callback without result...
        callback(null);
      });
      return;
    }

    this.client.close(true, (err) => {
      if (this.tunnel) {
        debug('mongo client closed. shutting down ssh tunnel');
        this.tunnel.close().finally(() => {
          this._cleanup();
          debug('ssh tunnel stopped');
          // @ts-expect-error Callback without result...
          callback(err);
        });
      } else {
        this._cleanup();
        // @ts-expect-error Callback without result...
        return callback(err);
      }
    });
  }

  /**
   * Drops a collection from a database
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  dropCollection(ns: string, callback: Callback<boolean>): void {
    this._collection(ns).drop((error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Drops a database
   *
   * @param name - The database name.
   * @param callback - The callback.
   */
  dropDatabase(name: string, callback: Callback<boolean>): void {
    this.client.db(this._databaseName(name)).dropDatabase((error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Drops an index from a collection
   *
   * @param ns - The namespace.
   * @param name - The index name.
   * @param callback - The callback.
   */
  dropIndex(ns: string, name: string, callback: Callback<Document>): void {
    this._collection(ns).dropIndex(name, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Execute an aggregation framework pipeline with the provided options on the
   * collection. Async if called with a callback function, otherwise function
   * returns a cursor. For more details, see
   * http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#aggregate
   *
   * @param ns - The namespace to search on.
   * @param pipeline - The aggregation pipeline.
   * @param options - The aggregation options.
   * @param callback - The callback (optional)
   */
  aggregate(
    ns: string,
    pipeline: Document[],
    options?: AggregateOptions
  ): AggregationCursor;
  aggregate(
    ns: string,
    pipeline: Document[],
    callback: Callback<AggregationCursor>
  ): void;
  aggregate(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions | undefined,
    callback: Callback<AggregationCursor>
  ): void;
  aggregate(
    ns: string,
    pipeline: Document[],
    options?: AggregateOptions | Callback<AggregationCursor>,
    callback?: Callback<AggregationCursor>
  ): AggregationCursor | void {
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
   * @param ns - The namespace to search on.
   * @param filter - The filter.
   * @param options - The query options.
   * @param callback - The callback.
   */
  find(
    ns: string,
    filter: Filter<Document> = {},
    options: FindOptions = {},
    callback: Callback<Document[]>
  ): void {
    // Workaround for https://jira.mongodb.org/browse/NODE-3173
    const cursor = this._collection(ns).find(filter, options);
    cursor.toArray((error, documents) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, documents!);
    });
  }

  /**
   * Fetch documents for the provided filter and options on the collection.
   *
   * @param ns - The namespace to search on.
   * @param filter - The filter.
   * @param options - The query options.
   */
  fetch(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions
  ): FindCursor {
    return this._collection(ns).find(filter, options);
  }

  /**
   * Find one document and replace it with the replacement.
   *
   * @param ns - The namespace to search on.
   * @param filter - The filter.
   * @param replacement - The replacement doc.
   * @param options - The query options.
   * @param callback - The callback.
   */
  findOneAndReplace(
    ns: string,
    filter: Filter<Document>,
    replacement: Document,
    options: FindOneAndReplaceOptions,
    callback: Callback<Document>
  ): void {
    this._collection(ns).findOneAndReplace(
      filter,
      replacement,
      options,
      (error, result) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, result!.value!);
      }
    );
  }

  /**
   * Find one document and update it with the update operations.
   *
   * @param ns - The namespace to search on.
   * @param filter - The filter.
   * @param update - The update operations doc.
   * @param options - The query options.
   * @param callback - The callback.
   */
  findOneAndUpdate(
    ns: string,
    filter: Filter<Document>,
    update: Document,
    options: FindOneAndUpdateOptions,
    callback: Callback<Document>
  ): void {
    this._collection(ns).findOneAndUpdate(
      filter,
      update,
      options,
      (error, result) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, result!.value!);
      }
    );
  }

  /**
   * Returns explain plan for the provided filter and options on the collection.
   *
   * @param ns - The namespace to search on.
   * @param filter - The query filter.
   * @param options - The query options, namely the explain verbosity,
   *                  e.g. {verbosity: 'allPlansExecution'}.
   * @param callback - The callback function.
   */
  explain(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions,
    callback: Callback<Document>
  ): void {
    // @todo thomasr: driver explain() does not yet support verbosity,
    // once it does, should be passed along from the options object.
    this._collection(ns)
      .find(filter, options)
      .explain((error, explanation) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, explanation);
      });
  }

  /**
   * Get the indexes for the collection.
   *
   * @param ns - The collection namespace.
   * @param callback - The callback.
   */
  indexes(ns: string, callback: Callback<IndexDetails[]>): void {
    getIndexes(
      this.client,
      ns,
      (error: Error | undefined, data: IndexDetails[]) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, data);
      }
    );
  }

  /**
   * Insert a single document into the database.
   *
   * @param ns - The namespace.
   * @param doc - The document to insert.
   * @param options - The options.
   * @param callback - The callback.
   */
  insertOne(
    ns: string,
    doc: Document,
    options: InsertOneOptions,
    callback: Callback<InsertOneResult<Document>>
  ): void {
    this._collection(ns).insertOne(doc, options, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Inserts multiple documents into the database.
   *
   * @param ns - The namespace.
   * @param docs - The documents to insert.
   * @param options - The options.
   * @param callback - The callback.
   */
  insertMany(
    ns: string,
    docs: Document[],
    options: BulkWriteOptions,
    callback: Callback<InsertManyResult<Document>>
  ): void {
    this._collection(ns).insertMany(docs, options, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Inserts multiple documents into the database.
   *
   * @param ns - The namespace.
   * @param docs - The documents to insert.
   * @param options - The options.
   *
   * @returns {Promise} The promise.
   */
  putMany(
    ns: string,
    docs: Document[],
    options: BulkWriteOptions
  ): Promise<InsertManyResult<Document>> {
    return this._collection(ns).insertMany(docs, options);
  }

  /**
   * Get the current instance details.
   *
   * @param callback - The callback function.
   */
  instance(callback: Callback<Instance>): void {
    getInstance(this.client, this.database, ((error, instanceData) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }

      const instance: Instance = {
        ...instanceData,
        _id: `${this.model.hostname}:${this.model.port}`,
        hostname: this.model.hostname,
        port: this.model.port,
      };
      callback(null, instance);
    }) as Callback<InstanceDetails>);
  }

  /**
   * Sample documents from the collection.
   *
   * @param ns - The namespace to sample.
   * @param aggregationOptions - The sampling options.
   * @param aggregationOptions.query - The aggregation match stage. Won't be used if empty.
   * @param aggregationOptions.size - The size option for the match stage. Default to 1000
   * @param aggregationOptions.fields - The fields for the project stage. Won't be used if empty.
   * @param options - Driver options (ie. maxTimeMs, session, batchSize ...)
   */
  sample(
    ns: string,
    {
      query,
      size,
      fields,
    }: { query?: Filter<Document>; size?: number; fields?: Document } = {},
    options: AggregateOptions = {}
  ): AggregationCursor {
    const pipeline = [];
    if (query && Object.keys(query).length > 0) {
      pipeline.push({
        $match: query,
      });
    }

    pipeline.push({
      $sample: {
        size: size === 0 ? 0 : size || DEFAULT_SAMPLE_SIZE,
      },
    });

    // add $project stage if projection (fields) was specified
    if (fields && Object.keys(fields).length > 0) {
      pipeline.push({
        $project: fields,
      });
    }

    return this.aggregate(ns, pipeline, {
      allowDiskUse: true,
      ...options,
    });
  }

  /**
   * Create a ClientSession that can be passed to commands.
   */
  startSession(): ClientSession {
    return this.client.startSession();
  }

  /**
   * Kill a session and terminate all in progress operations.
   * @param clientSession - a ClientSession (can be created with startSession())
   */
  killSession(clientSession: ClientSession): Promise<Document> {
    return this.database.admin().command({
      killSessions: [clientSession.id],
    });
  }

  /**
   * Get the collection details for sharded collections.
   *
   * @param ns - The full collection namespace.
   * @param callback - The callback.
   */
  shardedCollectionDetail(ns: string, callback: Callback<Document>): void {
    this.collectionDetail(ns, (error, data) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      if (!data?.sharded) {
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
        (err) => {
          if (err) {
            // @ts-expect-error Callback without result...
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
   * @param ns - The namespace.
   * @param flags - The flags.
   * @param callback - The callback.
   */
  updateCollection(
    ns: string,
    flags: Document,
    callback: Callback<Document>
  ): void {
    const collectionName = this._collectionName(ns);
    const db = this.client.db(this._databaseName(ns));
    const collMod = { collMod: collectionName };
    const command = assignIn<Document>(collMod, flags);
    db.command(command, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Update a single document in the collection.
   *
   * @param ns - The namespace.
   * @param filter - The filter.
   * @param update - The update.
   * @param options - The options.
   * @param callback - The callback.
   */
  updateOne(
    ns: string,
    filter: Filter<Document>,
    update: UpdateFilter<Document> | Document,
    options: UpdateOptions,
    callback: Callback<Document | UpdateResult>
  ): void {
    this._collection(ns).updateOne(filter, update, options, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Updates multiple documents in the database.
   *
   * @param ns - The namespace.
   * @param filter - The filter.
   * @param update - The update.
   * @param options - The options.
   * @param callback - The callback.
   */
  updateMany(
    ns: string,
    filter: Filter<Document>,
    update: UpdateFilter<Document>,
    options: UpdateOptions,
    callback: Callback<Document | UpdateResult>
  ): void {
    this._collection(ns).updateMany(
      filter,
      update,
      options,
      (error, result) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, result!);
      }
    );
  }

  /**
   * Create a new view.
   * @param name - The collectionName for the view.
   * @param sourceNs - The source `<db>.<collectionOrViewName>` for the view.
   * @param pipeline - The agggregation pipeline for the view.
   * @param options - Options e.g. collation.
   * @param callback - The callback.
   */
  createView(
    name: string,
    sourceNs: string,
    pipeline: Document[],
    options: CreateCollectionOptions,
    callback: Callback<Collection<Document>>
  ): void {
    options.viewOn = this._collectionName(sourceNs);
    options.pipeline = pipeline;

    this.client
      .db(this._databaseName(sourceNs))
      .createCollection(name, options, (error, result) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, result!);
      });
  }

  /**
   * Update a view.
   * @param name - The collectionName for the view.
   * @param sourceNs - The source `<db>.<collectionOrViewName>` for the view.
   * @param pipeline - The agggregation pipeline for the view.
   * @param options - Options e.g. collation.
   * @param callback - The callback.
   */
  updateView(
    name: string,
    sourceNs: string,
    pipeline: Document[],
    options: Document,
    callback: Callback<Document>
  ): void {
    options.viewOn = this._collectionName(sourceNs);
    options.pipeline = pipeline;

    const collMod = { collMod: name };
    const command = assignIn(collMod, options);
    const db = this.client.db(this._databaseName(sourceNs));

    db.command(command, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Convenience for dropping a view as a passthrough to `dropCollection()`.
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  dropView(ns: string, callback: Callback<boolean>): void {
    this.dropCollection(ns, callback);
  }

  /**
   * Merges the shard distribution information into the collection detail.
   *
   * @param ns - The namespace.
   * @param shardName - The shard name.
   * @param detail - The collection detail.
   * @param shardStats - The shard stats to merge into.
   * @param callback - The callback.
   */
  _shardDistribution(
    ns: string,
    shardName: string,
    detail: Document,
    shardStats: Document,
    callback: Callback<Document>
  ): void {
    const configDb = this.client.db('config');
    configDb
      .collection('shards')
      .findOne({ _id: shardName }, (error, shardDoc) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        configDb
          .collection('chunks')
          .count({ ns: ns, shard: shardName }, (err, chunkCount) => {
            if (err) {
              // @ts-expect-error Callback without result...
              return callback(this._translateMessage(err));
            }
            Object.assign(
              shardStats,
              this._buildShardDistribution(
                detail,
                shardStats,
                shardDoc!,
                chunkCount!
              )
            );
            // @ts-expect-error Callback without result...
            callback(null);
          });
      });
  }

  /**
   * Builds the collection detail.
   *
   * @param ns - The namespace.
   * @param data - The collection stats.
   */
  _buildCollectionDetail(
    ns: string,
    data: { stats: CollectionStats; indexes: IndexDetails[] }
  ): CollectionDetails {
    return assignIn<CollectionDetails>(data.stats, {
      _id: ns,
      name: this._collectionName(ns),
      database: this._databaseName(ns),
      indexes: data.indexes,
    });
  }

  /**
   * Build the shard distribution.
   *
   * @param detail - The collection details.
   * @param shardStats - The shard stats.
   * @param shardDoc - The shard doc.
   * @param chunkCount - The chunk counts.
   */
  _buildShardDistribution(
    detail: Document,
    shardStats: Document,
    shardDoc: Document,
    chunkCount: number
  ): Document {
    return {
      host: shardDoc.host,
      shardData: shardStats.size,
      shardDocs: shardStats.count,
      estimatedDataPerChunk: shardStats.size / chunkCount,
      estimatedDocsPerChunk: Math.floor(shardStats.count / chunkCount),
      estimatedDataPercent:
        Math.floor((shardStats.size / detail.size || 0) * 10000) / 100,
      estimatedDocPercent:
        Math.floor((shardStats.count / detail.count || 0) * 10000) / 100,
    };
  }

  /**
   * @todo: Durran: User JS style for keys, make builder.
   *
   * @param databaseName - The name of the database.
   * @param collectionName - The name of the collection.
   * @param data - The result of the collStats command.
   */
  _buildCollectionStats(
    databaseName: string,
    collectionName: string,
    data: Partial<CollStats & { shards: Document; sharded: boolean }>
  ): CollectionStats {
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
      max_document_size: data.maxSize,
      sharded: data.sharded || false,
      shards: data.shards || {},
      size: data.size,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      index_details: data.indexDetails || {},
      wired_tiger: data.wiredTiger || {},
    };
  }

  /**
   * Builds the database detail.
   *
   * @param name - The database name.
   * @param db - The database statistics.
   */
  _buildDatabaseDetail(name: string, db: Document): Document {
    return {
      _id: name,
      name: name,
      stats: db.stats,
      collections: db.collections,
    };
  }

  /**
   * @todo: Durran: User JS style for keys, make builder.
   *
   * @param data - The result of the dbStats command.
   *
   * @return The database stats.
   */
  _buildDatabaseStats(data: Document): Document {
    return {
      document_count: data.objects,
      document_size: data.dataSize,
      storage_size: data.storageSize,
      index_count: data.indexes,
      index_size: data.indexSize,
      extent_count: data.numExtents,
      file_size: data.fileSize,
      ns_size: data.nsSizeMB * 1024 * 1024,
    };
  }

  /**
   * Build the instance detail.
   *
   * @param data The data.
   *
   * @returns The instance detail.
   */
  _buildInstance(data: Instance): Document {
    return assignIn<Document>(data);
  }

  /**
   * Get the collection to operate on.
   *
   * @param ns - The namespace.
   */
  _collection(ns: string): Collection {
    return this.client
      .db(this._databaseName(ns))
      .collection(this._collectionName(ns));
  }

  /**
   * Get the collection name from a namespace.
   *
   * @param ns - The namespace in database.collection format.
   */
  _collectionName(ns: string): string {
    return parseNamespace(ns).collection;
  }

  /**
   * Get the database name from a namespace.
   *
   * @param ns - The namespace in database.collection format.
   */
  _databaseName(ns: string): string {
    return parseNamespace(ns).database;
  }

  /**
   * Determine if the ismaster response is for a writable server.
   *
   * @param evt - The topology description changed event.
   *
   * @returns If the server is writable.
   */
  _isWritable(evt: TopologyDescriptionChangedEvent): boolean {
    const topologyType = evt.newDescription.type;
    // If type is SINGLE we must be connected to primary, standalone or mongos.
    if (topologyType === SINGLE) {
      const server = [...evt.newDescription.servers.values()][0];
      return server && WRITABLE_SERVER_TYPES.includes(server.type);
    }
    return WRITABLE_TYPES.includes(topologyType);
  }

  /**
   * Determine if we are connected to a mongos
   *
   * @param evt - The topology descriptiopn changed event.
   *
   * @returns If the server is a mongos.
   */
  _isMongos(evt: TopologyDescriptionChangedEvent): boolean {
    return evt.newDescription.type === SHARDED;
  }

  /**
   * Translates the error message to something human readable.
   *
   * @param error - The error.
   *
   * @returns The error with message translated.
   */
  _translateMessage(error: any): Error | { message: string } {
    if (typeof error === 'string') {
      error = { message: error };
    } else {
      error.message = error.message || error.err || error.errmsg;
    }
    return error;
  }

  _cleanup(): void {
    this._client = undefined;
    this._database = undefined;

    this.connectionOptions = undefined;
    this.tunnel = undefined;
    this.isWritable = false;
    this.isMongos = false;
    this._isConnecting = false;
  }
}

function addDebugToClass(cls: any): any {
  if (!debug.enabled) {
    return cls;
  }

  const proto = cls.prototype;
  for (const prop of Object.getOwnPropertyNames(proto)) {
    if (prop.startsWith('_')) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
    if (typeof descriptor?.value !== 'function') {
      continue;
    }

    const orig = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      debug(`${prop}()`, args);
      if (args.length > 0 && typeof args[args.length - 1] === 'function') {
        const origCallback: any = args[args.length - 1];
        args[args.length - 1] = function (...callbackArgs: unknown[]) {
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

export type { NativeClient };
const WrappedClient: typeof NativeClient = addDebugToClass(NativeClient);
export default WrappedClient;
