import { AnyError, Db, Document, MongoClient } from 'mongodb';

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
  databases: DatabaseDetails[];
  listCollections: CollectionDetails[];
  allowedCollections: CollectionDetails[];
  collections: CollectionDetails[];
  hierarchy: never;
  stats: DatabaseStats;
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

export interface CollectionDetails {
  _id: string;
  name: string;
  database: string;
  readonly: boolean;
  collation: string | null;
  type: string;
  view_on?: string;
  pipeline?: Document[];
}

export interface DatabaseDetails {
  _id: string;
  name: string;
  document_count: number;
  storage_size: number;
  index_count: number;
  index_size: number;
  collections?: CollectionDetails[];
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

export interface DatabaseStats {
  document_count: number;
  storage_size: number;
  index_count: number;
  index_size: number;
}

export interface DataLakeDetails {
  isDataLake: boolean;
  version: string;
}
