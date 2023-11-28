import { UUID, EJSON } from 'bson';
import { UserData, z } from '@mongodb-js/compass-user-data';

const queryProps = {
  filter: z.any().optional(),
  project: z.any().optional(),
  collation: z.any().optional(),
  sort: z.any().optional(),
  skip: z.number().optional(),
  limit: z.number().optional(),
  update: z.any().optional(),
};

const commonMetadata = {
  _id: z.string().uuid(),
  _lastExecuted: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
  _ns: z.string(),
  _host: z.string().optional(),
};

const RecentQuerySchema = z.object({
  ...queryProps,
  ...commonMetadata,
});

const FavoriteQuerySchema = z.object({
  ...queryProps,
  ...commonMetadata,
  _name: z.string().nonempty(),
  _dateModified: z
    .union([z.coerce.date(), z.number()])
    .optional()
    .transform((x) => (x !== undefined ? new Date(x) : x)),
  _dateSaved: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
});

export type RecentQuery = z.output<typeof RecentQuerySchema>;

export type FavoriteQuery = z.output<typeof FavoriteQuerySchema>;

type QueryStorageOptions = {
  basepath?: string;
  namespace?: string;
};

export abstract class QueryStorage<T extends typeof RecentQuerySchema> {
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

  async loadAll(): Promise<z.output<T>[]> {
    try {
      const { data } = await this.userData.readAll();
      const sortedData = data
        .sort((a, b) => {
          return b._lastExecuted.getTime() - a._lastExecuted.getTime();
        })
        .filter(
          (x) => !this.options.namespace || x._ns === this.options.namespace
        );
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

export class RecentQueryStorage extends QueryStorage<typeof RecentQuerySchema> {
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

export class FavoriteQueryStorage extends QueryStorage<
  typeof FavoriteQuerySchema
> {
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
