import { UUID, EJSON } from 'bson';
import { type z } from '@mongodb-js/compass-user-data';
import { type IUserData, FileUserData } from '@mongodb-js/compass-user-data';
import { RecentQuerySchema, FavoriteQuerySchema } from './query-storage-schema';
import type { FavoriteQueryStorage, RecentQueryStorage } from './query-storage';

export type QueryStorageOptions = {
  basepath?: string;
};

export abstract class CompassQueryStorage<TSchema extends z.Schema> {
  protected readonly userData: IUserData<TSchema>;
  constructor(
    schemaValidator: TSchema,
    protected readonly folder: string,
    protected readonly options: QueryStorageOptions
  ) {
    // TODO: logic for whether we're in compass web or compass desktop
    this.userData = new FileUserData(schemaValidator, {
      subdir: folder,
      basePath: options.basepath,
      serialize: (content) => EJSON.stringify(content, undefined, 2),
      deserialize: (content: string) => EJSON.parse(content),
    });
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

  async delete(id: string) {
    return await this.userData.delete(id);
  }

  async updateAttributes(
    id: string,
    data: Partial<z.input<TSchema>>
  ): Promise<z.output<TSchema>> {
    return await this.userData.updateAttributes(id, data);
  }

  abstract saveQuery(data: Partial<z.input<TSchema>>): Promise<void>;
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
    // this creates a recent query that we will write to system/db
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
    // this creates a favorite query that we will write to system/db
    const favoriteQuery = {
      ...data,
      _id,
      _lastExecuted: new Date(),
      _dateSaved: new Date(),
    };
    await this.userData.write(_id, favoriteQuery);
  }
}
