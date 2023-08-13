import { EJSON, UUID } from 'bson';
import { orderBy } from 'lodash';
import { type BaseQuery } from '../constants/query-properties';
import { Filesystem } from '@mongodb-js/compass-utils';

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

export abstract class QueryStorage<T extends RecentQuery = RecentQuery> {
  private readonly fs: Filesystem<T>;
  constructor(
    protected readonly folder: string,
    protected readonly namespace: string = ''
  ) {
    this.fs = new Filesystem({
      subdir: folder,
      onSerialize: (content) => EJSON.stringify(content, undefined, 2),
      onDeserialize: (content) => EJSON.parse(content),
    });
  }

  async loadAll(): Promise<T[]> {
    try {
      const data = await this.fs.readAll('*.json');
      const sortedData = orderBy(data, (query) => query._lastExecuted, 'desc');
      if (this.namespace) {
        return sortedData.filter((x) => x._ns === this.namespace);
      }
      return sortedData;
    } catch (e) {
      return [];
    }
  }

  async updateAttributes(id: string, data: Partial<T>): Promise<T> {
    const fileName = this.getFileName(id);
    const fileData = (await this.fs.readOne(fileName)) ?? {};
    const updated = {
      ...fileData,
      ...data,
    } as T;
    await this.fs.write(fileName, updated);
    return updated;
  }

  async delete(id: string) {
    return await this.fs.delete(this.getFileName(id));
  }

  private getFileName(id: string) {
    return `${id}.json`;
  }
}

export class RecentQueryStorage extends QueryStorage<RecentQuery> {
  private readonly maxAllowedQueries = 30;

  constructor(namespace?: string) {
    super('RecentQueries', namespace);
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
    const recentQuery: RecentQuery = {
      ...data,
      _id,
      _lastExecuted: new Date(),
    };
    await this.updateAttributes(_id, recentQuery);
  }
}

export class FavoriteQueryStorage extends QueryStorage<FavoriteQuery> {
  constructor(namespace?: string) {
    super('FavoriteQueries', namespace);
  }
}
