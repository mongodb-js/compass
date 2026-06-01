import { EJSON, type Document } from 'bson';
import { AggregationCursor, FindCursor } from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import type {
  AggregateOptions,
  BsonDocument,
  CollectionInfo,
  SqlCursor,
  SqlDataService,
} from 'schema-builder-library';

/**
 * Convert native BSON documents to EJSON format for WASM.
 * This ensures BSON types like ObjectId, Date, etc. are properly serialized
 * as EJSON objects that can be deserialized by Rust's bson crate.
 */
function toEJSON(doc: Document): BsonDocument {
  // EJSON.serialize converts BSON types to their EJSON representation
  // e.g., ObjectId("...") -> { "$oid": "..." }
  return EJSON.serialize(doc, { relaxed: false }) as BsonDocument;
}

/**
 * Convert EJSON format from WASM back to native BSON documents.
 * This ensures EJSON objects like { "$oid": "..." } are converted back
 * to native BSON types like ObjectId for the MongoDB driver.
 */
function fromEJSON(doc: BsonDocument): Document {
  // EJSON.deserialize converts EJSON representation back to BSON types
  // e.g., { "$oid": "..." } -> ObjectId("...")
  return EJSON.deserialize(doc as Document);
}

/**
 * A wrapper around the node driver cursor that automatically converts the
 * native EJSON results to WASM-friendly ones.
 */
class Cursor implements SqlCursor {
  cursor: AggregationCursor | FindCursor;

  constructor(cursor: AggregationCursor | FindCursor) {
    this.cursor = cursor;
  }

  async next(): Promise<BsonDocument | null> {
    let next = (await this.cursor.next()) as Document;
    if (!next) {
      return null;
    }

    return toEJSON(next);
  }
}

/**
 * Adapter that wraps Compass's DataService to implement the WASM schema-builder-library
 * DataService interface.
 *
 * This allows the Rust-based schema builder to use Compass's existing database connection
 * without needing direct access to the MongoDB driver.
 */
export class CompassDataServiceAdapter implements SqlDataService {
  private dataService: DataService;
  private abortSignal?: AbortSignal;

  constructor(dataService: DataService, abortSignal?: AbortSignal) {
    this.dataService = dataService;
    this.abortSignal = abortSignal;
  }

  /**
   * List all database names accessible to the current user.
   */
  async listDatabases(): Promise<string[]> {
    const databases = await this.dataService.listDatabases({
      nameOnly: true,
    });

    return databases.map((db) => db.name);
  }

  /**
   * List all collections in a database, including views.
   * Returns collection info with name, type, and options (for views).
   */
  async listCollections(dbName: string): Promise<CollectionInfo[]> {
    const collections = await this.dataService.listCollections(dbName);

    return collections.map((coll) => {
      const collInfo: CollectionInfo = {
        name: coll.name,
        type: coll.type ?? 'collection',
      };

      // For views, include viewOn and pipeline in options
      if (coll.type === 'view') {
        collInfo.options = {
          viewOn: coll.view_on ?? undefined,
          pipeline: coll.pipeline?.map(toEJSON),
        };
      }

      return collInfo;
    });
  }

  /**
   * Execute an aggregation pipeline on a namespace.
   * Namespace format: "database.collection"
   *
   * Pipeline comes from WASM in EJSON format and must be converted to native BSON.
   * Results are converted back to EJSON format for WASM.
   */
  async aggregate(
    db: string,
    collection: string,
    pipeline: BsonDocument[],
    options: Partial<AggregateOptions>
  ): Promise<SqlCursor> {
    // Convert EJSON pipeline from WASM to native BSON for DataService
    const nativePipeline = pipeline.map(fromEJSON);

    const result = this.dataService.aggregateCursor(
      `${db}.${collection}`,
      nativePipeline,
      {
        signal: this.abortSignal,
        hint: options.keyHint,
      }
    );

    return new Cursor(result);
  }

  /**
   * Execute a find query on a namespace.
   * Namespace format: "database.collection"
   *
   * Filter comes from WASM in EJSON format and must be converted to native BSON.
   * Results are converted back to EJSON format for WASM.
   */
  async find(
    db: string,
    collection: string,
    filter: BsonDocument
  ): Promise<SqlCursor> {
    // Convert EJSON filter from WASM to native BSON for DataService
    const nativeFilter = fromEJSON(filter);

    const documents = this.dataService.findCursor(
      `${db}.${collection}`,
      nativeFilter,
      {}
    );

    return new Cursor(documents);
  }
}
