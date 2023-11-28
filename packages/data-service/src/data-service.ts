import type SshTunnel from '@mongodb-js/ssh-tunnel';
import { EventEmitter } from 'events';
import { ExplainVerbosity, ClientEncryption } from 'mongodb';
import type {
  AggregateOptions,
  AggregationCursor,
  AnyBulkWriteOperation,
  BulkWriteOptions,
  BulkWriteResult,
  ClientSession,
  Collection,
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
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
  ReplaceOptions,
  ClientEncryptionDataKeyProvider,
  ClientEncryptionCreateDataKeyProviderOptions,
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
import type {
  CloneableMongoClient,
  ReauthenticationHandler,
} from './connect-mongo-client';
import {
  connectMongoClientDataService as connectMongoClient,
  createClonedClient,
} from './connect-mongo-client';
import type { CollectionStats } from './types';
import type { ConnectionStatusWithPrivileges } from './run-command';
import { runCommand } from './run-command';
import type { CSFLECollectionTracker } from './csfle-collection-tracker';
import { CSFLECollectionTrackerImpl } from './csfle-collection-tracker';
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
import type { SearchIndex } from './search-index-detail-helper';
import type {
  BoundLogger,
  DataServiceImplLogger,
  MongoLogId,
  UnboundDataServiceImplLogger,
} from './logger';
import { WithLogContext, debug, mongoLogId } from './logger';
import type {
  DevtoolsConnectOptions,
  DevtoolsConnectionState,
} from '@mongodb-js/devtools-connect';
import { omit } from 'lodash';

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
  explainVerbosity?: keyof typeof ExplainVerbosity;
};

export interface DataServiceEventMap {
  topologyDescriptionChanged: (evt: TopologyDescriptionChangedEvent) => void;
  connectionInfoSecretsChanged: () => void;
}

export type UpdatePreviewChange = {
  before: Document;
  after: Document;
};

export type UpdatePreviewExecutionOptions = ExecutionOptions & {
  sample?: number;
  timeout?: number;
};

export type UpdatePreview = {
  changes: UpdatePreviewChange[];
};

export interface DataService {
  // TypeScript uses something like this itself for its EventTarget definitions.
  on<K extends keyof DataServiceEventMap>(
    event: K,
    listener: DataServiceEventMap[K]
  ): this;
  off?<K extends keyof DataServiceEventMap>(
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
  connect(options?: {
    signal?: AbortSignal;
    productName?: string;
    productDocsLink?: string;
  }): Promise<void>;

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
    | { url: string; options: DevtoolsConnectOptions }
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
   */
  currentOp(): Promise<{ inprog: Document }>;

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
   *
   */
  renameCollection(
    ns: string,
    newCollectionName: string
  ): Promise<Collection<Document>>;

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

  /*** SearchIndexes ***/

  isListSearchIndexesSupported(ns: string): Promise<boolean>;

  getSearchIndexes(ns: string): Promise<SearchIndex[]>;

  createSearchIndex(
    ns: string,
    name: string,
    definition: Document
  ): Promise<string>;

  updateSearchIndex(
    ns: string,
    name: string,
    definition: Document
  ): Promise<void>;

  dropSearchIndex(ns: string, name: string): Promise<void>;

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
   */
  findOneAndReplace(
    ns: string,
    filter: Filter<Document>,
    replacement: Document,
    options?: FindOneAndReplaceOptions
  ): Promise<Document | null>;

  /**
   * Find one document and update it with the update operations.
   *
   * @param ns - The namespace to search on.
   * @param filter - The filter.
   * @param update - The update operations doc.
   * @param options - The query options.
   */
  findOneAndUpdate(
    ns: string,
    filter: Filter<Document>,
    update: Document,
    options?: FindOneAndUpdateOptions
  ): Promise<Document | null>;

  /**
   * Update one document.
   *
   * @param ns - The namespace to search on.
   * @param filter - The filter used to select the document to update.
   * @param update - The update operations to be applied to the document.
   * @param options - Optional settings for the command.
   */
  updateOne(
    ns: string,
    filter: Filter<Document>,
    update: Document,
    options?: UpdateOptions
  ): Promise<Document | null>;

  /**
   * Replace one document.
   *
   * @param ns - The namespace to search on.
   * @param filter - The filter.
   * @param replacement - The Document that replaces the matching document.
   * @param options - Optional settings for the command.
   */
  replaceOne(
    ns: string,
    filter: Filter<Document>,
    replacement: Document,
    options?: UpdateOptions
  ): Promise<Document | null>;

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
   */
  insertOne(
    ns: string,
    doc: Document,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<Document>>;

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
    options?: BulkWriteOptions
  ): Promise<InsertManyResult<Document>>;

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
   */
  deleteOne(
    ns: string,
    filter: Filter<Document>,
    options?: DeleteOptions
  ): Promise<DeleteResult>;

  /**
   * Deletes multiple documents from a collection.
   *
   * @param ns - The namespace.
   * @param filter - The filter.
   * @param options - The options.
   */
  deleteMany(
    ns: string,
    filter: Filter<Document>,
    options?: DeleteOptions
  ): Promise<DeleteResult>;

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
   * Returns a list of configured KMS providers for the current connection
   */
  configuredKMSProviders(): string[];

  /**
   * Register reauthentication handlers with this DataService instance.
   */
  addReauthenticationHandler(handler: ReauthenticationHandler): void;

  /**
   * Return the current state of ConnectionOptions secrets, which may have changed
   * since connecting (e.g. OIDC tokens). The `connectionInfoSecretsChanged` event
   * is being emitted when this value changes.
   */
  getUpdatedSecrets(): Promise<Partial<ConnectionOptions>>;

  /**
   * Runs the update within a transactions, only
   * modifying a subset of the documents matched by the filter.
   * It returns a list of the changed documents, or a serverError.
   */
  previewUpdate(
    ns: string,
    filter: Document,
    update: Document | Document[],
    executionOptions?: UpdatePreviewExecutionOptions
  ): Promise<UpdatePreview>;

  /**
   * Updates multiple documents from a collection.
   *
   * @param ns - The namespace.
   * @param filter - The filter.
   * @param update - The update.
   * @param options - The options.
   */
  updateMany(
    ns: string,
    filter: Filter<Document>,
    update: UpdateFilter<Document>,
    options?: UpdateOptions
  ): Promise<UpdateResult>;
}

const maybePickNs = ([ns]: unknown[]) => {
  if (typeof ns === 'string') {
    return { ns };
  }
};

const isPromiseLike = <T>(val: any): val is PromiseLike<T> => {
  return 'then' in val && typeof val.then === 'function';
};

/**
 * Translates the error message to something human readable.
 * @param error - The error.
 * @returns The error with message translated.
 */
const translateErrorMessage = (error: any): Error | { message: string } => {
  if (typeof error === 'string') {
    error = { message: error };
  } else if (!error.message) {
    error.message = error.err || error.errmsg;
  }
  return error;
};

/**
 * Decorator to do standard op handling that is applied to every public method
 * of the data service
 *
 * - transform error message before throwing
 * - log method success / failure
 */
function op<T extends unknown[], K>(
  logId: MongoLogId,
  pickLogAttrs: (
    args: T,
    result?: K extends Promise<infer R> ? R : K
  ) => unknown | undefined = maybePickNs
) {
  return function (
    target: (this: WithLogContext, ...args: T) => K,
    context: ClassMethodDecoratorContext<
      WithLogContext,
      (this: WithLogContext, ...args: T) => K
    >
  ) {
    const opName = String(context.name);
    return function (this: WithLogContext, ...args: T): K {
      const handleResult = (result: any) => {
        this._logger.info(
          logId,
          `Running ${opName}`,
          pickLogAttrs(args, result)
        );
        return result;
      };
      const handleError = (error: any) => {
        const err = translateErrorMessage(error);
        this._logger.error(
          mongoLogId(1_001_000_058),
          'Failed to perform data service operation',
          {
            op: opName,
            message: err,
            ...(pickLogAttrs(args) ?? {}),
          }
        );
        throw err;
      };
      try {
        const result = target.call(this, ...args);
        if (isPromiseLike<K extends Promise<infer R> ? R : never>(result)) {
          return result.then(handleResult, handleError) as K;
        } else {
          return handleResult(result);
        }
      } catch (error) {
        return handleError(error);
      }
    };
  };
}

class DataServiceImpl extends WithLogContext implements DataService {
  private readonly _connectionOptions: Readonly<ConnectionOptions>;
  private _isConnecting = false;
  private _mongoClientConnectionOptions?: {
    url: string;
    options: DevtoolsConnectOptions;
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
  private _state?: DevtoolsConnectionState;
  private _reauthenticationHandlers = new Set<ReauthenticationHandler>();

  /**
   * Stores the most recent topology description from the server's SDAM events:
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  private _lastSeenTopology: TopologyDescription | null = null;

  private _isWritable = false;
  private _id: number;

  private _emitter = new EventEmitter();

  /**
   * Directly used during data-service runtime, auto sets component and context
   * with a connection id
   */
  protected _logger: BoundLogger;

  /**
   * To be passed to the connect-mongo-client
   */
  private _unboundLogger?: UnboundDataServiceImplLogger;

  constructor(
    connectionOptions: Readonly<ConnectionOptions>,
    logger?: DataServiceImplLogger
  ) {
    super();
    this._id = id++;
    this._connectionOptions = connectionOptions;
    const logComponent = 'COMPASS-DATA-SERVICE';
    const logCtx = `Connection ${this._id}`;
    this._logger = {
      debug: (logId, ...args) => {
        return logger?.debug(logComponent, logId, logCtx, ...args);
      },
      info: (logId, ...args) => {
        return logger?.info(logComponent, logId, logCtx, ...args);
      },
      warn: (logId, ...args) => {
        return logger?.warn(logComponent, logId, logCtx, ...args);
      },
      error: (logId, ...args) => {
        return logger?.error(logComponent, logId, logCtx, ...args);
      },
      fatal: (logId, ...args) => {
        return logger?.fatal(logComponent, logId, logCtx, ...args);
      },
    };
    if (logger) {
      this._unboundLogger = Object.assign(logger, { mongoLogId });
    }
  }

  on(...args: Parameters<DataService['on']>) {
    this._emitter.on(...args);
    return this;
  }

  off(...args: Parameters<DataService['on']>) {
    this._emitter.off(...args);
    return this;
  }

  once(...args: Parameters<DataService['on']>) {
    this._emitter.on(...args);
    return this;
  }

  getMongoClientConnectionOptions():
    | { url: string; options: DevtoolsConnectOptions }
    | undefined {
    // `notifyDeviceFlow` is a function which cannot be serialized for inclusion
    // in the shell, `signal` is an abortSignal, and `allowedFlows` is turned
    // into a function by the connection code.
    return omit(
      this._mongoClientConnectionOptions,
      'options.oidc.notifyDeviceFlow',
      'options.oidc.signal',
      'options.oidc.allowedFlows'
    );
  }

  getConnectionOptions(): Readonly<ConnectionOptions> {
    return this._connectionOptions;
  }

  getConnectionString(): ConnectionStringUrl {
    return new ConnectionStringUrl(this._connectionOptions.connectionString);
  }

  setCSFLEEnabled(enabled: boolean): void {
    this._logger.info(mongoLogId(1_001_000_117), 'Setting CSFLE mode', {
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

  @op(mongoLogId(1_001_000_178), ([dbName, collName], result) => {
    return { ns: `${dbName}.${collName}`, ...(result && { result }) };
  })
  async collectionStats(
    databaseName: string,
    collectionName: string
  ): Promise<CollectionStats> {
    const ns = `${databaseName}.${collectionName}`;

    try {
      const coll = this._collection(ns, 'CRUD');
      const collStats = await coll
        .aggregate([
          { $collStats: { storageStats: {} } },
          {
            $group: {
              _id: null,
              capped: { $first: '$storageStats.capped' },
              count: { $sum: '$storageStats.count' },
              size: { $sum: { $toDouble: '$storageStats.size' } },
              storageSize: {
                $sum: { $toDouble: '$storageStats.storageSize' },
              },
              totalIndexSize: {
                $sum: { $toDouble: '$storageStats.totalIndexSize' },
              },
              freeStorageSize: {
                $sum: { $toDouble: '$storageStats.freeStorageSize' },
              },
              unscaledCollSize: {
                $sum: {
                  $multiply: [
                    { $toDouble: '$storageStats.avgObjSize' },
                    { $toDouble: '$storageStats.count' },
                  ],
                },
              },
              nindexes: { $max: '$storageStats.nindexes' },
            },
          },
          {
            $addFields: {
              // `avgObjSize` is the average of per-shard `avgObjSize` weighted by `count`
              avgObjSize: {
                $cond: {
                  if: { $ne: ['$count', 0] },
                  then: {
                    $divide: ['$unscaledCollSize', { $toDouble: '$count' }],
                  },
                  else: 0,
                },
              },
            },
          },
        ])
        .toArray();

      if (!collStats || collStats[0] === undefined) {
        throw new Error(`Error running $collStats aggregation stage on ${ns}`);
      }

      collStats[0].ns = ns;

      return this._buildCollectionStats(
        databaseName,
        collectionName,
        collStats[0]
      );
    } catch (error) {
      const message = (error as Error).message;
      // We ignore errors for fetching collStats when requesting on an
      // unsupported collection type: either a view or a ADF
      if (
        message.includes('not valid for Data Lake') ||
        message.includes('is a view, not a collection')
      ) {
        return this._buildCollectionStats(databaseName, collectionName, {});
      }
      throw error;
    }
  }

  @op(mongoLogId(1_001_000_179))
  async collectionInfo(
    dbName: string,
    collName: string
  ): Promise<ReturnType<typeof adaptCollectionInfo> | null> {
    const [collInfo] = await this._listCollections(dbName, { name: collName });
    return adaptCollectionInfo({ db: dbName, ...collInfo }) ?? null;
  }

  @op(mongoLogId(1_001_000_031))
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

  @op(mongoLogId(1_001_000_100))
  private async _connectionStatus(): Promise<ConnectionStatusWithPrivileges> {
    const adminDb = this._database('admin', 'META');
    return await runCommand(adminDb, {
      connectionStatus: 1,
      showPrivileges: true,
    });
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

  private async _listCollections(
    databaseName: string,
    filter: Document = {},
    { nameOnly }: { nameOnly?: true } = {}
  ): Promise<Pick<CollectionInfo, 'name' | 'type'>[]> {
    try {
      const cursor = this._database(databaseName, 'CRUD').listCollections(
        filter,
        { nameOnly }
      );
      // Iterate instead of using .toArray() so we can emit
      // collection info update events as they come in.
      const results: Pick<CollectionInfo, 'name' | 'type'>[] = [];
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
      this._logger.warn(
        mongoLogId(1_001_000_099),
        'Failed to run listCollections',
        { message: (err as Error).message }
      );
      return [] as { name: string }[];
    }
  }

  @op(mongoLogId(1_001_000_032), ([databaseName, , options], colls) => {
    return {
      db: databaseName,
      nameOnly: options?.nameOnly ?? false,
      ...(colls && { collectionsCount: colls.length }),
    };
  })
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

    const [listedCollections, collectionsFromPrivileges] = await Promise.all([
      this._listCollections(databaseName, filter, { nameOnly }),
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

    return collections;
  }

  @op(mongoLogId(1_001_000_033), ([options], dbs) => {
    return {
      nameOnly: options?.nameOnly ?? false,
      ...(dbs && { databasesCount: dbs.length }),
    };
  })
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
        this._logger.warn(
          mongoLogId(1_001_000_098),
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

    return databases;
  }

  addReauthenticationHandler(handler: ReauthenticationHandler): void {
    this._reauthenticationHandlers.add(handler);
  }

  private async _requestReauthenticationFromUser(): Promise<void> {
    this._logger.info(
      mongoLogId(1_001_000_194),
      'Requesting re-authentication from user'
    );
    let threw = true;
    try {
      for (const handler of this._reauthenticationHandlers) await handler();
      threw = false;
    } finally {
      this._logger.info(
        mongoLogId(1_001_000_193),
        'Completed re-authentication request',
        {
          wantsReauth: !threw,
        }
      );
    }
  }

  async connect({
    signal,
    productName,
    productDocsLink,
  }: {
    signal?: AbortSignal;
    productName?: string;
    productDocsLink?: string;
  } = {}): Promise<void> {
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

    this._logger.info(mongoLogId(1_001_000_014), 'Connecting', {
      url: redactConnectionString(this._connectionOptions.connectionString),
      csfle: this._csfleLogInformation(this._connectionOptions.fleOptions),
    });

    try {
      const [metadataClient, crudClient, tunnel, state, connectionOptions] =
        await connectMongoClient({
          connectionOptions: this._connectionOptions,
          setupListeners: this._setupListeners.bind(this),
          signal,
          logger: this._unboundLogger,
          productName,
          productDocsLink,
          reauthenticationHandler:
            this._requestReauthenticationFromUser.bind(this),
        });

      const attr = {
        isWritable: this.isWritable(),
        isMongos: this.isMongos(),
      };

      this._logger.info(mongoLogId(1_001_000_015), 'Connected', attr);
      debug('connected!', attr);

      state.oidcPlugin.logger.on('mongodb-oidc-plugin:state-updated', () => {
        this._emitter.emit('connectionInfoSecretsChanged');
      });

      this._metadataClient = metadataClient;
      this._crudClient = crudClient;
      this._tunnel = tunnel;
      this._state = state;
      this._mongoClientConnectionOptions = connectionOptions;
      this._csfleCollectionTracker = new CSFLECollectionTrackerImpl(
        this,
        this._crudClient
      );
    } finally {
      this._isConnecting = false;
    }
  }

  @op(mongoLogId(1_001_000_034))
  estimatedCount(
    ns: string,
    options: EstimatedDocumentCountOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<number> {
    return this._cancellableOperation(
      async (session) => {
        return this._collection(ns, 'CRUD').estimatedDocumentCount({
          ...options,
          session,
        });
      },
      (session) => session.endSession(),
      executionOptions?.abortSignal
    );
  }

  @op(mongoLogId(1_001_000_035))
  count(
    ns: string,
    filter: Filter<Document>,
    options: CountDocumentsOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<number> {
    return this._cancellableOperation(
      async (session) => {
        return this._collection(ns, 'CRUD').countDocuments(filter, {
          ...options,
          session,
        });
      },
      (session) => session.endSession(),
      executionOptions?.abortSignal
    );
  }

  @op(mongoLogId(1_001_000_036), ([ns, options], result) => {
    return { ns, options, ...(result && { result }) };
  })
  async createCollection(
    ns: string,
    options: CreateCollectionOptions
  ): Promise<Collection<Document>> {
    const collectionName = this._collectionName(ns);
    const db = this._database(ns, 'CRUD');
    return await db.createCollection(collectionName, options);
  }

  @op(mongoLogId(1_001_000_037), ([ns, spec, options], result) => {
    return { ns, spec, options, ...(result && { result }) };
  })
  async createIndex(
    ns: string,
    spec: IndexSpecification,
    options: CreateIndexesOptions
  ): Promise<string> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.createIndex(spec, options);
  }

  @op(mongoLogId(1_001_000_038), ([ns], result) => {
    return { ns, ...(result && { result }) };
  })
  async deleteOne(
    ns: string,
    filter: Filter<Document>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.deleteOne(filter, options);
  }

  @op(mongoLogId(1_001_000_039), ([ns], result) => {
    return { ns, ...(result && { result }) };
  })
  async deleteMany(
    ns: string,
    filter: Filter<Document>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.deleteMany(filter, options);
  }

  async updateMany(
    ns: string,
    filter: Filter<Document>,
    update: UpdateFilter<Document>,
    options?: UpdateOptions
  ): Promise<UpdateResult> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.updateMany(filter, update, options);
  }

  async disconnect(): Promise<void> {
    this._logger.info(mongoLogId(1_001_000_016), 'Disconnecting');

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
        this._state
          ?.destroy()
          .catch((err) =>
            debug('failed to destroy DevtoolsConnectionState', err)
          ),
      ]);
    } finally {
      this._cleanup();
      this._logger.info(mongoLogId(1_001_000_017), 'Fully closed');
    }
  }

  @op(mongoLogId(1_001_000_059), ([ns], result) => {
    return { ns, ...(result && { result }) };
  })
  async dropCollection(ns: string): Promise<boolean> {
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
    return await coll.drop(options);
  }

  @op(mongoLogId(1_001_000_276))
  renameCollection(
    ns: string,
    newCollectionName: string
  ): Promise<Collection<Document>> {
    const db = this._database(ns, 'META');
    return db.renameCollection(this._collectionName(ns), newCollectionName);
  }

  @op(mongoLogId(1_001_000_040), ([db], result) => {
    return { db, ...(result && { result }) };
  })
  async dropDatabase(name: string): Promise<boolean> {
    const db = this._database(name, 'CRUD');
    return await db.dropDatabase();
  }

  @op(mongoLogId(1_001_000_182), ([ns, name], result) => {
    return { ns, name, ...(result && { result }) };
  })
  async dropIndex(ns: string, name: string): Promise<Document> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.dropIndex(name);
  }

  @op(mongoLogId(1_001_000_237))
  async isListSearchIndexesSupported(ns: string): Promise<boolean> {
    try {
      await this.getSearchIndexes(ns);
    } catch (err) {
      return false;
    }
    return true;
  }

  @op(mongoLogId(1_001_000_238))
  async getSearchIndexes(ns: string): Promise<SearchIndex[]> {
    const coll = this._collection(ns, 'CRUD');
    const cursor = coll.listSearchIndexes();
    const indexes = await cursor.toArray();
    void cursor.close();
    return indexes as SearchIndex[];
  }

  @op(mongoLogId(1_001_000_239))
  async createSearchIndex(
    ns: string,
    name: string,
    definition: Document
  ): Promise<string> {
    const coll = this._collection(ns, 'CRUD');
    return coll.createSearchIndex({ name, definition });
  }

  @op(mongoLogId(1_001_000_240))
  async updateSearchIndex(
    ns: string,
    name: string,
    definition: Document
  ): Promise<void> {
    const coll = this._collection(ns, 'CRUD');
    return coll.updateSearchIndex(name, definition);
  }

  @op(mongoLogId(1_001_000_241))
  async dropSearchIndex(ns: string, name: string): Promise<void> {
    const coll = this._collection(ns, 'CRUD');
    return coll.dropSearchIndex(name);
  }

  @op(mongoLogId(1_001_000_041), ([ns, pipeline]) => {
    return { ns, stages: pipeline.map((stage) => Object.keys(stage)[0]) };
  })
  aggregateCursor(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions = {}
  ): AggregationCursor {
    return this._collection(ns, 'CRUD').aggregate(pipeline, options);
  }

  // @ts-expect-error generic in the method trips up TS here resulting in
  // Promise<unknown> is not assignable to Promise<Document[]>
  @op(mongoLogId(1_001_000_181), ([ns, pipeline]) => {
    return { ns, stages: pipeline.map((stage) => Object.keys(stage)[0]) };
  })
  aggregate<T = Document>(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<T[]> {
    let cursor: AggregationCursor;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        cursor = this._collection(ns, 'CRUD').aggregate(pipeline, {
          ...options,
          session,
        });
        const results = await cursor.toArray();
        void cursor.close();
        return results;
      },
      () => cursor?.close(),
      executionOptions?.abortSignal
    );
  }

  @op(mongoLogId(1_001_000_060))
  find(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions = {},
    executionOptions?: ExecutionOptions
  ): Promise<Document[]> {
    let cursor: FindCursor;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        cursor = this._collection(ns, 'CRUD').find(filter, {
          ...options,
          session,
        });
        const results = await cursor.toArray();
        void cursor.close();
        return results;
      },
      () => cursor?.close(),
      executionOptions?.abortSignal
    );
  }

  @op(mongoLogId(1_001_000_043))
  findCursor(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions = {}
  ): FindCursor {
    return this._collection(ns, 'CRUD').find(filter, options);
  }

  @op(mongoLogId(1_001_000_044))
  async findOneAndReplace(
    ns: string,
    filter: Filter<Document>,
    replacement: Document,
    options: FindOneAndReplaceOptions
  ): Promise<Document | null> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.findOneAndReplace(filter, replacement, options);
  }

  @op(mongoLogId(1_001_000_045))
  async findOneAndUpdate(
    ns: string,
    filter: Filter<Document>,
    update: Document,
    options: FindOneAndUpdateOptions
  ): Promise<Document | null> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.findOneAndUpdate(filter, update, options);
  }

  @op(mongoLogId(1_001_000_183))
  async updateOne(
    ns: string,
    filter: Filter<Document>,
    update: Document,
    options: UpdateOptions
  ): Promise<Document | null> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.updateOne(filter, update, options);
  }

  @op(mongoLogId(1_001_000_191))
  async replaceOne(
    ns: string,
    filter: Filter<Document>,
    replacement: Document,
    options: ReplaceOptions
  ): Promise<Document | null> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.replaceOne(filter, replacement, options);
  }

  @op(mongoLogId(1_001_000_046), ([ns, , , executionOptions]) => {
    return {
      ns,
      verbosity:
        executionOptions?.explainVerbosity ||
        ExplainVerbosity.allPlansExecution,
    };
  })
  explainFind(
    ns: string,
    filter: Filter<Document>,
    options: FindOptions = {},
    executionOptions?: ExplainExecuteOptions
  ): Promise<Document> {
    const verbosity =
      executionOptions?.explainVerbosity || ExplainVerbosity.allPlansExecution;

    let cursor: FindCursor;
    return this._cancellableOperation(
      async (session?: ClientSession) => {
        cursor = this._collection(ns, 'CRUD').find(filter, {
          ...options,
          session,
        });
        const results = await cursor.explain(verbosity);
        void cursor.close();
        return results;
      },
      () => cursor?.close(),
      executionOptions?.abortSignal
    );
  }

  @op(mongoLogId(1_001_000_177), ([ns, , , executionOptions]) => {
    return {
      ns,
      verbosity:
        executionOptions?.explainVerbosity ||
        ExplainVerbosity.allPlansExecution,
    };
  })
  explainAggregate(
    ns: string,
    pipeline: Document[],
    options: AggregateOptions,
    executionOptions?: ExplainExecuteOptions
  ): Promise<Document> {
    const verbosity =
      executionOptions?.explainVerbosity || ExplainVerbosity.queryPlanner;

    let cursor: AggregationCursor;
    return this._cancellableOperation(
      async (session) => {
        cursor = this._collection(ns, 'CRUD').aggregate(pipeline, {
          ...options,
          session,
        });
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
      const coll = this._collection(ns, 'CRUD');
      const aggResult = (await coll
        .aggregate([
          { $collStats: { storageStats: {} } },
          {
            $project: {
              indexSizes: { $objectToArray: '$storageStats.indexSizes' },
            },
          },
          { $unwind: '$indexSizes' },
          {
            $group: {
              _id: '$indexSizes.k',
              size: { $sum: { $toDouble: '$indexSizes.v' } },
            },
          },
        ])
        .toArray()) as { _id: string; size: number }[];
      return Object.fromEntries(aggResult.map(({ _id, size }) => [_id, size]));
    } catch (err) {
      if (isNotAuthorized(err) || isNotSupportedPipelineStage(err)) {
        return {};
      }
      throw err;
    }
  }

  @op(mongoLogId(1_001_000_047))
  async indexes(
    ns: string,
    options?: IndexInformationOptions
  ): Promise<IndexDefinition[]> {
    const [indexes, indexStats, indexSizes] = await Promise.all([
      this._collection(ns, 'CRUD').indexes(options) as Promise<IndexInfo[]>,
      this._indexStats(ns),
      this._indexSizes(ns),
    ]);

    const maxSize = Math.max(...Object.values(indexSizes));

    return indexes.map((index) => {
      const name = index.name;
      return createIndexDefinition(
        ns,
        index,
        indexStats[name],
        indexSizes[name],
        maxSize
      );
    });
  }

  @op(mongoLogId(1_001_000_024), (_, instanceData) => {
    if (instanceData) {
      return {
        serverVersion: instanceData.build.version,
        genuineMongoDB: instanceData.genuineMongoDB,
        dataLake: instanceData.dataLake,
        featureCompatibilityVersion: instanceData.featureCompatibilityVersion,
      };
    }
  })
  async instance(): Promise<InstanceDetails> {
    return {
      ...(await getInstance(
        this._initializedClient('META'),
        this._connectionOptions.connectionString
      )),
      // Need to get the CSFLE flag from the CRUD client, not the META one
      csfleMode: this.getCSFLEMode(),
    };
  }

  @op(mongoLogId(1_001_000_048), ([ns], result) => {
    return { ns, ...(result && { acknowledged: result.acknowledged }) };
  })
  async insertOne(
    ns: string,
    doc: Document,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<Document>> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.insertOne(doc, options);
  }

  @op(mongoLogId(1_001_000_049), ([ns], result) => {
    return {
      ns,
      ...(result && {
        acknowledged: result.acknowledged,
        insertedCount: result.insertedCount,
      }),
    };
  })
  async insertMany(
    ns: string,
    docs: Document[],
    options?: BulkWriteOptions
  ): Promise<InsertManyResult<Document>> {
    const coll = this._collection(ns, 'CRUD');
    return await coll.insertMany(docs, options);
  }

  @op(mongoLogId(1_001_000_050), ([ns], result) => {
    return { ns, ...(result && { result }) };
  })
  async updateCollection(
    ns: string,
    // Collection name to update that will be passed to the collMod command will
    // be derived from the provided namespace, this is why we are explicitly
    // prohibiting to pass collMod flag here
    flags: Document & { collMod?: never } = {}
  ): Promise<Document> {
    const collectionName = this._collectionName(ns);
    const db = this._database(ns, 'CRUD');
    const result = await runCommand(db, {
      // Order of arguments is important here, collMod is a command name and it
      // should always be the first one in the object
      collMod: collectionName,
      ...flags,
    });
    // Reset the CSFLE-enabled client (if any) to clear any collection
    // metadata caches that might still be active.
    await this._resetCRUDClient();
    return result;
  }

  bulkWrite(
    ns: string,
    operations: AnyBulkWriteOperation<Document>[],
    options: BulkWriteOptions
  ) {
    return this._collection(ns, 'CRUD').bulkWrite(operations, options);
  }

  @op(mongoLogId(1_001_000_053), (_, result) => {
    return result ? { result } : undefined;
  })
  async currentOp(): Promise<{ inprog: Document[] }> {
    const db = this._database('admin', 'META');
    const pipelineWithTruncateOps: Document[] = [
      {
        $currentOp: {
          allUsers: true,
          idleConnections: false,
          truncateOps: false,
        },
      },
    ];
    const currentOp = await db.aggregate(pipelineWithTruncateOps).toArray();
    return { inprog: currentOp };
  }

  getLastSeenTopology(): null | TopologyDescription {
    return this._lastSeenTopology;
  }

  @op(mongoLogId(1_001_000_061), (_, result) => {
    return result ? { result } : undefined;
  })
  async serverStatus(): Promise<Document> {
    const admin = this._database('admin', 'META');
    return await runCommand(admin, { serverStatus: 1 });
  }

  @op(mongoLogId(1_001_000_062), (_, result) => {
    return result ? { result } : undefined;
  })
  async top(): Promise<{ totals: Record<string, unknown> }> {
    const adminDb = this._database('admin', 'META');
    return await runCommand(adminDb, { top: 1 });
  }

  @op(
    mongoLogId(1_001_000_055),
    ([name, sourceNs, pipeline, options], result) => {
      return {
        name,
        sourceNs,
        stages: pipeline.map((stage) => Object.keys(stage)[0]),
        options,
        ...(result && { result }),
      };
    }
  )
  async createView(
    name: string,
    sourceNs: string,
    pipeline: Document[],
    options: Omit<CreateCollectionOptions, 'viewOn' | 'pipeline'> = {}
  ): Promise<Collection<Document>> {
    const createCollectionOptions: CreateCollectionOptions = {
      ...options,
      viewOn: this._collectionName(sourceNs),
      pipeline,
    };
    const db = this._database(sourceNs, 'CRUD');
    return await db.createCollection(name, createCollectionOptions);
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
    stop: (session: ClientSession) => Promise<void> = () => Promise.resolve(),
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
        this._logger.warn(
          mongoLogId(1_001_000_140),
          'Attempting to kill the operation failed',
          { error: error.message }
        );
      };
      await stop(session).catch(logAbortError);
      await this._killSessions(session).catch(logAbortError);
    };

    try {
      result = await raceWithAbort(start(session), abortSignal);
    } catch (err) {
      if (isCancelError(err)) {
        await abort();
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
          this._logger.info(
            mongoLogId(1_001_000_018),
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
        this._logger.info(mongoLogId(1_001_000_019), 'Server opening', {
          address: evt.address,
        });
      });

      client.on('serverClosed', (evt: ServerClosedEvent) => {
        this._logger.info(mongoLogId(1_001_000_020), 'Server closed', {
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
          this._logger.info(
            mongoLogId(1_001_000_021),
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
            this._logger.debug(
              mongoLogId(1_001_000_022),
              'Server heartbeat succeeded',
              {
                connectionId: evt.connectionId,
                duration: evt.duration,
              }
            );
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
          this._logger.warn(
            mongoLogId(1_001_000_023),
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
        this._logger.debug(
          mongoLogId(1_001_000_029),
          'Driver command succeeded',
          {
            address,
            serverConnectionId: connectionId,
            duration,
            commandName,
          }
        );
      });

      client.on('commandFailed', (evt: CommandFailedEvent) => {
        const { address, connectionId, duration, commandName, failure } = evt;
        this._logger.debug(mongoLogId(1_001_000_030), 'Driver command failed', {
          address,
          serverConnectionId: connectionId,
          duration,
          commandName,
          failure: failure.message,
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

  @op(mongoLogId(1_001_000_057))
  async databaseStats(
    name: string
  ): Promise<ReturnType<typeof adaptDatabaseInfo> & { name: string }> {
    const db = this._database(name, 'META');
    const stats = await runCommand(db, { dbStats: 1 });
    const normalized = adaptDatabaseInfo(stats);
    return { name, ...normalized };
  }

  @op(mongoLogId(1_001_000_266))
  async previewUpdate(
    ns: string,
    filter: Document,
    update: Document | Document[],
    executionOptions: UpdatePreviewExecutionOptions = {}
  ): Promise<UpdatePreview> {
    const {
      abortSignal = new AbortController().signal,
      sample = 10,
      timeout = 1000,
    } = executionOptions;
    const startTimeMS = Date.now();
    const remainingTimeoutMS = () =>
      Math.max(1, timeout - (Date.now() - startTimeMS));
    return await this._cancellableOperation(
      async (session) => {
        if (!session) {
          throw new Error('Could not open session.');
        }

        try {
          return await session.withTransaction(
            async () => {
              const coll = this._collection(ns, 'CRUD');
              const docsToPreview = await coll
                .find(filter, { session, maxTimeMS: remainingTimeoutMS() })
                .sort({ _id: 1 })
                .limit(sample)
                .toArray();

              const idsToPreview = docsToPreview.map((doc) => doc._id);
              await coll.updateMany({ _id: { $in: idsToPreview } }, update, {
                session,
                maxTimeMS: remainingTimeoutMS(),
              });
              const changedDocs = await coll
                .find(
                  { _id: { $in: idsToPreview } },
                  { session, maxTimeMS: remainingTimeoutMS() }
                )
                .sort({ _id: 1 })
                .toArray();

              await session.abortTransaction();
              await session.endSession();

              const changes = docsToPreview.map((before, idx) => ({
                before,
                after: changedDocs[idx],
              }));
              return { changes };
            },
            {
              maxTimeMS: remainingTimeoutMS(),
            }
          );
        } catch (err: any) {
          if (isTransactionAbortError(err)) {
            // The transaction was aborted while it was still calculating the
            // preview. Just return something here rather than erroring. No
            // reason to abort the transaction or end the session again because
            // we only got here because that already happened.
            return { changes: [] };
          }

          // The only way this if statement would be true is if aborting the
          // transaction and ending the session itself failed above. Unlikely.
          if (session.inTransaction()) {
            await session.abortTransaction();
            await session.endSession();
          }

          throw err;
        }
      },
      async () => {
        // Rely on the session being killed when we cancel the operation. It can
        // take a few seconds before the driver reacts, but the Promise.race()
        // against the abort signal should cause the UI to immediately be
        // notified that the operation was cancelled. We don't abort the
        // transaction or end the session as well because the code we run inside
        // session.withTransaction() above would experience race conditions.
      },
      abortSignal
    );
  }

  /**
   * @param databaseName - The name of the database.
   * @param collectionName - The name of the collection.
   * @param data - The result of the collStats command.
   */
  private _buildCollectionStats(
    databaseName: string,
    collectionName: string,
    data: Document
  ): CollectionStats {
    return {
      ns: databaseName + '.' + collectionName,
      name: collectionName,
      database: databaseName,
      is_capped: data.capped,
      document_count: data.count ?? 0,
      document_size: data.size,
      avg_document_size: data.avgObjSize ?? 0,
      storage_size: data.storageSize ?? 0,
      free_storage_size: data.freeStorageSize ?? 0,
      index_count: data.nindexes ?? 0,
      index_size: data.totalIndexSize ?? 0,
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

  private _cleanup(): void {
    this._emitter.removeAllListeners();
    this._metadataClient?.removeAllListeners?.();
    this._crudClient?.removeAllListeners?.();
    this._metadataClient = undefined;
    this._crudClient = undefined;
    this._tunnel = undefined;
    this._state = undefined;
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

  @op(mongoLogId(1_001_000_123), ([provider]) => {
    return { provider };
  })
  async createDataKey(
    provider: ClientEncryptionDataKeyProvider,
    options?: ClientEncryptionCreateDataKeyProviderOptions
  ): Promise<Document> {
    const clientEncryption = this._getClientEncryption();
    return await clientEncryption.createDataKey(provider, options ?? {});
  }

  private _getClientEncryption(): ClientEncryption {
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

  async getUpdatedSecrets(): Promise<Partial<ConnectionOptions>> {
    if (!this._state) return {};
    return {
      oidc: {
        serializedState: await this._state.oidcPlugin.serialize(),
      },
    };
  }

  static {
    type NoExtraProps<T, U> = U & {
      [K in Exclude<keyof U, keyof T>]?: never;
    };

    const assertNoExtraProps = <T>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _cls: new (...args: any[]) => NoExtraProps<DataService, T>
    ) => {
      // Checking that we are not exposing anything unexpected on our data service
      // implementation. This file will not compile if there are more public methods
      // on the DataServiceImpl than DataService interface allows
    };

    assertNoExtraProps(this);
  }
}

function isTransactionAbortError(err: any) {
  if (err.message === 'Cannot use a session that has ended') {
    return true;
  }
  if (err.codeName === 'NoSuchTransaction') {
    return true;
  }
  return false;
}

export { DataServiceImpl };
export default DataService;
