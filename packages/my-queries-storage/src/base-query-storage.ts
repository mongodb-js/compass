import { UUID } from 'bson';
import { type z } from '@mongodb-js/compass-user-data';
import { type IUserData } from '@mongodb-js/compass-user-data';
import { RecentQuerySchema, FavoriteQuerySchema } from './query-storage-schema';
import type {
  RecentQueryStorageInterface,
  FavoriteQueryStorageInterface,
} from './storage-interfaces';

// Generic storage options that can be extended by platform-specific implementations
export type BaseStorageOptions = {
  serialize?: (content: unknown) => string;
  deserialize?: (content: string) => unknown;
};

// Generic base class that works with any IUserData implementation
export abstract class BaseCompassQueryStorage<TSchema extends z.Schema> {
  protected readonly userData: IUserData<TSchema>;

  constructor(
    schemaValidator: TSchema,
    protected readonly dataType: string,
    userData: IUserData<TSchema>
  ) {
    this.userData = userData;
  }

  async loadAll(namespace?: string): Promise<z.output<TSchema>[]> {
    try {
      const { data } = await this.userData.readAll();
      const sortedData = data
        .sort((a, b) => {
          return b._lastExecuted.getTime() - a._lastExecuted.getTime();
        })
        .filter((x) => !namespace || x._ns === namespace);
      return sortedData;
    } catch {
      return [];
    }
  }

  async write(id: string, content: z.input<TSchema>): Promise<boolean> {
    return await this.userData.write(id, content);
  }

  async delete(id: string): Promise<boolean> {
    return await this.userData.delete(id);
  }

  async updateAttributes(
    id: string,
    data: Partial<z.input<TSchema>>
  ): Promise<boolean> {
    return await this.userData.updateAttributes(id, data);
  }

  abstract saveQuery(data: Partial<z.input<TSchema>>): Promise<void>;
}

export class BaseCompassRecentQueryStorage
  extends BaseCompassQueryStorage<typeof RecentQuerySchema>
  implements RecentQueryStorageInterface
{
  private readonly maxAllowedQueries = 30;

  constructor(userData: IUserData<typeof RecentQuerySchema>) {
    super(RecentQuerySchema, 'RecentQueries', userData);
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
    await this.userData.write(_id, recentQuery);
  }
}

export class BaseCompassFavoriteQueryStorage
  extends BaseCompassQueryStorage<typeof FavoriteQuerySchema>
  implements FavoriteQueryStorageInterface
{
  constructor(userData: IUserData<typeof FavoriteQuerySchema>) {
    super(FavoriteQuerySchema, 'FavoriteQueries', userData);
  }

  async saveQuery(
    data: Omit<
      z.input<typeof FavoriteQuerySchema>,
      '_id' | '_lastExecuted' | '_dateModified' | '_dateSaved'
    >,
    _id?: string
  ): Promise<void> {
    _id ??= new UUID().toString();
    const favoriteQuery = {
      ...data,
      _id,
      _lastExecuted: new Date(),
      _dateSaved: new Date(),
    };
    await this.userData.write(_id, favoriteQuery);
  }
}
