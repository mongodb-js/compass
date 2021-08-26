import { EventEmitter } from 'events';
import {
  AggregateOptions,
  AggregationCursor,
  BulkWriteOptions,
  ClientSession,
  Collection,
  CollectionInfo,
  CountDocumentsOptions,
  CreateCollectionOptions,
  CreateIndexesOptions,
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
  ServerClosedEvent,
  ServerDescriptionChangedEvent,
  ServerOpeningEvent,
  TopologyClosedEvent,
  TopologyDescription,
  TopologyDescriptionChangedEvent,
  TopologyOpeningEvent,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
} from 'mongodb';

import NativeClient, {
  NativeClient as NativeClientType,
  NativeClientConnectionOptions,
} from './native-client';
import { Callback, Instance } from './types';
import { LegacyConnectionModel } from './legacy-connection-model';

class DataService extends EventEmitter {
  /**
   * Stores the most recent topology description from the server's SDAM events:
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  lastSeenTopology: TopologyDescription | null = null;

  client: NativeClientType;

  constructor(model: LegacyConnectionModel) {
    super();

    this.client = new NativeClient(model)
      .on('status', (evt: any) => this.emit('status', evt))
      .on('serverDescriptionChanged', (evt: ServerDescriptionChangedEvent) =>
        this.emit('serverDescriptionChanged', evt)
      )
      .on('serverOpening', (evt: ServerOpeningEvent) =>
        this.emit('serverOpening', evt)
      )
      .on('serverClosed', (evt: ServerClosedEvent) =>
        this.emit('serverClosed', evt)
      )
      .on('topologyOpening', (evt: TopologyOpeningEvent) =>
        this.emit('topologyOpening', evt)
      )
      .on('topologyClosed', (evt: TopologyClosedEvent) =>
        this.emit('topologyClosed', evt)
      )
      .on(
        'topologyDescriptionChanged',
        (evt: TopologyDescriptionChangedEvent) => {
          this.lastSeenTopology = evt.newDescription;
          this.emit('topologyDescriptionChanged', evt);
        }
      );
  }

  getConnectionOptions(): NativeClientConnectionOptions | undefined {
    return this.client.connectionOptions;
  }

  /**
   * Get the kitchen sink information about a collection.
   *
   * @param ns - The namespace.
   * @param options - The options.
   * @param callback - The callback.
   */
  collection(ns: string, options: unknown, callback: Callback<Document>): void {
    this.client.collectionDetail(ns, callback);
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
    callback: Callback<Document>
  ): void {
    this.client.collectionStats(databaseName, collectionName, callback);
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
    this.client.command(databaseName, comm, callback);
  }

  /**
   * Is the data service allowed to perform write operations.
   *
   * @returns If the data service is writable.
   */
  isWritable(): boolean {
    return this.client.isWritable;
  }

  /**
   * Is the data service connected to a mongos.
   *
   * @returns If the data service is connected to a mongos.
   */
  isMongos(): boolean {
    return this.client.isMongos;
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
    this.client.listCollections(databaseName, filter, callback);
  }

  /**
   * List all databases on the currently connected instance.
   *
   * @param callback - The callback.
   */
  listDatabases(callback: Callback<Document>): void {
    this.client.listDatabases(callback);
  }

  /**
   * Connect to the server.
   *
   * @param done - The callback function.
   */
  connect(done: Callback<DataService>): void {
    this.client.connect((err) => {
      if (err) {
        // @ts-expect-error Callback without result...
        return done(err);
      }
      done(null, this);
      this.emit('readable');
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
    this.client.estimatedCount(ns, options, callback);
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
    this.client.count(ns, filter, options, callback);
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
    this.client.createCollection(ns, options, callback);
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
    this.client.createIndex(ns, spec, options, callback);
  }

  /**
   * Get the kitchen sink information about a database and all its collections.
   *
   * @param name - The database name.
   * @param options - The query options.
   * @param callback - The callback.
   */
  database(name: string, options: unknown, callback: Callback<Document>): void {
    this.client.databaseDetail(name, callback);
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
    this.client.deleteOne(ns, filter, options, callback);
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
    this.client.deleteMany(ns, filter, options, callback);
  }

  /**
   * Disconnect the service.
   * @param callback - The callback.
   */
  disconnect(callback: Callback<never>): void {
    this.client.disconnect(callback);
  }

  /**
   * Drops a collection from a database
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  dropCollection(ns: string, callback: Callback<boolean>): void {
    this.client.dropCollection(ns, callback);
  }

  /**
   * Drops a database
   *
   * @param name - The database name.
   * @param callback - The callback.
   */
  dropDatabase(name: string, callback: Callback<boolean>): void {
    this.client.dropDatabase(name, callback);
  }

  /**
   * Drops an index from a collection
   *
   * @param ns - The namespace.
   * @param name - The index name.
   * @param callback - The callback.
   */
  dropIndex(ns: string, name: string, callback: Callback<Document>): void {
    this.client.dropIndex(ns, name, callback);
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
    return this.client.aggregate(ns, pipeline, options as any, callback as any);
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
    this.client.find(ns, filter, options, callback);
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
    return this.client.fetch(ns, filter, options);
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
    this.client.findOneAndReplace(ns, filter, replacement, options, callback);
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
    this.client.findOneAndUpdate(ns, filter, update, options, callback);
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
    this.client.explain(ns, filter, options, callback);
  }

  /**
   * Get the indexes for the collection.
   *
   * @param ns - The collection namespace.
   * @param options - The options (unused).
   * @param callback - The callback.
   */
  indexes(ns: string, options: unknown, callback: Callback<Document>): void {
    this.client.indexes(ns, callback);
  }

  /**
   * Get the current instance details.
   *
   * @param options - The options.
   * @param callback - The callback function.
   */
  instance(options: unknown, callback: Callback<Instance>): void {
    this.client.instance(callback);
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
    this.client.insertOne(ns, doc, options, callback);
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
    this.client.insertMany(ns, docs, options, callback);
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
    return this.client.putMany(ns, docs, options);
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
    this.client.updateCollection(ns, flags, callback);
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
    this.client.updateOne(ns, filter, update, options, callback);
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
    this.client.updateMany(ns, filter, update, options, callback);
  }

  /**
   * Returns the results of currentOp.
   *
   * @param includeAll - if true also list currently idle operations in the result.
   * @param callback - The callback.
   */
  currentOp(includeAll: boolean, callback: Callback<Document>): void {
    this.client.currentOp(includeAll, callback);
  }

  /**
   * Returns the most recent topology description from the server's SDAM events.
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#events
   */
  getLastSeenTopology(): null | TopologyDescription {
    return this.lastSeenTopology;
  }

  /**
   * Returns the result of serverStats.
   */
  serverstats(callback: Callback<Document>): void {
    this.client.serverStats(callback);
  }

  /**
   * Returns the result of top.
   *
   * @param callback - the callback.
   */
  top(callback: Callback<Document>): void {
    this.client.top(callback);
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
    this.client.createView(name, sourceNs, pipeline, options, callback);
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
    this.client.updateView(name, sourceNs, pipeline, options, callback);
  }

  /**
   * Convenience for dropping a view as a passthrough to `dropCollection()`.
   *
   * @param ns - The namespace.
   * @param callback - The callback.
   */
  dropView(ns: string, callback: Callback<boolean>): void {
    this.client.dropView(ns, callback);
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
    args: { query?: Filter<Document>; size?: number; fields?: Document } = {},
    options: AggregateOptions = {}
  ): AggregationCursor {
    return this.client.sample(ns, args, options);
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
  killSession(session: ClientSession): Promise<Document> {
    return this.client.killSession(session);
  }

  isConnected(): boolean {
    return this.client.isConnected();
  }
}

export = DataService;
