import type { DataService } from 'mongodb-data-service';
import { EJSON, type Document } from 'bson';

/**
 * BSON Document type - a generic key-value object.
 * This mirrors the BsonDocument type from schema-builder-library to avoid ESM/CJS issues.
 * When crossing the WASM boundary, BSON types are represented in EJSON format
 * (e.g., ObjectId as { "$oid": "..." }).
 */
export type BsonDocument = Record<string, unknown>;

/**
 * Convert native BSON documents to EJSON format for WASM.
 * This ensures BSON types like ObjectId, Date, etc. are properly serialized
 * as EJSON objects that can be deserialized by Rust's bson crate.
 */
function toEJSON(docs: Document[]): BsonDocument[] {
  // EJSON.serialize converts BSON types to their EJSON representation
  // e.g., ObjectId("...") -> { "$oid": "..." }
  return docs.map((doc) => EJSON.serialize(doc) as BsonDocument);
}

/**
 * Convert EJSON format from WASM back to native BSON documents.
 * This ensures EJSON objects like { "$oid": "..." } are converted back
 * to native BSON types like ObjectId for the MongoDB driver.
 */
function fromEJSON(docs: BsonDocument[]): Document[] {
  // EJSON.deserialize converts EJSON representation back to BSON types
  // e.g., { "$oid": "..." } -> ObjectId("...")
  return docs.map((doc) => EJSON.deserialize(doc as Document) as Document);
}

/**
 * Collection info type - mirrors CollectionInfo from schema-builder-library.
 */
export interface WasmCollectionInfo {
  name: string;
  type: string;
  options?: {
    viewOn?: string;
    pipeline?: BsonDocument[];
  };
}

/**
 * DataService interface - mirrors DataService from schema-builder-library.
 * This interface is what the WASM module expects.
 */
export interface WasmDataService {
  listDatabases(): Promise<string[]>;
  listCollections(dbName: string): Promise<WasmCollectionInfo[]>;
  aggregate(ns: string, pipeline: BsonDocument[]): Promise<BsonDocument[]>;
  find(ns: string, filter: BsonDocument): Promise<BsonDocument[]>;
}

/**
 * Adapter that wraps Compass's DataService to implement the WASM schema-builder-library
 * DataService interface.
 *
 * This allows the Rust-based schema builder to use Compass's existing database connection
 * without needing direct access to the MongoDB driver.
 */
export class CompassDataServiceAdapter implements WasmDataService {
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
  async listCollections(dbName: string): Promise<WasmCollectionInfo[]> {
    const collections = await this.dataService.listCollections(dbName);

    return collections.map((coll) => {
      const collInfo: WasmCollectionInfo = {
        name: coll.name,
        type: coll.type ?? 'collection',
      };

      // For views, include viewOn and pipeline in options
      if (coll.type === 'view') {
        const collectionInfo = coll as unknown as {
          options?: {
            viewOn?: string;
            pipeline?: Document[];
          };
        };
        if (collectionInfo.options) {
          collInfo.options = {
            viewOn: collectionInfo.options.viewOn,
            pipeline: collectionInfo.options.pipeline,
          };
        }
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
    ns: string,
    pipeline: BsonDocument[]
  ): Promise<BsonDocument[]> {
    // Convert EJSON pipeline from WASM to native BSON for DataService
    const nativePipeline = fromEJSON(pipeline);

    const result = await this.dataService.aggregate(
      ns,
      nativePipeline,
      {},
      {
        abortSignal: this.abortSignal,
      }
    );

    // Convert native BSON results to EJSON for WASM
    return toEJSON(result);
  }

  /**
   * Execute a find query on a namespace.
   * Namespace format: "database.collection"
   *
   * Filter comes from WASM in EJSON format and must be converted to native BSON.
   * Results are converted back to EJSON format for WASM.
   */
  async find(ns: string, filter: BsonDocument): Promise<BsonDocument[]> {
    // Convert EJSON filter from WASM to native BSON for DataService
    const nativeFilter = EJSON.deserialize(filter as Document) as Document;

    const documents = await this.dataService.find(
      ns,
      nativeFilter,
      {},
      {
        abortSignal: this.abortSignal,
      }
    );

    // Convert native BSON results to EJSON for WASM
    return toEJSON(documents);
  }
}
