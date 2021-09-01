import SshTunnel from '@mongodb-js/ssh-tunnel';
import async from 'async';
import createDebug from 'debug';
import { EventEmitter } from 'events';
import { isFunction } from 'lodash';
import {
  AggregateOptions,
  AggregationCursor,
  BulkWriteOptions,
  ClientSession,
  Collection,
  CollectionInfo,
  CollStats,
  CountDocumentsOptions,
  CreateCollectionOptions,
  CreateIndexesOptions,
  Db,
  DeleteOptions,
  DeleteResult,
  Document,
  EstimatedDocumentCountOptions,
  ExplainOptions,
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
  MongoClientOptions,
  ReadPreferenceLike,
  ServerDescription,
  TopologyDescription,
  TopologyDescriptionChangedEvent,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
} from 'mongodb';
import ConnectionString from 'mongodb-connection-string-url';
import { ConnectionOptions } from './connection-options';
import { getInstance } from './instance-detail-helper';
import connect from './legacy-connect';
import {
  convertConnectionModelToOptions,
  LegacyConnectionModel,
} from './legacy-connection-model';
import {
  Callback,
  CollectionDetails,
  CollectionStats,
  IndexDetails,
  Instance,
  InstanceDetails,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetch: getIndexes } = require('mongodb-index-model');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseNamespace = require('mongodb-ns');

const debug = createDebug('mongodb-data-service:data-service');

class DataService extends EventEmitter {
  /**
   * Currently used in:
   * - compass-sidebar/store.js
   */
  model: LegacyConnectionModel;

  private _connectionOptions: ConnectionOptions;
  private _isConnecting = false;
  private _mongoClientConnectionOptions?: {
    url: string;
    options: MongoClientOptions;
  };

  private _client?: MongoClient;
  private _database?: Db;
  private _tunnel: SshTunnel | null = null;

  /**
   * Stores the most recent topology description from the server's SDAM events:
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  private _lastSeenTopology: TopologyDescription | null = null;

  private _isWritable = false;
  private _isMongos = false;

  constructor(model: LegacyConnectionModel) {
    super();
    this.model = model;
    this._connectionOptions = convertConnectionModelToOptions(model);
  }

  getMongoClientConnectionOptions():
    | { url: string; options: MongoClientOptions }
    | undefined {
    return this._mongoClientConnectionOptions;
  }

  getConnectionOptions(): Readonly<ConnectionOptions> {
    return this._connectionOptions;
  }

  getConnectionString(): ConnectionString {
    return new ConnectionString(this._connectionOptions.connectionString);
  }

  getReadPreference(): ReadPreferenceLike {
    return this.mongoClient.readPreference;
  }

  /**
   * Get the kitchen sink information about a collection.
   *
   * @param ns - The namespace.
   * @param options - The options.
   * @param callback - The callback.
   */
  collection(ns: string, options: unknown, callback: Callback<Document>): void {
    // @ts-expect-error async typings are not nice :(
    async.parallel(
      {
        stats: this.collectionStats.bind(
          this,
          this._databaseName(ns),
          this._collectionName(ns)
        ),
        indexes: this.indexes.bind(this, ns, options),
      },
      (
        error,
        coll: { stats: CollectionStats; indexes: { name: string }[] }
      ) => {
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, this._buildCollectionDetail(ns, coll));
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
    if (databaseName === 'system') {
      return callback(null, []);
    }
    this._collectionNames(databaseName, (error, names) => {
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
    const db = this.mongoClient.db(databaseName);
    db.command({ collStats: collectionName, verbose: true }, (error, data) => {
      if (error && !error.message.includes('is a view, not a collection')) {
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
    const db = this.mongoClient.db(databaseName);
    db.command(comm, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Is the data service allowed to perform write operations.
   *
   * @returns If the data service is writable.
   */
  isWritable(): boolean {
    return this._isWritable;
  }

  /**
   * Is the data service connected to a mongos.
   *
   * @returns If the data service is connected to a mongos.
   */
  isMongos(): boolean {
    return this._isMongos;
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
    const db = this.mongoClient.db(databaseName);
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
    this.mongoClient.db('admin').command(
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
   * Connect to the server.
   *
   * @param done - The callback function.
   */
  connect(done: Callback<DataService>): void {
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
      return;
    }

    // Not really true at that point, we are doing it just so we don't allow
    // simultaneous syncronous calls to the connect method
    this._isConnecting = true;

    connect(
      this.model,
      this.setupListeners.bind(this),
      (err, client, tunnel, connectionOptions) => {
        if (err) {
          this._isConnecting = false;
          // @ts-expect-error Callback without result...
          return done(this._translateMessage(err));
        }

        this._client = client;
        this._tunnel = tunnel;

        this._mongoClientConnectionOptions = connectionOptions;

        debug('connected!', {
          isWritable: this.isWritable(),
          isMongos: this.isMongos(),
        });

        this._database = this._client.db(this.model.ns || 'admin');

        done(null, this);
        this.emit('readable');
      }
    );
    return;
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
    const db = this.mongoClient.db(this._databaseName(ns));
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
   * @param options - The query options.
   * @param callback - The callback.
   */
  database(name: string, options: unknown, callback: Callback<Document>): void {
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
   * Deletes multiple documents from a collection.
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
   * Disconnect the service.
   * @param callback - The callback.
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

    this._client.close(true, (err) => {
      if (this._tunnel) {
        debug('mongo client closed. shutting down ssh tunnel');
        this._tunnel.close().finally(() => {
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
    this.mongoClient
      .db(this._databaseName(name))
      .dropDatabase((error, result) => {
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
   * collection.
   *
   *
   * @param ns - The namespace to search on.
   * @param pipeline - The aggregation pipeline.
   * @param options - The aggregation options.
   * @param callback - The callback function.
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
   * @param filter - The query filter.
   * @param options - The query options.
   * @param callback - The callback function.
   */
  find(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions,
    callback: Callback<Document[]>
  ): void {
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
   * @param filter - The query filter.
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
   * @param options - The query options.
   * @param callback - The callback function.
   */
  explain(
    ns: string,
    filter: Filter<Document>,
    options: ExplainOptions,
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
   * @param options - The options (unused).
   * @param callback - The callback.
   */
  indexes(ns: string, options: unknown, callback: Callback<Document>): void {
    getIndexes(
      this.mongoClient,
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
   * Get the current instance details.
   *
   * @param options - The options.
   * @param callback - The callback function.
   */
  instance(options: unknown, callback: Callback<Instance>): void {
    getInstance(this.mongoClient, this.db, ((error, instanceData) => {
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
   * Inserts multiple documents into the collection.
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
   * Inserts multiple documents into the collection.
   *
   * @param ns - The namespace.
   * @param docs - The documents to insert.
   * @param options - The options.
   */
  putMany(
    ns: string,
    docs: Document[],
    options: BulkWriteOptions
  ): Promise<InsertManyResult<Document>> {
    return this._collection(ns).insertMany(docs, options);
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
    // Collection name to update that will be passed to the collMod command will
    // be derived from the provided namespace, this is why we are explicitly
    // prohibiting to pass collMod flag here
    flags: Document & { collMod?: never },
    callback: Callback<Document>
  ): void {
    const collectionName = this._collectionName(ns);
    const db = this.mongoClient.db(this._databaseName(ns));
    // Order of arguments is important here, collMod is a command name and it
    // should always be the first one in the object
    const command = {
      collMod: collectionName,
      ...flags,
    };
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
    update: Document | UpdateFilter<Document>,
    options: UpdateOptions,
    callback: Callback<Document>
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
   * Updates multiple documents in the collection.
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
   * Returns the results of currentOp.
   *
   * @param includeAll - if true also list currently idle operations in the result.
   * @param callback - The callback.
   */
  currentOp(includeAll: boolean, callback: Callback<Document>): void {
    this.mongoClient
      .db('admin')
      .command({ currentOp: 1, $all: includeAll }, (error, result) => {
        if (error) {
          this.mongoClient
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
   * Returns the most recent topology description from the server's SDAM events.
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  getLastSeenTopology(): null | TopologyDescription {
    return this._lastSeenTopology;
  }

  /**
   * Returns the result of serverStats.
   */
  serverstats(callback: Callback<Document>): void {
    this.db.admin().serverStatus((error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Returns the result of top.
   *
   * @param callback - the callback.
   */
  top(callback: Callback<Document>): void {
    this.db.admin().command({ top: 1 }, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  /**
   * Create a new view.
   *
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

    this.mongoClient
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
   * Update an existing view.
   *
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

    const command = {
      collMod: name,
      ...options,
    };
    const db = this.mongoClient.db(this._databaseName(sourceNs));

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
   * Sample documents from the collection.
   *
   * @param ns  - The namespace to sample.
   * @param args - The sampling options.
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
        size: size === 0 ? 0 : size || 1000,
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
    return this.mongoClient.startSession();
  }

  /**
   * Kill a session and terminate all in progress operations.
   * @param clientSession - a ClientSession (can be created with startSession())
   */
  killSession(session: ClientSession): Promise<Document> {
    return this.mongoClient.db('admin').command({
      killSessions: [session.id],
    });
  }

  isConnected(): boolean {
    // This is better than just returning internal `_isConnecting` as this
    // actually shows when the client is available on the NativeClient instance
    // and connected
    return !!this._client;
  }

  /**
   * Subscribe to SDAM monitoring events on the mongo client.
   *
   * @param {MongoClient} client - The driver client.
   */
  private setupListeners(client: MongoClient): void {
    this._client = client;

    if (client) {
      client.on('status', (...args) => {
        debug('status', args);
        this.emit('status', args[0]);
      });

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
        this._isWritable = this.checkIsWritable(args[0]);
        this._isMongos = this.checkIsMongos(args[0]);
        debug('updated to', {
          isWritable: this.isWritable(),
          isMongos: this.isMongos(),
        });

        this._lastSeenTopology = args[0].newDescription;

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

  private get mongoClient(): MongoClient {
    if (!this._client) {
      throw new Error('client not yet initialized');
    }
    return this._client;
  }

  private get db(): Db {
    if (!this._database) {
      throw new Error('database not yet initialized');
    }
    return this._database;
  }

  /**
   * Get the stats for a database.
   *
   * @param name - The database name.
   * @param callback - The callback.
   */
  private databaseStats(name: string, callback: Callback<Document>): void {
    const db = this.mongoClient.db(name);
    db.command({ dbStats: 1 }, (error, data) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, this._buildDatabaseStats(data || {}));
    });
  }

  /**
   * Builds the collection detail.
   *
   * @param ns - The namespace.
   * @param data - The collection stats.
   */
  private _buildCollectionDetail(
    ns: string,
    data: { stats: CollectionStats; indexes: IndexDetails[] }
  ): CollectionDetails {
    return {
      ...data.stats,
      _id: ns,
      name: this._collectionName(ns),
      database: this._databaseName(ns),
      indexes: data.indexes,
    };
  }

  /**
   * @param databaseName - The name of the database.
   * @param collectionName - The name of the collection.
   * @param data - The result of the collStats command.
   */
  private _buildCollectionStats(
    databaseName: string,
    collectionName: string,
    data: Partial<CollStats>
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
  private _buildDatabaseDetail(name: string, db: Document): Document {
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
  private _buildDatabaseStats(data: Document): Document {
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
   * Get the collection to operate on.
   *
   * @param ns - The namespace.
   */
  // TODO: this is used directly in compass-import-export/collection-stream
  _collection(ns: string): Collection {
    return this.mongoClient
      .db(this._databaseName(ns))
      .collection(this._collectionName(ns));
  }

  /**
   * Get all the collection names for a database.
   *
   * @param databaseName - The database name.
   * @param callback - The callback.
   */
  private _collectionNames(
    databaseName: string,
    callback: Callback<string[]>
  ): void {
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
   * Get the collection name from a namespace.
   *
   * @param ns - The namespace in database.collection format.
   */
  private _collectionName(ns: string): string {
    return parseNamespace(ns).collection;
  }

  /**
   * Get the database name from a namespace.
   *
   * @param ns - The namespace in database.collection format.
   */
  private _databaseName(ns: string): string {
    return parseNamespace(ns).database;
  }

  /**
   * Determine if the hello response indicates a writable server.
   *
   * @param evt - The topology description changed event.
   *
   * @returns If the server is writable.
   */
  private checkIsWritable(evt: TopologyDescriptionChangedEvent): boolean {
    return [...evt.newDescription.servers.values()].some(
      (server: ServerDescription) => server.isWritable
    );
  }

  /**
   * Determine if we are connected to a mongos
   *
   * @param evt - The topology descriptiopn changed event.
   *
   * @returns If the server is a mongos.
   */
  private checkIsMongos(evt: TopologyDescriptionChangedEvent): boolean {
    return evt.newDescription.type === 'Sharded';
  }

  /**
   * Translates the error message to something human readable.
   *
   * @param error - The error.
   *
   * @returns The error with message translated.
   */
  private _translateMessage(error: any): Error | { message: string } {
    if (typeof error === 'string') {
      error = { message: error };
    } else {
      error.message = error.message || error.err || error.errmsg;
    }
    return error;
  }

  private _cleanup(): void {
    this._client = undefined;
    this._database = undefined;
    this._mongoClientConnectionOptions = undefined;
    this._tunnel = null;
    this._isWritable = false;
    this._isMongos = false;
    this._isConnecting = false;
  }
}

export = DataService;
