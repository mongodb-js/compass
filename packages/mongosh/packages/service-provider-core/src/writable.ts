import type {
  Document,
  InsertOneOptions,
  InsertOneResult,
  Collection,
  RenameOptions,
  FindAndModifyOptions,
  BulkWriteOptions,
  AnyBulkWriteOperation,
  DeleteOptions,
  DeleteResult,
  InsertManyResult,
  ReplaceOptions,
  UpdateResult,
  UpdateOptions,
  DropDatabaseOptions,
  CreateIndexesOptions,
  DropCollectionOptions,
  BulkWriteResult,
  RunCommandOptions,
  DbOptions,
  OrderedBulkOperation,
  UnorderedBulkOperation
} from './all-transport-types';

/**
 * Interface for write operations in the CRUD specification.
 */
export default interface Writable {

  /**
   * @param {String} db - the db name
   * @param spec
   * @param options
   * @param {DbOptions} dbOptions - The database options
   * @return {Promise<Document>}
   */
  runCommand(
    db: string,
    spec: Document,
    options: RunCommandOptions,
    dbOptions?: DbOptions
  ): Promise<Document>;

  /**
   * @param {String} db - the db name
   * @param spec
   * @param options
   * @param {DbOptions} dbOptions - The database options
   * @return {Promise<Document>}
   */
  runCommandWithCheck(
    db: string,
    spec: Document,
    options: RunCommandOptions,
    dbOptions?: DbOptions
  ): Promise<Document>;

  /**
   * Drop a database
   *
   * @param {String} database - The database name.
   * @param {Document} options - The options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise<Document>} The result of the operation.
   */
  dropDatabase(
    database: string,
    options: DropDatabaseOptions,
    dbOptions?: DbOptions
  ): Promise<Document>;

  /**
   * Execute a mix of write operations.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} requests - The bulk write requests.
   * @param {Document} options - The bulk write options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} The promise of the result.
   */
  bulkWrite(
    database: string,
    collection: string,
    requests: AnyBulkWriteOperation[],
    options: BulkWriteOptions,
    dbOptions?: DbOptions): Promise<BulkWriteResult>;

  /**
   * Delete multiple documents from the collection.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {Document} options - The delete many options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} The promise of the result.
   */
  deleteMany(
    database: string,
    collection: string,
    filter: Document,
    options: DeleteOptions,
    dbOptions?: DbOptions): Promise<DeleteResult>;

  /**
   * Delete one document from the collection.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {Document} options - The delete one options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} The promise of the result.
   */
  deleteOne(
    database: string,
    collection: string,
    filter: Document,
    options: DeleteOptions,
    dbOptions?: DbOptions): Promise<DeleteResult>;

  /**
   * Find one document and delete it.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {Document} options - The find options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} The promise of the result.
   */
  findOneAndDelete(
    database: string,
    collection: string,
    filter: Document,
    options: FindAndModifyOptions,
    dbOptions?: DbOptions): Promise<Document>;

  /**
   * Find one document and replace it.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {Document} replacement - The replacement.
   * @param {Document} options - The find options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} The promise of the result.
   */
  findOneAndReplace(
    database: string,
    collection: string,
    filter: Document,
    replacement: Document,
    options: FindAndModifyOptions,
    dbOptions?: DbOptions): Promise<Document>;

  /**
   * Find one document and update it.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {(Document|Array)} update - The update.
   * @param {Document} options - The find options.
   * @param {DbOptions} dbOptions - The DB options
   *
   * @returns {Promise} The promise of the result.
   */
  findOneAndUpdate(
    database: string,
    collection: string,
    filter: Document,
    update: Document | Document[],
    options: FindAndModifyOptions,
    dbOptions?: DbOptions): Promise<Document>;

  /**
   * Insert many documents into the colleciton.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Array} docs - The documents.
   * @param {Document} options - The insert many options.
   * @param {DbOptions} dbOptions - The DB options
   *
   * @returns {Promise} The promise of the result.
   */
  insertMany(
    database: string,
    collection: string,
    docs: Document[],
    options: BulkWriteOptions,
    dbOptions?: DbOptions): Promise<InsertManyResult>;

  /**
   * Insert one document into the collection.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} doc - The document.
   * @param {Document} options - The insert one options.
   * @param {DbOptions} dbOptions - The DB options
   *
   * @returns {Promise} The promise of the result.
   */
  insertOne(
    database: string,
    collection: string,
    doc: Document,
    options: InsertOneOptions,
    dbOptions?: DbOptions): Promise<InsertOneResult>;

  /**
   * Replace a document with another.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {Document} replacement - The replacement document for matches.
   * @param {Document} options - The replace options.
   * @param {DbOptions} dbOptions - The DB options
   *
   * @returns {Promise} The promise of the result.
   */
  replaceOne(
    database: string,
    collection: string,
    filter: Document,
    replacement: Document,
    options?: ReplaceOptions,
    dbOptions?: DbOptions): Promise<UpdateResult>;

  /**
   * Update many document.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {(Document|Array)} update - The updates.
   * @param {Document} options - The update options.
   * @param {DbOptions} dbOptions - The DB options
   *
   * @returns {Promise} The promise of the result.
   */
  updateMany(
    database: string,
    collection: string,
    filter: Document,
    update: Document,
    options?: UpdateOptions,
    dbOptions?: DbOptions): Promise<UpdateResult>;

  /**
   * Update a document.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {(Document|Array)} update - The updates.
   * @param {Document} options - The update options.
   * @param {DbOptions} dbOptions - The DB options
   *
   * @returns {Promise} The promise of the result.
   */
  updateOne(
    database: string,
    collection: string,
    filter: Document,
    update: Document,
    options?: UpdateOptions,
    dbOptions?: DbOptions): Promise<UpdateResult>;

  /**
   * Deprecated remove command.
   *
   * @param {String} database - The db name.
   * @param {String} collection - The collection name.
   * @param {Object} query - The query.
   * @param {Object} options - The options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @return {Promise}
   */
  remove(
    database: string,
    collection: string,
    query: Document,
    options?: DeleteOptions,
    dbOptions?: DbOptions): Promise<DeleteResult>;

  /**
   * Adds new indexes to a collection.
   *
   * @param {String} database - The db name.
   * @param {String} collection - The collection name.
   * @param {Object[]} indexSpecs the spec of the indexes to be created.
   * @param {Object} options - The command options.
   * @param {DbOptions} dbOptions - The database options
   * @return {Promise}
   */
  createIndexes(
    database: string,
    collection: string,
    indexSpecs: Document[],
    options?: CreateIndexesOptions,
    dbOptions?: DbOptions): Promise<string[]>;

  /**
   * Drops a collection.
   *
   * @param {String} database - The db name.
   * @param {String} collection - The collection name.
   * @param options
   * @param {DbOptions} dbOptions - The database options
   *
   * @return {Promise}
   */
  dropCollection(
    database: string,
    collection: string,
    options: DropCollectionOptions,
    dbOptions?: DbOptions
  ): Promise<boolean>;

  /**
   * @param {String} database - The db name.
   * @param {String} oldName - The collection name.
   * @param {String} newName - The new collection name.
   * @param {String} options - The options.
   * @param {DbOptions} dbOptions - The database options
   */
  renameCollection(
    database: string,
    oldName: string,
    newName: string,
    options?: RenameOptions,
    dbOptions?: DbOptions): Promise<Collection>;

  /**
   * Initialize a bulk operation.
   *
   * @param dbName
   * @param collName
   * @param ordered
   * @param options
   * @param dbOptions
   */
  initializeBulkOp(
    dbName: string,
    collName: string,
    ordered: boolean,
    options?: BulkWriteOptions,
    dbOptions?: DbOptions
  ): Promise<OrderedBulkOperation | UnorderedBulkOperation>;
}

