import { promisify } from 'util';
import type SshTunnel from '@mongodb-js/ssh-tunnel';
import async from 'async';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { EventEmitter } from 'events';
import { isFunction } from 'lodash';
import type {
  AggregateOptions,
  AggregationCursor,
  BulkWriteOptions,
  ClientSession,
  Collection,
  CollStats,
  CommandFailedEvent,
  CommandSucceededEvent,
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
  ServerClosedEvent,
  ReadPreferenceLike,
  ServerDescription,
  ServerDescriptionChangedEvent,
  ServerHeartbeatFailedEvent,
  ServerHeartbeatSucceededEvent,
  ServerOpeningEvent,
  TopologyClosedEvent,
  TopologyDescription,
  TopologyDescriptionChangedEvent,
  TopologyOpeningEvent,
  TopologyType,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
} from 'mongodb';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import parseNamespace from 'mongodb-ns';
import type { ConnectionOptions } from './connection-options';
import type { InstanceDetails } from './instance-detail-helper';
import {
  adaptCollectionInfo,
  adaptDatabaseInfo,
  getPrivilegesByDatabaseAndCollection,
  getInstance,
} from './instance-detail-helper';
import { redactConnectionString } from './redact';
import connectMongoClient from './connect-mongo-client';
import type {
  Callback,
  CollectionDetails,
  CollectionStats,
  IndexDetails,
} from './types';
import type { ConnectionStatusWithPrivileges } from './run-command';
import { runCommand } from './run-command';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetch: getIndexes } = require('mongodb-index-model');

const { log, mongoLogId, debug } = createLoggerAndTelemetry(
  'COMPASS-DATA-SERVICE'
);

function uniqueBy<T extends Record<string, unknown>>(
  values: T[],
  key: keyof T
) {
  return Array.from(new Map(values.map((val) => [val[key], val])).values());
}

function isEmptyObject(obj: Record<string, unknown>) {
  return Object.keys(obj).length === 0;
}

let id = 0;

class DataService extends EventEmitter {
  private readonly _connectionOptions: ConnectionOptions;
  private _isConnecting = false;
  private _mongoClientConnectionOptions?: {
    url: string;
    options: MongoClientOptions;
  };

  private _client?: MongoClient;
  private _tunnel?: SshTunnel;

  /**
   * Stores the most recent topology description from the server's SDAM events:
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  private _lastSeenTopology: TopologyDescription | null = null;

  private _isWritable = false;
  private _topologyType: TopologyType = 'Unknown';
  private _id: number;

  constructor(connectionOptions: ConnectionOptions) {
    super();
    this._id = id++;
    this._connectionOptions = connectionOptions;
  }

  getMongoClientConnectionOptions():
    | { url: string; options: MongoClientOptions }
    | undefined {
    return this._mongoClientConnectionOptions;
  }

  private _logCtx(): string {
    return `Connection ${this._id}`;
  }

  getConnectionOptions(): Readonly<ConnectionOptions> {
    return this._connectionOptions;
  }

  getConnectionString(): ConnectionStringUrl {
    return new ConnectionStringUrl(this._connectionOptions.connectionString, {
      looseValidation: true,
    });
  }

  getReadPreference(): ReadPreferenceLike {
    return this._initializedClient.readPreference;
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_031),
      'Fetching collection info',
      { ns: `${databaseName}.${collectionName}` }
    );
    const db = this._initializedClient.db(databaseName);
    db.command({ collStats: collectionName, verbose: true }, (error, data) => {
      logop(error);
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
   * Returns normalized collection info provided by listCollection command for a
   * specific collection
   *
   * @param dbName database name
   * @param collName collection name
   */
  async collectionInfo(
    dbName: string,
    collName: string
  ): Promise<ReturnType<typeof adaptCollectionInfo> | null> {
    try {
      const [collInfo] = await this.listCollections(dbName, { name: collName });
      return collInfo ?? null;
    } catch (err) {
      throw this._translateMessage(err);
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
    const db = this._initializedClient.db(databaseName);
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
    return this._topologyType === 'Sharded';
  }

  /**
   * Return the current topology type, as reported by the driver's topology
   * update events.
   *
   * @returns The current topology type.
   */
  currentTopologyType(): TopologyType {
    return this._topologyType;
  }

  async connectionStatus(): Promise<ConnectionStatusWithPrivileges> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_100),
      'Running connectionStatus'
    );
    try {
      const adminDb = this._initializedClient.db('admin');
      const result = await runCommand(adminDb, {
        connectionStatus: 1,
        showPrivileges: true,
      });
      logop(null);
      return result;
    } catch (e) {
      logop(e);
      throw e;
    }
  }

  private async _getPrivilegesOrFallback(
    privileges:
      | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges']
      | null = null
  ) {
    if (privileges) {
      return privileges;
    }
    const {
      authInfo: { authenticatedUserPrivileges },
    } = await this.connectionStatus();
    return authenticatedUserPrivileges;
  }

  /**
   * List all collections for a database.
   */
  async listCollections(
    databaseName: string,
    filter: Document = {},
    {
      nameOnly,
      privileges = null,
    }: {
      nameOnly?: true;
      privileges?:
        | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges']
        | null;
    } = {}
  ): Promise<ReturnType<typeof adaptCollectionInfo>[]> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_032),
      'Running listCollections',
      { db: databaseName, nameOnly: nameOnly ?? false }
    );

    const db = this._initializedClient.db(databaseName);

    const listCollections = async () => {
      try {
        return await db.listCollections(filter, { nameOnly }).toArray();
      } catch (err) {
        // Currently Compass should not fail if listCollections failed for
        // any possible reason to preserve current behavior. We probably
        // want this to check at least that what we got back is a server
        // error and not a weird runtime issue on our side that can be
        // swallowed in this case, ideally we know exactly what server
        // errors we want to handle here and only avoid throwing in these
        // cases
        //
        // TODO: https://jira.mongodb.org/browse/COMPASS-5275
        log.warn(
          mongoLogId(1_001_000_099),
          this._logCtx(),
          'Failed to run listCollections',
          { message: (err as Error).message }
        );
        return [] as { name: string }[];
      }
    };

    const getCollectionsFromPrivileges = async () => {
      const databases = getPrivilegesByDatabaseAndCollection(
        await this._getPrivilegesOrFallback(privileges),
        ['find']
      );
      return Object.keys(
        // Privileges might not have a database we are looking for
        databases[databaseName] || {}
      )
        .filter(
          // Privileges can have collection name '' that indicates
          // privileges on all collections in the database, we don't want
          // those registered as "real" collection names
          Boolean
        )
        .map((name) => ({ name }));
    };

    try {
      const [listedCollections, collectionsFromPrivileges] = await Promise.all([
        listCollections(),
        // If the filter is not empty, we can't meaningfully derive collections
        // from privileges and filter them as the criteria might include any key
        // from the listCollections result object and there is no such info in
        // privileges. Because of that we are ignoring privileges completely if
        // listCollections was called with a filter.
        isEmptyObject(filter) ? getCollectionsFromPrivileges() : [],
      ]);

      const collections = uniqueBy(
        // NB: Order is important, we want listed collections to take precedence
        // if they were fetched successfully
        [...collectionsFromPrivileges, ...listedCollections],
        'name'
      ).map((coll) => adaptCollectionInfo({ db: databaseName, ...coll }));

      logop(null, { collectionsCount: collections.length });

      return collections;
    } catch (err) {
      logop(err);
      throw err;
    }
  }

  /**
   * List all databases on the currently connected instance.
   */
  async listDatabases({
    nameOnly,
    privileges = null,
  }: {
    nameOnly?: true;
    privileges?:
      | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges']
      | null;
  } = {}): Promise<{ _id: string; name: string }[]> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_033),
      'Running listDatabases',
      { nameOnly: nameOnly ?? false }
    );

    const adminDb = this._initializedClient.db('admin');

    const listDatabases = async () => {
      try {
        const { databases } = await runCommand(adminDb, {
          listDatabases: 1,
          nameOnly,
        } as {
          listDatabases: 1;
        });
        return databases;
      } catch (err) {
        // Currently Compass should not fail if listDatabase failed for any
        // possible reason to preserve current behavior. We probably want this
        // to check at least that what we got back is a server error and not a
        // weird runtime issue on our side that can be swallowed in this case,
        // ideally we know exactly what server errors we want to handle here
        // and only avoid throwing in these cases
        //
        // TODO: https://jira.mongodb.org/browse/COMPASS-5275
        log.warn(
          mongoLogId(1_001_000_098),
          this._logCtx(),
          'Failed to run listDatabases',
          { message: (err as Error).message }
        );
        return [];
      }
    };

    const getDatabasesFromPrivileges = async () => {
      const databases = getPrivilegesByDatabaseAndCollection(
        await this._getPrivilegesOrFallback(privileges),
        ['find']
      );
      return Object.keys(databases)
        .filter(
          // For the roles created in admin database, the database name
          // can be '' meaning that it applies to all databases. We can't
          // meaningfully handle this in the UI so we are filtering these
          // out
          Boolean
        )
        .map((name) => ({ name }));
    };

    try {
      const [listedDatabases, databasesFromPrivileges] = await Promise.all([
        listDatabases(),
        getDatabasesFromPrivileges(),
      ]);

      const databases = uniqueBy(
        // NB: Order is important, we want listed collections to take precedence
        // if they were fetched successfully
        [...databasesFromPrivileges, ...listedDatabases],
        'name'
      ).map((db) => {
        return { _id: db.name, name: db.name, ...adaptDatabaseInfo(db) };
      });

      logop(null, { databasesCount: databases.length });

      return databases;
    } catch (err) {
      logop(err);
      throw err;
    }
  }

  async connect(): Promise<void> {
    if (this._client) {
      debug('already connected');
      return;
    }

    if (this._isConnecting) {
      debug('connect method called more than once');
      return;
    }

    debug('connecting...');
    this._isConnecting = true;

    log.info(mongoLogId(1_001_000_014), this._logCtx(), 'Connecting', {
      url: redactConnectionString(this._connectionOptions.connectionString),
    });

    try {
      const [client, tunnel, connectionOptions] = await connectMongoClient(
        this._connectionOptions,
        this.setupListeners.bind(this)
      );

      const attr = {
        isWritable: this.isWritable(),
        isMongos: this.isMongos(),
      };

      log.info(mongoLogId(1_001_000_015), this._logCtx(), 'Connected', attr);
      debug('connected!', attr);

      this._client = client;
      this._tunnel = tunnel;
      this._mongoClientConnectionOptions = connectionOptions;
    } finally {
      this._isConnecting = false;
    }
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_034),
      'Running estimatedCount',
      { ns }
    );
    this._collection(ns).estimatedDocumentCount(options, (err, result) => {
      logop(err, result);
      callback(err, result!);
    });
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_035),
      'Running countDocuments',
      { ns }
    );
    this._collection(ns).countDocuments(filter, options, (err, result) => {
      logop(err, result);
      callback(err, result!);
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
    const db = this._initializedClient.db(this._databaseName(ns));
    const logop = this._startLogOp(
      mongoLogId(1_001_000_036),
      'Running createCollection',
      { ns, options }
    );

    db.createCollection(collectionName, options, (error, result) => {
      logop(error);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_037),
      'Running createIndex',
      { ns, spec, options }
    );
    this._collection(ns).createIndex(spec, options, (error, result) => {
      logop(error);
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
    const asyncColls = promisify(this.collections.bind(this));

    void Promise.all([this.databaseStats(name), asyncColls(name)]).then(
      ([stats, collections]) => {
        callback(null, this._buildDatabaseDetail(name, { stats, collections }));
      },
      (err) => {
        // @ts-expect-error callback without result
        callback(this._translateMessage(err));
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_038),
      'Running deleteOne',
      { ns }
    );
    this._collection(ns).deleteOne(filter, options, (error, result) => {
      logop(error, result);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_039),
      'Running deleteMany',
      { ns }
    );
    this._collection(ns).deleteMany(filter, options, (error, result) => {
      logop(error, result);
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
  async disconnect(): Promise<void> {
    log.info(mongoLogId(1_001_000_016), this._logCtx(), 'Disconnecting');

    try {
      await this._client
        ?.close(true)
        .catch((err) => debug('failed to close MongoClient', err));

      await this._tunnel
        ?.close()
        .catch((err) => debug('failed to close tunnel', err));
    } finally {
      this._cleanup();
      log.info(mongoLogId(1_001_000_017), this._logCtx(), 'Fully closed');
    }
  }

  /**
   * Drops a collection from a database
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  dropCollection(ns: string, callback: Callback<boolean>): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_059),
      'Running dropCollection',
      { ns }
    );
    this._collection(ns).drop((error, result) => {
      logop(error, result);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_040),
      'Running dropDatabase',
      { db: name }
    );
    this._initializedClient
      .db(this._databaseName(name))
      .dropDatabase((error, result) => {
        logop(error, result);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_060),
      'Running dropIndex',
      { ns, name }
    );
    this._collection(ns).dropIndex(name, (error, result) => {
      logop(error, result);
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
    log.info(mongoLogId(1_001_000_041), this._logCtx(), 'Running aggregation', {
      ns,
      stages: pipeline.map((stage) => Object.keys(stage)[0]),
    });
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
    const logop = this._startLogOp(mongoLogId(1_001_000_042), 'Running find', {
      ns,
    });
    const cursor = this._collection(ns).find(filter, options);
    cursor.toArray((error, documents) => {
      logop(error);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_043),
      'Running raw find',
      { ns }
    );

    logop(null);

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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_044),
      'Running findOneAndReplace',
      { ns }
    );
    this._collection(ns).findOneAndReplace(
      filter,
      replacement,
      options,
      (error, result) => {
        logop(error);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_045),
      'Running findOneAndUpdate',
      { ns }
    );
    this._collection(ns).findOneAndUpdate(
      filter,
      update,
      options,
      (error, result) => {
        logop(error);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_046),
      'Running find explain',
      { ns }
    );
    // @todo thomasr: driver explain() does not yet support verbosity,
    // once it does, should be passed along from the options object.
    this._collection(ns)
      .find(filter, options)
      .explain((error, explanation) => {
        logop(error);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_047),
      'Listing indexes',
      { ns }
    );
    getIndexes(
      this._initializedClient,
      ns,
      (error: Error | undefined, data: IndexDetails[]) => {
        logop(error);
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
   */
  async instance(): Promise<InstanceDetails> {
    try {
      const instanceData = await getInstance(this._initializedClient);

      log.info(
        mongoLogId(1_001_000_024),
        this._logCtx(),
        'Fetched instance information',
        {
          serverVersion: instanceData.build.version,
          genuineMongoDB: instanceData.genuineMongoDB,
          dataLake: instanceData.dataLake,
          featureCompatibilityVersion: instanceData.featureCompatibilityVersion,
        }
      );

      return instanceData;
    } catch (err) {
      throw this._translateMessage(err);
    }
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_048),
      'Running insertOne',
      { ns }
    );
    this._collection(ns).insertOne(doc, options, (error, result) => {
      logop(error, { acknowledged: result?.acknowledged });
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_049),
      'Running insertOne',
      { ns }
    );
    this._collection(ns).insertMany(docs, options, (error, result) => {
      logop(error, {
        acknowledged: result?.acknowledged,
        insertedCount: result?.insertedCount,
      });
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
   * @deprecated
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_050),
      'Running updateCollection',
      { ns }
    );
    const collectionName = this._collectionName(ns);
    const db = this._initializedClient.db(this._databaseName(ns));
    // Order of arguments is important here, collMod is a command name and it
    // should always be the first one in the object
    const command = {
      collMod: collectionName,
      ...flags,
    };
    db.command(command, (error, result) => {
      logop(error, result);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_051),
      'Running updateOne',
      { ns }
    );
    this._collection(ns).updateOne(filter, update, options, (error, result) => {
      logop(error, result);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_052),
      'Running updateMany',
      { ns }
    );
    this._collection(ns).updateMany(
      filter,
      update,
      options,
      (error, result) => {
        logop(error, result);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_053),
      'Running currentOp'
    );
    this._initializedClient
      .db('admin')
      .command({ currentOp: 1, $all: includeAll }, (error, result) => {
        logop(error);
        if (error) {
          const logop = this._startLogOp(
            mongoLogId(1_001_000_054),
            'Searching $cmd.sys.inprog manually'
          );
          this._initializedClient
            .db('admin')
            .collection('$cmd.sys.inprog')
            .findOne({ $all: includeAll }, (error2, result2) => {
              logop(error2);
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
    const logop = this._startLogOp(
      mongoLogId(1_001_000_061),
      'Running serverStats'
    );

    this._defaultDb.admin().serverStatus((error, result) => {
      logop(error);

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
    const logop = this._startLogOp(mongoLogId(1_001_000_062), 'Running top');
    this._defaultDb.admin().command({ top: 1 }, (error, result) => {
      logop(error);
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

    const logop = this._startLogOp(
      mongoLogId(1_001_000_055),
      'Running createView',
      {
        name,
        sourceNs,
        stages: pipeline.map((stage) => Object.keys(stage)[0]),
        options,
      }
    );

    this._initializedClient
      .db(this._databaseName(sourceNs))
      .createCollection(name, options, (error, result) => {
        logop(error, result);
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
    const db = this._initializedClient.db(this._databaseName(sourceNs));

    const logop = this._startLogOp(
      mongoLogId(1_001_000_056),
      'Running updateView',
      {
        name,
        sourceNs,
        stages: pipeline.map((stage) => Object.keys(stage)[0]),
        options,
      }
    );
    db.command(command, (error, result) => {
      logop(error, result);
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
    return this._initializedClient.startSession();
  }

  /**
   * Kill a session and terminate all in progress operations.
   * @param clientSession - a ClientSession (can be created with startSession())
   */
  killSessions(sessions: ClientSession | ClientSession[]): Promise<Document> {
    return this._initializedClient.db('admin').command({
      killSessions: Array.isArray(sessions)
        ? sessions.map((s) => s.id)
        : [sessions.id],
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
      client.on(
        'serverDescriptionChanged',
        (evt: ServerDescriptionChangedEvent) => {
          log.info(
            mongoLogId(1_001_000_018),
            this._logCtx(),
            'Server description changed',
            {
              address: evt.address,
              error: evt.newDescription.error?.message ?? null,
              previousType: evt.previousDescription.type,
              newType: evt.newDescription.type,
            }
          );
          this.emit('serverDescriptionChanged', evt);
        }
      );

      client.on('serverOpening', (evt: ServerOpeningEvent) => {
        log.info(mongoLogId(1_001_000_019), this._logCtx(), 'Server opening', {
          address: evt.address,
        });
        this.emit('serverOpening', evt);
      });

      client.on('serverClosed', (evt: ServerClosedEvent) => {
        log.info(mongoLogId(1_001_000_020), this._logCtx(), 'Server closed', {
          address: evt.address,
        });
        this.emit('serverClosed', evt);
      });

      client.on('topologyOpening', (evt: TopologyOpeningEvent) => {
        this.emit('topologyOpening', evt);
      });

      client.on('topologyClosed', (evt: TopologyClosedEvent) => {
        this.emit('topologyClosed', evt);
      });

      client.on(
        'topologyDescriptionChanged',
        (evt: TopologyDescriptionChangedEvent) => {
          this._isWritable = this._checkIsWritable(evt);
          this._topologyType = evt.newDescription.type;
          const attr = {
            isWritable: this.isWritable(),
            isMongos: this.isMongos(),
            previousType: evt.previousDescription.type,
            newType: evt.newDescription.type,
          };
          log.info(
            mongoLogId(1_001_000_021),
            this._logCtx(),
            'Topology description changed',
            attr
          );

          this._lastSeenTopology = evt.newDescription;
          this.emit('topologyDescriptionChanged', evt);
        }
      );

      // Heartbeat events are fairly noisy. We put some effort into
      // making sure that we only log events that actually contain
      // meaningful information.
      const heartbeatStatusMap = new Map<
        string,
        { failure: string | null; duration: number }
      >();
      const isSignificantDurationChange = (
        before: number,
        after: number
      ): boolean => {
        // Changes in pings below 200ms are not particularly concerning here.
        before = Math.max(before, 200);
        after = Math.max(after, 200);
        // Check if changes is at least 2× (in either direction).
        return Math.abs(Math.log2(before / after)) >= 1;
      };

      client.on(
        'serverHeartbeatSucceeded',
        (evt: ServerHeartbeatSucceededEvent) => {
          const previousStatus = heartbeatStatusMap.get(evt.connectionId);
          if (
            !previousStatus ||
            previousStatus.failure ||
            isSignificantDurationChange(previousStatus.duration, evt.duration)
          ) {
            heartbeatStatusMap.set(evt.connectionId, {
              failure: null,
              duration: evt.duration,
            });
            log.write({
              s: 'D2',
              id: mongoLogId(1_001_000_022),
              ctx: this._logCtx(),
              msg: 'Server heartbeat succeeded',
              attr: {
                connectionId: evt.connectionId,
                duration: evt.duration,
              },
            });
          }
          this.emit('serverHeartbeatSucceeded', evt);
        }
      );

      client.on('serverHeartbeatFailed', (evt: ServerHeartbeatFailedEvent) => {
        const previousStatus = heartbeatStatusMap.get(evt.connectionId);
        if (
          !previousStatus ||
          !previousStatus.failure ||
          isSignificantDurationChange(previousStatus.duration, evt.duration)
        ) {
          heartbeatStatusMap.set(evt.connectionId, {
            failure: evt.failure.message,
            duration: evt.duration,
          });
          log.warn(
            mongoLogId(1_001_000_023),
            this._logCtx(),
            'Server heartbeat failed',
            {
              connectionId: evt.connectionId,
              duration: evt.duration,
              failure: evt.failure.message,
            }
          );
        }
        this.emit('serverHeartbeatFailed', evt);
      });

      client.on('commandSucceeded', (evt: CommandSucceededEvent) => {
        const { address, connectionId, duration, commandName } = evt;
        log.write({
          s: 'D2',
          id: mongoLogId(1_001_000_029),
          ctx: this._logCtx(),
          msg: 'Driver command succeeded',
          attr: {
            address,
            serverConnectionId: connectionId,
            duration,
            commandName,
          },
        });
      });

      client.on('commandFailed', (evt: CommandFailedEvent) => {
        const { address, connectionId, duration, commandName, failure } = evt;
        log.write({
          s: 'D1',
          id: mongoLogId(1_001_000_030),
          ctx: this._logCtx(),
          msg: 'Driver command failed',
          attr: {
            address,
            serverConnectionId: connectionId,
            duration,
            commandName,
            failure: failure.message,
          },
        });
      });
    }
  }

  private get _initializedClient(): MongoClient {
    if (!this._client) {
      throw new Error('client not yet initialized');
    }
    return this._client;
  }

  private get _defaultDb(): Db {
    return this._initializedClient.db();
  }

  /**
   * Get the stats for a database.
   *
   * @param name - The database name.
   * @param callback - The callback.
   */
  async databaseStats(
    name: string
  ): Promise<ReturnType<typeof adaptDatabaseInfo> & { name: string }> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_057),
      'Running databaseStats',
      { db: name }
    );
    try {
      const db = this._initializedClient.db(name);
      const stats = await runCommand(db, { dbStats: 1 });
      const normalized = adaptDatabaseInfo(stats);
      return { name, ...normalized };
    } catch (err) {
      logop(err);
      throw this._translateMessage(err);
    }
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
      document_count: data.count ?? 0,
      document_size: data.size,
      avg_document_size: data.avgObjSize ?? 0,
      storage_size: data.storageSize ?? 0,
      free_storage_size: data.freeStorageSize ?? 0,
      index_count: data.nindexes ?? 0,
      index_size: data.totalIndexSize ?? 0,
      padding_factor: data.paddingFactor,
      extent_count: data.numExtents,
      extent_last_size: data.lastExtentSize,
      flags_user: data.userFlags,
      max_document_size: data.maxSize,
      size: data.size,
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
   * Get the collection to operate on.
   *
   * @param ns - The namespace.
   */
  // TODO: this is used directly in compass-import-export/collection-stream
  _collection(ns: string): Collection {
    return this._initializedClient
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
    // Since all we are interested in are collection names, we should
    // pass nameOnly: true. This speeds things up when collections are
    // actively being used because it means that the server has to
    // acquire fewer locks on the collections:
    // https://jira.mongodb.org/browse/SERVER-34244
    this.listCollections(databaseName, {}, { nameOnly: true }).then(
      (collections) => {
        const names = collections?.map((c) => c.name);
        callback(null, names);
      },
      (error) => {
        // @ts-expect-error Callback without result...
        callback(this._translateMessage(error));
      }
    );
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
  private _checkIsWritable(evt: TopologyDescriptionChangedEvent): boolean {
    return [...evt.newDescription.servers.values()].some(
      (server: ServerDescription) => server.isWritable
    );
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
    if (this._client) {
      this._client.removeAllListeners();
    }
    this._client = undefined;
    this._tunnel = undefined;
    this._mongoClientConnectionOptions = undefined;
    this._isWritable = false;
    this._topologyType = 'Unknown';
    this._isConnecting = false;
  }

  private _startLogOp(
    logId: ReturnType<typeof mongoLogId>,
    op: string,
    attr: any = {}
  ): (error: any, result?: any) => void {
    return (error: any, result: any) => {
      if (error) {
        const { message } = this._translateMessage(error);
        log.error(
          mongoLogId(1_001_000_058),
          this._logCtx(),
          'Failed to perform data service operation',
          {
            op,
            message,
            ...attr,
          }
        );
      } else {
        if (result) {
          attr = { ...attr, result };
        }
        if (Object.keys(attr).length > 0) {
          log.info(logId, this._logCtx(), op, attr);
        } else {
          log.info(logId, this._logCtx(), op);
        }
      }
    };
  }
}

export default DataService;
