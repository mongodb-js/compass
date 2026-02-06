import type { DataService } from 'mongodb-data-service';
import type { Document } from 'bson';

/**
 * BSON Document type - a generic key-value object.
 * This mirrors the BsonDocument type from schema-builder-library to avoid ESM/CJS issues.
 */
export type BsonDocument = Record<string, unknown>;

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
      const result: WasmCollectionInfo = {
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
          result.options = {
            viewOn: collectionInfo.options.viewOn,
            pipeline: collectionInfo.options.pipeline,
          };
        }
      }

      return result;
    });
  }

  /**
   * Execute an aggregation pipeline on a namespace.
   * Namespace format: "database.collection"
   */
  aggregate(ns: string, pipeline: BsonDocument[]): Promise<BsonDocument[]> {
    return this.dataService.aggregate(
      ns,
      pipeline,
      {},
      {
        abortSignal: this.abortSignal,
      }
    );
  }

  /**
   * Execute a find query on a namespace.
   * Namespace format: "database.collection"
   */
  find(ns: string, filter: BsonDocument): Promise<BsonDocument[]> {
    return this.dataService.find(
      ns,
      filter,
      {},
      {
        abortSignal: this.abortSignal,
      }
    );
  }
}
