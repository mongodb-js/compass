import { UUID, EJSON } from 'bson';
import { orderBy } from 'lodash';
import { type BaseQuery } from '../constants/query-properties';
import { UserData } from '@mongodb-js/compass-user-data';
import { z } from 'zod';

// We do not save maxTimeMS
const BaseQuerySchema: z.Schema<Omit<BaseQuery, 'maxTimeMS'>> = z.object({
  filter: z.any().optional(),
  project: z.any().optional(),
  collation: z.any().optional(),
  sort: z.any().optional(),
  skip: z.number().optional(),
  limit: z.number().optional(),
});

const RecentQuerySchema = BaseQuerySchema.and(
  z.object({
    _id: z.string().uuid(),
    _lastExecuted: z
      .union([z.coerce.date(), z.number()])
      .transform((x) => new Date(x)),
    _ns: z.string(),
    _host: z.string().optional(),
  })
);

const FavoriteQuerySchema = RecentQuerySchema.and(
  z.object({
    _name: z.string().nonempty(),
    _dateModified: z
      .union([z.coerce.date(), z.number()])
      .transform((x) => new Date(x)),
    _dateSaved: z
      .union([z.coerce.date(), z.number()])
      .transform((x) => new Date(x)),
  })
);

export type RecentQuery = z.output<typeof RecentQuerySchema>;
export type FavoriteQuery = z.output<typeof FavoriteQuerySchema>;

type QueryStorageOptions = {
  basepath?: string;
  namespace?: string;
};

export abstract class QueryStorage<T extends z.Schema = z.Schema> {
  protected readonly userData: UserData<T>;
  constructor(
    getValidationSchema: () => T,
    protected readonly folder: string,
    protected readonly options: QueryStorageOptions
  ) {
    this.userData = new UserData(getValidationSchema, {
      subdir: folder,
      basePath: options.basepath,
      serialize: (content) => EJSON.stringify(content, undefined, 2),
      deserialize: (content) => EJSON.parse(content),
    });
  }

  async loadAll() {
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

  async updateAttributes(id: string, data: Partial<z.input<T>>) {
    const fileName = this.getFileName(id);
    await this.userData.write(fileName, {
      ...((await this.userData.readOne(fileName)) ?? {}),
      ...data,
    });
    return await this.userData.readOne(fileName);
  }

  async delete(id: string) {
    return await this.userData.delete(this.getFileName(id));
  }

  protected getFileName(id: string) {
    return `${id}.json`;
  }
}

export class RecentQueryStorage extends QueryStorage<typeof RecentQuerySchema> {
  private readonly maxAllowedQueries = 30;

  constructor(options: QueryStorageOptions = {}) {
    super(() => RecentQuerySchema, 'RecentQueries', options);
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
    await this.userData.write(this.getFileName(_id), recentQuery);
  }
}

export class FavoriteQueryStorage extends QueryStorage<
  typeof FavoriteQuerySchema
> {
  constructor(options: QueryStorageOptions = {}) {
    super(() => FavoriteQuerySchema, 'FavoriteQueries', options);
  }
}
