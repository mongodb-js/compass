import type {
  Abortable,
  AggregateOptions,
  Document,
  FindOptions,
  ReadPreferenceMode,
} from 'mongodb';
import type { DevtoolsConnectOptions } from '@mongodb-js/devtools-connect';
import type { ConnectionOptions } from './connection-options';
import type { ConnectionStatusWithPrivileges } from './run-command';
import type { CSFLECollectionTracker } from './csfle-collection-tracker';
import type {
  adaptCollectionInfo,
  adaptDatabaseInfo,
  DatabaseDetails,
} from './instance-detail-helper';
import type { ExecutionOptions } from './data-service';

/** Options passed to the driver when connecting, as reported by getMongoClientConnectionOptions */
export type MongoClientConnectionOptions = {
  url: string;
  options: DevtoolsConnectOptions;
};

/** The type of a collection as reported by collection metadata */
export type CollectionType = 'collection' | 'view' | 'timeseries';

/** Current CSFLE status for the connection */
export type CSFLEMode = 'enabled' | 'disabled' | 'unavailable';

export type AuthenticatedUserPrivileges =
  ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges'];

export type AuthenticatedUserRoles =
  ConnectionStatusWithPrivileges['authInfo']['authenticatedUserRoles'];

export type ListCollectionsOptions = {
  nameOnly?: true;
  fetchNamespacesFromPrivileges?: boolean;
  privileges?: AuthenticatedUserPrivileges | null;
};

export type ListDatabasesOptions = ListCollectionsOptions & {
  roles?: AuthenticatedUserRoles | null;
};

/** A database as returned by listDatabases, which does not include collections */
export type ListedDatabase = Omit<DatabaseDetails, 'collections'>;

/** Normalized collection info provided by the listCollections command */
export type CollectionInfoDetails = ReturnType<
  typeof adaptCollectionInfo
> | null;

/** Normalized database stats as returned by databaseStats */
export type DatabaseStats = ReturnType<typeof adaptDatabaseInfo> & {
  name: string;
};

/**
 * Collection name to update that will be passed to the collMod command will
 * be derived from the provided namespace, this is why we are explicitly
 * prohibiting to pass collMod flag here
 */
export type UpdateCollectionFlags = Document & { collMod?: never };

export type AbortableAggregateOptions = AggregateOptions & Abortable;

export type ExecutionOptionsWithFallbackReadPreference = ExecutionOptions & {
  fallbackReadPreference?: ReadPreferenceMode;
};

export type FetchShardKeyOptions = Omit<FindOptions, 'projection'>;

/** The shard key for a collection, or null when the collection is not sharded */
export type ShardKey = Record<string, unknown>;

/** An update document or aggregation pipeline used to preview an update */
export type UpdateExpression = Document | Document[];

export type IsUpdateAllowedMethod = CSFLECollectionTracker['isUpdateAllowed'];

export type KnownSchemaForCollectionMethod =
  CSFLECollectionTracker['knownSchemaForCollection'];

/** The current state of ConnectionOptions secrets, which may have changed since connecting */
export type UpdatedSecrets = Partial<ConnectionOptions>;

export interface CollectionStats {
  ns: string;
  name: string;
  database: string;
  is_capped?: boolean;
  document_count: number;
  document_size?: number;
  avg_document_size: number;
  // Undefined when the server did not report the field.
  // DSC filter both out of $collStats for non-internal users.
  storage_size: number | undefined;
  free_storage_size: number | undefined;
  index_count: number;
  index_size: number;
  bucket_count?: number;
  avg_bucket_size?: number;
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
  transaction?: Record<string, number>;
}

export interface IndexDetails {
  name: string;
}

export interface CollectionDetails extends CollectionStats {
  _id: string;
  name: string;
  database: string;
  indexes: IndexDetails[];
}
