import { join } from 'path';
import fs from 'fs/promises';
import { EJSON, UUID } from 'bson';
import { orderBy } from 'lodash';
import { type BaseQuery } from '../constants/query-properties';

const ENCODING_UTF8 = 'utf8';

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
  constructor(
    protected readonly path: string,
    protected readonly namespace: string = ''
  ) {}

  async loadAll(): Promise<T[]> {
    try {
      const dir = this.path;
      const files = (await fs.readdir(dir))
        .filter((file) => file.endsWith('.json'))
        .map((file) => join(dir, file));

      const data = (
        await Promise.all(files.map((filePath) => this.getFileData(filePath)))
      ).filter(Boolean) as T[];

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
    // ensure the folder exists
    await fs.mkdir(this.path, { recursive: true });
    const filePath = this.getFilePath(id);
    const fileData = (await this.getFileData(filePath)) ?? {};
    const updated = {
      ...fileData,
      ...data,
    };
    await fs.writeFile(
      filePath,
      EJSON.stringify(updated, undefined, 2),
      ENCODING_UTF8
    );
    return updated as T;
  }

  async delete(id: string) {
    return fs.unlink(this.getFilePath(id));
  }

  private getFilePath(id: string) {
    return join(this.path, `${id}.json`);
  }

  private async getFileData(filePath: string): Promise<T | false> {
    try {
      const data = await fs.readFile(filePath, ENCODING_UTF8);
      return EJSON.parse(data);
    } catch (e) {
      return false;
    }
  }
}

export class RecentQueryStorage extends QueryStorage<RecentQuery> {
  private readonly maxAllowedQueries = 30;

  constructor(path?: string, namespace?: string) {
    super(join(path ?? '', 'RecentQueries'), namespace);
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
  constructor(path?: string, namespace?: string) {
    super(join(path ?? '', 'FavoriteQueries'), namespace);
  }
}
