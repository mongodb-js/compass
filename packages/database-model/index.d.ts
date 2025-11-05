import type { CollectionCollection } from 'mongodb-collection-model';
import type { DataService } from 'mongodb-data-service';

interface DatabaseProps {
  _id: string;
  name: string;
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  statusError: string | null;
  collectionsStatus: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  collectionsStatusError: string | null;
  collection_count: number | undefined;
  document_count: number | undefined;
  storage_size: number | undefined;
  data_size: number | undefined;
  index_count: number | undefined;
  index_size: number | undefined;
  collectionsLength: number;
  collections: CollectionCollection;
  inferred_from_privileges: boolean;
}

interface Database extends DatabaseProps {
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
  toJSON(opts?: { derived: boolean }): DatabaseProps;
  previousAttributes(): DatabaseProps;
  set(val: Partial<DatabaseProps>): this;
  modelType: 'Database';
}

interface DatabaseCollection extends Array<Database> {
  fetch(opts: { dataService: DataService }): Promise<void>;
  toJSON(opts?: { derived: boolean }): Array<DatabaseProps>;
  at(index: number): Database | undefined;
  get(id: string, key?: '_id' | 'name'): Database | undefined;
  add(props: Partial<DatabaseProps>): Database;
  remove(
    models: string | [string] | Database | [Database]
  ): Database | undefined;
  remove(models: string[] | Database[]): (Database | undefined)[];
}

export default Database;
export { DatabaseCollection as Collection, DatabaseProps };
