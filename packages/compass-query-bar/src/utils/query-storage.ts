import { join } from 'path';
import fs from 'fs/promises';
import { EJSON } from 'bson';
import { orderBy } from 'lodash';
import { type BaseQuery } from '../constants/query-properties';

const ENCODING_UTF8 = 'utf8';

// We do not save maxTimeMS
export type RecentQuery = Omit<BaseQuery, 'maxTimeMS'> & {
  _host: string;
  _id: string;
  _lastExecuted: Date;
  _ns: string;
};

export type FavoriteQuery = RecentQuery & {
  _name: string;
  _dateModified: Date;
  _dateSaved: Date;
};

abstract class QueryStorage<T extends RecentQuery> {
  constructor(
    protected readonly path: string,
    protected readonly namespace: string = ''
  ) {}

  async loadAll(): Promise<T[]> {
    const dir = this.path;
    const files = (await fs.readdir(dir))
      .filter((file) => file.endsWith('.json'))
      .map((file) => join(dir, file));

    const data = (
      await Promise.all(files.map((filePath) => this.getFileData(filePath)))
    ).filter(Boolean) as T[];

    // todo: new Date
    const sortedData = orderBy(
      data,
      (query) => new Date(query._lastExecuted),
      'desc'
    );

    if (this.namespace) {
      return sortedData.filter((x) => x._ns === this.namespace);
    }

    return sortedData;
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
    // todo: fix type
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
  constructor(path?: string, namespace?: string) {
    super(join(path ?? '', 'RecentQueries'), namespace);
  }
}

export class FavoriteQueryStorage extends QueryStorage<FavoriteQuery> {
  constructor(path?: string, namespace?: string) {
    super(join(path ?? '', 'FavoriteQueries'), namespace);
  }
}
