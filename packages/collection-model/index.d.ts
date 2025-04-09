import type { PreferencesAccess } from 'compass-preferences-model';
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
   * View source pipeline definition
   */
  sourcePipeline?: unknown[];
  /**
   * Instance metadata: whether or not we are connected to the ADF
   */
  isDataLake: boolean;
  /**
   * Instance metadata: whether or not we are connected to Atlas Cloud
   */
  isAtlas: boolean;
  /**
   * Instance metadata: current connection server version
   */
  serverVersion: string;
};

interface CollectionProps {
  _id: string;
  type: 'collection' | 'view' | 'timeseries';
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
  view_on: string | null;
  collation: unknown;
  pipeline: unknown[];
  validation: unknown;
  is_capped?: boolean;
  document_count?: number;
  document_size?: number;
  avg_document_size?: number;
  storage_size?: number;
  free_storage_size?: number;
  index_count?: number;
  index_size?: number;
  isTimeSeries: boolean;
  isView: boolean;
  /** Only relevant for a view and identifies collection/view from which this view was created. */
  sourceName: string | null;
  source: Collection;
  properties: { id: string; options?: Record<string, unknown> }[];
  is_non_existent: boolean;
}

type CollectionDataService = Pick<
  DataService,
  | 'collectionStats'
  | 'collectionInfo'
  | 'listCollections'
  | 'isListSearchIndexesSupported'
>;

interface Collection extends CollectionProps {
  fetch(opts: {
    dataService: CollectionDataService;
    preferences: PreferencesAccess;
    fetchInfo?: boolean;
    force?: boolean;
  }): Promise<void>;
  fetchMetadata(opts: {
    dataService: CollectionDataService;
    preferences: PreferencesAccess;
  }): Promise<CollectionMetadata>;
  on(evt: string, fn: (...args: any) => void);
  off(evt: string, fn: (...args: any) => void);
  removeListener(evt: string, fn: (...args: any) => void);
  toJSON(opts?: { derived: boolean }): CollectionProps;
  previousAttributes(): CollectionProps;
  set(val: Partial<CollectionProps>): this;
  modelType: 'Collection';
}

interface CollectionCollection extends Array<Collection> {
  fetch(opts: {
    dataService: CollectionDataService;
    fetchInfo?: boolean;
  }): Promise<void>;
  toJSON(opts?: { derived: boolean }): Array<CollectionProps>;
  at(index: number): Collection | undefined;
  get(id: string, key?: '_id' | 'name'): Collection | undefined;
  add(props: Partial<CollectionProps>): Collection;
  remove(
    models: string | [string] | Collection | [Collection]
  ): Collection | undefined;
  remove(models: string[] | Collection[]): (Collection | undefined)[];
}

export default Collection;
export { CollectionCollection, CollectionMetadata, CollectionProps };
