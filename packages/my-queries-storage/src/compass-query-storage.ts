import { UUID, EJSON } from 'bson';
import { UserData, type z } from '@mongodb-js/compass-user-data';
import { RecentQuerySchema, FavoriteQuerySchema } from './query-storage-schema';
import type { FavoriteQueryStorage, RecentQueryStorage } from './query-storage';

export type QueryStorageOptions = {
  basepath?: string;
};

export abstract class CompassQueryStorage<T extends typeof RecentQuerySchema> {
  protected readonly userData: UserData<T>;
  constructor(
    schemaValidator: T,
    protected readonly folder: string,
    protected readonly options: QueryStorageOptions
  ) {
    this.userData = new UserData(schemaValidator, {
      subdir: folder,
      basePath: options.basepath,
      serialize: (content) => EJSON.stringify(content, undefined, 2),
      deserialize: (content) => EJSON.parse(content),
    });
  }

  async loadAll(namespace?: string): Promise<z.output<T>[]> {
    try {
      const { data } = await this.userData.readAll();
      const sortedData = data
        .sort((a, b) => {
          return b._lastExecuted.getTime() - a._lastExecuted.getTime();
        })
        .filter((x) => !namespace || x._ns === namespace);
      return sortedData;
    } catch (e) {
      return [];
    }
  }

  async updateAttributes(
    id: string,
    data: Partial<z.input<T>>
  ): Promise<z.output<T>> {
    await this.userData.write(id, {
      ...((await this.userData.readOne(id)) ?? {}),
      ...data,
    });
    return await this.userData.readOne(id);
  }

  async delete(id: string) {
    return await this.userData.delete(id);
  }
}

export class CompassRecentQueryStorage
  extends CompassQueryStorage<typeof RecentQuerySchema>
  implements RecentQueryStorage
{
  private readonly maxAllowedQueries = 30;

  constructor(options: QueryStorageOptions = {}) {
    super(RecentQuerySchema, 'RecentQueries', options);
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

export class CompassFavoriteQueryStorage
  extends CompassQueryStorage<typeof FavoriteQuerySchema>
  implements FavoriteQueryStorage
{
  constructor(options: QueryStorageOptions = {}) {
    super(FavoriteQuerySchema, 'FavoriteQueries', options);
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
    await this.userData.write(_id, favoriteQuery);
  }
}
