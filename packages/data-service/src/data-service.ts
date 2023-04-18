import { callbackify } from 'util';
import type SshTunnel from '@mongodb-js/ssh-tunnel';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { EventEmitter } from 'events';
import type {
  AggregateOptions,
  AggregationCursor,
  AnyBulkWriteOperation,
  BulkWriteOptions,
  BulkWriteResult,
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
  ServerDescriptionChangedEvent,
  ServerOpeningEvent,
  ServerClosedEvent,
  ServerDescription,
  ServerHeartbeatFailedEvent,
  ServerHeartbeatSucceededEvent,
  TopologyDescription,
  TopologyDescriptionChangedEvent,
  TopologyType,
  Db,
  IndexInformationOptions,
  CollectionInfo,
} from 'mongodb';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import parseNamespace from 'mongodb-ns';
import type {
  ConnectionFleOptions,
  ConnectionOptions,
} from './connection-options';
import type { InstanceDetails } from './instance-detail-helper';
import {
  isNotAuthorized,
  isNotSupportedPipelineStage,
} from './instance-detail-helper';
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
import type { CloneableMongoClient } from './connect-mongo-client';
import connectMongoClient, { createClonedClient } from './connect-mongo-client';
import type { Callback, CollectionStats } from './types';
import type { ConnectionStatusWithPrivileges } from './run-command';
import { runCommand } from './run-command';
import type { CSFLECollectionTracker } from './csfle-collection-tracker';
import { CSFLECollectionTrackerImpl } from './csfle-collection-tracker';

import * as mongodb from 'mongodb';
import type { ClientEncryption as ClientEncryptionType } from 'mongodb-client-encryption';
import {
  raceWithAbort,
  createCancelError,
  isCancelError,
} from '@mongodb-js/compass-utils';
import type {
  IndexDefinition,
  IndexStats,
  IndexInfo,
} from './index-detail-helper';
import { createIndexDefinition } from './index-detail-helper';

// TODO: remove try/catch and refactor encryption related types
// when the Node bundles native binding distributions
// https://jira.mongodb.org/browse/WRITING-10274
let ClientEncryption: typeof ClientEncryptionType;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { extension } = require('mongodb-client-encryption');

  // mongodb-client-encryption only works properly in a packaged
  // environment with dependency injection
  ClientEncryption = extension(mongodb).ClientEncryption;
} catch (e) {
  console.warn(e);
}

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

type ClientType = 'CRUD' | 'META';
const kSessionClientType = Symbol('kSessionClientType');
interface CompassClientSession extends ClientSession {
  [kSessionClientType]: ClientType;
}

export type ExecutionOptions = {
  abortSignal?: AbortSignal;
};

export type ExplainExecuteOptions = ExecutionOptions & {
  explainVerbosity?: keyof typeof mongodb.ExplainVerbosity;
};

export interface DataServiceEventMap {
  topologyDescriptionChanged: (evt: TopologyDescriptionChangedEvent) => void;
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

  /*** Connection ***/

  /**
   * Connect the service
   */
  connect(): Promise<void>;

  /**
   * Disconnect the service
   */
  disconnect(): Promise<void>;

  /**
   * Returns whether or not current instance is connected
   */
  isConnected(): boolean;

  /**
   * Returns connection options passed to the driver on connection
   */
  getMongoClientConnectionOptions():
    | { url: string; options: MongoClientOptions }
    | undefined;

  /**
   * Returns connection options DataService was initialized with
   */
  getConnectionOptions(): Readonly<ConnectionOptions>;

  /**
   * Returns connection string for the connection options DataService was
   * initialized with
   */
  getConnectionString(): ConnectionStringUrl;

  /**
   * Return the current topology type, as reported by the driver's topology
   * update events.
   *
   * @returns The current topology type.
   */
  getCurrentTopologyType(): TopologyType;

  /**
   * Returns the most recent topology description from the server's SDAM events.
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  getLastSeenTopology(): null | TopologyDescription;

  /**
   * Is the data service allowed to perform write operations.
   * @returns If the data service is writable.
   */
  isWritable(): boolean;

  /**
   * Is the data service connected to a mongos.
   * @returns If the data service is connected to a mongos.
   */
  isMongos(): boolean;

  /*** Server Stats and Info ***/

  /**
   * Get the current instance details.
   */
  instance(): Promise<InstanceDetails>;

  /**
   * Returns the results of currentOp.
   *
   * @param includeAll - if true also list currently idle operations in the result.
   * @param callback - The callback.
   */
  currentOp(includeAll: boolean): Promise<{ inprog: Document }>;

  /**
   * Returns the result of serverStatus.
   */
  serverStatus(): Promise<Document>;

  /**
   * Returns the result of top.
   *
   * @param callback - the callback.
   */
  top(): Promise<{ totals: Record<string, unknown> }>;

  /**
   * Kills operation by operation id
   * @see {@link https://www.mongodb.com/docs/manual/reference/command/killOp/#mongodb-dbcommand-dbcmd.killOp}
   */
  killOp(id: number, comment?: string): Promise<Document>;

  /*** Collections ***/

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
   * Get the stats for a collection.
   *
   * @param databaseName - The database name.
   * @param collectionName - The collection name.
   */
  collectionStats(
    databaseName: string,
    collectionName: string
  ): Promise<CollectionStats>;

  /**
   * Creates a collection
   *
   * @param ns - The namespace.
   * @param options - The options.
   */
  createCollection(
    ns: string,
    options: CreateCollectionOptions
  ): Promise<Collection<Document>>;

  /**
   * Create a new view.
   *
   * @param name - The collectionName for the view.
   * @param sourceNs - The source `<db>.<collectionOrViewName>` for the view.
   * @param pipeline - The agggregation pipeline for the view.
   * @param options - Options e.g. collation.
   */
  createView(
    name: string,
    sourceNs: string,
    pipeline: Document[],
    options: CreateCollectionOptions
  ): Promise<Collection<Document>>;

  /**
   * Update a collection.
   *
   * @param ns - The namespace.
   * @param flags - The flags.
   */
  updateCollection(
    ns: string,
    // Collection name to update that will be passed to the collMod command will
    // be derived from the provided namespace, this is why we are explicitly
    // prohibiting to pass collMod flag here
    flags: Document & { collMod?: never }
  ): Promise<Document>;

  /**
   * Drops a collection from a database
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  dropCollection(ns: string): Promise<boolean>;

  /**
   * Count the number of documents in the collection.
   *
   * @param ns - The namespace to search on.
   * @param options - The query options.
   * @param executionOptions - The execution options.
   */
  estimatedCount(
    ns: string,
    options?: EstimatedDocumentCountOptions,
    executionOptions?: ExecutionOptions
  ): Promise<number>;

  /*** Databases ***/

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
   * Drops a database
   *
   * @param name - The database name
   */
  dropDatabase(name: string): Promise<boolean>;

  /*** Indexes ***/

  /**
   * Get the indexes for the collection.
   *
   * @param ns - The collection namespace.
   * @param options - Index information options
   */
  indexes(
    ns: string,
    options?: IndexInformationOptions
  ): Promise<IndexDefinition[]>;

  /**
   * Creates an index
   *
   * @param ns - The namespace.
   * @param spec - The index specification.
   * @param options - The options.
   */
  createIndex(
    ns: string,
    spec: IndexSpecification,
    options: CreateIndexesOptions
  ): Promise<string>;

  /**
   * Drops an index from a collection
   *
   * @param ns - The namespace.
   * @param name - The index name.
   */
  dropIndex(ns: string, name: string): Promise<Document>;

  /*** Aggregation ***/

  /**
   * Execute an aggregation framework pipeline with the provided options on the
   * collection.
   *
   * @param ns - The namespace to search on.
   * @param pipeline - The aggregation pipeline.
   * @param options - The aggregation options.
   * @param executionOptions - The execution options.
   */
  aggregate(
    ns: string,
    pipeline: Document[],
    options?: AggregateOptions,
    executionOptions?: ExecutionOptions
  ): Promise<Document[]>;

  /**
   * Returns an aggregation cursor on the collection.
   *
   * @param ns - The namespace to search on.
   * @param pipeline - The aggregation pipeline.
   * @param options - The aggregation options.
   */
  aggregateCursor(
    ns: string,
    pipeline: Document[],
    options?: AggregateOptions
  ): AggregationCursor;

  explainAggregate(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions,
    executionOptions?: ExplainExecuteOptions
  ): Promise<Document>;

  /*** Find ***/

  /**
   * Find documents for the provided filter and options on the collection.
   *
   * @param ns - The namespace to search on.
   * @param filter - The query filter.
   * @param options - The query options.
   * @param executionOptions - The execution options.
   */
  find(
    ns: string,
    filter: Filter<Document>,
    options?: FindOptions,
    executionOptions?: ExecutionOptions
  ): Promise<Document[]>;

  /**
   * Returns a find cursor on the collection.
   *
   * @param ns - The namespace to search on.
   * @param filter - The query filter.
   * @param options - The query options.
   */
  findCursor(
    ns: string,
    filter: Filter<Document>,
    options?: FindOptions
  ): FindCursor;

  /**
   * Returns explain plan for the provided filter and options on the collection.
   *
   * @param ns - The namespace to search on.
   * @param filter - The query filter.
   * @param options - The query options.
   * @param executionOptions - The execution options.
   */
  explainFind(
    ns: string,
    filter: Filter<Document>,
    options?: FindOptions,
    executionOptions?: ExplainExecuteOptions
  ): Promise<Document>;

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
   * Count the number of documents in the collection for the provided filter
   * and options.
   *
   * @param ns - The namespace to search on.
   * @param filter - The filter query.
   * @param options - The query options.
   * @param executionOptions - The execution options.
   */
  count(
    ns: string,
    filter: Filter<Document>,
    options?: CountDocumentsOptions,
    executionOptions?: ExecutionOptions
  ): Promise<number>;

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
    options?: AggregateOptions,
    executionOptions?: ExecutionOptions
  ): Promise<Document[]>;

  /*** Insert ***/

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
   * Performs multiple write operations with controls for order of execution.
   *
   * @param ns Namespace
   * @param operations An array of `bulkWrite()` write operations.
   * @param options `bulkWrite()` options
   *
   * @see {@link https://www.mongodb.com/docs/manual/reference/method/db.collection.bulkWrite/}
   */
  bulkWrite(
    ns: string,
    operations: AnyBulkWriteOperation[],
    options: BulkWriteOptions
  ): Promise<BulkWriteResult>;

  /*** Delete ***/

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
   * Helper method to check whether or not error is caused by dataService
   * operation being aborted
   *
   * @param error The error to check.
   */
  isCancelError(error: any): ReturnType<typeof isCancelError>;

  /**
   * Create a new data encryption key (DEK) using the ClientEncryption
   * helper class.
   */
  createDataKey(provider: string, options?: unknown): Promise<Document>;

  /**
   * Returns current CSFLE status (`enabled` or `disabled`) or `unavailable`
   * when no CSFLE configuration was provided to the dataService.
   *
   * Should default to `unavailable` on unsupported platforms
   */
  getCSFLEMode(): 'enabled' | 'disabled' | 'unavailable';

  /**
   * Change current CSFLE status
   */
  setCSFLEEnabled(enabled: boolean): void;

  /**
   * @see CSFLECollectionTracker.isUpdateAllowed
   */
  isUpdateAllowed: CSFLECollectionTracker['isUpdateAllowed'];

  /**
   * @see CSFLECollectionTracker.knownSchemaForCollection
   */
  knownSchemaForCollection: CSFLECollectionTracker['knownSchemaForCollection'];

  /**
   * Retuns a list of configured KMS providers for the current connection
   */
  configuredKMSProviders(): string[];
}

// Make arguments of a function mandatory for TS; This makes working
// with util.callbackify easier.
function allArgumentsMandatory<F extends (...args: any[]) => any>(
  fn: F
): F extends (...args: infer A) => infer R ? (...args: Required<A>) => R : F {
  return fn as any;
}

export class DataServiceImpl implements DataService {
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
  private _metadataClient?: CloneableMongoClient;
  private _crudClient?: CloneableMongoClient;
  private _useCRUDClient = true;
  private _csfleCollectionTracker?: CSFLECollectionTracker;

  private _tunnel?: SshTunnel;

  /**
   * Stores the most recent topology description from the server's SDAM events:
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  private _lastSeenTopology: TopologyDescription | null = null;

  private _isWritable = false;
  private _id: number;

  private _emitter = new EventEmitter();

  constructor(connectionOptions: Readonly<ConnectionOptions>) {
    this._id = id++;
    this._connectionOptions = connectionOptions;
  }

  on(...args: Parameters<DataService['on']>) {
    this._emitter.on(...args);
    return this;
  }

  once(...args: Parameters<DataService['on']>) {
    this._emitter.on(...args);
    return this;
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

  async collectionStats(
    databaseName: string,
    collectionName: string
  ): Promise<CollectionStats> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_031),
      'Fetching collection info',
      { ns: `${databaseName}.${collectionName}` }
    );
    // Note: The collStats command is not supported on CSFLE-enabled
    // clients, but the $collStats aggregation stage is.
    // When we're doing https://jira.mongodb.org/browse/COMPASS-5583,
    // we can switch this over to using the CRUD client instead.
    const db = this._database(databaseName, 'META');
    try {
      const data = await runCommand(db, { collStats: collectionName });
      logop(null, data);
      return this._buildCollectionStats(databaseName, collectionName, data);
    } catch (error) {
      logop(error);
      if (!(error as Error).message.includes('is a view, not a collection')) {
        throw this._translateErrorMessage(error);
      }
      return this._buildCollectionStats(databaseName, collectionName, {});
    }
  }

  async collectionInfo(
    dbName: string,
    collName: string
  ): Promise<ReturnType<typeof adaptCollectionInfo> | null> {
    try {
      const [collInfo] = await this.listCollections(dbName, { name: collName });
      return collInfo ?? null;
    } catch (err) {
      throw this._translateErrorMessage(err);
    }
  }

  async killOp(id: number, comment?: string): Promise<Document> {
    const db = this._database('admin', 'META');
    return runCommand(db, { killOp: 1, id, comment });
  }

  isWritable(): boolean {
    return this._isWritable;
  }

  isMongos(): boolean {
    return this.getCurrentTopologyType() === 'Sharded';
  }

  getCurrentTopologyType(): TopologyType {
    return this.getLastSeenTopology()?.type ?? 'Unknown';
  }

  private async _connectionStatus(): Promise<ConnectionStatusWithPrivileges> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_100),
      'Running connectionStatus'
    );
    try {
      const adminDb = this._database('admin', 'META');
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
    } = await this._connectionStatus();
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
    } = await this._connectionStatus();

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

    const db = this._database(databaseName, 'CRUD');

    const listCollections = async () => {
      try {
        const cursor = db.listCollections(filter, { nameOnly });
        // Iterate instead of using .toArray() so we can emit
        // collection info update events as they come in.
        const results = [];
        for await (const result of cursor) {
          if (!nameOnly) {
            this._csfleCollectionTracker?.updateCollectionInfo(
              `${databaseName}.${result.name}`,
              result
            );
          }
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

    const adminDb = this._database('admin', 'CRUD');

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
          this._setupListeners.bind(this)
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
    options: EstimatedDocumentCountOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<number> {
    log.info(
      mongoLogId(1_001_000_034),
      this._logCtx(),
      'Running estimatedCount',
      { ns }
    );

    let _session: ClientSession | undefined;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        _session = session;
        return this._collection(ns, 'CRUD').estimatedDocumentCount({
          ...options,
          session,
        });
      },
      () => _session!.endSession(),
      executionOptions?.abortSignal
    );
  }

  count(
    ns: string,
    filter: Filter<Document>,
    options: CountDocumentsOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<number> {
    log.info(
      mongoLogId(1_001_000_035),
      this._logCtx(),
      'Running countDocuments',
      { ns }
    );

    let _session: ClientSession | undefined;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        _session = session;
        return this._collection(ns, 'CRUD').countDocuments(filter, {
          ...options,
          session,
        });
      },
      () => _session!.endSession(),
      executionOptions?.abortSignal
    );
  }

  async createCollection(
    ns: string,
    options: CreateCollectionOptions
  ): Promise<Collection<Document>> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_036),
      'Running createCollection',
      { ns, options }
    );
    const collectionName = this._collectionName(ns);
    const db = this._database(ns, 'CRUD');
    try {
      const result = await db.createCollection(collectionName, options);
      logop(null, result);
      return result;
    } catch (error) {
      logop(error);
      throw this._translateErrorMessage(error);
    }
  }

  async createIndex(
    ns: string,
    spec: IndexSpecification,
    options: CreateIndexesOptions
  ): Promise<string> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_037),
      'Running createIndex',
      { ns, spec, options }
    );
    const coll = this._collection(ns, 'CRUD');
    try {
      const result = await coll.createIndex(spec, options);
      logop(null, result);
      return result;
    } catch (err) {
      logop(err);
      throw this._translateErrorMessage(err);
    }
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
    const coll = this._collection(ns, 'CRUD');
    callbackify(allArgumentsMandatory(coll.deleteOne.bind(coll)))(
      filter,
      options,
      (error, result) => {
        logop(error, result);
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateErrorMessage(error));
        }
        callback(null, result);
      }
    );
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
    const coll = this._collection(ns, 'CRUD');
    callbackify(allArgumentsMandatory(coll.deleteMany.bind(coll)))(
      filter,
      options,
      (error, result) => {
        logop(error, result);
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateErrorMessage(error));
        }
        callback(null, result);
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

  async dropCollection(ns: string): Promise<boolean> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_059),
      'Running dropCollection',
      { ns }
    );

    const db = this._database(ns, 'CRUD');
    const collName = this._collectionName(ns);
    const coll = db.collection(collName);

    let result: CollectionInfo | null = null;
    try {
      [result] = await db
        .listCollections({ name: collName }, { nameOnly: false })
        .toArray();
    } catch {
      // ignore
    }
    const options: DropCollectionOptions = {};
    const encryptedFieldsInfo = result?.options?.encryptedFields;
    if (encryptedFieldsInfo) {
      options.encryptedFields = encryptedFieldsInfo;
    }
    try {
      const result = await coll.drop(options);
      logop(null, result);
      return result;
    } catch (error) {
      logop(error);
      throw this._translateErrorMessage(error);
    }
  }

  async dropDatabase(name: string): Promise<boolean> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_040),
      'Running dropDatabase',
      { db: name }
    );
    const db = this._database(name, 'CRUD');
    try {
      const result = await db.dropDatabase();
      logop(null, result);
      return result;
    } catch (error) {
      logop(error);
      throw this._translateErrorMessage(error);
    }
  }

  async dropIndex(ns: string, name: string): Promise<Document> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_060),
      'Running dropIndex',
      { ns, name }
    );
    const coll = this._collection(ns, 'CRUD');
    try {
      const result = await coll.dropIndex(name);
      logop(null, result);
      return result;
    } catch (err) {
      logop(err);
      throw this._translateErrorMessage(err);
    }
  }

  aggregateCursor(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions = {}
  ): AggregationCursor {
    log.info(mongoLogId(1_001_000_041), this._logCtx(), 'Running aggregation', {
      ns,
      stages: pipeline.map((stage) => Object.keys(stage)[0]),
    });
    return this._collection(ns, 'CRUD').aggregate(pipeline, options);
  }

  aggregate<T = Document>(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<T[]> {
    let cursor: AggregationCursor;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        cursor = this.aggregateCursor(ns, pipeline, { ...options, session });
        const results = await cursor.toArray();
        void cursor.close();
        return results;
      },
      () => cursor?.close(),
      executionOptions?.abortSignal
    );
  }

  find(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<Document[]> {
    let cursor: FindCursor;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        cursor = this.findCursor(ns, filter, { ...options, session });
        const results = await cursor.toArray();
        void cursor.close();
        return results;
      },
      () => cursor?.close(),
      executionOptions?.abortSignal
    );
  }

  findCursor(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions = {}
  ): FindCursor {
    log.info(mongoLogId(1_001_000_043), this._logCtx(), 'Running find', { ns });

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
    const coll = this._collection(ns, 'CRUD');
    callbackify(allArgumentsMandatory(coll.findOneAndReplace.bind(coll)))(
      filter,
      replacement,
      options,
      (error, result) => {
        logop(error);
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateErrorMessage(error));
        }
        callback(null, result.value!);
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
    const coll = this._collection(ns, 'CRUD');
    callbackify(allArgumentsMandatory(coll.findOneAndUpdate.bind(coll)))(
      filter,
      update,
      options,
      (error, result) => {
        logop(error);
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateErrorMessage(error));
        }
        callback(null, result.value!);
      }
    );
  }

  explainFind(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions = {},
    executionOptions?: ExplainExecuteOptions
  ): Promise<Document> {
    const verbosity =
      executionOptions?.explainVerbosity ||
      mongodb.ExplainVerbosity.allPlansExecution;

    log.info(
      mongoLogId(1_001_000_046),
      this._logCtx(),
      'Running find explain',
      { ns, verbosity }
    );

    let cursor: FindCursor;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        cursor = this.findCursor(ns, filter, { ...options, session });
        const results = await cursor.explain(verbosity);
        void cursor.close();
        return results;
      },
      () => cursor?.close(),
      executionOptions?.abortSignal
    );
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

    log.info(
      mongoLogId(1_001_000_177),
      this._logCtx(),
      'Running aggregate explain',
      { ns, verbosity }
    );

    let cursor: AggregationCursor;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        cursor = this.aggregateCursor(ns, pipeline, { ...options, session });
        const results = await cursor.explain(verbosity);
        void cursor.close();
        return results;
      },
      () => cursor?.close(),
      executionOptions?.abortSignal
    );
  }

  private async _indexStats(ns: string) {
    try {
      const stats = await this.aggregate<IndexStats>(ns, [
        { $indexStats: {} },
        {
          $project: {
            name: 1,
            usageHost: '$host',
            usageCount: '$accesses.ops',
            usageSince: '$accesses.since',
          },
        },
      ]);

      return Object.fromEntries(
        stats.map((index) => {
          return [index.name, index];
        })
      );
    } catch (err) {
      if (isNotAuthorized(err) || isNotSupportedPipelineStage(err)) {
        return {};
      }
      throw err;
    }
  }

  private async _indexSizes(ns: string): Promise<Record<string, number>> {
    try {
      return (await this._collection(ns, 'META').stats()).indexSizes;
    } catch (err) {
      if (isNotAuthorized(err) || isNotSupportedPipelineStage(err)) {
        return {};
      }
      throw err;
    }
  }

  async indexes(
    ns: string,
    options?: IndexInformationOptions
  ): Promise<IndexDefinition[]> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_047),
      'Listing indexes',
      { ns }
    );
    try {
      const [indexes, indexStats, indexSizes] = await Promise.all([
        this._collection(ns, 'CRUD').indexes(options) as Promise<IndexInfo[]>,
        this._indexStats(ns),
        this._indexSizes(ns),
      ]);

      const maxSize = Math.max(...Object.values(indexSizes));

      const result = indexes.map((index) => {
        const name = index.name;
        return createIndexDefinition(
          ns,
          index,
          indexStats[name],
          indexSizes[name],
          maxSize
        );
      });

      logop(null);

      return result;
    } catch (err) {
      logop(err);
      throw this._translateErrorMessage(err);
    }
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
      throw this._translateErrorMessage(err);
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
    const coll = this._collection(ns, 'CRUD');
    callbackify(allArgumentsMandatory(coll.insertOne.bind(coll)))(
      doc,
      options,
      (error, result) => {
        logop(error, { acknowledged: result?.acknowledged });
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateErrorMessage(error));
        }
        callback(null, result);
      }
    );
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
    const coll = this._collection(ns, 'CRUD');
    callbackify(allArgumentsMandatory(coll.insertMany.bind(coll)))(
      docs,
      options,
      (error, result) => {
        logop(error, {
          acknowledged: result?.acknowledged,
          insertedCount: result?.insertedCount,
        });
        if (error) {
          // @ts-expect-error Callback without result...
          return callback(this._translateErrorMessage(error));
        }
        callback(null, result);
      }
    );
  }

  async updateCollection(
    ns: string,
    // Collection name to update that will be passed to the collMod command will
    // be derived from the provided namespace, this is why we are explicitly
    // prohibiting to pass collMod flag here
    flags: Document & { collMod?: never } = {}
  ): Promise<Document> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_050),
      'Running updateCollection',
      { ns }
    );
    const collectionName = this._collectionName(ns);
    const db = this._database(ns, 'CRUD');
    try {
      const result = await runCommand(db, {
        // Order of arguments is important here, collMod is a command name and it
        // should always be the first one in the object
        collMod: collectionName,
        ...flags,
      });
      logop(null, result);
      // Reset the CSFLE-enabled client (if any) to clear any collection
      // metadata caches that might still be active.
      await this._resetCRUDClient();
      return result;
    } catch (error) {
      logop(error);
      throw this._translateErrorMessage(error);
    }
  }

  bulkWrite(
    ns: string,
    operations: AnyBulkWriteOperation<Document>[],
    options: BulkWriteOptions
  ) {
    return this._collection(ns, 'CRUD').bulkWrite(operations, options);
  }

  async currentOp(includeAll: boolean): Promise<{ inprog: Document[] }> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_053),
      'Running currentOp'
    );
    const db = this._database('admin', 'META');
    try {
      const cmdResult = await runCommand(db, {
        currentOp: 1,
        $all: includeAll,
      });
      logop(null, cmdResult);
      return cmdResult;
    } catch (error) {
      logop(error);
      throw this._translateErrorMessage(error);
    }
  }

  getLastSeenTopology(): null | TopologyDescription {
    return this._lastSeenTopology;
  }

  async serverStatus(): Promise<Document> {
    const logop = this._startLogOp(
      mongoLogId(1_001_000_061),
      'Running serverStatus'
    );
    const admin = this._database('admin', 'META');
    try {
      const result = await runCommand(admin, { serverStatus: 1 });
      logop(null, result);
      return result;
    } catch (error) {
      logop(error);
      throw this._translateErrorMessage(error);
    }
  }

  async top(): Promise<{ totals: Record<string, unknown> }> {
    const logop = this._startLogOp(mongoLogId(1_001_000_062), 'Running top');
    const adminDb = this._database('admin', 'META');
    try {
      const result = await runCommand(adminDb, { top: 1 });
      logop(null, result);
      return result;
    } catch (error) {
      logop(error);
      throw this._translateErrorMessage(error);
    }
  }

  async createView(
    name: string,
    sourceNs: string,
    pipeline: Document[],
    options: CreateCollectionOptions = {}
  ): Promise<Collection<Document>> {
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

    const db = this._database(sourceNs, 'CRUD');

    try {
      const result = await db.createCollection(name, options);
      logop(null, result);
      return result;
    } catch (error) {
      logop(error);
      throw this._translateErrorMessage(error);
    }
  }

  sample(
    ns: string,
    {
      query,
      size,
      fields,
    }: { query?: Filter<Document>; size?: number; fields?: Document } = {},
    options: AggregateOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<Document[]> {
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

    return this.aggregate(
      ns,
      pipeline,
      {
        allowDiskUse: true,
        ...options,
      },
      executionOptions
    );
  }

  private _startSession(clientType: ClientType): CompassClientSession {
    const session = this._initializedClient(
      clientType
    ).startSession() as CompassClientSession;
    session[kSessionClientType] = clientType;
    return session;
  }

  private _killSessions(
    sessions: CompassClientSession | CompassClientSession[]
  ): Promise<unknown> {
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
    return runCommand(this._database('admin', clientType), {
      killSessions: sessionsArray.map((s) => s.id!),
    });
  }

  isConnected(): boolean {
    // This is better than just returning internal `_isConnecting` as this
    // actually shows when the client is available on the NativeClient instance
    // and connected
    return !!this._metadataClient;
  }

  private async _cancellableOperation<T>(
    start: (session?: ClientSession) => Promise<T>,
    stop: () => Promise<void> = () => Promise.resolve(),
    abortSignal?: AbortSignal
  ): Promise<T> {
    if (!abortSignal) {
      return await start();
    }

    if (abortSignal.aborted) {
      // AbortSignal.reason is supported from node v17.2.0.
      throw (abortSignal as any).reason ?? createCancelError();
    }

    const session = this._startSession('CRUD');

    let result: T;
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
      await this._killSessions(session).catch(logAbortError);
    };

    const logop = this._startLogOp(
      mongoLogId(1_001_000_179),
      'Running cancellable operation'
    );

    try {
      result = await raceWithAbort(start(session), abortSignal);
      logop(null);
    } catch (err) {
      logop(err);
      if (isCancelError(err)) {
        void abort();
      }
      throw err;
    }

    return result;
  }

  isCancelError(error: any): ReturnType<typeof isCancelError> {
    return isCancelError(error);
  }

  private _setupListeners(client: MongoClient): void {
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
        }
      );

      client.on('serverOpening', (evt: ServerOpeningEvent) => {
        log.info(mongoLogId(1_001_000_019), this._logCtx(), 'Server opening', {
          address: evt.address,
        });
      });

      client.on('serverClosed', (evt: ServerClosedEvent) => {
        log.info(mongoLogId(1_001_000_020), this._logCtx(), 'Server closed', {
          address: evt.address,
        });
      });

      client.on(
        'topologyDescriptionChanged',
        (evt: TopologyDescriptionChangedEvent) => {
          this._isWritable = this._checkIsWritable(evt);
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
          this._emitter.emit('topologyDescriptionChanged', evt);
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
            // TODO(COMPASS-6650): add debug to logging package
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
      });

      client.on('commandSucceeded', (evt: CommandSucceededEvent) => {
        const { address, connectionId, duration, commandName } = evt;
        // TODO(COMPASS-6650): add debug to logging package
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
        // TODO(COMPASS-6650): add debug to logging package
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

  private _getCSFLECollectionTracker(): CSFLECollectionTracker {
    if (!this._csfleCollectionTracker) {
      throw new Error('Client not yet initialized');
    }
    return this._csfleCollectionTracker;
  }

  isUpdateAllowed(ns: string, originalDocument: Document) {
    return this._getCSFLECollectionTracker().isUpdateAllowed(
      ns,
      originalDocument
    );
  }

  knownSchemaForCollection(ns: string) {
    return this._getCSFLECollectionTracker().knownSchemaForCollection(ns);
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
      const db = this._database(name, 'META');
      const stats = await runCommand(db, { dbStats: 1 });
      const normalized = adaptDatabaseInfo(stats);
      return { name, ...normalized };
    } catch (err) {
      logop(err);
      throw this._translateErrorMessage(err);
    }
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
   * Get the collection to operate on.
   *
   * @param ns - The namespace.
   */
  private _collection(ns: string, type: ClientType): Collection {
    return this._initializedClient(type)
      .db(this._databaseName(ns))
      .collection(this._collectionName(ns));
  }

  /**
   * Get the database to operate on.
   *
   * @param ns - The namespace.
   */
  private _database(ns: string, type: ClientType): Db {
    return this._initializedClient(type).db(this._databaseName(ns));
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
        callback(this._translateErrorMessage(error));
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
  private _translateErrorMessage(error: any): Error | { message: string } {
    if (typeof error === 'string') {
      error = { message: error };
    } else if (!error.message) {
      error.message = error.err || error.errmsg;
    }
    return error;
  }

  private _cleanup(): void {
    this._emitter.removeAllListeners();
    this._metadataClient?.removeAllListeners?.();
    this._crudClient?.removeAllListeners?.();
    this._metadataClient = undefined;
    this._crudClient = undefined;
    this._tunnel = undefined;
    this._mongoClientConnectionOptions = undefined;
    this._isWritable = false;
    this._isConnecting = false;
  }

  private async _resetCRUDClient(): Promise<void> {
    if (this.getCSFLEMode() === 'unavailable') {
      // No separate client in use, don't do anything
      return;
    }
    const crudClient = this._crudClient;
    if (!crudClient) {
      // In disconnected state, don't do anything
      return;
    }
    const newClient = await crudClient[createClonedClient]();
    if (this._crudClient === crudClient) {
      this._crudClient = newClient;
      await crudClient.close();
    } else {
      // If _crudClient has changed between start and end of
      // connection establishment, don't do anything, just
      // close and discard the new client.
      await newClient.close();
    }
  }

  private _startLogOp(
    logId: ReturnType<typeof mongoLogId>,
    op: string,
    attr: any = {}
  ): (error: any, result?: any) => void {
    return (error: any, result: any) => {
      if (error) {
        const { message } = this._translateErrorMessage(error);
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

  private _csfleLogInformation(
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
    provider: any /* ClientEncryptionDataKeyProvider */,
    options?: any /* ClientEncryptionCreateDataKeyProviderOptions */
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

  private _getClientEncryption() {
    if (!ClientEncryption) {
      throw new Error(
        'Cannot get client encryption, because the optional mongodb-client-encryption dependency is not installed'
      );
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

type NoExtraProps<T, U> = U & {
  [K in Exclude<keyof U, keyof T>]?: never;
};

function assertNoExtraProps<T>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cls: new (...args: any[]) => NoExtraProps<DataService, T>
) {
  // Checking that we are not exposing anything unexpected on our data service
  // implementation. This file will not compile if there are more public methods
  // on the DataServiceImpl than DataService interface allows
}

assertNoExtraProps(DataServiceImpl);

export default DataService;
