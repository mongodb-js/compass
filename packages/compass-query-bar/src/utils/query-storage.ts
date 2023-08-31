import { UUID, EJSON } from 'bson';
import { orderBy } from 'lodash';
import { type BaseQuery } from '../constants/query-properties';
import { UserData } from '@mongodb-js/compass-user-data';

// We do not save maxTimeMS
export type RecentQuery = Omit<BaseQuery, 'maxTimeMS'> & {
  _id: string;
  _lastExecuted: Date;
  _ns: string;
  _host?: string;
};

export type FavoriteQuery = RecentQuery & {
  _name: string;
  _dateModified: Date;
  _dateSaved: Date;
};

type QueryStorageOptions = {
  basepath?: string;
  namespace?: string;
};

export abstract class QueryStorage<T extends RecentQuery = RecentQuery> {
  protected readonly userData: UserData<T>;
  constructor(
    protected readonly folder: string,
    protected readonly options: QueryStorageOptions
  ) {
    this.userData = new UserData({
      subdir: folder,
      basePath: options.basepath,
      serialize: (content) => EJSON.stringify(content, undefined, 2),
      deserialize: (content) => EJSON.parse(content),
    });
  }

  async loadAll(): Promise<T[]> {
    try {
      const { data } = await this.userData.readAll();
      const sortedData = orderBy(data, (query) => query._lastExecuted, 'desc');
      if (this.options.namespace) {
        return sortedData.filter((x) => x._ns === this.options.namespace);
      }
      return sortedData;
    } catch (e) {
      return [];
    }
  }

  async updateAttributes(id: string, data: Partial<T>): Promise<T> {
    const fileName = this.getFileName(id);
    const fileData = (await this.userData.readOne(fileName)) ?? {};
    const updated = {
      ...fileData,
      ...data,
    } as T;
    await this.userData.write(fileName, updated);
    return updated;
  }

  async delete(id: string) {
    return await this.userData.delete(this.getFileName(id));
  }

  protected getFileName(id: string) {
    return `${id}.json`;
  }
}

export class RecentQueryStorage extends QueryStorage<RecentQuery> {
  private readonly maxAllowedQueries = 30;

  constructor(options: QueryStorageOptions = {}) {
    super('RecentQueries', options);
  }

  async saveQuery(
    data: Omit<RecentQuery, '_id' | '_lastExecuted'>
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
    await this.userData.write(this.getFileName(_id), recentQuery);
  }
}

export class FavoriteQueryStorage extends QueryStorage<FavoriteQuery> {
  constructor(options: QueryStorageOptions = {}) {
    super('FavoriteQueries', options);
  }
}
