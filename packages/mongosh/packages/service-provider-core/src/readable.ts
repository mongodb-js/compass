import type {
  Document,
  AggregateOptions,
  CountOptions,
  CountDocumentsOptions,
  DistinctOptions,
  EstimatedDocumentCountOptions,
  FindOptions,
  ListCollectionsOptions,
  CollStatsOptions,
  ListIndexesOptions,
  AggregationCursor,
  FindCursor,
  DbOptions,
  ReadPreferenceFromOptions,
  ReadPreferenceLike
} from './all-transport-types';
import { ChangeStream, ChangeStreamOptions } from './all-transport-types';

/**
 * Interface for read operations in the CRUD specification.
 */
export default interface Readable {
  /**
   * Run an aggregation pipeline.
   *
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Array} pipeline - The aggregation pipeline.
   * @param {Document} options - The pipeline options.
   * @param {DbOptions} dbOptions - The database options
   * @returns {Cursor} A cursor.
   */
  aggregate(
    database: string,
    collection: string,
    pipeline: Document[],
    options?: AggregateOptions,
    dbOptions?: DbOptions): AggregationCursor;

  /**
   * Run an aggregation pipeline on the DB.
   *
   * @param {String} database - The database name.
   * @param {Array} pipeline - The aggregation pipeline.
   * @param {Document} options - The pipeline options.
   * @param {Object} dbOptions - Optional options.
   *
   * @returns {Cursor} A cursor.
   */
  aggregateDb(
    database: string,
    pipeline: Document[],
    options?: AggregateOptions,
    dbOptions?: DbOptions
  ): AggregationCursor;

  /**
   * Returns the count of documents that would match a find() query for the
   * collection or view. The db.collection.count() method does not perform the
   * find() operation but instead counts and returns the number of results
   * that match a query.
   *
   * @param {String} db - the db name
   * @param {String} coll - the collection name
   * @param query
   * @param options
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} A promise of the result.
   */
  count(
    db: string,
    coll: string,
    query?: Document,
    options?: CountOptions,
    dbOptions?: DbOptions): Promise<number>;

  /**
   * Get an exact document count from the collection.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {Document} options - The count options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} A promise of the result.
   */
  countDocuments(
    database: string,
    collection: string,
    filter?: Document,
    options?: CountDocumentsOptions,
    dbOptions?: DbOptions): Promise<number>;

  /**
   * Get distinct values for the field.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {String} fieldName - The field name.
   * @param {Document} filter - The filter.
   * @param {Document} options - The distinct options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Document}.
   */
  distinct(
    database: string,
    collection: string,
    fieldName: string,
    filter?: Document,
    options?: DistinctOptions,
    dbOptions?: DbOptions): Promise<Document>;

  /**
   * Get an estimated document count from the collection.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} options - The count options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} The promise of the result.
   */
  estimatedDocumentCount(
    database: string,
    collection: string,
    options?: EstimatedDocumentCountOptions,
    dbOptions?: DbOptions): Promise<number>;

  /**
   * Find documents in the collection.
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {Document} filter - The filter.
   * @param {Document} options - The find options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} The promise of the cursor.
   */
  find(
    database: string,
    collection: string,
    filter?: Document,
    options?: FindOptions,
    dbOptions?: DbOptions): FindCursor;

  /**
   * Get currently known topology information.
   */
  getTopology(): any;

  /**
   * Is the collection capped?
   *
   * @param {String} database - The database name.
   * @param {String} collection - The collection name.
   * @param {DbOptions} dbOptions - The database options
   *
   * @returns {Promise} The promise of the result.
   */
  isCapped(
    database: string,
    collection: string,
    dbOptions?: DbOptions): Promise<boolean>;

  /**
   * Returns an array that holds a list of documents that identify and
   * describe the existing indexes on the collection.
   *
   * @param {String} database - The db name.
   * @param {String} collection - The collection name.
   * @param options
   * @param {DbOptions} dbOptions - The database options
   *
   * @return {Promise}
   */
  getIndexes(
    database: string,
    collection: string,
    options: ListIndexesOptions,
    dbOptions?: DbOptions): Promise<Document[]>;

  /**
   * Returns an array of collection infos
   *
   * @param {String} database - The db name.
   * @param {Document} filter - The filter.
   * @param {Document} options - The command options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @return {Promise}
   */
  listCollections(
    database: string,
    filter?: Document,
    options?: ListCollectionsOptions,
    dbOptions?: DbOptions): Promise<Document[]>;

  /**
   * Create a ReadPreference object from a set of options
   */
  readPreferenceFromOptions(options?: Omit<ReadPreferenceFromOptions, 'session'>): ReadPreferenceLike | undefined;

  /**
   * Get all the collection statistics.
   *
   * @param {String} database - The db name.
   * @param {String} collection - The collection name.
   * @param {Object} options - The count options.
   * @param {DbOptions} dbOptions - The database options
   *
   * @return {Promise} returns Promise
   */
  stats(
    database: string,
    collection: string,
    options?: CollStatsOptions,
    dbOptions?: DbOptions
  ): Promise<Document>;

  /**
   * Start a change stream cursor on either the client, db, or collection.
   * @param pipeline
   * @param options
   * @param db
   * @param dbOptions
   * @param coll
   */
  watch(
    pipeline: Document[],
    options: ChangeStreamOptions,
    dbOptions?: DbOptions,
    db?: string,
    coll?: string
  ): ChangeStream;
}

