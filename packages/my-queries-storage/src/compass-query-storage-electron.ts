import { ObjectId, EJSON, UUID } from 'bson';
import { type z } from '@mongodb-js/compass-user-data';
import { FileUserData } from '@mongodb-js/compass-user-data';
import { RecentQuerySchema, FavoriteQuerySchema } from './query-storage-schema';
import type {
  RecentQueryStorageInterface,
  FavoriteQueryStorageInterface,
} from './storage-interfaces';

export type ElectronQueryStorageOptions = {
  basepath?: string;
};

export abstract class ElectronCompassQueryStorage<TSchema extends z.Schema> {
  protected readonly userData: FileUserData<TSchema>;

  constructor(
    schemaValidator: TSchema,
    protected readonly dataType: string,
    protected readonly options: ElectronQueryStorageOptions
  ) {
    this.userData = new FileUserData(schemaValidator, dataType, {
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

export class ElectronCompassRecentQueryStorage
  extends ElectronCompassQueryStorage<typeof RecentQuerySchema>
  implements RecentQueryStorageInterface
{
  private readonly maxAllowedQueries = 30;

  constructor(options: ElectronQueryStorageOptions = {}) {
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

export class ElectronCompassFavoriteQueryStorage
  extends ElectronCompassQueryStorage<typeof FavoriteQuerySchema>
  implements FavoriteQueryStorageInterface
{
  constructor(options: ElectronQueryStorageOptions = {}) {
    super(FavoriteQuerySchema, 'FavoriteQueries', options);
  }

  async saveQuery(
    data: Omit<
      z.input<typeof FavoriteQuerySchema>,
      '_id' | '_lastExecuted' | '_dateModified' | '_dateSaved'
    >,
    _id?: string
  ): Promise<void> {
    _id ??= new ObjectId().toHexString();
    const favoriteQuery = {
      ...data,
      _id,
      _lastExecuted: new Date(),
      _dateSaved: new Date(),
    };
    await this.userData.write(_id, favoriteQuery);
  }
}
