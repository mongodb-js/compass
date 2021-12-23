import type { AnyError, CollStats } from 'mongodb';

export interface Callback<R> {
  (
    err: Error | AnyError | { message: string } | null | undefined,
    result: R
  ): void;
}

export interface CollectionStats {
  ns: string;
  name: string;
  database: string;
  is_capped?: boolean;
  max?: number;
  is_power_of_two: boolean;
  index_sizes?: CollStats['indexSizes'];
  document_count: CollStats['count'];
  document_size?: CollStats['size'];
  avg_document_size: number;
  storage_size: number;
  free_storage_size: number;
  index_count: number;
  index_size: number;
  padding_factor?: CollStats['paddingFactor'];
  extent_count?: CollStats['numExtents'];
  extent_last_size?: CollStats['lastExtentSize'];
  flags_user: CollStats['userFlags'];
  max_document_size?: CollStats['maxSize'];
  size?: CollStats['size'];
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

export interface IndexDetails {
  name: string;
}

export interface CollectionDetails extends CollectionStats {
  _id: string;
  name: string;
  database: string;
  indexes: IndexDetails[];
}
