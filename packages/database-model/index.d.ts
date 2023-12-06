import type { CollectionCollection } from 'mongodb-collection-model';
import type { DataService } from 'mongodb-data-service';

interface Database {
  _id: string;
  name: string;
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  statusError: string | null;
  collectionsStatus: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  collectionsStatusError: string | null;
  collection_count: number;
  document_count: number;
  storage_size: number;
  data_size: number;
  index_count: number;
  index_size: number;
  collectionsLength: number;
  collections: CollectionCollection;
  fetch(opts: { dataService: DataService; force?: boolean }): Promise<void>;
  fetchCollections(opts: {
    dataService: DataService;
    fetchInfo?: boolean;
    force?: boolean;
  }): Promise<void>;
  fetchCollectionsDetails(opts: {
    dataService: DataService;
    nameOnly?: boolean;
    force?: boolean;
  }): Promise<void>;
  on(evt: string, fn: (...args: any) => void);
  off(evt: string, fn: (...args: any) => void);
  removeListener(evt: string, fn: (...args: any) => void);
  toJSON(opts?: { derived: boolean }): this;
}

interface DatabaseCollection extends Array<Database> {
  fetch(opts: { dataService: DataService }): Promise<void>;
  toJSON(opts?: { derived: boolean }): this;
  at(index: number): Database | undefined;
  get(id: string, key?: '_id' | 'name'): Database | undefined;
}

export default Database;
export { DatabaseCollection as Collection };
