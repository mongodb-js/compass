import type toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';

type Namespace = ReturnType<typeof toNS>;

interface Collection {
  _id: string;
  type: string;
  status: string;
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
  max: number;
  is_power_of_two: boolean;
  index_sizes: unknown;
  document_count: number;
  document_size: number;
  avg_document_size: number;
  storage_size: number;
  free_storage_size: number;
  index_count: number;
  index_size: number;
  padding_factor: number;
  extent_count: number;
  extent_last_size: number;
  flags_user: number;
  max_document_size: number;
  size: number;
  index_details: unknown;
  wired_tiger: unknown;
  isTimeSeries: boolean;
  isView: boolean;
  sourceId: string | null;
  source: Collection;
  properties: { name: string; options?: unknown }[];
  fetch(opts: {
    dataService: DataService;
    fetchInfo?: boolean;
    force?: boolean;
  }): Promise<void>;
  fetchMetadata(opts: { dataService: DataService }): Promise<{
    namespace: string;
    isReadonly: boolean;
    isTimeSeries: boolean;
    sourceName?: string;
    sourceReadonly?: boolean;
    sourceViewon?: string;
    sourcePipeline?: unknown[];
  }>;
  toJSON(opts?: { derived: boolean }): this;
}

interface CollectionCollection extends Array<Collection> {
  fetch(opts: { dataService: DataService; fetchInfo?: boolean }): Promise<void>;
  toJSON(opts?: { derived: boolean }): this;
  at(index: number): Collection | undefined;
  get(id: string, key?: '_id' | 'name'): Collection | undefined;
}

export default Collection;
export { CollectionCollection };
