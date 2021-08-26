import { AnyError, CollStats, Db, Document, MongoClient } from 'mongodb';
import { IndexDetails } from 'mongodb-index-model';

export interface Callback<R> {
  (
    err: Error | AnyError | { message: string } | null | undefined,
    result: R
  ): void;
}

export interface ResolvedInstanceTaskData {
  client: MongoClient;
  db: Db;
  userInfo: Document;
  host: HostInfoDetails;
  build: BuildInfoDetails;
  cmdLineOpts: Document;
  genuineMongoDB: GenuineMongoDBDetails;
  dataLake: DataLakeDetails;
  listDatabases: string[];
  allowedDatabases: string[];
  databases: InstanceDatabaseDetails[];
  listCollections: InstanceCollectionDetails[];
  allowedCollections: InstanceCollectionDetails[];
  collections: InstanceCollectionDetails[];
  hierarchy: never;
  stats: InstanceDatabaseStats;
}

export type InstanceDetails = Omit<
  ResolvedInstanceTaskData,
  | 'db'
  | 'listDatabases'
  | 'allowedDatabases'
  | 'userInfo'
  | 'listCollections'
  | 'allowedCollections'
  | 'cmdLineOpts'
>;

export interface Instance extends InstanceDetails {
  _id?: string;
  hostname: string;
  port: number;
}

export interface InstanceCollectionDetails {
  _id: string;
  name: string;
  database: string;
  readonly: boolean;
  collation: string | null;
  type: string;
  view_on?: string;
  pipeline?: Document[];
}

export interface InstanceDatabaseDetails {
  _id: string;
  name: string;
  document_count: number;
  storage_size: number;
  index_count: number;
  index_size: number;
  collections?: InstanceCollectionDetails[];
}

export interface HostInfoDetails {
  system_time?: any; // ISODate?
  hostname?: string;
  os?: string;
  os_family?: string;
  kernel_version?: string;
  kernel_version_string?: string;
  memory_bits?: number;
  memory_page_size?: number;
  arch?: string;
  cpu_cores?: number;
  cpu_cores_physical?: number;
  cpu_scheduler?: string;
  cpu_frequency?: number;
  cpu_string?: string;
  cpu_bits?: number;
  machine_model?: string;
  feature_numa?: boolean;
  feature_always_full_sync?: number;
  feature_nfs_async?: number;
}

export interface GenuineMongoDBDetails {
  isGenuine: boolean;
  dbType: string;
}

export interface BuildInfoDetails {
  version: string;
  commit: string;
  commit_url: string;
  flags_loader: any;
  flags_compiler: any;
  allocator: string;
  javascript_engine: string;
  debug: boolean;
  for_bits: number;
  max_bson_object_size: number;
  enterprise_module: boolean;
  query_engine: any;
  raw: Document;
}

export interface InstanceDatabaseStats {
  document_count: number;
  storage_size: number;
  index_count: number;
  index_size: number;
}

export interface DataLakeDetails {
  isDataLake: boolean;
  version: string;
}

export interface CollectionStats {
  ns: string;
  name: string;
  database: string;
  is_capped?: boolean;
  max?: number;
  is_power_of_two: boolean;
  index_sizes?: CollStats['indexSizes'];
  document_count: CollStats['documentCount'];
  document_size?: CollStats['size'];
  storage_size?: CollStats['storageSize'];
  index_count?: CollStats['nindexes'];
  index_size?: CollStats['totalIndexSize'];
  padding_factor?: CollStats['paddingFactor'];
  extent_count?: CollStats['numExtents'];
  extent_last_size?: CollStats['lastExtentSize'];
  flags_user: CollStats['userFlags'];
  max_document_size?: CollStats['maxSize'];
  size?: CollStats['size'];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  index_details: CollStats['indexDetails'];
  wired_tiger: Partial<CollStats['wiredTiger']>;
}

export interface CollStatsIndexDetails {
  metadata: {
    formatVersion: number;
    infoObj: string;
  };
  creationString: string;
  type: string;
  uri?: string;
  LSM?: Record<string, number>;
  'block-manager'?: Record<string, number>;
  btree?: Record<string, number>;
  cache?: Record<string, number>;
  cache_walk?: Record<string, number>;
  'checkpoint-cleanup'?: Record<string, number>;
  compression?: Record<string, number>;
  reconciliation?: Record<string, number>;
  session?: Record<string, number>;
  transations?: Record<string, number>;
}

export interface CollectionDetails extends CollectionStats {
  _id: string;
  name: string;
  database: string;
  indexes: IndexDetails[];
}
