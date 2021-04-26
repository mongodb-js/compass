/* eslint-disable complexity */
import Mongo from './mongo';
import {
  addSourceToResults,
  hasAsyncChild,
  Namespace,
  returnsPromise,
  returnType,
  serverVersions,
  ShellApiClass,
  shellApiClassDefault,
  topologies,
  deprecated
} from './decorators';
import { ADMIN_DB, asPrintable, namespaceInfo, ServerVersions, Topologies } from './enums';
import {
  adaptAggregateOptions,
  assertKeysDefined,
  dataFormat,
  validateExplainableVerbosity,
  FindAndModifyShellOptions,
  FindAndModifyMethodShellOptions,
  processFindAndModifyOptions,
  processRemoveOptions,
  RemoveShellOptions,
  MapReduceShellOptions,
  processMapReduceOptions,
  setHideIndex,
  maybeMarkAsExplainOutput,
  markAsExplainOutput,
  assertArgsDefinedType
} from './helpers';
import {
  AnyBulkWriteOperation,
  BulkWriteOptions,
  CollStatsOptions,
  CountOptions,
  CountDocumentsOptions,
  ChangeStreamOptions,
  CreateIndexesOptions,
  DeleteOptions,
  DistinctOptions,
  Document,
  EstimatedDocumentCountOptions,
  ExplainVerbosityLike,
  FindAndModifyOptions,
  FindOptions,
  InsertOneOptions,
  ReplaceOptions,
  RunCommandOptions,
  UpdateOptions,
} from '@mongosh/service-provider-core';
import {
  AggregationCursor,
  BulkWriteResult,
  CommandResult,
  Cursor,
  Database,
  DeleteResult,
  Explainable,
  InsertManyResult,
  InsertOneResult,
  UpdateResult
} from './index';
import {
  CommonErrors, MongoshInvalidInputError, MongoshRuntimeError, MongoshInternalError
} from '@mongosh/errors';
import Bulk from './bulk';
import { HIDDEN_COMMANDS } from '@mongosh/history';
import PlanCache from './plan-cache';
import { printDeprecationWarning } from './deprecation-warning';
import ChangeStreamCursor from './change-stream-cursor';
import { ShellApiErrors } from './error-codes';

type CollStatsShellOptions = CollStatsOptions & {
  indexDetails?: boolean;
  indexDetailsKey?: Document;
  indexDetailsName?: string;
};

@shellApiClassDefault
@hasAsyncChild
@addSourceToResults
export default class Collection extends ShellApiClass {
  _mongo: Mongo;
  _database: Database;
  _name: string;
  constructor(mongo: Mongo, database: Database, name: string) {
    super();
    this._mongo = mongo;
    this._database = database;
    this._name = name;
    const proxy = new Proxy(this, {
      get: (target, prop): any => {
        if (prop in target) {
          return (target as any)[prop];
        }

        if (
          typeof prop !== 'string' ||
          prop.startsWith('_') ||
          !prop.trim()
        ) {
          return;
        }
        return database.getCollection(`${name}.${prop}`);
      }
    });
    return proxy;
  }

  [namespaceInfo](): Namespace {
    return { db: this._database.getName(), collection: this._name };
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): string {
    return this._name;
  }

  /**
   * Internal helper for emitting collection API call events.
   *
   * @param methodName
   * @param methodArguments
   * @private
   */
  private _emitCollectionApiCall(methodName: string, methodArguments: Document = {}): void {
    this._mongo._internalState.emitApiCall({
      method: methodName,
      class: 'Collection',
      db: this._database._name,
      coll: this._name,
      arguments: methodArguments
    });
  }

  /**
   * Run an aggregation against the collection. Accepts array pipeline and options object OR stages as individual arguments.
   *
   * @returns {Promise} The promise of aggregation results.
   */
  @returnsPromise
  @returnType('AggregationCursor')
  async aggregate(...args: any[]): Promise<AggregationCursor> {
    let options;
    let pipeline;
    if (args.length === 0 || Array.isArray(args[0])) {
      options = args[1] || {};
      pipeline = args[0] || [];
    } else {
      options = {};
      pipeline = args || [];
    }
    this._emitCollectionApiCall(
      'aggregate',
      { options, pipeline }
    );
    const {
      aggOptions,
      dbOptions,
      explain
    } = adaptAggregateOptions(options);

    const providerCursor = this._mongo._serviceProvider.aggregate(
      this._database._name,
      this._name,
      pipeline,
      { ...this._database._baseOptions, ...aggOptions },
      dbOptions
    );
    const cursor = new AggregationCursor(this._mongo, providerCursor);

    if (explain) {
      return await cursor.explain(explain);
    }

    this._mongo._internalState.currentCursor = cursor;
    return cursor;
  }

  /**
   * Execute a mix of write operations.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   *
   * @param {Array} operations - The bulk write requests.
   * @param {Object} options - The bulk write options.
   *  <writeConcern, ordered>
   *
   * @returns {BulkWriteResult} The promise of the result.
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async bulkWrite(
    operations: AnyBulkWriteOperation[],
    options: BulkWriteOptions = {}
  ): Promise<BulkWriteResult> {
    this._emitCollectionApiCall(
      'bulkWrite',
      { options }
    );

    const result = await this._mongo._serviceProvider.bulkWrite(
      this._database._name,
      this._name,
      operations,
      { ...this._database._baseOptions, ...options }
    );

    return new BulkWriteResult(
      !!result.ok,
      result.insertedCount,
      result.insertedIds,
      result.matchedCount,
      result.modifiedCount,
      result.deletedCount,
      result.upsertedCount,
      result.upsertedIds
    );
  }

  /**
   * Deprecated count command.
   *
   * @note: Shell API passes readConcern via options, data provider API via
   * collection options.
   *
   * @param {Object} query - The filter.
   * @param {Object} options - The count options.
   *  <limit, skip, hint, maxTimeMS, readConcern, collation>
   * @returns {Integer} The promise of the count.
   */
  @returnsPromise
  @deprecated
  @serverVersions([ServerVersions.earliest, '4.0.0'])
  async count(query = {}, options: CountOptions = {}): Promise<number> {
    this._emitCollectionApiCall(
      'count',
      { query, options }
    );

    return this._mongo._serviceProvider.count(
      this._database._name,
      this._name,
      query,
      { ...this._database._baseOptions, ...options }
    );
  }

  /**
   * Get an exact document count from the coll.
   *
   * @param {Object} query - The filter.
   * @param {Object} options - The count options.
   *  <limit, skip, hint, maxTimeMS>
   *
   * @returns {Integer} The promise of the count.
   */
  @returnsPromise
  @serverVersions(['4.0.3', ServerVersions.latest])
  async countDocuments(query: Document, options: CountDocumentsOptions = {}): Promise<number> {
    this._emitCollectionApiCall('countDocuments', { query, options });
    return this._mongo._serviceProvider.countDocuments(
      this._database._name,
      this._name,
      query,
      { ...this._database._baseOptions, ...options }
    );
  }

  /**
   * Delete multiple documents from the coll.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   *
   * @param {Object} filter - The filter.
   * @param {Object} options - The delete many options.
   *  <collation, writeConcern>
   *
   * @returns {DeleteResult} The promise of the result.
   */
  @returnsPromise
  async deleteMany(filter: Document, options: DeleteOptions = {}): Promise<DeleteResult | Document> {
    assertArgsDefinedType([filter], [true], 'Collection.deleteMany');
    this._emitCollectionApiCall('deleteMany', { filter, options });

    const result = await this._mongo._serviceProvider.deleteMany(
      this._database._name,
      this._name,
      filter,
      { ...this._database._baseOptions, ...options }
    );
    if (options.explain) {
      return markAsExplainOutput(result);
    }

    return new DeleteResult(
      !!result.acknowledged,
      result.deletedCount
    );
  }

  /**
   * Delete one document from the coll.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   *
   * @param {Object} filter - The filter.
   * @param {Object} options - The delete one options.
   *  <collation, writeConcern>
   *
   * @returns {DeleteResult} The promise of the result.
   */
  @returnsPromise
  async deleteOne(filter: Document, options: DeleteOptions = {}): Promise<DeleteResult | Document> {
    assertArgsDefinedType([filter], [true], 'Collection.deleteOne');
    this._emitCollectionApiCall('deleteOne', { filter, options });

    const result = await this._mongo._serviceProvider.deleteOne(
      this._database._name,
      this._name,
      filter,
      { ...this._database._baseOptions, ...options }
    );
    if (options.explain) {
      return markAsExplainOutput(result);
    }

    return new DeleteResult(
      !!result.acknowledged,
      result.deletedCount
    );
  }

  /**
   * Get distinct values for the field.
   *
   * @note Data Provider API also provides maxTimeMS option.
   *
   * @param {String} field - The field name.
   * @param {Object} query - The filter.
   * @param {Object} options - The distinct options.
   *  <collation>
   *
   * @returns {Array} The promise of the result.
   */
  @returnsPromise
  async distinct(field: string, query: Document, options: DistinctOptions = {}): Promise<Document> {
    this._emitCollectionApiCall('distinct', { field, query, options });
    return maybeMarkAsExplainOutput(
      await this._mongo._serviceProvider.distinct(
        this._database._name,
        this._name,
        field,
        query,
        { ...this._database._baseOptions, ...options }),
      options);
  }

  /**
   * Get an estimated document count from the coll.
   *
   * @param {Object} options - The count options.
   *  <maxTimeMS>
   *
   * @returns {Integer} The promise of the count.
   */
  @returnsPromise
  @serverVersions(['4.0.3', ServerVersions.latest])
  async estimatedDocumentCount(options: EstimatedDocumentCountOptions = {}): Promise<number> {
    this._emitCollectionApiCall('estimatedDocumentCount', { options });
    return this._mongo._serviceProvider.estimatedDocumentCount(this._database._name, this._name, { ...this._database._baseOptions, ...options });
  }

  /**
   * Find documents in the collection.
   *
   * @note: Shell API passes filter and projection to find, data provider API
   * uses a options object.
   *
   * @param {Object} query - The filter.
   * @param {Object} projection - The projection.
   *
   * @returns {Cursor} The promise of the cursor.
   */
  @returnType('Cursor')
  find(query?: Document, projection?: Document): Cursor {
    const options: FindOptions = {};
    if (projection) {
      options.projection = projection;
    }

    this._emitCollectionApiCall('find', { query, options });
    const cursor = new Cursor(
      this._mongo,
      this._mongo._serviceProvider.find(this._database._name, this._name, query, { ...this._database._baseOptions, ...options })
    );

    this._mongo._internalState.currentCursor = cursor;
    return cursor;
  }

  @returnsPromise
  async findAndModify(options: FindAndModifyMethodShellOptions): Promise<Document> {
    assertArgsDefinedType([options], [true], 'Collection.findAndModify');
    assertKeysDefined(options, ['query']);
    this._emitCollectionApiCall(
      'findAndModify',
      { options: { ...options, update: !!options.update } }
    );
    const reducedOptions: Omit<FindAndModifyMethodShellOptions, 'query' | 'update'> = { ...options };
    delete (reducedOptions as any).query;
    delete (reducedOptions as any).update;
    if (options.remove) {
      return this.findOneAndDelete(options.query, reducedOptions);
    }
    const { update } = options;
    if (!update) {
      throw new MongoshInvalidInputError(
        'Must specify options.update or options.remove',
        CommonErrors.InvalidArgument);
    }
    if (Array.isArray(update) || Object.keys(update).some(key => key.startsWith('$'))) {
      return this.findOneAndUpdate(options.query, update, reducedOptions);
    }
    return this.findOneAndReplace(options.query, update, reducedOptions);
  }

  /**
   * Find one document in the collection.
   *
   * @note: findOne is just find with limit.
   *
   * @param {Object} query - The filter.
   * @param {Object} projection - The projection.
   *
   * @returns {Cursor} The promise of the cursor.
   */
  @returnsPromise
  @returnType('Document')
  async findOne(query: Document = {}, projection?: Document): Promise<Document | null> {
    const options: any = {};
    if (projection) {
      options.projection = projection;
    }

    this._emitCollectionApiCall('findOne', { query, options });
    return new Cursor(
      this._mongo,
      this._mongo._serviceProvider.find(this._database._name, this._name, query, { ...this._database._baseOptions, ...options })
    ).limit(1).tryNext();
  }

  @returnsPromise
  async renameCollection(
    newName: string,
    dropTarget?: boolean
  ): Promise<Document> {
    assertArgsDefinedType([newName], ['string'], 'Collection.renameCollection');
    this._emitCollectionApiCall('renameCollection', { newName, dropTarget });

    try {
      await this._mongo._serviceProvider.renameCollection(
        this._database._name,
        this._name,
        newName,
        { ...this._database._baseOptions, dropTarget: !!dropTarget }
      );

      return {
        ok: 1
      };
    } catch (e) {
      if (e.name === 'MongoError') {
        return {
          ok: 0,
          errmsg: e.errmsg,
          code: e.code,
          codeName: e.codeName
        };
      }

      throw e;
    }
  }

  /**
   * Find one document and delete it.
   *
   * @param {Object} filter - The filter.
   * @param {Object} options - The find options.
   *  <projection, sort, collation, maxTimeMS>
   *
   * @returns {Document} The promise of the result.
   */
  @returnsPromise
  @returnType('Document')
  @serverVersions(['3.2.0', ServerVersions.latest])
  async findOneAndDelete(filter: Document, options: FindAndModifyOptions = {}): Promise<Document> {
    assertArgsDefinedType([filter], [true], 'Collection.findOneAndDelete');
    this._emitCollectionApiCall('findOneAndDelete', { filter, options });
    const result = await this._mongo._serviceProvider.findOneAndDelete(
      this._database._name,
      this._name,
      filter,
      { ...this._database._baseOptions, ...options },
    );

    if (options.explain) {
      return markAsExplainOutput(result);
    }
    return result.value;
  }

  /**
   * Find one document and replace it.
   *
   * @note: Shell API uses option 'returnNewDocument' while data provider API
   * expects 'returnDocument'.
   * @note: Data provider API provides bypassDocumentValidation option that shell does not have.
   *
   * @param {Object} filter - The filter.
   * @param {Object} replacement - The replacement.
   * @param {Object} options - The find options.
   *  <projection, sort, upsert, maxTimeMS, returnNewDocument, collation>
   *
   * @returns {Document} The promise of the result.
   */
  @returnsPromise
  @returnType('Document')
  @serverVersions(['3.2.0', ServerVersions.latest])
  async findOneAndReplace(filter: Document, replacement: Document, options: FindAndModifyShellOptions = {}): Promise<Document> {
    assertArgsDefinedType([filter], [true], 'Collection.findOneAndReplace');
    const findOneAndReplaceOptions = processFindAndModifyOptions({
      ...this._database._baseOptions,
      ...options
    });

    this._emitCollectionApiCall('findOneAndReplace', { filter, findOneAndReplaceOptions });
    const result = await this._mongo._serviceProvider.findOneAndReplace(
      this._database._name,
      this._name,
      filter,
      replacement,
      findOneAndReplaceOptions
    );

    if (options.explain) {
      return markAsExplainOutput(result);
    }
    return result.value;
  }

  /**
   * Find one document and update it.
   *
   * @note: Shell API uses option 'returnNewDocument' while data provider API
   * expects 'returnDocument'.
   *
   * @param {Object} filter - The filter.
   * @param {(Object|Array)} update - The update.
   * @param {Object} options - The find options.
   *  <projection, sort,maxTimeMS,upsert,returnNewDocument,collation, arrayFilters>
   *
   * @returns {Document} The promise of the result.
   */
  @returnsPromise
  @returnType('Document')
  @serverVersions(['3.2.0', ServerVersions.latest])
  async findOneAndUpdate(filter: Document, update: Document | Document[], options: FindAndModifyShellOptions = {}): Promise<Document> {
    assertArgsDefinedType([filter], [true], 'Collection.findOneAndUpdate');
    const findOneAndUpdateOptions = processFindAndModifyOptions({
      ...this._database._baseOptions,
      ...options
    });

    this._emitCollectionApiCall('findOneAndUpdate', { filter, findOneAndUpdateOptions });
    const result = await this._mongo._serviceProvider.findOneAndUpdate(
      this._database._name,
      this._name,
      filter,
      update,
      findOneAndUpdateOptions,
    );

    if (options.explain) {
      return markAsExplainOutput(result);
    }
    return result.value;
  }

  /**
   * Alias for insertMany.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   *
   * @param {Object|Array} docs
   * @param {Object} options
   *    <writeConcern, ordered>
   * @return {InsertManyResult}
   */
  @returnsPromise
  @deprecated
  @serverVersions([ServerVersions.earliest, '3.6.0'])
  async insert(docs: Document | Document[], options: BulkWriteOptions = {}): Promise<InsertManyResult> {
    printDeprecationWarning(
      'Collection.insert() is deprecated. Use insertOne, insertMany, or bulkWrite.',
      this._mongo._internalState.context.print
    );
    assertArgsDefinedType([docs], [true], 'Collection.insert');
    // When inserting documents into MongoDB that do not contain the _id field,
    // one will be added to each of the documents missing it by the Node driver,
    // mutating the document. To prevent this behaviour we pass not the original document,
    // but its copy, to keep the original document immutable.
    // https://github.com/mongodb/node-mongodb-native/blob/3.6/lib/collection.js#L487-L489
    const docsToInsert: Document[] = Array.isArray(docs) ? docs.map((doc) => ({ ...doc })) : [{ ...docs }];

    this._emitCollectionApiCall('insert', { options });
    const result = await this._mongo._serviceProvider.insertMany(
      this._database._name,
      this._name,
      docsToInsert,
      { ...this._database._baseOptions, ...options }
    );

    return new InsertManyResult(
      !!result.acknowledged,
      result.insertedIds
    );
  }

  /**
   * Insert multiple documents.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   * @note: Data provider API allows for bypassDocumentValidation as argument,
   * shell API doesn't.
   *
   * @param {Object|Array} docs
   * @param {Object} options
   *    <writeConcern, ordered>
   * @return {InsertManyResult}
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async insertMany(docs: Document[], options: BulkWriteOptions = {}): Promise<InsertManyResult> {
    assertArgsDefinedType([docs], [true], 'Collection.insertMany');
    const docsToInsert: Document[] = Array.isArray(docs) ? docs.map((doc) => ({ ...doc })) : docs;

    this._emitCollectionApiCall('insertMany', { options });
    const result = await this._mongo._serviceProvider.insertMany(
      this._database._name,
      this._name,
      docsToInsert,
      { ...this._database._baseOptions, ...options }
    );

    return new InsertManyResult(
      !!result.acknowledged,
      result.insertedIds
    );
  }

  /**
   * Insert one document.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   * @note: Data provider API allows for bypassDocumentValidation as argument,
   * shell API doesn't.
   *
   * @param {Object} doc
   * @param {Object} options
   *    <writeConcern>
   * @return {InsertOneResult}
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async insertOne(doc: Document, options: InsertOneOptions = {}): Promise<InsertOneResult> {
    assertArgsDefinedType([doc], [true], 'Collection.insertOne');

    this._emitCollectionApiCall('insertOne', { options });
    const result = await this._mongo._serviceProvider.insertOne(
      this._database._name,
      this._name,
      { ...doc },
      { ...this._database._baseOptions, ...options }
    );

    return new InsertOneResult(
      !!result.acknowledged,
      result.insertedId
    );
  }

  /**
   * Is collection capped?
   *
   * @return {Boolean}
   */
  @returnsPromise
  async isCapped(): Promise<boolean> {
    this._emitCollectionApiCall('isCapped');
    return this._mongo._serviceProvider.isCapped(this._database._name, this._name);
  }

  /**
   * Deprecated remove command.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   * @note: Shell API accepts second argument as a bool, indicating justOne.
   *
   * @param {Object} query
   * @param {Object|Boolean} options
   *    <justOne, writeConcern, collation>
   * @return {Promise}
   */
  @returnsPromise
  @deprecated
  @serverVersions([ServerVersions.earliest, '3.2.0'])
  async remove(query: Document, options: boolean | RemoveShellOptions = {}): Promise<DeleteResult | Document> {
    printDeprecationWarning(
      'Collection.remove() is deprecated. Use deleteOne, deleteMany, findOneAndDelete, or bulkWrite.',
      this._mongo._internalState.context.print
    );
    assertArgsDefinedType([query], [true], 'Collection.remove');
    const removeOptions = processRemoveOptions(options);
    const method = removeOptions.justOne ? 'deleteOne' : 'deleteMany';
    delete removeOptions.justOne;

    this._emitCollectionApiCall('remove', { query, removeOptions });
    const result = await this._mongo._serviceProvider[method](
      this._database._name,
      this._name,
      query,
      { ...this._database._baseOptions, ...removeOptions }
    );
    if (removeOptions.explain) {
      return markAsExplainOutput(result);
    }
    return new DeleteResult(
      !!result.acknowledged,
      result.deletedCount
    );
  }

  @deprecated
  save(): never {
    throw new MongoshInvalidInputError(
      'Collection.save() is deprecated. Use insertOne, insertMany, updateOne, or updateMany.'
    );
  }

  /**
   * Replace a document with another.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   * @note: Data provider API allows for bypassDocumentValidation as argument,
   * shell API doesn't.
   *
   * @param {Object} filter - The filter.
   * @param {Object} replacement - The replacement document for matches.
   * @param {Object} options - The replace options.
   *    <upsert, writeConcern, collation, hint>
   *
   * @returns {UpdateResult} The promise of the result.
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async replaceOne(filter: Document, replacement: Document, options: ReplaceOptions = {}): Promise<UpdateResult> {
    assertArgsDefinedType([filter], [true], 'Collection.replaceOne');

    this._emitCollectionApiCall('replaceOne', { filter, options });
    const result = await this._mongo._serviceProvider.replaceOne(
      this._database._name,
      this._name,
      filter,
      replacement,
      { ...this._database._baseOptions, ...options }
    );
    return new UpdateResult(
      !!result.acknowledged,
      result.matchedCount,
      result.modifiedCount,
      result.upsertedCount,
      result.upsertedId
    );
  }

  @returnsPromise
  @deprecated
  @serverVersions([ServerVersions.earliest, '3.2.0'])
  async update(filter: Document, update: Document, options: UpdateOptions & { multi?: boolean } = {}): Promise<UpdateResult | Document> {
    printDeprecationWarning(
      'Collection.update() is deprecated. Use updateOne, updateMany, or bulkWrite.',
      this._mongo._internalState.context.print
    );
    assertArgsDefinedType([filter, update], [true, true], 'Collection.update');
    this._emitCollectionApiCall('update', { filter, options });
    let result;

    if (options.multi) {
      result = await this._mongo._serviceProvider.updateMany(
        this._database._name,
        this._name,
        filter,
        update,
        { ...this._database._baseOptions, ...options },
      );
    } else {
      result = await this._mongo._serviceProvider.updateOne(
        this._database._name,
        this._name,
        filter,
        update,
        { ...this._database._baseOptions, ...options },
      );
    }
    if (options.explain) {
      return markAsExplainOutput(result);
    }
    return new UpdateResult(
      !!result.acknowledged,
      result.matchedCount,
      result.modifiedCount,
      result.upsertedCount,
      result.upsertedId
    );
  }

  /**
   * Update many documents.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   *
   * @param {Object} filter - The filter.
   * @param {(Object|Array)} update - The updates.
   * @param {Object} options - The update options.
   *  <upsert, writeConcern, collation, arrayFilters, hint>
   *
   * @returns {UpdateResult} The promise of the result.
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async updateMany(filter: Document, update: Document, options: UpdateOptions = {}): Promise<UpdateResult | Document> {
    assertArgsDefinedType([filter], [true], 'Collection.updateMany');
    this._emitCollectionApiCall('updateMany', { filter, options });
    const result = await this._mongo._serviceProvider.updateMany(
      this._database._name,
      this._name,
      filter,
      update,
      { ...this._database._baseOptions, ...options }
    );
    if (options.explain) {
      return markAsExplainOutput(result);
    }

    return new UpdateResult(
      !!result.acknowledged,
      result.matchedCount,
      result.modifiedCount,
      result.upsertedCount,
      result.upsertedId
    );
  }

  /**
   * Update one document.
   *
   * @note: Shell API sets writeConcern via options in object, data provider API
   * expects it as a dbOption object.
   *
   * @param {Object} filter - The filter.
   * @param {(Object|Array)} update - The updates.
   * @param {Object} options - The update options.
   *  <upsert, writeConcern, collation, arrayFilters, hint>
   *
   * @returns {UpdateResult} The promise of the result.
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async updateOne(
    filter: Document,
    update: Document,
    options: UpdateOptions = {}
  ): Promise<UpdateResult | Document> {
    assertArgsDefinedType([filter], [true], 'Collection.updateOne');
    this._emitCollectionApiCall('updateOne', { filter, options });
    const result = await this._mongo._serviceProvider.updateOne(
      this._database._name,
      this._name,
      filter,
      update,
      { ...this._database._baseOptions, ...options }
    );
    if (options.explain) {
      return markAsExplainOutput(result);
    }

    return new UpdateResult(
      !!result.acknowledged,
      result.matchedCount,
      result.modifiedCount,
      result.upsertedCount,
      result.upsertedId
    );
  }

  /**
   * Converts a collection to capped
   *
   * @param {String} size - The maximum size, in bytes, for the capped collection.
   *
   * @return {Promise}
   */
  @returnsPromise
  async convertToCapped(size: number): Promise<Document> {
    this._emitCollectionApiCall('convertToCapped', { size });
    return await this._mongo._serviceProvider.runCommandWithCheck(
      this._database._name, {
        convertToCapped: this._name,
        size
      },
      this._database._baseOptions
    );
  }

  /**
   * Create indexes for a collection
   *
   * @param {Document} keyPatterns - An array of documents that contains
   *  the field and value pairs where the field is the index key and the
   *  value describes the type of index for that field.
   * @param {Document} options - createIndexes options (
   *  name, background, sparse ...)
   * @return {Promise}
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async createIndexes(
    keyPatterns: Document[],
    options: CreateIndexesOptions = {}
  ): Promise<string[]> {
    assertArgsDefinedType([keyPatterns], [true], 'Collection.createIndexes');
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new MongoshInvalidInputError(
        'The "options" argument must be an object.',
        CommonErrors.InvalidArgument
      );
    }

    const specs = keyPatterns.map((pattern) => ({
      ...options, key: pattern
    }));

    this._emitCollectionApiCall('createIndexes', { specs });

    return await this._mongo._serviceProvider.createIndexes(
      this._database._name, this._name, specs, { ...this._database._baseOptions, ...options });
  }

  /**
   * Create index for a collection
   *
   * @param {Document} keys - An document that contains
   *  the field and value pairs where the field is the index key and the
   *  value describes the type of index for that field.
   * @param {Document} options - createIndexes options (
   *  name, background, sparse ...)
   *
   * @return {Promise}
   */
  @returnsPromise
  async createIndex(
    keys: Document,
    options: CreateIndexesOptions = {}
  ): Promise<string> {
    assertArgsDefinedType([keys], [true], 'Collection.createIndex');
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new MongoshInvalidInputError(
        'The "options" argument must be an object.',
        CommonErrors.InvalidArgument
      );
    }
    this._emitCollectionApiCall('createIndex', { keys, options });

    const spec = { key: keys, ...options }; // keep options for java
    const names = await this._mongo._serviceProvider.createIndexes(
      this._database._name, this._name, [spec], { ...this._database._baseOptions, ...options });
    if (!Array.isArray(names) || names.length !== 1) {
      throw new MongoshInternalError(
        `Expected createIndexes() to return array of length 1, saw ${names}`);
    }
    return names[0];
  }

  /**
   * Create index for a collection (alias for createIndex)
   *
   * @param {Document} keys - An document that contains
   *  the field and value pairs where the field is the index key and the
   *  value describes the type of index for that field.
   * @param {Document} options - createIndexes options (
   *  name, background, sparse ...)
   *
   * @return {Promise}
   */
  @returnsPromise
  async ensureIndex(
    keys: Document,
    options: CreateIndexesOptions = {}
  ): Promise<Document> {
    assertArgsDefinedType([keys], [true], 'Collection.ensureIndex');
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new MongoshInvalidInputError(
        'The "options" argument must be an object.',
        CommonErrors.InvalidArgument
      );
    }
    this._emitCollectionApiCall('ensureIndex', { keys, options });

    const spec = { key: keys, ...options };
    return await this._mongo._serviceProvider.createIndexes(this._database._name, this._name, [spec], { ...this._database._baseOptions, ...options });
  }

  /**
   * Returns an array that holds a list of documents that identify and
   * describe the existing indexes on the collection.
   *
   * @return {Promise}
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async getIndexes(): Promise<Document[]> {
    this._emitCollectionApiCall('getIndexes');
    return await this._mongo._serviceProvider.getIndexes(this._database._name, this._name, this._database._baseOptions);
  }

  /**
   * Returns an array that holds a list of documents that identify and
   * describe the existing indexes on the collection. (alias for getIndexes)
   *
   * @return {Promise}
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async getIndexSpecs(): Promise<Document[]> {
    this._emitCollectionApiCall('getIndexSpecs');
    return await this._mongo._serviceProvider.getIndexes(this._database._name, this._name, this._database._baseOptions);
  }

  /**
   * Returns an array that holds a list of documents that identify and
   * describe the existing indexes on the collection. (alias for getIndexes)
   *
   * @return {Promise}
   */
  @returnsPromise
  async getIndices(): Promise<Document[]> {
    this._emitCollectionApiCall('getIndices');
    return await this._mongo._serviceProvider.getIndexes(this._database._name, this._name, this._database._baseOptions);
  }

  /**
   * Returns an array of key patterns for the indexes defined on the collection.
   *
   * @return {Promise}
   */
  @returnsPromise
  @serverVersions(['3.2.0', ServerVersions.latest])
  async getIndexKeys(): Promise<Document[]> {
    this._emitCollectionApiCall('getIndexKeys');
    const indexes = await this._mongo._serviceProvider.getIndexes(this._database._name, this._name, this._database._baseOptions);
    return indexes.map(i => i.key);
  }

  /**
   * Drops the specified index or indexes (except the index on the _id field)
   * from a collection.
   *
   * @param {string|string[]|Object|Object[]} indexes the indexes to be removed.
   * @return {Promise}
   */
  @returnsPromise
  async dropIndexes(indexes: string|string[]|Document|Document[] = '*'): Promise<Document> {
    this._emitCollectionApiCall('dropIndexes', { indexes });
    try {
      return await this._mongo._serviceProvider.runCommandWithCheck(
        this._database._name,
        {
          dropIndexes: this._name,
          index: indexes,
        },
        this._database._baseOptions);
    } catch (error) {
      // If indexes is an array and we're failing because of that, we fall back to
      // trying to drop all the indexes individually because that's what's supported
      // on mongod 4.0. In the java-shell, error properties are unavailable,
      // so we are a bit more generous there in terms of situation in which we retry.
      if ((error.codeName === 'IndexNotFound' || error.codeName === undefined) &&
          (error.errmsg === 'invalid index name spec' || error.errmsg === undefined) &&
          Array.isArray(indexes) &&
          indexes.length > 0 &&
          (await this._database.version()).match(/^4\.0\./)) {
        const all = await Promise.all((indexes as string[]).map(
          async index => await this.dropIndexes(index)));
        const errored = all.find(result => !result.ok);
        if (errored) return errored;
        // Return the entry with the highest nIndexesWas value.
        return all.sort((a, b) => b.nIndexesWas - a.nIndexesWas)[0];
      }

      if (error.codeName === 'IndexNotFound') {
        return {
          ok: error.ok,
          errmsg: error.errmsg,
          code: error.code,
          codeName: error.codeName
        };
      }

      throw error;
    }
  }

  /**
   * Drops the specified index from a collection.
   *
   * @param {string|Object} index the index to be removed.
   * @return {Promise}
   */
  @returnsPromise
  async dropIndex(index: string|Document): Promise<Document> {
    assertArgsDefinedType([index], [true], 'Collection.dropIndex');
    this._emitCollectionApiCall('dropIndex', { index });
    if (index === '*') {
      throw new MongoshInvalidInputError(
        'To drop indexes in the collection using \'*\', use db.collection.dropIndexes().',
        CommonErrors.InvalidArgument
      );
    }

    if (Array.isArray(index)) {
      throw new MongoshInvalidInputError(
        'The index to drop must be either the index name or the index specification document.',
        CommonErrors.InvalidArgument
      );
    }
    return this.dropIndexes(index);
  }

  /**
   * Returns the total size of all indexes for the collection.
   *
   * @return {Promise}
   */
  @returnsPromise
  async totalIndexSize(...args: any[]): Promise<number> {
    this._emitCollectionApiCall('totalIndexSize');
    if (args.length) {
      throw new MongoshInvalidInputError(
        '"totalIndexSize" takes no argument. Use db.collection.stats to get detailed information.',
        CommonErrors.InvalidArgument
      );
    }

    const stats = await this._mongo._serviceProvider.stats(this._database._name, this._name, this._database._baseOptions);
    return stats.totalIndexSize;
  }

  /**
   * Drops and recreate indexes for a collection.
   *
   * @return {Promise}
   */
  @returnsPromise
  async reIndex(): Promise<Document> {
    this._emitCollectionApiCall('reIndex');
    return await this._mongo._serviceProvider.runCommandWithCheck(this._database._name, {
      reIndex: this._name
    }, this._database._baseOptions);
  }

  /**
   * Returns the collection database.
   *
   * @return {Database}
   */
  @returnType('Database')
  getDB(): Database {
    this._emitCollectionApiCall('getDB');
    return this._database;
  }

  /**
   * Returns the collection mongo
   *
   * @return {Mongo}
   */
  @returnType('Mongo')
  getMongo(): Mongo {
    this._emitCollectionApiCall('getMongo');
    return this._mongo;
  }

  /**
   * Get the collection dataSize.
   *
   * @return {Promise} returns Promise
   */
  @returnsPromise
  async dataSize(): Promise<number> {
    this._emitCollectionApiCall('dataSize');
    const stats = await this._mongo._serviceProvider.stats(this._database._name, this._name, this._database._baseOptions);
    return stats.size;
  }

  /**
   * Get the collection storageSize.
   *
   * @return {Promise} returns Promise
   */
  @returnsPromise
  async storageSize(): Promise<number> {
    this._emitCollectionApiCall('storageSize');
    const stats = await this._mongo._serviceProvider.stats(this._database._name, this._name, this._database._baseOptions);
    return stats.storageSize;
  }

  /**
   * Get the collection totalSize.
   *
   * @return {Promise} returns Promise
   */
  @returnsPromise
  async totalSize(): Promise<number> {
    this._emitCollectionApiCall('totalSize');
    const stats = await this._mongo._serviceProvider.stats(this._database._name, this._name, this._database._baseOptions);
    return (stats.storageSize || 0) + (stats.totalIndexSize || 0);
  }

  /**
   * Drop a collection.
   *
   * @return {Promise} returns Promise
   */
  @returnsPromise
  async drop(): Promise<boolean> {
    this._emitCollectionApiCall('drop');

    try {
      return await this._mongo._serviceProvider.dropCollection(
        this._database._name,
        this._name,
        this._database._baseOptions
      );
    } catch (error) {
      if (error.codeName === 'NamespaceNotFound') {
        this._mongo._internalState.messageBus.emit(
          'mongosh:warn',
          {
            method: 'drop',
            class: 'Collection',
            message: `Namespace not found: ${this._name}`
          }
        );
        return false;
      }
      throw error;
    }
  }

  /**
   * Collection exists.
   *
   * @return {Promise} returns Promise
   */
  @returnsPromise
  async exists(): Promise<Document> {
    this._emitCollectionApiCall('exists');
    const collectionInfos = await this._mongo._serviceProvider.listCollections(
      this._database._name,
      {
        name: this._name
      },
      this._database._baseOptions
    );

    return collectionInfos[0] || null;
  }

  getFullName(): string {
    this._emitCollectionApiCall('getFullName');
    return `${this._database._name}.${this._name}`;
  }

  getName(): string {
    this._emitCollectionApiCall('getName');
    return `${this._name}`;
  }

  @returnsPromise
  async runCommand(commandName: string, options?: RunCommandOptions): Promise<Document> {
    assertArgsDefinedType([commandName], ['string'], 'Collection.runCommand');

    if (options && commandName in options) {
      throw new MongoshInvalidInputError(
        'The "commandName" argument cannot be passed as an option to "runCommand".',
        CommonErrors.InvalidArgument
      );
    }


    const hiddenCommands = new RegExp(HIDDEN_COMMANDS);
    if (!hiddenCommands.test(commandName)) {
      this._emitCollectionApiCall('runCommand', { commandName });
    }
    return await this._mongo._serviceProvider.runCommandWithCheck(
      this._database._name,
      {
        [commandName]: this._name,
        ...options
      },
      this._database._baseOptions
    );
  }

  @returnType('Explainable')
  explain(verbosity: ExplainVerbosityLike = 'queryPlanner'): Explainable {
    verbosity = validateExplainableVerbosity(verbosity);
    this._emitCollectionApiCall('explain', { verbosity });
    return new Explainable(this._mongo, this, verbosity);
  }

  @returnsPromise
  async stats(originalOptions: CollStatsShellOptions | number = {}): Promise<Document> {
    const options: CollStatsShellOptions =
      typeof originalOptions === 'number' ? { scale: originalOptions } : originalOptions;

    if (options.indexDetailsKey && options.indexDetailsName) {
      throw new MongoshInvalidInputError(
        'Cannot filter indexDetails on both indexDetailsKey and indexDetailsName',
        CommonErrors.InvalidArgument
      );
    }
    if (options.indexDetailsKey && typeof options.indexDetailsKey !== 'object') {
      throw new MongoshInvalidInputError(
        `Expected options.indexDetailsKey to be a document, got ${typeof options.indexDetailsKey}`,
        CommonErrors.InvalidArgument
      );
    }
    if (options.indexDetailsName && typeof options.indexDetailsName !== 'string') {
      throw new MongoshInvalidInputError(
        `Expected options.indexDetailsName to be a string, got ${typeof options.indexDetailsName}`,
        CommonErrors.InvalidArgument
      );
    }
    options.scale = options.scale || 1;
    options.indexDetails = options.indexDetails || false;

    this._emitCollectionApiCall('stats', { options });
    const result = await this._mongo._serviceProvider.runCommandWithCheck(
      this._database._name,
      {
        collStats: this._name, scale: options.scale
      },
      this._database._baseOptions
    );
    if (!result) {
      throw new MongoshRuntimeError(
        `Error running collStats command on ${this.getFullName()}`,
        CommonErrors.CommandFailed
      );
    }
    let filterIndexName = options.indexDetailsName;
    if (!filterIndexName && options.indexDetailsKey) {
      const indexes = await this._mongo._serviceProvider.getIndexes(this._database._name, this._name, this._database._baseOptions);
      indexes.forEach((spec) => {
        if (JSON.stringify(spec.key) === JSON.stringify(options.indexDetailsKey)) {
          filterIndexName = spec.name;
        }
      });
    }

    /**
     * Remove indexDetails if options.indexDetails is true. From the old shell code.
     * @param stats
     */
    const updateStats = (stats: any): void => {
      if (!stats.indexDetails) {
        return;
      }
      if (!options.indexDetails) {
        delete stats.indexDetails;
        return;
      }
      if (!filterIndexName) {
        return;
      }
      for (const key of Object.keys(stats.indexDetails)) {
        if (key === filterIndexName) {
          continue;
        }
        delete stats.indexDetails[key];
      }
    };
    updateStats(result);

    if (result.sharded) {
      for (const shardName of result.shards) {
        updateStats(result.shards[shardName]);
      }
    }
    return result;
  }

  @returnsPromise
  async latencyStats(options: Document = {}): Promise<Document[]> {
    this._emitCollectionApiCall('latencyStats', { options });
    const pipeline = [{ $collStats: { latencyStats: options } }];
    const providerCursor = this._mongo._serviceProvider.aggregate(
      this._database._name,
      this._name,
      pipeline,
      this._database._baseOptions
    );
    return await providerCursor.toArray();
  }

  @returnsPromise
  @returnType('Bulk')
  async initializeOrderedBulkOp(): Promise<Bulk> {
    this._emitCollectionApiCall('initializeOrderedBulkOp');
    const innerBulk = await this._mongo._serviceProvider.initializeBulkOp(
      this._database._name,
      this._name,
      true,
      this._database._baseOptions
    );
    return new Bulk(this, innerBulk, true);
  }

  @returnsPromise
  @returnType('Bulk')
  async initializeUnorderedBulkOp(): Promise<Bulk> {
    this._emitCollectionApiCall('initializeUnorderedBulkOp');
    const innerBulk = await this._mongo._serviceProvider.initializeBulkOp(
      this._database._name,
      this._name,
      false,
      this._database._baseOptions
    );
    return new Bulk(this, innerBulk);
  }

  @returnType('PlanCache')
  getPlanCache(): PlanCache {
    this._emitCollectionApiCall('getPlanCache');
    return new PlanCache(this);
  }

  @returnsPromise
  async mapReduce(map: Function | string, reduce: Function | string, optionsOrOutString: MapReduceShellOptions): Promise<Document> {
    assertArgsDefinedType([map, reduce, optionsOrOutString], [true, true, true], 'Collection.mapReduce');
    this._emitCollectionApiCall('mapReduce', { map, reduce, out: optionsOrOutString });

    let cmd = {
      mapReduce: this._name,
      map: map,
      reduce: reduce,
      ...processMapReduceOptions(optionsOrOutString)
    } as Document;

    if (cmd.explain) {
      const verbosity = cmd.explain;
      delete cmd.explain;
      cmd = {
        explain: cmd,
        verbosity
      };
    }

    return await this._mongo._serviceProvider.runCommandWithCheck(
      this._database._name,
      cmd,
      this._database._baseOptions
    );
  }

  @returnsPromise
  async validate(full = false): Promise<Document> {
    this._emitCollectionApiCall('validate', { full });
    return await this._mongo._serviceProvider.runCommandWithCheck(
      this._database._name,
      {
        validate: this._name,
        full: full
      },
      this._database._baseOptions
    );
  }

  @returnsPromise
  @topologies([Topologies.Sharded])
  async getShardVersion(): Promise<Document> {
    this._emitCollectionApiCall('getShardVersion', {});
    return await this._mongo._serviceProvider.runCommandWithCheck(
      ADMIN_DB,
      {
        getShardVersion: `${this._database._name}.${this._name}`
      },
      this._database._baseOptions
    );
  }

  @returnsPromise
  @topologies([Topologies.Sharded])
  async getShardDistribution(): Promise<CommandResult> {
    this._emitCollectionApiCall('getShardDistribution', {});

    const result = {} as Document;
    const config = this._mongo.getDB('config');

    const isSharded = !!(await config.getCollection('collections').countDocuments({
      _id: `${this._database._name}.${this._name}`,
      // dropped is gone on newer server versions, so check for !== true
      // rather than for === false (SERVER-51880 and related)
      dropped: { $ne: true }
    }));
    if (!isSharded) {
      throw new MongoshInvalidInputError(
        `Collection ${this._name} is not sharded`,
        ShellApiErrors.NotConnectedToShardedCluster
      );
    }

    const collStats = await (await this.aggregate({ '$collStats': { storageStats: {} } })).toArray();

    const totals = { numChunks: 0, size: 0, count: 0 };
    const conciseShardsStats: {
      shardId: string;
      host: string;
      size: number;
      count: number;
      numChunks: number;
      avgObjSize: number;
    }[] = [];

    await Promise.all(collStats.map((extShardStats) => (
      (async(): Promise<void> => {
        // Extract and store only the relevant subset of the stats for this shard
        const [ host, numChunks ] = await Promise.all([
          config.getCollection('shards').findOne({ _id: extShardStats.shard }),
          config.getCollection('chunks').countDocuments({ ns: extShardStats.ns, shard: extShardStats.shard })
        ]);
        const shardStats = {
          shardId: extShardStats.shard,
          host: host !== null ? host.host : null,
          size: extShardStats.storageStats.size,
          count: extShardStats.storageStats.count,
          numChunks: numChunks,
          avgObjSize: extShardStats.storageStats.avgObjSize
        };

        const key = `Shard ${shardStats.shardId} at ${shardStats.host}`;

        const estChunkData =
          (shardStats.numChunks === 0) ? 0 : (shardStats.size / shardStats.numChunks);
        const estChunkCount =
          (shardStats.numChunks === 0) ? 0 : Math.floor(shardStats.count / shardStats.numChunks);

        result[key] = {
          data: dataFormat(shardStats.size),
          docs: shardStats.count,
          chunks: shardStats.numChunks,
          'estimated data per chunk': dataFormat(estChunkData),
          'estimated docs per chunk': estChunkCount
        };


        totals.size += shardStats.size;
        totals.count += shardStats.count;
        totals.numChunks += shardStats.numChunks;

        conciseShardsStats.push(shardStats);
      })()
    )));

    const totalValue = {
      data: dataFormat(totals.size),
      docs: totals.count,
      chunks: totals.numChunks
    } as Document;

    // for (const shardStats of conciseShardsStats) {
    await Promise.all(conciseShardsStats.map((shardStats) => (
      (async(): Promise<void> => {
        const estDataPercent =
          (totals.size === 0) ? 0 : (Math.floor(shardStats.size / totals.size * 10000) / 100);
        const estDocPercent =
          (totals.count === 0) ? 0 : (Math.floor(shardStats.count / totals.count * 10000) / 100);

        totalValue[`Shard ${shardStats.shardId}`] = [
          `${estDataPercent} % data`,
          `${estDocPercent} % docs in cluster`,
          `${dataFormat(shardStats.avgObjSize)} avg obj size on shard`
        ];
      })()
    )));
    result.Totals = totalValue;
    return new CommandResult('StatsResult', result);
  }

  @serverVersions(['3.1.0', ServerVersions.latest])
  @topologies([Topologies.ReplSet, Topologies.Sharded])
  watch(pipeline: Document[] = [], options: ChangeStreamOptions = {}): ChangeStreamCursor {
    this._emitCollectionApiCall('watch', { pipeline, options });
    const cursor = new ChangeStreamCursor(
      this._mongo._serviceProvider.watch(pipeline, options, {}, this._database._name, this._name),
      this._name,
      this._mongo
    );
    this._mongo._internalState.currentCursor = cursor;
    return cursor;
  }

  @serverVersions(['4.4.0', ServerVersions.latest])
  @returnsPromise
  async hideIndex(index: string | Document): Promise<Document> {
    this._emitCollectionApiCall('hideIndex');
    return setHideIndex(this, index, true);
  }

  @serverVersions(['4.4.0', ServerVersions.latest])
  @returnsPromise
  async unhideIndex(index: string | Document): Promise<Document> {
    this._emitCollectionApiCall('unhideIndex');
    return setHideIndex(this, index, false);
  }
}
