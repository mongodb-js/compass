export interface CollectionStats {
  ns: string;
  name: string;
  database: string;
  is_capped?: boolean;
  document_count: number;
  document_size?: number;
  avg_document_size: number;
  storage_size: number;
  free_storage_size: number;
  index_count: number;
  index_size: number;
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
