import type toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';

type CollectionMetadata = {
  /**
   * Collection namespace (<database>.<collection>)
   */
  namespace: string;
  /**
   * Indicates that colleciton is read only
   */
  isReadonly: boolean;
  /**
   * Indicates that colleciton is a time series collection
   */
  isTimeSeries: boolean;
  /**
   * Indicates that collection is clustered / has a clustered index
   */
  isClustered: boolean;
  /**
   * Indicates that collection has encrypted fields in it
   */
  isFLE: boolean;
  /**
   * Indicates that MongoDB server supports search indexes (property is exposed
   * on collection because the check is relevant for collection tab and requires
   * collection namespace to perform the check)
   */
  isSearchIndexesSupported: boolean;
  /**
   * View source namespace (<database>.<collection>)
   */
  sourceName?: string;
  /**
   * Indicates if a source collection is read only
   */
  sourceReadonly?: boolean;
  /**
   * View source view namespace (this is the same as metadata namespace if
   * present)
   */
  sourceViewon?: string;
  /**
   * Aggregation pipeline view definition
   */
  sourcePipeline?: unknown[];
};

interface Collection {
  _id: string;
  type: string;
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  statusError: string | null;
  ns: string;
  name: string;
  database: string;
  system: boolean;
  oplog: boolean;
  command: boolean;
  special: boolean;
  specialish: boolean;
  normal: boolean;
  readonly: boolean;
  view_on: string;
  collation: unknown;
  pipeline: unknown[];
  validation: unknown;
  is_capped: boolean;
  document_count: number;
  document_size: number;
  avg_document_size: number;
  storage_size: number;
  free_storage_size: number;
  index_count: number;
  index_size: number;
  isTimeSeries: boolean;
  isView: boolean;
  sourceId: string | null;
  source: Collection;
  properties: { id: string; options?: unknown }[];
  fetch(opts: {
    dataService: DataService;
    fetchInfo?: boolean;
    force?: boolean;
  }): Promise<void>;
  fetchMetadata(opts: {
    dataService: DataService;
  }): Promise<CollectionMetadata>;
  on(evt: string, fn: (...args: any) => void);
  off(evt: string, fn: (...args: any) => void);
  removeListener(evt: string, fn: (...args: any) => void);
  toJSON(opts?: { derived: boolean }): this;
}

interface CollectionCollection extends Array<Collection> {
  fetch(opts: { dataService: DataService; fetchInfo?: boolean }): Promise<void>;
  toJSON(opts?: { derived: boolean }): this;
  at(index: number): Collection | undefined;
  get(id: string, key?: '_id' | 'name'): Collection | undefined;
}

export default Collection;
export { CollectionCollection, CollectionMetadata };
