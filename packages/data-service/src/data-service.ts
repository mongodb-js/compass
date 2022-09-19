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
  DeleteOptions,
  DeleteResult,
  Document,
  DropCollectionOptions,
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
import type {
  ConnectionFleOptions,
  ConnectionOptions,
} from './connection-options';
import type { InstanceDetails } from './instance-detail-helper';
import {
  adaptCollectionInfo,
  adaptDatabaseInfo,
  getPrivilegesByDatabaseAndCollection,
  checkIsCSFLEConnection,
  getInstance,
  getDatabasesByRoles,
  configuredKMSProviders,
} from './instance-detail-helper';
import { redactConnectionString } from './redact';
import connectMongoClient from './connect-mongo-client';
import type { CollectionInfo, CollectionInfoNameOnly } from './run-command';
import type {
  Callback,
  CollectionDetails,
  CollectionStats,
  IndexDetails,
} from './types';
import type { ConnectionStatusWithPrivileges } from './run-command';
import { runCommand } from './run-command';
import type { CSFLECollectionTracker } from './csfle-collection-tracker';
import { CSFLECollectionTrackerImpl } from './csfle-collection-tracker';

import * as mongodb from 'mongodb';

// TODO: replace any with proper types when the Node bundles native binding distributions
// https://jira.mongodb.org/browse/WRITING-10274
let ClientEncryption: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mongodbClientEncryption = require('mongodb-client-encryption');
  const extension = mongodbClientEncryption.extension;

  // mongodb-client-encryption only works properly in a packaged
  // environment with dependency injection
  ClientEncryption = extension(mongodb).ClientEncryption;
} catch (e) {
  console.warn(e);
}

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

class DataServiceOperationCancelledError extends Error {
  name = 'DataServiceOperationCancelledError';
  constructor() {
    super('The operation was cancelled.');
  }
  static isOperationCancelledError(error: Error) {
    return error.name === 'DataServiceOperationCancelledError';
  }
}

let id = 0;

type ClientType = 'CRUD' | 'META';
const kSessionClientType = Symbol('kSessionClientType');
interface CompassClientSession extends ClientSession {
  [kSessionClientType]: ClientType;
}

// In nodejs, AbortController support is from 15.x and we are currently on 14.x.
// With the implementation of cancellable actions using AbortSignal, we have custom AbortSignal
// type definition to avoid including DOM compiler options in tsconfig.
type AbortSignal = {
  readonly aborted: boolean;
  onabort: ((event: any) => void) | null;
  addEventListener: (
    type: string,
    listener: (event: any) => void,
    options: Record<string, unknown>
  ) => void;
  removeEventListener: (type: string, listener: (event: any) => void) => void;
};

export type ExplainExecuteOptions = {
  abortSignal?: AbortSignal;
  explainVerbosity?: keyof typeof mongodb.ExplainVerbosity;
};

export interface DataServiceEventMap {
  serverDescriptionChanged: (evt: ServerDescriptionChangedEvent) => void;
  serverOpening: (evt: ServerOpeningEvent) => void;
  serverClosed: (evt: ServerClosedEvent) => void;
  topologyOpening: (evt: TopologyOpeningEvent) => void;
  topologyClosed: (evt: TopologyClosedEvent) => void;
  topologyDescriptionChanged: (evt: TopologyDescriptionChangedEvent) => void;
  serverHeartbeatSucceeded: (evt: ServerHeartbeatSucceededEvent) => void;
  serverHeartbeatFailed: (evt: ServerHeartbeatFailedEvent) => void;
  collectionInfoFetched: (
    opts: { databaseName: string; nameOnly?: boolean },
    result: CollectionInfoNameOnly & Partial<CollectionInfo>
  ) => void;
}

export interface DataService {
  // TypeScript uses something like this itself for its EventTarget definitions.
  on<K extends keyof DataServiceEventMap>(
    event: K,
    listener: DataServiceEventMap[K]
  ): this;
  once<K extends keyof DataServiceEventMap>(
    event: K,
    listener: DataServiceEventMap[K]
  ): this;
  emit<K extends keyof DataServiceEventMap>(
    event: K,
    ...args: DataServiceEventMap[K] extends (...args: infer P) => any
      ? P
      : never
  ): unknown;

  getMongoClientConnectionOptions():
    | { url: string; options: MongoClientOptions }
    | undefined;
  getConnectionOptions(): Readonly<ConnectionOptions>;
  getConnectionString(): ConnectionStringUrl;
  getReadPreference(): ReadPreferenceLike;
  setCSFLEEnabled(enabled: boolean): void;
  configuredKMSProviders(): string[];

  /**
   * Get the kitchen sink information about a collection.
   *
   * @param ns - The namespace.
   * @param options - The options.
   * @param callback - The callback.
   */
  collection(ns: string, options: unknown, callback: Callback<Document>): void;

  /**
   * Get the stats for all collections in the database.
   *
   * @param databaseName - The database name.
   * @param callback - The callback.
   */
  collections(
    databaseName: string,
    callback: Callback<CollectionStats[]>
  ): void;

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
  ): void;

  /**
   * Returns normalized collection info provided by listCollection command for a
   * specific collection
   *
   * @param dbName database name
   * @param collName collection name
   */
  collectionInfo(
    dbName: string,
    collName: string
  ): Promise<ReturnType<typeof adaptCollectionInfo> | null>;

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
  ): void;

  /**
   * Is the data service allowed to perform write operations.
   *
   * @returns If the data service is writable.
   */
  isWritable(): boolean;

  /**
   * Is the data service connected to a mongos.
   *
   * @returns If the data service is connected to a mongos.
   */
  isMongos(): boolean;

  /**
   * Return the current topology type, as reported by the driver's topology
   * update events.
   *
   * @returns The current topology type.
   */
  currentTopologyType(): TopologyType;

  connectionStatus(): Promise<ConnectionStatusWithPrivileges>;

  /**
   * List all collections for a database.
   */
  listCollections(
    databaseName: string,
    filter?: Document,
    options?: {
      nameOnly?: true;
      privileges?:
        | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges']
        | null;
    }
  ): Promise<ReturnType<typeof adaptCollectionInfo>[]>;

  /**
   * List all databases on the currently connected instance.
   */
  listDatabases(options?: {
    nameOnly?: true;
    privileges?:
      | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges']
      | null;
    roles?:
      | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserRoles']
      | null;
  }): Promise<{ _id: string; name: string }[]>;

  connect(): Promise<void>;

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
  ): void;

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
  ): void;

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
  ): void;

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
  ): void;

  /**
   * Get the kitchen sink information about a database and all its collections.
   *
   * @param name - The database name.
   * @param options - The query options.
   * @param callback - The callback.
   */
  database(name: string, options: unknown, callback: Callback<Document>): void;

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
  ): void;

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
  ): void;

  /**
   * Disconnect the service.
   * @param callback - The callback.
   */
  disconnect(): Promise<void>;

  /**
   * Drops a collection from a database
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  dropCollection(ns: string, callback: Callback<boolean>): void;

  /**
   * Drops a database
   *
   * @param name - The database name.
   * @param callback - The callback.
   */
  dropDatabase(name: string, callback: Callback<boolean>): void;

  /**
   * Drops an index from a collection
   *
   * @param ns - The namespace.
   * @param name - The index name.
   * @param callback - The callback.
   */
  dropIndex(ns: string, name: string, callback: Callback<Document>): void;

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
  ): void;

  /**
   * Fetch documents for the provided filter and options on the collection.
   *
   * @param ns - The namespace to search on.
   * @param filter - The query filter.
   * @param options - The query options.
   */
  fetch(ns: string, filter: Filter<Document>, options: FindOptions): FindCursor;

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
  ): void;

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
  ): void;

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
    options: FindOptions,
    callback: Callback<Document>
  ): void;

  explainAggregate(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions,
    executionOptions?: ExplainExecuteOptions
  ): Promise<Document>;

  /**
   * Get the indexes for the collection.
   *
   * @param ns - The collection namespace.
   * @param options - The options (unused).
   * @param callback - The callback.
   */
  indexes(ns: string, options: unknown, callback: Callback<Document[]>): void;

  /**
   * Get the current instance details.
   */
  instance(): Promise<InstanceDetails>;

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
  ): void;

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
  ): void;

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
  ): Promise<InsertManyResult<Document>>;

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
  ): void;

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
  ): void;

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
  ): void;

  /**
   * Returns the results of currentOp.
   *
   * @param includeAll - if true also list currently idle operations in the result.
   * @param callback - The callback.
   */
  currentOp(includeAll: boolean, callback: Callback<Document>): void;

  /**
   * Returns the most recent topology description from the server's SDAM events.
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  getLastSeenTopology(): null | TopologyDescription;

  /**
   * Returns the result of serverStats.
   */
  serverstats(callback: Callback<Document>): void;

  /**
   * Returns the result of top.
   *
   * @param callback - the callback.
   */
  top(callback: Callback<Document>): void;

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
  ): void;

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
  ): void;

  /**
   * Convenience for dropping a view as a passthrough to `dropCollection()`.
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  dropView(ns: string, callback: Callback<boolean>): void;

  /**
   * Sample documents from the collection.
   *
   * @param ns  - The namespace to sample.
   * @param args - The sampling options.
   * @param options - Driver options (ie. maxTimeMs, session, batchSize ...)
   */
  sample(
    ns: string,
    args?: { query?: Filter<Document>; size?: number; fields?: Document },
    options?: AggregateOptions
  ): AggregationCursor;

  /**
   * Create a ClientSession that can be passed to commands.
   */
  startSession(clientType: ClientType): CompassClientSession;

  /**
   * Kill a session and terminate all in progress operations.
   * @param clientSession - a ClientSession (can be created with startSession())
   */
  killSessions(
    sessions: CompassClientSession | CompassClientSession[]
  ): Promise<Document>;

  isConnected(): boolean;

  isOperationCancelledError(error: Error): boolean;

  /**
   * Get the stats for a database.
   *
   * @param name - The database name.
   * @param callback - The callback.
   */
  databaseStats(
    name: string
  ): Promise<ReturnType<typeof adaptDatabaseInfo> & { name: string }>;

  /**
   * Create a new data encryption key (DEK) using the ClientEncryption
   * helper class.
   */
  createDataKey(provider: string, options?: unknown): Promise<Document>;
}

export class DataServiceImpl extends EventEmitter implements DataService {
  private readonly _connectionOptions: Readonly<ConnectionOptions>;
  private _isConnecting = false;
  private _mongoClientConnectionOptions?: {
    url: string;
    options: MongoClientOptions;
  };

  // Use two separate clients in the CSFLE case, one with CSFLE
  // enabled, one disabled. _initializedClient() can be used
  // to fetch the right one. _useCRUDClient can be used to control
  // this behavior after connecting, i.e. for disabling and
  // enabling CSFLE on an already-connected DataService instance.
  private _metadataClient?: MongoClient;
  private _crudClient?: MongoClient;
  private _useCRUDClient = true;
  private _csfleCollectionTracker?: CSFLECollectionTracker;

  private _tunnel?: SshTunnel;

  /**
   * Stores the most recent topology description from the server's SDAM events:
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  private _lastSeenTopology: TopologyDescription | null = null;

  private _isWritable = false;
  private _topologyType: TopologyType = 'Unknown';
  private _id: number;

  constructor(connectionOptions: Readonly<ConnectionOptions>) {
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
    return new ConnectionStringUrl(this._connectionOptions.connectionString);
  }

  getReadPreference(): ReadPreferenceLike {
    return this._initializedClient('CRUD').readPreference;
  }

  setCSFLEEnabled(enabled: boolean): void {
    log.info(mongoLogId(1_001_000_117), this._logCtx(), 'Setting CSFLE mode', {
      enabled,
    });
    this._useCRUDClient = enabled;
  }

  getCSFLEMode(): 'enabled' | 'disabled' | 'unavailable' {
    if (this._crudClient && checkIsCSFLEConnection(this._crudClient)) {
      if (this._useCRUDClient) {
        return 'enabled';
      } else {
        return 'disabled';
      }
    } else {
      return 'unavailable';
    }
  }

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
    // Note: The collStats command is not supported on CSFLE-enabled
    // clients, but the $collStats aggregation stage is.
    // When we're doing https://jira.mongodb.org/browse/COMPASS-5583,
    // we can switch this over to using the CRUD client instead.
    const db = this._initializedClient('META').db(databaseName);
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

  command(
    databaseName: string,
    comm: Document,
    callback: Callback<Document>
  ): void {
    const db = this._initializedClient('META').db(databaseName);
    db.command(comm, (error, result) => {
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  isWritable(): boolean {
    return this._isWritable;
  }

  isMongos(): boolean {
    return this._topologyType === 'Sharded';
  }

  currentTopologyType(): TopologyType {
    return this._topologyType;
  }

  async connectionStatus(): Promise<ConnectionStatusWithPrivileges> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_100),
      'Running connectionStatus'
    );
    try {
      const adminDb = this._initializedClient('META').db('admin');
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

  private async _getRolesOrFallback(
    roles:
      | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserRoles']
      | null = null
  ) {
    if (roles) {
      return roles;
    }
    const {
      authInfo: { authenticatedUserRoles },
    } = await this.connectionStatus();

    return authenticatedUserRoles;
  }

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

    const db = this._initializedClient('CRUD').db(databaseName);

    const listCollections = async () => {
      try {
        const cursor = db.listCollections(filter, { nameOnly });
        // Iterate instead of using .toArray() so we can emit
        // collection info update events as they come in.
        const results = [];
        for await (const result of cursor) {
          this.emit(
            'collectionInfoFetched',
            { databaseName, nameOnly },
            result
          );
          results.push(result);
        }
        return results;
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

  async listDatabases({
    nameOnly,
    privileges = null,
    roles = null,
  }: {
    nameOnly?: true;
    privileges?:
      | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges']
      | null;
    roles?:
      | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserRoles']
      | null;
  } = {}): Promise<{ _id: string; name: string }[]> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_033),
      'Running listDatabases',
      { nameOnly: nameOnly ?? false }
    );

    const adminDb = this._initializedClient('CRUD').db('admin');

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

    const getDatabasesFromRoles = async () => {
      const databases = getDatabasesByRoles(
        await this._getRolesOrFallback(roles),
        // https://jira.mongodb.org/browse/HELP-32199
        // Atlas shared tier MongoDB server version v5+ does not return
        // `authenticatedUserPrivileges` as part of the `connectionStatus`.
        // As a workaround we show the databases the user has
        // certain general built-in roles for.
        // This does not cover custom user roles which can
        // have custom privileges that we can't currently fetch.
        ['read', 'readWrite', 'dbAdmin', 'dbOwner']
      );
      return databases.map((name) => ({ name }));
    };

    try {
      const [listedDatabases, databasesFromPrivileges, databasesFromRoles] =
        await Promise.all([
          listDatabases(),
          getDatabasesFromPrivileges(),
          getDatabasesFromRoles(),
        ]);

      const databases = uniqueBy(
        // NB: Order is important, we want listed collections to take precedence
        // if they were fetched successfully
        [...databasesFromRoles, ...databasesFromPrivileges, ...listedDatabases],
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
    if (this._metadataClient) {
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
      csfle: this._csfleLogInformation(this._connectionOptions.fleOptions),
    });

    try {
      const [metadataClient, crudClient, tunnel, connectionOptions] =
        await connectMongoClient(
          this._connectionOptions,
          this.setupListeners.bind(this)
        );

      const attr = {
        isWritable: this.isWritable(),
        isMongos: this.isMongos(),
      };

      log.info(mongoLogId(1_001_000_015), this._logCtx(), 'Connected', attr);
      debug('connected!', attr);

      this._metadataClient = metadataClient;
      this._crudClient = crudClient;
      this._tunnel = tunnel;
      this._mongoClientConnectionOptions = connectionOptions;
      this._csfleCollectionTracker = new CSFLECollectionTrackerImpl(
        this,
        this._crudClient
      );
    } finally {
      this._isConnecting = false;
    }
  }

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
    this._collection(ns, 'CRUD').estimatedDocumentCount(
      options,
      (err, result) => {
        logop(err, result);
        callback(err, result!);
      }
    );
  }

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
    this._collection(ns, 'CRUD').countDocuments(
      filter,
      options,
      (err, result) => {
        logop(err, result);
        callback(err, result!);
      }
    );
  }

  createCollection(
    ns: string,
    options: CreateCollectionOptions,
    callback: Callback<Collection<Document>>
  ): void {
    const collectionName = this._collectionName(ns);
    const db = this._initializedClient('CRUD').db(this._databaseName(ns));
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
    this._collection(ns, 'CRUD').createIndex(spec, options, (error, result) => {
      logop(error);
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

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
    this._collection(ns, 'CRUD').deleteOne(filter, options, (error, result) => {
      logop(error, result);
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

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
    this._collection(ns, 'CRUD').deleteMany(
      filter,
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

  async disconnect(): Promise<void> {
    log.info(mongoLogId(1_001_000_016), this._logCtx(), 'Disconnecting');

    try {
      await Promise.all([
        this._metadataClient
          ?.close(true)
          .catch((err) => debug('failed to close MongoClient', err)),
        this._crudClient !== this._metadataClient &&
          this._crudClient
            ?.close(true)
            .catch((err) => debug('failed to close MongoClient', err)),
        this._tunnel
          ?.close()
          .catch((err) => debug('failed to close tunnel', err)),
      ]);
    } finally {
      this._cleanup();
      log.info(mongoLogId(1_001_000_017), this._logCtx(), 'Fully closed');
    }
  }

  dropCollection(ns: string, callback: Callback<boolean>): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_059),
      'Running dropCollection',
      { ns }
    );

    const client = this._initializedClient('CRUD');
    const db = client.db(this._databaseName(ns));
    const collName = this._collectionName(ns);
    const coll = db.collection(collName);

    db.listCollections({ name: collName }, { nameOnly: false }).toArray(
      (_errIgnore, result) => {
        const options: DropCollectionOptions = {};
        const encryptedFieldsInfo = result?.[0]?.options?.encryptedFields;
        if (encryptedFieldsInfo) {
          options.encryptedFields = encryptedFieldsInfo;
        }
        coll.drop(options, (error, result) => {
          logop(error, result);
          if (error) {
            // @ts-expect-error Callback without result...
            return callback(this._translateMessage(error));
          }
          callback(null, result!);
        });
      }
    );
  }

  dropDatabase(name: string, callback: Callback<boolean>): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_040),
      'Running dropDatabase',
      { db: name }
    );
    this._initializedClient('CRUD')
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

  dropIndex(ns: string, name: string, callback: Callback<Document>): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_060),
      'Running dropIndex',
      { ns, name }
    );
    this._collection(ns, 'CRUD').dropIndex(name, (error, result) => {
      logop(error, result);
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

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
    const cursor = this._collection(ns, 'CRUD').aggregate(pipeline, options);
    // async when a callback is provided
    if (isFunction(callback)) {
      process.nextTick(callback, null, cursor);
      return;
    }
    // otherwise return cursor
    return cursor;
  }

  find(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions,
    callback: Callback<Document[]>
  ): void {
    const logop = this._startLogOp(mongoLogId(1_001_000_042), 'Running find', {
      ns,
    });
    const cursor = this._collection(ns, 'CRUD').find(filter, options);
    cursor.toArray((error, documents) => {
      logop(error);
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, documents!);
    });
  }

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

    return this._collection(ns, 'CRUD').find(filter, options);
  }

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
    this._collection(ns, 'CRUD').findOneAndReplace(
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
    this._collection(ns, 'CRUD').findOneAndUpdate(
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

  explain(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions,
    callback: Callback<Document>
  ): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_046),
      'Running find explain',
      { ns }
    );
    // @todo thomasr: driver explain() does not yet support verbosity,
    // once it does, should be passed along from the options object.
    this._collection(ns, 'CRUD')
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

  explainAggregate(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions,
    executionOptions?: ExplainExecuteOptions
  ): Promise<Document> {
    const verbosity =
      executionOptions?.explainVerbosity ||
      mongodb.ExplainVerbosity.queryPlanner;
    let cursor: AggregationCursor;
    return this.cancellableOperation(
      (session?: ClientSession) => {
        cursor = this.aggregate(ns, pipeline, { ...options, session });
        return cursor.explain(verbosity);
      },
      () => cursor?.close(),
      executionOptions?.abortSignal
    );
  }

  indexes(ns: string, options: unknown, callback: Callback<Document[]>): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_047),
      'Listing indexes',
      { ns }
    );
    getIndexes(
      this._initializedClient('META'),
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

  async instance(): Promise<InstanceDetails> {
    try {
      const instanceData = {
        ...(await getInstance(this._initializedClient('META'))),
        // Need to get the CSFLE flag from the CRUD client, not the META one
        csfleMode: this.getCSFLEMode(),
      };

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
    this._collection(ns, 'CRUD').insertOne(doc, options, (error, result) => {
      logop(error, { acknowledged: result?.acknowledged });
      if (error) {
        // @ts-expect-error Callback without result...
        return callback(this._translateMessage(error));
      }
      callback(null, result!);
    });
  }

  insertMany(
    ns: string,
    docs: Document[],
    options: BulkWriteOptions,
    callback: Callback<InsertManyResult<Document>>
  ): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_049),
      'Running insertMany',
      { ns }
    );
    this._collection(ns, 'CRUD').insertMany(docs, options, (error, result) => {
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

  putMany(
    ns: string,
    docs: Document[],
    options: BulkWriteOptions
  ): Promise<InsertManyResult<Document>> {
    return this._collection(ns, 'CRUD').insertMany(docs, options);
  }

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
    const db = this._initializedClient('CRUD').db(this._databaseName(ns));
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
    this._collection(ns, 'CRUD').updateOne(
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
    this._collection(ns, 'CRUD').updateMany(
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

  currentOp(includeAll: boolean, callback: Callback<Document>): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_053),
      'Running currentOp'
    );
    this._initializedClient('META')
      .db('admin')
      .command({ currentOp: 1, $all: includeAll }, (error, result) => {
        logop(error);
        if (error) {
          const logop = this._startLogOp(
            mongoLogId(1_001_000_054),
            'Searching $cmd.sys.inprog manually'
          );
          this._initializedClient('META')
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

  getLastSeenTopology(): null | TopologyDescription {
    return this._lastSeenTopology;
  }

  serverstats(callback: Callback<Document>): void {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_061),
      'Running serverStats'
    );

    this._initializedClient('META')
      .db()
      .admin()
      .serverStatus((error, result) => {
        logop(error);

        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, result!);
      });
  }

  top(callback: Callback<Document>): void {
    const logop = this._startLogOp(mongoLogId(1_001_000_062), 'Running top');
    this._initializedClient('META')
      .db()
      .admin()
      .command({ top: 1 }, (error, result) => {
        logop(error);
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateMessage(error));
        }
        callback(null, result!);
      });
  }

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

    this._initializedClient('CRUD')
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
    const db = this._initializedClient('META').db(this._databaseName(sourceNs));

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

  dropView(ns: string, callback: Callback<boolean>): void {
    this.dropCollection(ns, callback);
  }

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

  startSession(clientType: ClientType): CompassClientSession {
    const session = this._initializedClient(
      clientType
    ).startSession() as CompassClientSession;
    session[kSessionClientType] = clientType;
    return session;
  }

  killSessions(
    sessions: CompassClientSession | CompassClientSession[]
  ): Promise<Document> {
    const sessionsArray = Array.isArray(sessions) ? sessions : [sessions];
    const clientTypes = new Set(
      sessionsArray.map((s) => s[kSessionClientType])
    );
    if (clientTypes.size !== 1) {
      throw new Error(
        `Cannot kill sessions without a specific client type: [${[
          ...clientTypes,
        ].join(', ')}]`
      );
    }
    const [clientType] = clientTypes;
    return this._initializedClient(clientType)
      .db('admin')
      .command({
        killSessions: sessionsArray.map((s) => s.id),
      });
  }

  isConnected(): boolean {
    // This is better than just returning internal `_isConnecting` as this
    // actually shows when the client is available on the NativeClient instance
    // and connected
    return !!this._metadataClient;
  }

  isOperationCancelledError(error: Error): boolean {
    return DataServiceOperationCancelledError.isOperationCancelledError(error);
  }

  private async cancellableOperation<T>(
    start: (session?: ClientSession) => Promise<T>,
    stop: () => Promise<void> = () => Promise.resolve(),
    abortSignal?: AbortSignal
  ): Promise<T> {
    if (!abortSignal) {
      return await start();
    }

    if (abortSignal.aborted) {
      throw new DataServiceOperationCancelledError();
    }

    const session = this.startSession('CRUD');

    let result: T;
    let abortListener;
    const pendingPromise = new Promise<never>((_resolve, reject) => {
      abortListener = () => reject(new DataServiceOperationCancelledError());
      abortSignal.addEventListener('abort', abortListener, { once: true });
    });

    const abort = async () => {
      const logAbortError = (error: Error) => {
        try {
          log.warn(
            mongoLogId(1_001_000_140),
            'CancelOp',
            'Attempting to kill the operation failed',
            { error: error.message }
          );
        } catch (e) {
          // ignore
        }
      };
      await stop().catch(logAbortError);
      await this.killSessions(session).catch(logAbortError);
    };

    try {
      result = await Promise.race([pendingPromise, start(session)]);
    } catch (err) {
      if (this.isOperationCancelledError(err as Error)) {
        void abort();
      }
      throw err;
    } finally {
      abortListener && abortSignal.removeEventListener('abort', abortListener);
    }

    return result;
  }

  /**
   * Subscribe to SDAM monitoring events on the mongo client.
   *
   * @param {MongoClient} client - The driver client.
   */
  private setupListeners(client: MongoClient): void {
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

  private _initializedClient(type: ClientType): MongoClient {
    if (type !== 'CRUD' && type !== 'META') {
      throw new Error(`Invalid client type: ${type as string}`);
    }
    const client =
      type === 'CRUD' && this._useCRUDClient
        ? this._crudClient
        : this._metadataClient;
    if (!client) {
      throw new Error('Client not yet initialized');
    }
    return client;
  }

  getCSFLECollectionTracker(): CSFLECollectionTracker {
    if (!this._csfleCollectionTracker) {
      throw new Error('Client not yet initialized');
    }
    return this._csfleCollectionTracker;
  }

  async databaseStats(
    name: string
  ): Promise<ReturnType<typeof adaptDatabaseInfo> & { name: string }> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_057),
      'Running databaseStats',
      { db: name }
    );
    try {
      const db = this._initializedClient('META').db(name);
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
  _collection(ns: string, type: ClientType): Collection {
    return this._initializedClient(type)
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
    this._metadataClient?.removeAllListeners?.();
    this._crudClient?.removeAllListeners?.();
    this._metadataClient = undefined;
    this._crudClient = undefined;
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

  configuredKMSProviders(): string[] {
    return configuredKMSProviders(
      this._connectionOptions.fleOptions?.autoEncryption
    );
  }

  _csfleLogInformation(
    fleOptions?: Readonly<ConnectionFleOptions>
  ): null | Record<string, unknown> {
    const kmsProviders = configuredKMSProviders(fleOptions?.autoEncryption);
    if (kmsProviders.length === 0) return null;
    return {
      storeCredentials: fleOptions?.storeCredentials,
      encryptedFieldsMapNamespaces: Object.keys({
        ...fleOptions?.autoEncryption?.encryptedFieldsMap,
        ...fleOptions?.autoEncryption?.schemaMap,
      }),
      keyVaultNamespace: fleOptions?.autoEncryption?.keyVaultNamespace,
      kmsProviders,
    };
  }

  async createDataKey(
    provider: any,
    options?: any
  ): Promise<Document> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_123),
      'Running createDataKey',
      { provider }
    );

    const clientEncryption = this._getClientEncryption();
    let result;
    try {
      result = await clientEncryption.createDataKey(provider, options ?? {});
    } catch (err) {
      logop(err);
      throw err;
    }
    logop(null);
    return result;
  }

  _getClientEncryption(): any {
    if (!ClientEncryption) {
      return;
    }

    const crudClient = this._initializedClient('CRUD');
    const autoEncryptionOptions = crudClient.options.autoEncryption;
    const { proxyHost, proxyPort, proxyUsername, proxyPassword } =
      crudClient.options;

    return new ClientEncryption(crudClient, {
      keyVaultNamespace: autoEncryptionOptions.keyVaultNamespace as string,
      kmsProviders: autoEncryptionOptions.kmsProviders,
      tlsOptions: autoEncryptionOptions.tlsOptions,
      proxyOptions: proxyHost
        ? {
            proxyHost,
            proxyPort,
            proxyUsername,
            proxyPassword,
          }
        : undefined,
    });
  }
}

export default DataService;
