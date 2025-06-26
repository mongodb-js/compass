import { UUID, EJSON } from 'bson';
import { UserData, type z } from '@mongodb-js/compass-user-data';
import {
  RecentQuerySchema,
  FavoriteQuerySchema,
  type RecentQuery,
  type FavoriteQuery,
} from './query-storage-schema';
import type { FavoriteQueryStorage, RecentQueryStorage } from './query-storage';

export type QueryStorageOptions = {
  basepath?: string;
};

export interface QueryDocumentBase {
  _id: string;
  _lastExecuted: Date;
  _ns?: string;
}

// this will be either UserDataBackend (for desktop filesystem storage) or
// ApiBackend (for Compass-Web cloud storage)
export interface QueryStorageBackend<TData extends QueryDocumentBase> {
  loadAll(): Promise<TData[]>;
  readOne(id: string): Promise<TData | undefined>;
  updateAttributes(id: string, data: Partial<TData>): Promise<TData>;
  delete(id: string): Promise<boolean>;
  saveQuery(data: TData): Promise<void>;
}

export abstract class CompassQueryStorage<TData extends QueryDocumentBase>
  implements QueryStorageBackend<TData>
{
  protected backend: QueryStorageBackend<TData>;

  constructor(backend: QueryStorageBackend<TData>) {
    this.backend = backend;
  }

  async loadAll(namespace?: string): Promise<TData[]> {
    const items = await this.backend.loadAll();
    return items
      .sort((a, b) => b._lastExecuted.getTime() - a._lastExecuted.getTime())
      .filter((x) => !namespace || x._ns === namespace);
  }

  async readOne(id: string): Promise<TData | undefined> {
    return this.backend.readOne(id);
  }

  async updateAttributes(id: string, patch: Partial<TData>): Promise<TData> {
    return this.backend.updateAttributes(id, patch);
  }

  async delete(id: string): Promise<boolean> {
    return this.backend.delete(id);
  }

  abstract saveQuery(data: Omit<TData, '_id' | '_lastExecuted'>): Promise<void>;
}

// UserDataBackend preserves all major functionality and adapts UserData to the QueryStorageBackend interface
export class UserDataBackend<
  TSchema extends z.Schema,
  TData extends z.output<TSchema> & QueryDocumentBase
> implements QueryStorageBackend<TData>
{
  private userData: UserData<TSchema>;

  constructor(userData: UserData<TSchema>) {
    this.userData = userData;
  }

  async loadAll(): Promise<TData[]> {
    try {
      const { data } = await this.userData.readAll();
      return data as TData[];
    } catch {
      return [];
    }
  }

  async readOne(id: string): Promise<TData | undefined> {
    try {
      const result = await this.userData.readOne(id);
      return result as TData | undefined;
    } catch {
      // not sure if this is what I should be returning here
      return undefined;
    }
  }

  async updateAttributes(id: string, patch: Partial<TData>): Promise<TData> {
    // this is kind of a different approach than the original UserData
    // just more error handling
    const current = await this.readOne(id);
    if (!current) {
      // will throwing Errors here be bubbled up properly?
      // or should I return undefined or null?
      throw new Error(`Record not found for id ${id}`);
    }
    const updated = { ...current, ...patch };
    await this.userData.write(id, updated as z.input<TSchema>);
    const after = await this.readOne(id);
    if (!after) {
      throw new Error(`Failed to update record for id ${id}`);
    }
    return after;
  }

  async delete(id: string): Promise<boolean> {
    return await this.userData.delete(id);
  }

  async saveQuery(data: TData): Promise<void> {
    await this.userData.write(data._id, data as z.input<TSchema>);
  }
}

export class CompassRecentQueryStorage
  extends CompassQueryStorage<RecentQuery>
  implements RecentQueryStorage
{
  private readonly maxAllowedQueries = 30;

  constructor(backend: QueryStorageBackend<RecentQuery>) {
    super(backend);
  }

  async saveQuery(
    data: Omit<z.input<typeof RecentQuerySchema>, '_id' | '_lastExecuted'>
  ): Promise<void> {
    const recentQueries = await this.loadAll();

    if (recentQueries.length >= this.maxAllowedQueries) {
      const lastRecent = recentQueries[recentQueries.length - 1];
      await this.delete(lastRecent._id);
    }

    const _id = new UUID().toString();
    const recentQuery = {
      ...data,
      _id,
      _lastExecuted: new Date(),
    };
    await this.backend.saveQuery(recentQuery);
  }
}

export class CompassFavoriteQueryStorage
  extends CompassQueryStorage<FavoriteQuery>
  implements FavoriteQueryStorage
{
  constructor(backend: QueryStorageBackend<FavoriteQuery>) {
    super(backend);
  }

  async saveQuery(
    data: Omit<
      z.input<typeof FavoriteQuerySchema>,
      '_id' | '_lastExecuted' | '_dateModified' | '_dateSaved'
    >
  ): Promise<void> {
    const _id = new UUID().toString();
    const favoriteQuery = {
      ...data,
      _id,
      _lastExecuted: new Date(),
      _dateSaved: new Date(),
    };
    await this.backend.saveQuery(favoriteQuery);
  }
}
